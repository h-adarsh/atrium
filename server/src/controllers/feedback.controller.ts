import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { FeedbackType } from '@prisma/client';

export async function submitFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { rating, category, message, page, deviceInfo, name, email } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars.' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Please provide a constructive message (at least 5 characters).' });
      return;
    }

    const validCategories: FeedbackType[] = ['BUG', 'FEATURE_REQUEST', 'USABILITY', 'GENERAL'];
    const feedbackCategory: FeedbackType = validCategories.includes(category) ? category : 'GENERAL';

    const feedback = await prisma.feedback.create({
      data: {
        societyId: req.user?.societyId || null,
        userId: req.user?.userId || null,
        name: name?.trim() || null,
        email: email?.trim() || null,
        rating: Math.round(numRating),
        category: feedbackCategory,
        message: message.trim(),
        page: page?.trim() || null,
        deviceInfo: deviceInfo?.trim() || null
      }
    });

    res.status(201).json({
      success: true,
      feedback,
      message: 'Thank you for your valuable feedback! The development team will review it.'
    });
  } catch (error) {
    console.error('SubmitFeedback error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
}

export async function getFeedbacks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { category, minRating } = req.query;

    const whereClause: any = {};
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId) {
      whereClause.societyId = req.user.societyId;
    }
    if (category && category !== 'ALL') {
      whereClause.category = category as FeedbackType;
    }
    if (minRating) {
      whereClause.rating = { gte: Number(minRating) };
    }

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            flat: {
              select: { unitNumber: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Summary statistics
    const totalCount = feedbacks.length;
    const avgRating = totalCount > 0
      ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1))
      : 0;

    const categoryBreakdown = {
      BUG: feedbacks.filter(f => f.category === 'BUG').length,
      FEATURE_REQUEST: feedbacks.filter(f => f.category === 'FEATURE_REQUEST').length,
      USABILITY: feedbacks.filter(f => f.category === 'USABILITY').length,
      GENERAL: feedbacks.filter(f => f.category === 'GENERAL').length
    };

    res.json({
      success: true,
      summary: {
        totalCount,
        avgRating,
        categoryBreakdown
      },
      feedbacks
    });
  } catch (error) {
    console.error('GetFeedbacks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feedback entries' });
  }
}

export async function deleteFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Feedback entry not found' });
      return;
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.societyId && existing.societyId && existing.societyId !== req.user.societyId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    await prisma.feedback.delete({ where: { id } });
    res.json({ success: true, message: 'Feedback entry deleted' });
  } catch (error) {
    console.error('DeleteFeedback error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete feedback entry' });
  }
}
