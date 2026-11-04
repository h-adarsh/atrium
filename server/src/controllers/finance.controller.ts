import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { DueStatus, PaymentVerification } from '@prisma/client';
import { generateReceiptPdf } from '../services/pdf.service';
import path from 'path';
import fs from 'fs';

export async function getConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const societyId = req.user?.societyId || (await prisma.society.findFirst())?.id;
    if (!societyId) {
      res.status(404).json({ success: false, message: 'Society not found' });
      return;
    }

    let config = await prisma.maintenanceConfig.findUnique({
      where: { societyId }
    });

    if (!config) {
      const soc = await prisma.society.findUnique({ where: { id: societyId } });
      config = await prisma.maintenanceConfig.create({
        data: {
          societyId,
          baseFixedCharge: 500.00,
          ratePerSqFt: 2.50,
          dueDayOfMonth: 5,
          lateFeeFlat: 100.00,
          bankAccountName: soc?.bankAccountName || 'Apartment RWA',
          bankAccountNumber: soc?.bankAccountNumber || '923010049281729',
          bankIfscCode: soc?.bankIfscCode || 'HDFC0001234',
          upiId: soc?.upiId || 'royalorchid.rwa@hdfcbank'
        }
      });
    }
    res.json({ success: true, config });
  } catch (error) {
    console.error('GetConfig error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance config' });
  }
}

export async function updateConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const societyId = req.user?.societyId || (await prisma.society.findFirst())?.id;
    if (!societyId) {
      res.status(404).json({ success: false, message: 'Society not found' });
      return;
    }

    const { baseFixedCharge, ratePerSqFt, dueDayOfMonth, lateFeeFlat, bankAccountName, bankAccountNumber, bankIfscCode, upiId } = req.body;

    let config = await prisma.maintenanceConfig.findUnique({
      where: { societyId }
    });

    if (!config) {
      config = await prisma.maintenanceConfig.create({
        data: {
          societyId,
          baseFixedCharge: Number(baseFixedCharge) || 500,
          ratePerSqFt: Number(ratePerSqFt) || 2.50,
          dueDayOfMonth: Number(dueDayOfMonth) || 5,
          lateFeeFlat: Number(lateFeeFlat) || 100,
          bankAccountName: bankAccountName || 'Apartment RWA',
          bankAccountNumber: bankAccountNumber || '',
          bankIfscCode: bankIfscCode || '',
          upiId: upiId || ''
        }
      });
    } else {
      config = await prisma.maintenanceConfig.update({
        where: { id: config.id },
        data: {
          baseFixedCharge: baseFixedCharge !== undefined ? Number(baseFixedCharge) : undefined,
          ratePerSqFt: ratePerSqFt !== undefined ? Number(ratePerSqFt) : undefined,
          dueDayOfMonth: dueDayOfMonth !== undefined ? Number(dueDayOfMonth) : undefined,
          lateFeeFlat: lateFeeFlat !== undefined ? Number(lateFeeFlat) : undefined,
          bankAccountName: bankAccountName || undefined,
          bankAccountNumber: bankAccountNumber || undefined,
          bankIfscCode: bankIfscCode || undefined,
          upiId: upiId || undefined
        }
      });
    }

    res.json({ success: true, config, message: 'Maintenance configuration updated successfully' });
  } catch (error) {
    console.error('UpdateConfig error:', error);
    res.status(500).json({ success: false, message: 'Failed to update configuration' });
  }
}

export async function getDues(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { period, flatId } = req.query;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    const whereClause: any = {};

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId) {
      whereClause.societyId = req.user.societyId;
    }

    if (!isAdmin) {
      // PRIVACY: Only Admin can view society-wide dues ledger.
      // Non-admins can strictly only fetch dues for their own assigned flat.
      if (!req.user?.flatId) {
        res.json({ success: true, dues: [] });
        return;
      }
      whereClause.flatId = req.user.flatId;
    } else if (flatId) {
      whereClause.flatId = String(flatId);
    }

    if (period) {
      whereClause.billingPeriod = String(period);
    }

    const dues = await prisma.maintenanceDue.findMany({
      where: whereClause,
      include: {
        flat: {
          include: {
            resident: {
              select: { id: true, fullName: true, email: true, phone: true }
            }
          }
        },
        payment: {
          include: {
            verifiedBy: {
              select: { id: true, fullName: true, role: true }
            }
          }
        }
      },
      orderBy: [{ billingPeriod: 'desc' }, { flat: { unitNumber: 'asc' } }]
    });

    res.json({ success: true, dues });
  } catch (error) {
    console.error('GetDues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dues' });
  }
}

export async function generateMonthlyDuesBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { billingPeriod } = req.body; // e.g. "2026-11"

    if (!billingPeriod || !/^\d{4}-\d{2}$/.test(billingPeriod)) {
      res.status(400).json({ success: false, message: 'Invalid billing period format. Use YYYY-MM (e.g. 2026-11)' });
      return;
    }

    const societyId = req.user?.societyId || (await prisma.society.findFirst())?.id;
    if (!societyId) {
      res.status(400).json({ success: false, message: 'Society not identified for dues generation.' });
      return;
    }

    // Check if dues already generated for this society
    const existing = await prisma.maintenanceDue.findFirst({
      where: { billingPeriod, societyId }
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: `Dues for billing period ${billingPeriod} have already been generated for this building.`
      });
      return;
    }

    const config = await prisma.maintenanceConfig.findUnique({ where: { societyId } });
    const ratePerSqFt = Number(config?.ratePerSqFt || 2.50);
    const baseFixed = Number(config?.baseFixedCharge || 500.00);
    const dueDay = config?.dueDayOfMonth || 5;

    const [year, month] = billingPeriod.split('-').map(Number);
    const dueDate = new Date(year, month - 1, dueDay, 23, 59, 59);

    const flats = await prisma.flat.findMany({ where: { societyId } });

    const createdDues = await prisma.$transaction(
      flats.map(flat => {
        const variable = Number((flat.superBuiltUpSqFt * ratePerSqFt).toFixed(2));
        const total = baseFixed + variable;

        return prisma.maintenanceDue.create({
          data: {
            societyId,
            flatId: flat.id,
            billingPeriod,
            sqFtRate: ratePerSqFt,
            areaSqFt: flat.superBuiltUpSqFt,
            fixedCharge: baseFixed,
            variableCharge: variable,
            totalDue: total,
            dueDate,
            status: DueStatus.PENDING
          }
        });
      })
    );

    res.json({
      success: true,
      message: `Successfully generated dues for ${createdDues.length} flats for period ${billingPeriod}`,
      count: createdDues.length
    });
  } catch (error) {
    console.error('GenerateMonthlyDuesBatch error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate monthly dues' });
  }
}

export async function submitPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { dueId, utrNumber, paymentMethod, amountPaid } = req.body;
    const proofFile = req.file;

    if (!dueId || !utrNumber) {
      res.status(400).json({ success: false, message: 'Due ID and UTR / Reference number are required' });
      return;
    }

    const due = await prisma.maintenanceDue.findUnique({
      where: { id: dueId },
      include: { flat: true }
    });

    if (!due) {
      res.status(404).json({ success: false, message: 'Due record not found' });
      return;
    }

    // Role check: Resident can only submit payment for their own flat
    if (req.user?.role === 'RESIDENT' && req.user.flatId !== due.flatId) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only submit payments for your assigned flat' });
      return;
    }

    if (due.status === DueStatus.PAID) {
      res.status(400).json({ success: false, message: 'This due is already marked as paid' });
      return;
    }

    const cleanUtr = String(utrNumber).trim().toUpperCase();

    // Flexible bank reference / UTR validation: 6 to 35 alphanumeric characters (with hyphens/underscores allowed)
    if (!/^[A-Z0-9\-_]{6,35}$/.test(cleanUtr)) {
      res.status(400).json({
        success: false,
        message: 'Invalid transaction reference format. Please enter a valid bank reference number or UTR (6 to 35 alphanumeric characters).'
      });
      return;
    }

    // Duplicate UTR check across different dues to prevent fraud
    const duplicatePayment = await prisma.payment.findFirst({
      where: {
        utrNumber: cleanUtr,
        dueId: { not: due.id }
      },
      include: {
        due: {
          include: { flat: true }
        }
      }
    });

    if (duplicatePayment) {
      res.status(409).json({
        success: false,
        message: `This transaction reference (${cleanUtr}) has already been claimed for Flat ${duplicatePayment.due.flat.unitNumber}. Duplicate payment claims are strictly prohibited.`
      });
      return;
    }

    const proofImageUrl = proofFile ? `/uploads/${proofFile.filename}` : null;
    const finalAmount = amountPaid ? Number(amountPaid) : Number(due.totalDue);

    // Upsert payment transaction
    const payment = await prisma.payment.upsert({
      where: { dueId: due.id },
      create: {
        dueId: due.id,
        amountPaid: finalAmount,
        paymentMethod: paymentMethod || 'UPI',
        utrNumber: cleanUtr,
        proofImageUrl,
        verificationStatus: PaymentVerification.PENDING,
        paidAt: new Date()
      },
      update: {
        amountPaid: finalAmount,
        paymentMethod: paymentMethod || 'UPI',
        utrNumber: cleanUtr,
        proofImageUrl: proofImageUrl || undefined,
        verificationStatus: PaymentVerification.PENDING,
        paidAt: new Date(),
        rejectionReason: null
      }
    });

    await prisma.maintenanceDue.update({
      where: { id: due.id },
      data: { status: DueStatus.SUBMITTED_FOR_VERIFICATION }
    });

    res.json({
      success: true,
      payment,
      message: 'Payment verification details submitted successfully. Admin will verify shortly.'
    });
  } catch (error) {
    console.error('SubmitPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit payment details' });
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { paymentId } = req.params;
    const { status, rejectionReason } = req.body; // status: "VERIFIED" | "REJECTED"
    const reviewerId = req.user?.userId || null;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        due: {
          include: {
            flat: {
              include: { resident: true }
            }
          }
        }
      }
    });

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin can strictly only verify payments for their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && payment.due.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only verify payments for your own society.' });
      return;
    }

    const config = await prisma.maintenanceConfig.findUnique({
      where: { societyId: payment.due.societyId }
    });

    if (status === 'VERIFIED') {
      const receiptNumber = payment.receiptNumber || `RCP-${payment.due.billingPeriod.replace('-', '')}-${payment.due.flat.unitNumber}`;

      // Generate PDF receipt on server
      const receiptFileName = await generateReceiptPdf({
        receiptNumber,
        societyName: config?.bankAccountName || 'Royal Orchid RWA',
        unitNumber: payment.due.flat.unitNumber,
        residentName: payment.due.flat.resident?.fullName || 'Resident',
        billingPeriod: payment.due.billingPeriod,
        areaSqFt: payment.due.areaSqFt,
        sqFtRate: Number(payment.due.sqFtRate),
        fixedCharge: Number(payment.due.fixedCharge),
        variableCharge: Number(payment.due.variableCharge),
        totalPaid: Number(payment.amountPaid),
        paymentMethod: payment.paymentMethod,
        utrNumber: payment.utrNumber,
        paidAt: payment.paidAt,
        verifiedAt: new Date()
      });

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          verificationStatus: PaymentVerification.VERIFIED,
          receiptNumber,
          receiptPdfUrl: `/uploads/receipts/${receiptFileName}`,
          verifiedAt: new Date(),
          verifiedById: reviewerId,
          rejectionReason: null
        }
      });

      await prisma.maintenanceDue.update({
        where: { id: payment.dueId },
        data: { status: DueStatus.PAID }
      });

      res.json({
        success: true,
        payment: updatedPayment,
        message: `Payment verified. Official receipt #${receiptNumber} generated.`
      });
    } else if (status === 'REJECTED') {
      const cleanReason = String(rejectionReason || '').trim() || 'Payment details could not be verified with society bank statement.';

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          verificationStatus: PaymentVerification.REJECTED,
          rejectionReason: cleanReason,
          verifiedAt: new Date(),
          verifiedById: reviewerId
        }
      });

      await prisma.maintenanceDue.update({
        where: { id: payment.dueId },
        data: { status: DueStatus.PENDING }
      });

      res.json({
        success: true,
        payment: updatedPayment,
        message: 'Payment rejected. Resident requested to resubmit valid transaction details.'
      });
    } else {
      res.status(400).json({ success: false, message: 'Status must be VERIFIED or REJECTED' });
    }
  } catch (error) {
    console.error('VerifyPayment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
}

export async function downloadReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { receiptNumber } = req.params;

    // Strict format validation to prevent path traversal characters
    if (!receiptNumber || !/^[A-Za-z0-9\-_]+$/.test(receiptNumber)) {
      res.status(400).json({ success: false, message: 'Invalid receipt number format' });
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { receiptNumber },
      include: {
        due: {
          include: { flat: true }
        }
      }
    });

    if (!payment) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    // Role check: Resident can only download their own flat receipt
    if (req.user?.role === 'RESIDENT' && req.user.flatId !== payment.due.flatId) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only download receipts for your own flat' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin/Staff can only access receipts from their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && payment.due.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: This receipt belongs to another society' });
      return;
    }

    const receiptsBaseDir = path.resolve(__dirname, '../../uploads/receipts');
    let safeFileName = path.basename(`receipt-${receiptNumber}.pdf`);
    let filePath = path.join(receiptsBaseDir, safeFileName);

    // If default pattern doesn't exist, check if payment record has a specific receiptPdfUrl on disk
    if (!fs.existsSync(filePath) && payment.receiptPdfUrl) {
      const altFileName = path.basename(payment.receiptPdfUrl);
      const altPath = path.join(receiptsBaseDir, altFileName);
      if (fs.existsSync(altPath)) {
        filePath = altPath;
        safeFileName = altFileName;
      }
    }

    // Guard against directory traversal
    if (!filePath.startsWith(receiptsBaseDir)) {
      res.status(400).json({ success: false, message: 'Invalid file path' });
      return;
    }

    if (!fs.existsSync(filePath)) {
      // Resilient on-demand generation if physical file was purged or not yet written to disk
      const society = await prisma.society.findUnique({
        where: { id: payment.due.societyId }
      });
      const config = await prisma.maintenanceConfig.findUnique({
        where: { societyId: payment.due.societyId }
      });
      const resident = await prisma.user.findFirst({
        where: { flatId: payment.due.flatId }
      });

      await generateReceiptPdf({
        receiptNumber: payment.receiptNumber || receiptNumber,
        societyName: society?.name || config?.bankAccountName || 'Apartment Society',
        unitNumber: payment.due.flat.unitNumber,
        residentName: resident?.fullName || 'Resident',
        billingPeriod: payment.due.billingPeriod,
        areaSqFt: payment.due.areaSqFt,
        sqFtRate: Number(payment.due.sqFtRate),
        fixedCharge: Number(payment.due.fixedCharge),
        variableCharge: Number(payment.due.variableCharge),
        totalPaid: Number(payment.amountPaid),
        paymentMethod: payment.paymentMethod,
        utrNumber: payment.utrNumber || 'N/A',
        paidAt: payment.paidAt,
        verifiedAt: payment.verifiedAt || new Date()
      });
    }

    res.download(filePath, `Receipt_${receiptNumber}.pdf`);
  } catch (error) {
    console.error('DownloadReceipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to download receipt' });
  }
}

export async function getExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { category, month } = req.query;
    const where: any = {};

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId) {
      where.societyId = req.user.societyId;
    }

    if (category) {
      where.category = String(category);
    }

    if (month) {
      const [year, m] = String(month).split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      where.expenseDate = { gte: start, lte: end };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        recordedBy: {
          select: { id: true, fullName: true, role: true }
        }
      },
      orderBy: { expenseDate: 'desc' }
    });

    res.json({ success: true, expenses });
  } catch (error) {
    console.error('GetExpenses error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve expenses' });
  }
}

export async function createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, category, amount, expenseDate, vendorName } = req.body;
    const billFile = req.file;

    if (!title || !category || !amount) {
      res.status(400).json({ success: false, message: 'Title, category, and amount are required' });
      return;
    }

    const societyId = req.user?.societyId || (await prisma.society.findFirst())?.id;
    if (!societyId) {
      res.status(400).json({ success: false, message: 'Society not identified for recording expense' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        societyId,
        title,
        category,
        amount: Number(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        vendorName: vendorName || null,
        billImageUrl: billFile ? `/uploads/${billFile.filename}` : null,
        recordedById: req.user!.userId
      }
    });

    res.json({ success: true, expense, message: 'Expense entry recorded in society ledger' });
  } catch (error) {
    console.error('CreateExpense error:', error);
    res.status(500).json({ success: false, message: 'Failed to record expense' });
  }
}

export async function deleteExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense record not found' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin can only delete expenses for their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && expense.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only delete expenses from your own society' });
      return;
    }

    await prisma.expense.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Expense record removed successfully' });
  } catch (error) {
    console.error('DeleteExpense error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
}

export async function getFinancialSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { period } = req.query;
    const currentPeriod = String(period || '2026-10');
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    const societyFilter: any = {};
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId) {
      societyFilter.societyId = req.user.societyId;
    }

    // 1. Dues for this period
    const dues = await prisma.maintenanceDue.findMany({
      where: {
        billingPeriod: currentPeriod,
        ...societyFilter
      }
    });

    const totalBilled = dues.reduce((acc, d) => acc + Number(d.totalDue), 0);
    const totalCollected = dues
      .filter(d => d.status === DueStatus.PAID)
      .reduce((acc, d) => acc + Number(d.totalDue), 0);
    const totalOutstanding = totalBilled - totalCollected;
    const pendingVerificationCount = dues.filter(d => d.status === DueStatus.SUBMITTED_FOR_VERIFICATION).length;
    const paidCount = dues.filter(d => d.status === DueStatus.PAID).length;
    const pendingCount = dues.filter(d => d.status === DueStatus.PENDING || d.status === DueStatus.OVERDUE).length;

    // 2. Expenses for this month
    const [year, month] = currentPeriod.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: startOfMonth, lte: endOfMonth },
        ...societyFilter
      }
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const netBalance = totalCollected - totalExpenses;

    // PRIVACY: Only Admin can see who has paid / who is left to pay & society collection metrics
    if (!isAdmin) {
      res.json({
        success: true,
        summary: {
          billingPeriod: currentPeriod,
          totalExpenses,
          totalFlats: dues.length,
          isAdmin: false
        }
      });
      return;
    }

    res.json({
      success: true,
      summary: {
        billingPeriod: currentPeriod,
        totalBilled,
        totalCollected,
        totalOutstanding,
        paidCount,
        pendingCount,
        pendingVerificationCount,
        totalExpenses,
        netBalance,
        totalFlats: dues.length,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('GetFinancialSummary error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate financial summary' });
  }
}
