import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Notice } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const WhatsAppShareButton: React.FC<{ notice: Notice }> = ({ notice }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();

    const societyName = user?.society?.name || 'Apartment RWA';
    const formattedMessage = `📢 *[SOCIETY NOTICE: ${notice.title.toUpperCase()}]*\n` +
      `🏢 ${societyName}\n` +
      `Priority: ${notice.priority}\n\n` +
      `${notice.content}\n\n` +
      `Date: ${new Date(notice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
      `— Building Management`;

    const encoded = encodeURIComponent(formattedMessage);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
      title="Share notice to building WhatsApp group"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
      <span>{copied ? 'Opening...' : 'Share to WhatsApp'}</span>
    </button>
  );
};
