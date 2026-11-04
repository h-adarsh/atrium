import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { Role } from '@prisma/client';

// Public: Get all registered societies for selection / login
export async function getSocieties(_req: Request, res: Response): Promise<void> {
  try {
    const societies = await prisma.society.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        city: true,
        state: true,
        totalFloors: true,
        flatsPerFloor: true,
        hasBasement: true,
        hasTerrace: true,
        bankAccountName: true,
        upiId: true,
        _count: {
          select: { flats: true, users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, societies });
  } catch (error) {
    console.error('GetSocieties error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve societies' });
  }
}

// Public / Authenticated: Get society by slug or ID with sensitive banking data masked for visitors
export async function getSocietyBySlug(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const society = await prisma.society.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ]
      },
      include: {
        config: true,
        _count: {
          select: { flats: true, users: true }
        }
      }
    });

    if (!society) {
      res.status(404).json({ success: false, message: 'Society not found' });
      return;
    }

    const isSocietyAdmin = req.user && (req.user.role === Role.SUPER_ADMIN || (req.user.role === Role.ADMIN && req.user.societyId === society.id));
    const isSocietyResident = req.user && req.user.societyId === society.id;

    // Redact internal bank account number if requester is not an authenticated member/admin of this society
    const sanitizedSociety = {
      ...society,
      config: society.config ? {
        ...society.config,
        bankAccountNumber: (isSocietyAdmin || isSocietyResident)
          ? society.config.bankAccountNumber
          : society.config.bankAccountNumber
            ? `••••••••${society.config.bankAccountNumber.slice(-4)}`
            : null,
        bankIfscCode: (isSocietyAdmin || isSocietyResident)
          ? society.config.bankIfscCode
          : '••••••••'
      } : null
    };

    res.json({ success: true, society: sanitizedSociety });
  } catch (error) {
    console.error('GetSocietyBySlug error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve society details' });
  }
}

// Onboard / Create New Society (SuperAdmin or Public RWA Setup)
export async function createSociety(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      name,
      slug,
      address,
      city,
      state,
      pincode,
      totalFloors,
      flatsPerFloor,
      hasBasement,
      hasTerrace,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
      upiId,
      baseFixedCharge,
      ratePerSqFt,
      defaultSqFt
    } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ success: false, message: 'Society name is required' });
      return;
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await prisma.society.findUnique({
      where: { slug: cleanSlug }
    });

    if (existing) {
      res.status(409).json({ success: false, message: `A society with slug '${cleanSlug}' already exists.` });
      return;
    }

    const rawFloors = parseInt(totalFloors, 10) || 4;
    const rawUnitsPerFloor = parseInt(flatsPerFloor, 10) || 6;

    // DoS / Resource Exhaustion Guard: Enforce reasonable architectural boundaries
    if (rawFloors < 1 || rawFloors > 60) {
      res.status(400).json({ success: false, message: 'Total floors must be between 1 and 60.' });
      return;
    }

    if (rawUnitsPerFloor < 1 || rawUnitsPerFloor > 30) {
      res.status(400).json({ success: false, message: 'Flats per floor must be between 1 and 30.' });
      return;
    }

    if (rawFloors * rawUnitsPerFloor > 500) {
      res.status(400).json({ success: false, message: 'Maximum 500 units can be auto-generated in a single complex.' });
      return;
    }

    const floors = rawFloors;
    const unitsPerFloor = rawUnitsPerFloor;
    const avgSqFt = Math.max(300, Math.min(10000, Number(defaultSqFt) || 1150));

    // Create society and default maintenance config in transaction
    const newSociety = await prisma.$transaction(async (tx) => {
      const soc = await tx.society.create({
        data: {
          name: name.trim(),
          slug: cleanSlug,
          address: address?.trim() || null,
          city: city?.trim() || 'Bengaluru',
          state: state?.trim() || 'Karnataka',
          pincode: pincode?.trim() || null,
          totalFloors: floors,
          flatsPerFloor: unitsPerFloor,
          hasBasement: Boolean(hasBasement),
          hasTerrace: hasTerrace !== undefined ? Boolean(hasTerrace) : true,
          bankAccountName: bankAccountName?.trim() || `${name} RWA`,
          bankAccountNumber: bankAccountNumber?.trim() || null,
          bankIfscCode: bankIfscCode?.trim() || null,
          upiId: upiId?.trim() || null
        }
      });

      // Default maintenance config
      await tx.maintenanceConfig.create({
        data: {
          societyId: soc.id,
          baseFixedCharge: Number(baseFixedCharge) || 500,
          ratePerSqFt: Number(ratePerSqFt) || 2.50,
          dueDayOfMonth: 5,
          lateFeeFlat: 100,
          bankAccountName: soc.bankAccountName || `${soc.name} RWA`,
          bankAccountNumber: soc.bankAccountNumber || '',
          bankIfscCode: soc.bankIfscCode || '',
          upiId: soc.upiId || ''
        }
      });

      // Auto-generate flats based on floors & units per floor
      for (let floor = 1; floor <= floors; floor++) {
        for (let u = 1; u <= unitsPerFloor; u++) {
          const unitNumber = `${floor}0${u}`;
          await tx.flat.create({
            data: {
              societyId: soc.id,
              unitNumber,
              floorNumber: floor,
              superBuiltUpSqFt: avgSqFt,
              carpetSqFt: Math.round(avgSqFt * 0.8),
              occupancyType: 'OWNER',
              occupantCount: 2
            }
          });
        }
      }

      return soc;
    });

    res.status(201).json({
      success: true,
      society: newSociety,
      message: `Society '${newSociety.name}' created successfully.`
    });
  } catch (error) {
    console.error('CreateSociety error:', error);
    res.status(500).json({ success: false, message: 'Failed to create society' });
  }
}

