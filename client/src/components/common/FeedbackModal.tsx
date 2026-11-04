import React, { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Star, MessageSquarePlus, CheckCircle2, AlertCircle, Sparkles, Bug, Lightbulb, Palette, MessageCircle } from 'lucide-react';
import { FeedbackType } from '../../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentPage = 'General'
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackType>('GENERAL');
  const [message, setMessage] = useState<string>('');
  const [name, setName] = useState<string>(user?.fullName || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ratingLabels = ['Needs Work', 'Fair', 'Good', 'Very Good', 'Exceptional'];

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const screenWidth = window.innerWidth;
    return `${isMobile ? 'Mobile' : 'Desktop'} (${screenWidth}px) • ${navigator.platform || 'Web'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setError('Please provide at least a short comment (5+ characters) to help us improve.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.feedback.submit({
        rating,
        category,
        message: message.trim(),
        page: currentPage,
        deviceInfo: getDeviceInfo(),
        name: name.trim() || undefined,
        email: email.trim() || undefined
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setMessage('');
    setError(null);
    onClose();
  };

  const categoryOptions: Array<{ type: FeedbackType; label: string; icon: React.ReactNode }> = [
    { type: 'BUG', label: 'Bug / Issue', icon: <Bug className="w-3.5 h-3.5 text-rose-500" /> },
    { type: 'FEATURE_REQUEST', label: 'Feature Request', icon: <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> },
    { type: 'USABILITY', label: 'UI / UX', icon: <Palette className="w-3.5 h-3.5 text-[#2c70dd]" /> },
    { type: 'GENERAL', label: 'General', icon: <MessageCircle className="w-3.5 h-3.5 text-[#24b26d]" /> }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Tester & Resident Feedback"
      subtitle="Help us refine your apartment community experience"
      maxWidth="max-w-md"
    >
      {submitted ? (
        <div className="py-6 text-center space-y-3 font-sans">
          <div className="w-12 h-12 rounded-full bg-[#f9f9fb] dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] text-[#24b26d] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#333333] dark:text-[#f4f4f5]">
            Thank you for your feedback!
          </h3>
          <p className="text-[13px] text-[#545454] dark:text-[#a1a1aa] max-w-sm mx-auto leading-relaxed">
            Your review and suggestions have been logged and will be used to enhance upcoming updates.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 rounded-full bg-[#333333] text-white hover:bg-[#1f1f1f] text-[13px] font-semibold transition cursor-pointer shadow-none"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-[13px]">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Star rating selector */}
          <div className="space-y-1.5 text-center p-3.5 rounded-[12px] bg-[#f9f9fb] dark:bg-[#1f1f23] border border-[#e5e7eb] dark:border-[#27272a]">
            <p className="text-[11px] font-semibold text-[#767676] uppercase tracking-wider">
              Rate Your Experience
            </p>
            <div className="flex items-center justify-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoverRating ?? rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#e5e7eb] dark:text-[#3f3f46]'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[12px] font-medium text-[#333333] dark:text-[#f4f4f5]">
              {ratingLabels[(hoverRating ?? rating) - 1]}
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block font-medium text-[#545454] dark:text-[#a1a1aa]">
              Feedback Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setCategory(opt.type)}
                  className={`flex items-center gap-2 p-2.5 rounded-[8px] border text-left text-[13px] font-medium transition cursor-pointer ${
                    category === opt.type
                      ? 'border-[#333333] dark:border-[#f4f4f5] bg-[#eff0f6] dark:bg-[#27272a] text-[#333333] dark:text-[#f4f4f5] font-semibold'
                      : 'border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-[#f9f9fb] text-[#545454] dark:text-[#a1a1aa]'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback message */}
          <div className="space-y-1.5">
            <label className="block font-medium text-[#545454] dark:text-[#a1a1aa]">
              Your Observations & Suggestions <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What worked well? What felt confusing, broken, or missing?"
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] shadow-none"
            />
          </div>

          {/* Tester name / email for follow-up */}
          {!user && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-[#767676] mb-0.5">Your Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="w-full px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[12px] text-[#333333] dark:text-[#f4f4f5] shadow-none focus:outline-none focus:border-[#333333]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#767676] mb-0.5">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tester@domain.com"
                  className="w-full px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[12px] text-[#333333] dark:text-[#f4f4f5] shadow-none focus:outline-none focus:border-[#333333]"
                />
              </div>
            </div>
          )}

          {/* Context footer */}
          <div className="text-[11px] text-[#767676] flex items-center justify-between pt-1 border-t border-[#e5e7eb] dark:border-[#27272a]">
            <span>Context: Page <strong>{currentPage}</strong></span>
            <span>Device info auto-attached</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-full border border-[#e5e7eb] dark:border-[#27272a] text-[#545454] dark:text-[#a1a1aa] hover:bg-[#f9f9fb] hover:border-[#545454] text-[13px] font-medium transition cursor-pointer shadow-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white text-[13px] font-semibold transition disabled:opacity-50 cursor-pointer shadow-none"
            >
              {loading ? 'Submitting...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
