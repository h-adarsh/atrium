import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Notice } from '../types';
import { NoticePriorityBadge } from '../components/common/Badge';
import { WhatsAppShareButton } from '../components/notices/WhatsAppShareButton';
import { NewNoticeModal } from '../components/notices/NewNoticeModal';
import { Plus, Pin, Trash2 } from 'lucide-react';

export const NoticesPage: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);

  const loadNotices = async () => {
    try {
      const res = await api.notices.getAll();
      if (res.success) {
        setNotices(res.notices);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.notices.delete(id);
      loadNotices();
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await api.notices.togglePin(id);
      loadNotices();
    } catch (err: any) {
      console.error('Failed to toggle pin:', err);
      alert(err.message || 'Failed to update pin status');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb] dark:border-[#27272a]">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] leading-tight">
            Building Notices
          </h1>
          <p className="text-[13px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">
            Operational announcements, maintenance schedules, and WhatsApp broadcast
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition cursor-pointer shadow-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Notices Feed */}
      {notices.length === 0 ? (
        <div className="rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-12 text-center text-[13px] text-[#767676] shadow-none">
          No notices published currently.
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => {
            const isUrgent = n.priority === 'URGENT';
            return (
              <div
                key={n.id}
                className={`rounded-[12px] p-6 border space-y-3.5 transition shadow-none hover:border-[#545454] ${
                  isUrgent
                    ? 'bg-[#f9f9fb] dark:bg-[#18181b] border-rose-300 dark:border-rose-900/60'
                    : 'bg-white dark:bg-[#18181b] border-[#e5e7eb] dark:border-[#27272a]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isAdmin && n.pinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#eff0f6] text-[#333333] border border-[#e5e7eb] dark:bg-[#27272a] dark:text-[#f4f4f5] dark:border-[#3f3f46]">
                        <Pin className="w-3 h-3" />
                        Pinned
                      </span>
                    )}
                    <NoticePriorityBadge priority={n.priority} />
                    <span className="text-[11px] text-[#767676] uppercase tracking-wider font-medium">
                      {n.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] text-[#767676] font-mono">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(n.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer border border-[#e5e7eb] dark:border-[#27272a] ${
                            n.pinned
                              ? 'bg-[#eff0f6] text-[#333333] dark:bg-[#27272a] dark:text-[#f4f4f5]'
                              : 'text-[#767676] hover:text-[#333333] dark:hover:text-[#f4f4f5] hover:bg-[#f9f9fb]'
                          }`}
                          title={n.pinned ? 'Click to unpin notice' : 'Click to pin notice to top'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${n.pinned ? 'fill-current' : ''}`} />
                          <span className="hidden sm:inline">{n.pinned ? 'Pinned' : 'Pin'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(n.id)}
                          className="p-1 rounded-full text-[#767676] hover:text-rose-600 transition cursor-pointer"
                          title="Delete notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h2 className="text-[17px] font-semibold text-[#333333] dark:text-[#f4f4f5]">{n.title}</h2>
                  <p className="text-[14px] text-[#545454] dark:text-[#a1a1aa] mt-1.5 leading-relaxed whitespace-pre-line">
                    {n.content}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb] dark:border-[#27272a] text-[12px]">
                  <span className="text-[#767676]">
                    Issued by {n.publishedBy?.fullName || 'RWA Management'}
                  </span>

                  <WhatsAppShareButton notice={n} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <NewNoticeModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={loadNotices}
      />
    </div>
  );
};
