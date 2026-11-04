import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getAllFlats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const userFlatId = req.user?.flatId;

    const whereClause: any = {};
    if (req.user?.role !== 'SUPER_ADMIN') {
      if (req.user?.societyId) {
        whereClause.societyId = req.user.societyId;
      }
    } else if (req.query.societyId) {
      whereClause.societyId = String(req.query.societyId);
    }

    const flats = await prisma.flat.findMany({
      where: whereClause,
      include: {
        resident: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        dues: {
          take: 1,
          orderBy: { billingPeriod: 'desc' },
          include: { payment: true }
        }
      },
      orderBy: { unitNumber: 'asc' }
    });

    // PRIVACY: Only Admin can see maintenance due status across all units.
    // Non-admin users only receive dues data for their own assigned flat.
    const sanitizedFlats = flats.map(flat => {
      if (isAdmin || (userFlatId && flat.id === userFlatId)) {
        return flat;
      }
      return {
        ...flat,
        dues: []
      };
    });

    res.json({ success: true, flats: sanitizedFlats });
  } catch (error) {
    console.error('GetAllFlats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve flats' });
  }
}

export async function getFlatById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // RBAC: Resident can only view their own flat details unless ADMIN
    if (req.user?.role === 'RESIDENT' && req.user.flatId !== id) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only view your own flat details' });
      return;
    }

    const flat = await prisma.flat.findUnique({
      where: { id },
      include: {
        resident: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        dues: {
          orderBy: { billingPeriod: 'desc' },
          include: { payment: true }
        },
        complaints: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!flat) {
      res.status(404).json({ success: false, message: 'Flat not found' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin/Resident can only view flats in their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && flat.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: Flat belongs to another society' });
      return;
    }

    res.json({ success: true, flat });
  } catch (error) {
    console.error('GetFlatById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flat details' });
  }
}

export async function updateFlat(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { superBuiltUpSqFt, carpetSqFt, fullName, phone, email } = req.body;

    const flat = await prisma.flat.findUnique({
      where: { id },
      include: { resident: true }
    });

    if (!flat) {
      res.status(404).json({ success: false, message: 'Flat not found' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin can only update flats in their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && flat.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: Flat belongs to another society' });
      return;
    }

    // Update flat physical details
    const updatedFlat = await prisma.flat.update({
      where: { id },
      data: {
        superBuiltUpSqFt: superBuiltUpSqFt ? Number(superBuiltUpSqFt) : undefined,
        carpetSqFt: carpetSqFt ? Number(carpetSqFt) : undefined
      }
    });

    // If resident info is provided, update user
    if (flat.residentId && (fullName || phone || email)) {
      await prisma.user.update({
        where: { id: flat.residentId },
        data: {
          fullName: fullName || undefined,
          phone: phone || undefined,
          email: email ? email.toLowerCase().trim() : undefined
        }
      });
    }

    res.json({ success: true, flat: updatedFlat, message: 'Flat details updated successfully' });
  } catch (error) {
    console.error('UpdateFlat error:', error);
    res.status(500).json({ success: false, message: 'Failed to update flat' });
  }
}
