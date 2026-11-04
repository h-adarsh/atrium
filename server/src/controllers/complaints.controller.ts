import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';

export async function getComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, category, priority } = req.query;
    const isResident = req.user?.role === 'RESIDENT';

    const where: any = {};

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId) {
      where.societyId = req.user.societyId;
    }

    if (isResident) {
      if (!req.user?.flatId) {
        res.status(403).json({ success: false, message: 'No flat linked to this resident account' });
        return;
      }
      where.flatId = req.user.flatId;
    }

    if (status) {
      where.status = status as ComplaintStatus;
    }
    if (category) {
      where.category = String(category);
    }
    if (priority) {
      where.priority = priority as ComplaintPriority;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        flat: {
          select: { unitNumber: true, floorNumber: true }
        },
        createdBy: {
          select: { fullName: true, phone: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ success: true, complaints });
  } catch (error) {
    console.error('GetComplaints error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve complaints' });
  }
}

export async function createComplaint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, description, category, priority, preferredSlot } = req.body;
    const photoFile = req.file;

    if (!title || !description || !category) {
      res.status(400).json({ success: false, message: 'Title, description, and category are required' });
      return;
    }

    if (!req.user?.flatId) {
      res.status(400).json({ success: false, message: 'User must belong to a flat to file a complaint' });
      return;
    }

    const flat = await prisma.flat.findUnique({ where: { id: req.user.flatId } });
    const societyId = req.user.societyId || flat?.societyId;

    if (!societyId) {
      res.status(400).json({ success: false, message: 'Society affiliation missing for filing complaint' });
      return;
    }

    const complaint = await prisma.complaint.create({
      data: {
        societyId,
        flatId: req.user.flatId,
        createdById: req.user.userId,
        title: title.trim(),
        description: description.trim(),
        category,
        priority: (priority as ComplaintPriority) || ComplaintPriority.MEDIUM,
        preferredSlot: preferredSlot || null,
        photoUrl: photoFile ? `/uploads/${photoFile.filename}` : null,
        status: ComplaintStatus.OPEN
      },
      include: {
        flat: {
          select: { unitNumber: true }
        }
      }
    });

    res.json({
      success: true,
      complaint,
      message: `Ticket #${complaint.ticketNumber} registered successfully`
    });
  } catch (error) {
    console.error('CreateComplaint error:', error);
    res.status(500).json({ success: false, message: 'Failed to create complaint ticket' });
  }
}

export async function updateComplaint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionNotes, priority } = req.body;
    const resolutionFile = req.file;

    const existing = await prisma.complaint.findUnique({
      where: { id },
      include: { flat: true }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Complaint not found' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin/Staff can only update complaints within their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && existing.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: Ticket belongs to another society.' });
      return;
    }

    // Role checking:
    // Residents can only mark their own ticket as CLOSED if RESOLVED, or cancel OPEN ticket
    if (req.user?.role === 'RESIDENT') {
      if (req.user.flatId !== existing.flatId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      if (status !== 'CLOSED') {
        res.status(403).json({ success: false, message: 'Residents can only close resolved tickets' });
        return;
      }
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status as ComplaintStatus;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }
    }

    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    if (priority !== undefined) updateData.priority = priority as ComplaintPriority;
    if (resolutionFile) updateData.resolutionPhotoUrl = `/uploads/${resolutionFile.filename}`;

    const updated = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        flat: { select: { unitNumber: true, floorNumber: true } },
        createdBy: { select: { fullName: true } }
      }
    });

    res.json({
      success: true,
      complaint: updated,
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('UpdateComplaint error:', error);
    res.status(500).json({ success: false, message: 'Failed to update complaint' });
  }
}
