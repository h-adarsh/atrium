import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getFileUrl } from '../services/api';
import { Complaint } from '../types';
import { ComplaintStatusBadge, PriorityBadge } from '../components/common/Badge';
import { NewComplaintModal } from '../components/complaints/NewComplaintModal';
import { UpdateComplaintModal } from '../components/complaints/UpdateComplaintModal';
import { Plus, ExternalLink } from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [showNewModal, setShowNewModal] = useState(false);
  const [activeComplaintForUpdate, setActiveComplaintForUpdate] = useState<Complaint | null>(null);

  const loadComplaints = async () => {
    try {
      const res = await api.complaints.getAll({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined
      });
      if (res.success) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, categoryFilter, user]);

  const handleResidentCloseTicket = async (id: string) => {
    if (!window.confirm('Confirm ticket closure?')) return;
    const formData = new FormData();
    formData.append('status', 'CLOSED');
    formData.append('resolutionNotes', 'Resident confirmed fixed');
    await api.complaints.update(id, formData);
    loadComplaints();
  };

  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb] dark:border-[#27272a]">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] leading-tight">
            Maintenance Tickets
          </h1>
          <p className="text-[13px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">
            Building repairs, plumbing, electrical, and elevator operations
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition cursor-pointer shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-full bg-[#eff0f6] dark:bg-[#1f1f23] border border-[#e5e7eb] dark:border-[#27272a]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] font-semibold shadow-none'
                  : 'text-[#545454] dark:text-[#a1a1aa] hover:text-[#333333] dark:hover:text-[#ffffff]'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[12px] font-medium text-[#333333] dark:text-[#f4f4f5] shadow-none cursor-pointer focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="PLUMBING">Plumbing</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="LIFT">Lift</option>
          <option value="CLEANING">Cleaning</option>
          <option value="TERRACE">Terrace</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Tickets List */}
      {complaints.length === 0 ? (
        <div className="rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-12 text-center text-[13px] text-[#767676] shadow-none">
          No maintenance tickets found for the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((c) => {
            const isMyComplaint = user?.flat && c.flatId === user.flat.id;
            return (
              <div
                key={c.id}
                className="rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-5 space-y-3.5 flex flex-col justify-between shadow-none hover:border-[#545454] transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-mono text-[#767676]">#{c.ticketNumber}</span>
                      <span className="text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Flat {c.flat.unitNumber}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <ComplaintStatusBadge status={c.status} />
                  </div>

                  <div>
                    <h3 className="text-[15px] font-semibold text-[#333333] dark:text-[#f4f4f5]">{c.title}</h3>
                    <p className="text-[13px] text-[#545454] dark:text-[#a1a1aa] mt-1 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-2.5 border-t border-[#e5e7eb] dark:border-[#27272a] text-[12px] text-[#767676] dark:text-[#a1a1aa] space-y-1">
                    {c.preferredSlot && <p>Preferred slot: <strong className="text-[#333333] dark:text-[#f4f4f5] font-medium">{c.preferredSlot}</strong></p>}
                    {c.assignedTo ? (
                      <p className="text-[#333333] dark:text-[#f4f4f5]">Technician: <strong>{c.assignedTo}</strong></p>
                    ) : (
                      <p className="text-[#767676]">Awaiting technician assignment</p>
                    )}

                    {c.photoUrl && (
                      <a
                        href={getFileUrl(c.photoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#2c70dd] hover:underline pt-0.5"
                      >
                        <span>Attached Photo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {c.resolutionNotes && (
                    <div className="p-3 rounded-[8px] bg-[#f9f9fb] dark:bg-[#1f1f23] border border-[#e5e7eb] dark:border-[#27272a] text-[12px]">
                      <p className="font-semibold text-[#333333] dark:text-[#f4f4f5]">Resolution:</p>
                      <p className="text-[#545454] dark:text-[#a1a1aa] mt-0.5">{c.resolutionNotes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#e5e7eb] dark:border-[#27272a] text-[12px]">
                  <span className="text-[#767676] font-mono">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {isStaffOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveComplaintForUpdate(c)}
                        className="px-3 py-1 rounded-full text-[12px] font-medium border border-[#e5e7eb] dark:border-[#27272a] text-[#333333] dark:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition cursor-pointer shadow-none"
                      >
                        Update
                      </button>
                    )}

                    {isMyComplaint && c.status === 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleResidentCloseTicket(c.id)}
                        className="px-4 py-1 rounded-full text-[12px] font-semibold bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white cursor-pointer shadow-none"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <NewComplaintModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={loadComplaints}
      />

      {activeComplaintForUpdate && (
        <UpdateComplaintModal
          isOpen={Boolean(activeComplaintForUpdate)}
          onClose={() => setActiveComplaintForUpdate(null)}
          complaint={activeComplaintForUpdate}
          onSuccess={loadComplaints}
        />
      )}
    </div>
  );
};
