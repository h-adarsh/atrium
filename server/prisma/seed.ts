import { PrismaClient, Role, ComplaintPriority, ComplaintStatus, DueStatus, PaymentVerification, NoticePriority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (Multi-Tenant Architecture)...');

  // Safeguard against accidental wipe in production unless forced
  const existingFlats = await prisma.flat.count();
  if (existingFlats > 0 && process.env.FORCE_SEED !== 'true') {
    console.log(`⚠️ Database already contains ${existingFlats} flats. Skipping seed to prevent accidental data loss.`);
    console.log('💡 Set FORCE_SEED=true to reset and reseed all data.');
    return;
  }

  // Clear existing records safely
  await prisma.feedback.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.maintenanceDue.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.user.deleteMany();
  await prisma.maintenanceConfig.deleteMany();
  await prisma.society.deleteMany();

  // 1. Create Default Society #1: Royal Orchid (4 Floors, 24 Units)
  const royalOrchid = await prisma.society.create({
    data: {
      name: 'Royal Orchid Apartments',
      slug: 'royal-orchid',
      address: '12th Main, HAL 2nd Stage, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      totalFloors: 4,
      flatsPerFloor: 6,
      hasBasement: false,
      hasTerrace: true,
      bankAccountName: 'Royal Orchid Apartment RWA',
      bankAccountNumber: '923010049281729',
      bankIfscCode: 'HDFC0001234',
      upiId: 'royalorchid.rwa@hdfcbank'
    }
  });
  console.log(`✅ Society created: ${royalOrchid.name} (${royalOrchid.slug})`);

  // 2. Create Society #2: Greenwoods Enclave (Demo Second Apartment: 3 Floors, 12 Units)
  const greenwoods = await prisma.society.create({
    data: {
      name: 'Greenwoods Enclave',
      slug: 'greenwoods',
      address: '5th Cross, Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      totalFloors: 3,
      flatsPerFloor: 4,
      hasBasement: true,
      hasTerrace: true,
      bankAccountName: 'Greenwoods Enclave Owners Association',
      bankAccountNumber: '812903110294811',
      bankIfscCode: 'ICIC0005678',
      upiId: 'greenwoods.rwa@icici'
    }
  });
  console.log(`✅ Society created: ${greenwoods.name} (${greenwoods.slug})`);

  // 3. Setup Maintenance Config for Royal Orchid
  await prisma.maintenanceConfig.create({
    data: {
      societyId: royalOrchid.id,
      baseFixedCharge: 500.00,
      ratePerSqFt: 2.50,
      dueDayOfMonth: 5,
      lateFeeFlat: 100.00,
      bankAccountName: royalOrchid.bankAccountName || 'Royal Orchid RWA',
      bankAccountNumber: royalOrchid.bankAccountNumber || '923010049281729',
      bankIfscCode: royalOrchid.bankIfscCode || 'HDFC0001234',
      upiId: royalOrchid.upiId || 'royalorchid.rwa@hdfcbank'
    }
  });

  // Setup Maintenance Config for Greenwoods
  await prisma.maintenanceConfig.create({
    data: {
      societyId: greenwoods.id,
      baseFixedCharge: 600.00,
      ratePerSqFt: 3.00,
      dueDayOfMonth: 7,
      lateFeeFlat: 150.00,
      bankAccountName: greenwoods.bankAccountName || 'Greenwoods Enclave RWA',
      bankAccountNumber: greenwoods.bankAccountNumber || '812903110294811',
      bankIfscCode: greenwoods.bankIfscCode || 'ICIC0005678',
      upiId: greenwoods.upiId || 'greenwoods.rwa@icici'
    }
  });
  console.log('✅ Maintenance configurations created for societies');

  // Password hashes
  const superAdminPasswordHash = await bcrypt.hash('superadmin123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const residentDefaultHash = await bcrypt.hash('resident123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  // 4. Create Super Admin (Platform Owner - can manage all societies)
  await prisma.user.create({
    data: {
      email: 'superadmin@atrium.local',
      fullName: 'Atrium Platform SuperAdmin',
      phone: '+91 99999 00000',
      passwordHash: superAdminPasswordHash,
      role: Role.SUPER_ADMIN
    }
  });

  // 5. Create Royal Orchid Admin & Staff Users
  const adminUser = await prisma.user.create({
    data: {
      societyId: royalOrchid.id,
      email: 'admin@atrium.local',
      fullName: 'Rajesh Sharma (Secretary / Treasurer)',
      phone: '+91 98765 43210',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN
    }
  });

  const staffUser = await prisma.user.create({
    data: {
      societyId: royalOrchid.id,
      email: 'staff@atrium.local',
      fullName: 'Ramesh Kumar (Electrician & Plumber)',
      phone: '+91 98111 22334',
      passwordHash: staffPasswordHash,
      role: Role.STAFF
    }
  });

  // Greenwoods Admin & Staff Users
  const gwAdminUser = await prisma.user.create({
    data: {
      societyId: greenwoods.id,
      email: 'greenwoods.admin@atrium.local',
      fullName: 'Vikram Seth (Greenwoods Secretary)',
      phone: '+91 98333 44556',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN
    }
  });

  const gwStaffUser = await prisma.user.create({
    data: {
      societyId: greenwoods.id,
      email: 'greenwoods.staff@atrium.local',
      fullName: 'Suresh Gowda (Electrician & Facility)',
      phone: '+91 98450 11223',
      passwordHash: staffPasswordHash,
      role: Role.STAFF
    }
  });
  console.log('✅ Admins & Staff created for Royal Orchid & Greenwoods Enclave');

  // 6. Create Royal Orchid 24 Flats and Residents (4 floors x 6 units)
  const flatsData = [
    // Floor 1
    { unit: '101', floor: 1, sqft: 1150, residentName: 'Amit Verma', phone: '+91 98201 10001' },
    { unit: '102', floor: 1, sqft: 1200, residentName: 'Pooja Nair', phone: '+91 98201 10002' },
    { unit: '103', floor: 1, sqft: 980, residentName: 'Karthik Iyer', phone: '+91 98201 10003' },
    { unit: '104', floor: 1, sqft: 1150, residentName: 'Rohan Kulkarni', phone: '+91 98201 10004' },
    { unit: '105', floor: 1, sqft: 1200, residentName: 'Meera Sen', phone: '+91 98201 10005' },
    { unit: '106', floor: 1, sqft: 980, residentName: 'Arvind Swamy', phone: '+91 98201 10006' },

    // Floor 2
    { unit: '201', floor: 2, sqft: 1150, residentName: 'Sunil Deshmukh', phone: '+91 98201 10007' },
    { unit: '202', floor: 2, sqft: 1200, residentName: 'Neha Gupta', phone: '+91 98201 10008' },
    { unit: '203', floor: 2, sqft: 980, residentName: 'Adarsh Singh', phone: '+91 98201 10009' },
    { unit: '204', floor: 2, sqft: 1150, residentName: 'Priya Bansal', phone: '+91 98201 10010' },
    { unit: '205', floor: 2, sqft: 1200, residentName: 'Harish Bhat', phone: '+91 98201 10011' },
    { unit: '206', floor: 2, sqft: 980, residentName: 'Sangeeta Rao', phone: '+91 98201 10012' },

    // Floor 3
    { unit: '301', floor: 3, sqft: 1150, residentName: 'Vikram Patel', phone: '+91 98201 10013' },
    { unit: '302', floor: 3, sqft: 1200, residentName: 'Ananya Roy', phone: '+91 98201 10014' },
    { unit: '303', floor: 3, sqft: 980, residentName: 'Deepak Joshi', phone: '+91 98201 10015' },
    { unit: '304', floor: 3, sqft: 1150, residentName: 'Tanvi Chawla', phone: '+91 98201 10016' },
    { unit: '305', floor: 3, sqft: 1200, residentName: 'Nikhil Mehra', phone: '+91 98201 10017' },
    { unit: '306', floor: 3, sqft: 980, residentName: 'Farhan Siddiqui', phone: '+91 98201 10018' },

    // Floor 4
    { unit: '401', floor: 4, sqft: 1150, residentName: 'Suresh Menon', phone: '+91 98201 10019' },
    { unit: '402', floor: 4, sqft: 1200, residentName: 'Kavita Reddy', phone: '+91 98201 10020' },
    { unit: '403', floor: 4, sqft: 980, residentName: 'Manish Agarwal', phone: '+91 98201 10021' },
    { unit: '404', floor: 4, sqft: 1150, residentName: 'Shalini Saxena', phone: '+91 98201 10022' },
    { unit: '405', floor: 4, sqft: 1200, residentName: 'Varun Kapoor', phone: '+91 98201 10023' },
    { unit: '406', floor: 4, sqft: 980, residentName: 'Divya Pillai', phone: '+91 98201 10024' },
  ];

  const createdFlats: any[] = [];
  const createdResidents: any[] = [];

  for (const f of flatsData) {
    const flatUser = await prisma.user.create({
      data: {
        societyId: royalOrchid.id,
        email: `flat${f.unit}@atrium.local`,
        fullName: f.residentName,
        phone: f.phone,
        passwordHash: residentDefaultHash,
        role: Role.RESIDENT
      }
    });
    createdResidents.push(flatUser);

    const flat = await prisma.flat.create({
      data: {
        societyId: royalOrchid.id,
        unitNumber: f.unit,
        floorNumber: f.floor,
        superBuiltUpSqFt: f.sqft,
        carpetSqFt: Math.round(f.sqft * 0.8),
        residentId: flatUser.id,
        occupancyType: 'OWNER',
        occupantCount: 2
      }
    });
    await prisma.user.update({
      where: { id: flatUser.id },
      data: { flatId: flat.id }
    });
    createdFlats.push(flat);
  }
  console.log(`✅ Royal Orchid: 24 Flats & Resident accounts created`);

  // 7. Seed Greenwoods Enclave sample flats (3 floors x 4 units = 12 units)
  const gwFlatsData = [
    // Floor 1
    { unit: '101', floor: 1, sqft: 1350, residentName: 'Vikram Seth', phone: '+91 98333 44556', occupancy: 'OWNER' },
    { unit: '102', floor: 1, sqft: 1300, residentName: 'Dr. Arvind Shenoy', phone: '+91 98400 10002', occupancy: 'OWNER' },
    { unit: '103', floor: 1, sqft: 1250, residentName: 'Priya Nambiar', phone: '+91 98400 10003', occupancy: 'TENANT' },
    { unit: '104', floor: 1, sqft: 1350, residentName: 'Rajesh Chhabra', phone: '+91 98400 10004', occupancy: 'OWNER' },

    // Floor 2
    { unit: '201', floor: 2, sqft: 1350, residentName: 'Rohan & Sneha Joshi', phone: '+91 98400 10005', occupancy: 'OWNER' },
    { unit: '202', floor: 2, sqft: 1300, residentName: 'Anand Murthy', phone: '+91 98400 10006', occupancy: 'OWNER' },
    { unit: '203', floor: 2, sqft: 1250, residentName: 'Meenakshi Sundaram', phone: '+91 98400 10007', occupancy: 'TENANT' },
    { unit: '204', floor: 2, sqft: 1350, residentName: 'Sameer Kulkarni', phone: '+91 98400 10008', occupancy: 'OWNER' },

    // Floor 3
    { unit: '301', floor: 3, sqft: 1350, residentName: 'Gaurav & Shilpa Tandon', phone: '+91 98400 10009', occupancy: 'OWNER' },
    { unit: '302', floor: 3, sqft: 1300, residentName: 'Lt. Col. David Joseph', phone: '+91 98400 10010', occupancy: 'OWNER' },
    { unit: '303', floor: 3, sqft: 1250, residentName: 'Radhika Nair', phone: '+91 98400 10011', occupancy: 'OWNER' },
    { unit: '304', floor: 3, sqft: 1350, residentName: 'Karthik Viswanathan', phone: '+91 98400 10012', occupancy: 'TENANT' },
  ];

  const gwCreatedFlats: any[] = [];
  const gwCreatedResidents: any[] = [];

  for (const f of gwFlatsData) {
    const gwResident = await prisma.user.create({
      data: {
        societyId: greenwoods.id,
        email: `gw${f.unit}@atrium.local`,
        fullName: f.residentName,
        phone: f.phone,
        passwordHash: residentDefaultHash,
        role: Role.RESIDENT
      }
    });
    gwCreatedResidents.push(gwResident);

    const gwFlat = await prisma.flat.create({
      data: {
        societyId: greenwoods.id,
        unitNumber: f.unit,
        floorNumber: f.floor,
        superBuiltUpSqFt: f.sqft,
        carpetSqFt: Math.round(f.sqft * 0.8),
        residentId: gwResident.id,
        occupancyType: f.occupancy as any,
        occupantCount: 3
      }
    });

    await prisma.user.update({
      where: { id: gwResident.id },
      data: { flatId: gwFlat.id }
    });
    gwCreatedFlats.push(gwFlat);
  }
  console.log(`✅ Greenwoods Enclave: 12 Flats & Resident accounts created`);

  // 8. Generate Monthly Dues for current period ("2026-10") for Royal Orchid
  const currentPeriod = '2026-10';
  const dueDate = new Date('2026-10-05T23:59:59.000Z');

  for (let i = 0; i < createdFlats.length; i++) {
    const flat = createdFlats[i];
    const fixed = 500;
    const variable = Number((flat.superBuiltUpSqFt * 2.50).toFixed(2));
    const total = fixed + variable;

    let dueStatus: DueStatus = DueStatus.PENDING;
    if (['101', '102', '203', '301', '305', '404'].includes(flat.unitNumber)) {
      dueStatus = DueStatus.PAID;
    } else if (['201', '304'].includes(flat.unitNumber)) {
      dueStatus = DueStatus.SUBMITTED_FOR_VERIFICATION;
    }

    const due = await prisma.maintenanceDue.create({
      data: {
        societyId: royalOrchid.id,
        flatId: flat.id,
        billingPeriod: currentPeriod,
        sqFtRate: 2.50,
        areaSqFt: flat.superBuiltUpSqFt,
        fixedCharge: fixed,
        variableCharge: variable,
        totalDue: total,
        dueDate: dueDate,
        status: dueStatus
      }
    });

    if (dueStatus === DueStatus.PAID) {
      await prisma.payment.create({
        data: {
          dueId: due.id,
          amountPaid: total,
          paymentMethod: 'UPI',
          utrNumber: `UPI40918239${flat.unitNumber}`,
          verificationStatus: PaymentVerification.VERIFIED,
          receiptNumber: `RCP-202610-${flat.unitNumber}`,
          receiptPdfUrl: `/uploads/receipts/receipt-${flat.unitNumber}-202610.pdf`,
          paidAt: new Date('2026-10-03T11:20:00Z'),
          verifiedAt: new Date('2026-10-03T18:00:00Z'),
          verifiedById: adminUser.id
        }
      });
    } else if (dueStatus === DueStatus.SUBMITTED_FOR_VERIFICATION) {
      await prisma.payment.create({
        data: {
          dueId: due.id,
          amountPaid: total,
          paymentMethod: 'UPI',
          utrNumber: `UPI40918239${flat.unitNumber}`,
          verificationStatus: PaymentVerification.PENDING,
          paidAt: new Date('2026-10-04T16:45:00Z')
        }
      });
    }
  }
  console.log('✅ Generated October 2026 Dues & Payments for Royal Orchid');

  // 9. Seed Royal Orchid Expenses
  await prisma.expense.createMany({
    data: [
      {
        societyId: royalOrchid.id,
        title: 'Municipal Water Tanker (2 loads x 6,000L)',
        category: 'WATER',
        amount: 2400.00,
        expenseDate: new Date('2026-10-02'),
        vendorName: 'Balaji Water Suppliers',
        recordedById: adminUser.id
      },
      {
        societyId: royalOrchid.id,
        title: 'Monthly Common Area & Staircase Deep Cleaning',
        category: 'CLEANING',
        amount: 3500.00,
        expenseDate: new Date('2026-10-01'),
        vendorName: 'ShineCare Facility Services',
        recordedById: adminUser.id
      },
      {
        societyId: royalOrchid.id,
        title: 'Lift Monthly AMC & Lubrication Check',
        category: 'LIFT_AMC',
        amount: 4200.00,
        expenseDate: new Date('2026-10-04'),
        vendorName: 'Johnson Lifts Pvt Ltd',
        recordedById: adminUser.id
      },
      {
        societyId: royalOrchid.id,
        title: 'Terrace Overhead Water Pump Sensor Replacement',
        category: 'REPAIRS',
        amount: 1850.00,
        expenseDate: new Date('2026-10-07'),
        vendorName: 'Standard Electric Works',
        recordedById: adminUser.id
      }
    ]
  });
  console.log('✅ Seeded society expenses');

  // 10. Seed Royal Orchid Complaints
  const flat203 = createdFlats.find(f => f.unitNumber === '203');
  const user203 = createdResidents.find(r => r.email === 'flat203@atrium.local');
  const flat402 = createdFlats.find(f => f.unitNumber === '402');
  const user402 = createdResidents.find(r => r.email === 'flat402@atrium.local');

  if (flat203 && user203) {
    await prisma.complaint.create({
      data: {
        societyId: royalOrchid.id,
        flatId: flat203.id,
        createdById: user203.id,
        title: 'Master Bedroom Balcony Drain Blockage',
        description: 'Rainwater is draining very slowly from the balcony drain pipe during evening showers.',
        category: 'PLUMBING',
        priority: ComplaintPriority.MEDIUM,
        status: ComplaintStatus.RESOLVED,
        assignedTo: 'Ramesh Kumar (Plumber)',
        resolutionNotes: 'Removed leaf debris and descaled drain pipe grating.',
        resolvedAt: new Date('2026-10-05T14:30:00Z')
      }
    });
  }

  if (flat402 && user402) {
    await prisma.complaint.create({
      data: {
        societyId: royalOrchid.id,
        flatId: flat402.id,
        createdById: user402.id,
        title: 'Low Water Pressure in Kitchen Sink Tap',
        description: 'Noticeable drop in water pressure between 7 AM and 9 AM. Overhead booster pump may need inspection.',
        category: 'PLUMBING',
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.IN_PROGRESS,
        preferredSlot: 'Morning 9:00 AM - 11:00 AM',
        assignedTo: 'Ramesh Kumar (Plumber)'
      }
    });
  }
  console.log('✅ Seeded initial complaints');

  // 11. Seed Royal Orchid Notices
  await prisma.notice.createMany({
    data: [
      {
        societyId: royalOrchid.id,
        title: 'Overhead Water Tank Cleaning Scheduled',
        content: 'Dear Residents, the society overhead water tanks will undergo quarterly chemical scrubbing and disinfection on Saturday, 18-Oct from 9:00 AM to 1:00 PM. Water supply will remain suspended during this window. Please store adequate water beforehand.',
        category: 'WATER',
        priority: NoticePriority.URGENT,
        pinned: true,
        publishedById: adminUser.id
      },
      {
        societyId: royalOrchid.id,
        title: 'Terrace Access Rules & Solar Inverter Notice',
        content: 'Residents are kindly reminded that terrace gates are kept open between 6:00 AM and 10:00 PM. Please ensure the terrace door is latched after evening walks. Do not place heavy pots near the solar inverter wiring zone.',
        category: 'GENERAL',
        priority: NoticePriority.IMPORTANT,
        pinned: true,
        publishedById: adminUser.id
      },
      {
        societyId: royalOrchid.id,
        title: 'RWA Monthly General Meeting (AGM) Announcement',
        content: 'A brief 30-minute informal meeting is scheduled on Sunday, 26-Oct at 6:00 PM on the 1st-floor lobby to discuss the festival lighting budget and CCTV camera addition at the front gate.',
        category: 'MEETING',
        priority: NoticePriority.NORMAL,
        pinned: false,
        publishedById: adminUser.id
      }
    ]
  });
  console.log('✅ Seeded Royal Orchid notices');

  // =========================================================================
  // GREENWOODS ENCLAVE SAMPLE DATA (Dues, Payments, Expenses, Tickets, Notices)
  // =========================================================================

  // 12. Generate October 2026 Monthly Dues for Greenwoods Enclave
  const gwDueDate = new Date('2026-10-07T23:59:59.000Z');
  for (const flat of gwCreatedFlats) {
    const fixed = 600;
    const variable = Number((flat.superBuiltUpSqFt * 3.00).toFixed(2));
    const total = fixed + variable;

    let dueStatus: DueStatus = DueStatus.PENDING;
    // 6 Paid, 2 Awaiting Verification, 4 Unpaid
    if (['101', '102', '104', '202', '301', '303'].includes(flat.unitNumber)) {
      dueStatus = DueStatus.PAID;
    } else if (['201', '204'].includes(flat.unitNumber)) {
      dueStatus = DueStatus.SUBMITTED_FOR_VERIFICATION;
    }

    const due = await prisma.maintenanceDue.create({
      data: {
        societyId: greenwoods.id,
        flatId: flat.id,
        billingPeriod: currentPeriod,
        sqFtRate: 3.00,
        areaSqFt: flat.superBuiltUpSqFt,
        fixedCharge: fixed,
        variableCharge: variable,
        totalDue: total,
        dueDate: gwDueDate,
        status: dueStatus
      }
    });

    if (dueStatus === DueStatus.PAID) {
      await prisma.payment.create({
        data: {
          dueId: due.id,
          amountPaid: total,
          paymentMethod: 'UPI',
          utrNumber: `UPI82910482${flat.unitNumber}`,
          verificationStatus: PaymentVerification.VERIFIED,
          receiptNumber: `RCP-GW-202610-${flat.unitNumber}`,
          receiptPdfUrl: `/uploads/receipts/receipt-gw-${flat.unitNumber}-202610.pdf`,
          paidAt: new Date('2026-10-04T10:15:00Z'),
          verifiedAt: new Date('2026-10-04T17:30:00Z'),
          verifiedById: gwAdminUser.id
        }
      });
    } else if (dueStatus === DueStatus.SUBMITTED_FOR_VERIFICATION) {
      await prisma.payment.create({
        data: {
          dueId: due.id,
          amountPaid: total,
          paymentMethod: 'UPI',
          utrNumber: `UPI82910482${flat.unitNumber}`,
          verificationStatus: PaymentVerification.PENDING,
          paidAt: new Date('2026-10-06T15:20:00Z')
        }
      });
    }
  }
  console.log('✅ Generated October 2026 Dues & Payments for Greenwoods Enclave');

  // 13. Seed Greenwoods Enclave Expenses
  await prisma.expense.createMany({
    data: [
      {
        societyId: greenwoods.id,
        title: 'Monthly Security & Intercom Surveillance Guard Services',
        category: 'SECURITY',
        amount: 16500.00,
        expenseDate: new Date('2026-10-01'),
        vendorName: 'Apex Shield Facility Management',
        recordedById: gwAdminUser.id
      },
      {
        societyId: greenwoods.id,
        title: 'Diesel for 40kVA Backup Generator (180 Litres)',
        category: 'DIESEL_GENERATOR',
        amount: 4800.00,
        expenseDate: new Date('2026-10-03'),
        vendorName: 'Indian Oil Corporation',
        recordedById: gwAdminUser.id
      },
      {
        societyId: greenwoods.id,
        title: 'Common Area BESCOM Electricity Bill (Basement & Lobbies)',
        category: 'ELECTRICITY',
        amount: 6450.00,
        expenseDate: new Date('2026-10-05'),
        vendorName: 'Bangalore Electricity Supply Company (BESCOM)',
        recordedById: gwAdminUser.id
      },
      {
        societyId: greenwoods.id,
        title: 'Sewage Treatment Plant (STP) Blower & Filter Maintenance',
        category: 'REPAIRS',
        amount: 3200.00,
        expenseDate: new Date('2026-10-06'),
        vendorName: 'EnviroPure Water Solutions',
        recordedById: gwAdminUser.id
      },
      {
        societyId: greenwoods.id,
        title: 'Vertical Garden Drip Irrigation & Landscaping Maintenance',
        category: 'GARDENING',
        amount: 2500.00,
        expenseDate: new Date('2026-10-07'),
        vendorName: 'GreenLeaf Urban Gardens',
        recordedById: gwAdminUser.id
      }
    ]
  });
  console.log('✅ Seeded Greenwoods society expenses');

  // 14. Seed Greenwoods Enclave Complaints
  const gwFlat204 = gwCreatedFlats.find(f => f.unitNumber === '204');
  const gwUser204 = gwCreatedResidents.find(r => r.email === 'gw204@atrium.local');
  const gwFlat102 = gwCreatedFlats.find(f => f.unitNumber === '102');
  const gwUser102 = gwCreatedResidents.find(r => r.email === 'gw102@atrium.local');
  const gwFlat301 = gwCreatedFlats.find(f => f.unitNumber === '301');
  const gwUser301 = gwCreatedResidents.find(r => r.email === 'gw301@atrium.local');
  const gwFlat103 = gwCreatedFlats.find(f => f.unitNumber === '103');
  const gwUser103 = gwCreatedResidents.find(r => r.email === 'gw103@atrium.local');

  if (gwFlat204 && gwUser204) {
    await prisma.complaint.create({
      data: {
        societyId: greenwoods.id,
        flatId: gwFlat204.id,
        createdById: gwUser204.id,
        title: 'Basement B1 Stilt Car Parking Water Seepage',
        description: 'Water is trickling from the ceiling expansion joint above car parking slot P-08 after heavy evening rain.',
        category: 'PLUMBING',
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.IN_PROGRESS,
        preferredSlot: 'Evening after 6:00 PM',
        assignedTo: 'Suresh Gowda (Facility)'
      }
    });
  }

  if (gwFlat102 && gwUser102) {
    await prisma.complaint.create({
      data: {
        societyId: greenwoods.id,
        flatId: gwFlat102.id,
        createdById: gwUser102.id,
        title: 'Intercom Audio Distortion & Main Gate Unlock Failure',
        description: 'Intercom receiver has continuous static buzzing and pressing 0 to unlock the visitor turnstile does not respond.',
        category: 'ELECTRICAL',
        priority: ComplaintPriority.MEDIUM,
        status: ComplaintStatus.OPEN,
        preferredSlot: 'Morning 10:00 AM - 12:00 PM'
      }
    });
  }

  if (gwFlat301 && gwUser301) {
    await prisma.complaint.create({
      data: {
        societyId: greenwoods.id,
        flatId: gwFlat301.id,
        createdById: gwUser301.id,
        title: 'Rooftop Solar Inverter Error Code E-04',
        description: 'Phase imbalance warning buzzer sounded on the top terrace solar controller during peak sunlight.',
        category: 'ELECTRICAL',
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.RESOLVED,
        assignedTo: 'Suresh Gowda (Electrician)',
        resolutionNotes: 'Cleaned DC busbar terminals and reset grid-tied breaker. Generation restored to 12.4 kW.',
        resolvedAt: new Date('2026-10-06T16:00:00Z')
      }
    });
  }

  if (gwFlat103 && gwUser103) {
    await prisma.complaint.create({
      data: {
        societyId: greenwoods.id,
        flatId: gwFlat103.id,
        createdById: gwUser103.id,
        title: 'Basement Corridor Motion Sensor Light Off',
        description: 'The PIR sensor lamp outside the lift vestibule in Basement -1 does not turn on when walking past.',
        category: 'ELECTRICAL',
        priority: ComplaintPriority.LOW,
        status: ComplaintStatus.OPEN
      }
    });
  }
  console.log('✅ Seeded Greenwoods initial complaints');

  // 15. Seed Greenwoods Enclave Notices
  await prisma.notice.createMany({
    data: [
      {
        societyId: greenwoods.id,
        title: 'Basement Sump Deep Cleaning & Power Washing',
        content: 'Dear Residents, quarterly pressure-washing and chemical disinfection of the basement parking and rainwater harvesting sumps will be conducted on Thursday, 22-Oct from 10:00 AM to 4:00 PM. Please park vehicles in marked visitor bays during this period.',
        category: 'WATER',
        priority: NoticePriority.URGENT,
        pinned: true,
        publishedById: gwAdminUser.id
      },
      {
        societyId: greenwoods.id,
        title: 'Diwali Community Lighting & Common Terrace Setup',
        content: 'Warm festive greetings! Common area fairy light installations on balconies and the rooftop terrace garden will begin this Saturday. Residents are requested not to route personal extension cords through common stairwells.',
        category: 'GENERAL',
        priority: NoticePriority.IMPORTANT,
        pinned: true,
        publishedById: gwAdminUser.id
      },
      {
        societyId: greenwoods.id,
        title: 'RWA General Body Meeting: Security & Access Control Review',
        content: 'All owners and residents are cordially invited to our quarterly general meeting this Sunday, 25-Oct at 11:00 AM in the Ground Floor Clubhouse. Agenda: boom-barrier RFID tags and CCTV coverage expansion.',
        category: 'MEETING',
        priority: NoticePriority.NORMAL,
        pinned: false,
        publishedById: gwAdminUser.id
      }
    ]
  });
  console.log('✅ Seeded Greenwoods society notices');

  console.log('\n🎉 Multi-Tenant Seeding Complete!');
  console.log('----------------------------------------------------');
  console.log('PLATFORM SUPERADMIN: superadmin@atrium.local   / superadmin123');
  console.log('ROYAL ORCHID ADMIN:  admin@atrium.local        / admin123');
  console.log('GREENWOODS ADMIN:    greenwoods.admin@atrium.local / admin123');
  console.log('ROYAL ORCHID USERS:  flat101@atrium.local ... flat406@atrium.local / resident123');
  console.log('GREENWOODS USERS:    gw101@atrium.local ... gw304@atrium.local / resident123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
