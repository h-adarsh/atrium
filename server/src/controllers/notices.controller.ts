import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { NoticePriority } from '@prisma/client';

export async function getNotices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const where: any = {};
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId) {
      where.societyId = req.user.societyId;
    }

    const notices = await prisma.notice.findMany({
      where,
      include: {
        publishedBy: {
          select: { fullName: true, role: true }
        }
      },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ success: true, notices });
  } catch (error) {
    console.error('GetNotices error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notices' });
  }
}

export async function createNotice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, content, category, priority, pinned, expiresAt } = req.body;

    if (!title || !content || !category) {
      res.status(400).json({ success: false, message: 'Title, content, and category are required' });
      return;
    }

    const societyId = req.user?.societyId || (await prisma.society.findFirst())?.id;
    if (!societyId) {
      res.status(400).json({ success: false, message: 'Society affiliation missing for notice' });
      return;
    }

    const notice = await prisma.notice.create({
      data: {
        societyId,
        title: title.trim(),
        content: content.trim(),
        category,
        priority: (priority as NoticePriority) || NoticePriority.NORMAL,
        pinned: Boolean(pinned),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        publishedById: req.user!.userId
      },
      include: {
        publishedBy: {
          select: { fullName: true }
        }
      }
    });

    res.json({ success: true, notice, message: 'Society notice published successfully' });
  } catch (error) {
    console.error('CreateNotice error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish notice' });
  }
}

export async function togglePinNotice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.notice.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Notice not found' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin can only pin/unpin notices in their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && existing.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: Notice belongs to another society' });
      return;
    }

    const notice = await prisma.notice.update({
      where: { id },
      data: {
        pinned: !existing.pinned
      },
      include: {
        publishedBy: {
          select: { fullName: true }
        }
      }
    });

    res.json({
      success: true,
      notice,
      message: `Notice ${notice.pinned ? 'pinned to top' : 'unpinned'} successfully`
    });
  } catch (error) {
    console.error('TogglePinNotice error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle notice pin status' });
  }
}

export async function deleteNotice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.notice.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Notice not found' });
      return;
    }

    // MULTI-TENANT ISOLATION: Admin can only delete notices in their own society
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && existing.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden: Notice belongs to another society' });
      return;
    }

    await prisma.notice.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('DeleteNotice error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notice' });
  }
}
