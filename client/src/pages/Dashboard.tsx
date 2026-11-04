import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getReceiptUrl } from '../services/api';
import {
  MaintenanceDue,
  FinancialSummary,
  Complaint,
  Notice,
  MaintenanceConfig
} from '../types';
import { DueStatusBadge, ComplaintStatusBadge, PriorityBadge } from '../components/common/Badge';
import { WhatsAppShareButton } from '../components/notices/WhatsAppShareButton';
import { PayDueModal } from '../components/finance/PayDueModal';
import { NewComplaintModal } from '../components/complaints/NewComplaintModal';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  Plus,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [myDue, setMyDue] = useState<MaintenanceDue | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);

  const [showPayModal, setShowPayModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const loadData = async () => {
    try {
      const [sumRes, duesRes, compRes, notRes, confRes] = await Promise.all([
        api.finance.getSummary('2026-10'),
        api.finance.getDues({ period: '2026-10' }),
        api.complaints.getAll(),
        api.notices.getAll(),
        api.finance.getConfig()
      ]);

      if (sumRes.success) setSummary(sumRes.summary);
      if (notRes.success) setNotices(notRes.notices);
      if (compRes.success) setComplaints(compRes.complaints);
      if (confRes.success) setConfig(confRes.config);

      if (duesRes.success && duesRes.dues.length > 0) {
        if (user?.role === 'RESIDENT' && user.flat) {
          const found = duesRes.dues.find(d => d.flatId === user.flat?.id);
          setMyDue(found || null);
        } else {
          setMyDue(duesRes.dues[0]);
        }
      }

      if (user?.role === 'ADMIN') {
        const regRes = await api.auth.getPendingRegistrations();
        if (regRes.success) {
          setPendingRegistrations(regRes.registrations);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleReviewRegistration = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.auth.reviewRegistration(userId, action);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to review registration');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const urgentNotice = notices.find(n => n.priority === 'URGENT');

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Urgent Notice Banner */}
      {urgentNotice && (
        <div className="rounded-[12px] bg-[#f9f9fb] dark:bg-[#18181b] border border-rose-200 dark:border-rose-900/50 p-4 shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                    Urgent Notice
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5]">{urgentNotice.title}</span>
                </div>
                <p className="text-[13px] text-[#545454] dark:text-[#a1a1aa] mt-1 leading-relaxed">
                  {urgentNotice.content}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <WhatsAppShareButton notice={urgentNotice} />
            </div>
          </div>
        </div>
      )}

      {/* 1b. Admin Approval Notification Banner */}
      {user?.role === 'ADMIN' && pendingRegistrations.length > 0 && (
        <div className="rounded-[12px] bg-[#f9f9fb] dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-4.5 space-y-3.5 shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#24b26d]" />
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#333333] dark:text-[#f4f4f5]">
                Pending Resident Registrations ({pendingRegistrations.length})
              </h3>
            </div>
            <span className="text-[11px] text-[#767676] dark:text-[#a1a1aa]">
              Requires Unit Occupancy Verification
            </span>
          </div>

          <div className="space-y-2">
            {pendingRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="p-3.5 rounded-[8px] bg-white dark:bg-[#1f1f23] border border-[#e5e7eb] dark:border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px] shadow-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#333333] dark:text-[#f4f4f5]">
                      {reg.fullName}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#eff0f6] dark:bg-[#27272a] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46]">
                      Flat {reg.flat?.unitNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f9f9fb] dark:bg-[#27272a] text-[#767676] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46]">
                      {reg.occupancyType === 'TENANT' ? 'Tenant Occupant' : 'Property Owner'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa]">
                    Mobile: {reg.phone} • Email: {reg.email}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReviewRegistration(reg.id, 'APPROVE')}
                    className="px-4 py-1.5 rounded-full bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white text-[12px] font-semibold transition cursor-pointer shadow-none"
                  >
                    Approve Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewRegistration(reg.id, 'REJECT')}
                    className="px-3.5 py-1.5 rounded-full border border-[#e5e7eb] dark:border-[#27272a] text-[#545454] dark:text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 text-[12px] font-medium transition cursor-pointer shadow-none"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb] dark:border-[#27272a]">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] leading-tight">
            Welcome, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-[13px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">
            {user?.role === 'ADMIN'
              ? `${user.society?.name || 'Apartment Society'} • Administrator`
              : user?.flat
              ? `${user.society?.name || 'Apartment Society'} • Flat ${user.flat.unitNumber} (${user.flat.superBuiltUpSqFt} sq. ft.)`
              : 'Maintenance Staff'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user?.role === 'RESIDENT' && myDue && (
            <>
              {myDue.status === 'PAID' && myDue.payment?.receiptNumber ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.finance.downloadReceipt(myDue.payment!.receiptNumber!);
                    } catch (err: any) {
                      alert(err.message || 'Could not download receipt');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition cursor-pointer shadow-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Receipt</span>
                </button>
              ) : myDue.status === 'PENDING' ? (
                <button
                  type="button"
                  onClick={() => setShowPayModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition cursor-pointer shadow-none"
                >
                  <span>Pay Maintenance (₹{Number(myDue.totalDue).toLocaleString('en-IN')})</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setShowComplaintModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] hover:text-[#333333] dark:hover:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition cursor-pointer shadow-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </button>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setActiveTab('dues')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition cursor-pointer shadow-none"
            >
              <span>Manage Collections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Metrics Cards (Role-aware: 21n Border-driven & Zero Shadow) */}
      {user?.role === 'ADMIN' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">Dues Collected</p>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              ₹ {(summary?.totalCollected || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-1">
              {summary?.paidCount || 0} of {summary?.totalFlats || 12} units paid
            </p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">Outstanding Dues</p>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              ₹ {(summary?.totalOutstanding || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-1">
              {summary?.pendingCount || 0} units left to pay
            </p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">Society Expenses</p>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              ₹ {(summary?.totalExpenses || 0).toLocaleString('en-IN')}
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className="text-[12px] text-[#2c70dd] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">Open Tickets</p>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              {complaints.filter(c => c.status !== 'CLOSED').length}
            </p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-1">
              {complaints.filter(c => c.priority === 'HIGH' || c.priority === 'EMERGENCY').length} urgent attention
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">My Maintenance Fee</p>
              {myDue && <DueStatusBadge status={myDue.status} />}
            </div>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              {myDue ? `₹ ${Number(myDue.totalDue).toLocaleString('en-IN')}` : '—'}
            </p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-1">
              {myDue?.status === 'PAID'
                ? 'October fee paid & verified'
                : myDue?.status === 'SUBMITTED_FOR_VERIFICATION'
                ? 'Payment under verification'
                : 'Due by 5th of this month'}
            </p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">My Unit Standing</p>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              {user?.flat ? `Flat ${user.flat.unitNumber}` : 'Resident'}
            </p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-1">
              {user?.flat ? `Floor ${user.flat.floorNumber} • ${user.flat.superBuiltUpSqFt} sq.ft.` : user?.society?.name || 'Society Resident'}
            </p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">Society Expenses</p>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              ₹ {(summary?.totalExpenses || 0).toLocaleString('en-IN')}
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className="text-[12px] text-[#2c70dd] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none">
            <p className="text-[13px] font-medium text-[#767676] dark:text-[#a1a1aa]">Open Tickets</p>
            <p className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] mt-1">
              {complaints.filter(c => c.status !== 'CLOSED').length}
            </p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-1">
              {user?.flat
                ? `${complaints.filter(c => c.flatId === user.flat?.id && c.status !== 'CLOSED').length} open from your unit`
                : 'Building maintenance tickets'}
            </p>
          </div>
        </div>
      )}

      {/* 4. Action Queue for Admin */}
      {user?.role === 'ADMIN' && (summary?.pendingVerificationCount || 0) > 0 && (
        <div className="p-4 rounded-[12px] bg-[#f9f9fb] dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] flex items-center justify-between gap-4 shadow-none">
          <div>
            <p className="text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5]">
              {summary?.pendingVerificationCount} resident payment(s) awaiting verification
            </p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">
              Verify UTR numbers against the society bank statement to issue receipts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('dues')}
            className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition cursor-pointer shadow-none"
          >
            Review
          </button>
        </div>
      )}

      {/* 5. Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets Table/List */}
        <div className="lg:col-span-2 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] dark:border-[#27272a] pb-3">
            <h2 className="text-[17px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Recent Maintenance Tickets</h2>
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className="text-[13px] text-[#2c70dd] hover:underline cursor-pointer"
            >
              View all ({complaints.length})
            </button>
          </div>

          {complaints.length === 0 ? (
            <p className="text-[13px] text-[#767676] py-6 text-center">No active tickets.</p>
          ) : (
            <div className="divide-y divide-[#e5e7eb] dark:divide-[#27272a]">
              {complaints.slice(0, 4).map((c) => (
                <div key={c.id} className="py-3.5 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-mono text-[#767676]">#{c.ticketNumber}</span>
                      <span className="text-[13px] font-medium text-[#333333] dark:text-[#f4f4f5]">Flat {c.flat.unitNumber}</span>
                      <PriorityBadge priority={c.priority} />
                      <ComplaintStatusBadge status={c.status} />
                    </div>
                    <p className="text-[14px] font-semibold text-[#333333] dark:text-[#f4f4f5]">{c.title}</p>
                    <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] line-clamp-1">{c.description}</p>
                  </div>

                  <span className="text-[11px] text-[#767676] shrink-0 font-mono">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Building Operations & Contacts */}
        <div className="space-y-4">
          <div className="rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-5 space-y-3 shadow-none">
            <h3 className="text-[12px] font-semibold text-[#333333] dark:text-[#f4f4f5] uppercase tracking-wider">
              Common Area Status
            </h3>

            <div className="space-y-2.5 text-[13px]">
              {user?.society?.slug === 'greenwoods' ? (
                <>
                  <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23]">
                    <div className="flex justify-between font-medium text-[#333333] dark:text-[#f4f4f5]">
                      <span>Basement Sump Cleaning</span>
                      <span className="text-[#767676] text-[11px]">Due 22-Oct</span>
                    </div>
                    <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">Quarterly pump pressure wash scheduled.</p>
                  </div>

                  <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23]">
                    <div className="flex justify-between font-medium text-[#333333] dark:text-[#f4f4f5]">
                      <span>40kVA DG Generator Check</span>
                      <span className="text-[#767676] text-[11px]">Done 03-Oct</span>
                    </div>
                    <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">180L diesel refilled & battery load tested.</p>
                  </div>

                  <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23]">
                    <div className="flex justify-between font-medium text-[#333333] dark:text-[#f4f4f5]">
                      <span>Terrace & Solar Pergola</span>
                      <span className="text-[#767676] text-[11px]">6 AM – 10 PM</span>
                    </div>
                    <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">Access door latched after evening hours.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23]">
                    <div className="flex justify-between font-medium text-[#333333] dark:text-[#f4f4f5]">
                      <span>Overhead Water Tank</span>
                      <span className="text-[#767676] text-[11px]">Due 18-Oct</span>
                    </div>
                    <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">Quarterly cleaning scheduled.</p>
                  </div>

                  <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23]">
                    <div className="flex justify-between font-medium text-[#333333] dark:text-[#f4f4f5]">
                      <span>Lift AMC Service</span>
                      <span className="text-[#767676] text-[11px]">Done 04-Oct</span>
                    </div>
                    <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">Monthly check completed by Johnson Lifts.</p>
                  </div>

                  <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23]">
                    <div className="flex justify-between font-medium text-[#333333] dark:text-[#f4f4f5]">
                      <span>Terrace Timings</span>
                      <span className="text-[#767676] text-[11px]">6 AM – 10 PM</span>
                    </div>
                    <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">Please ensure door is latched after use.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-5 space-y-3 shadow-none text-[13px]">
            <h3 className="text-[12px] font-semibold text-[#333333] dark:text-[#f4f4f5] uppercase tracking-wider">
              Building Contacts
            </h3>

            <div className="space-y-2 divide-y divide-[#e5e7eb] dark:divide-[#27272a]">
              {user?.society?.slug === 'greenwoods' ? (
                <>
                  <div className="pt-2 first:pt-0 flex justify-between">
                    <div>
                      <p className="font-semibold text-[#333333] dark:text-[#f4f4f5]">Suresh Gowda</p>
                      <p className="text-[11px] text-[#767676]">Electrician & Facility</p>
                    </div>
                    <a href="tel:+919845011223" className="text-[#2c70dd] hover:underline font-mono text-[12px]">
                      +91 98450 11223
                    </a>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <div>
                      <p className="font-semibold text-[#333333] dark:text-[#f4f4f5]">Vikram Seth</p>
                      <p className="text-[11px] text-[#767676]">RWA Secretary</p>
                    </div>
                    <a href="tel:+919833344556" className="text-[#2c70dd] hover:underline font-mono text-[12px]">
                      +91 98333 44556
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="pt-2 first:pt-0 flex justify-between">
                    <div>
                      <p className="font-semibold text-[#333333] dark:text-[#f4f4f5]">Ramesh Kumar</p>
                      <p className="text-[11px] text-[#767676]">Electrician & Plumber</p>
                    </div>
                    <a href="tel:+919811122334" className="text-[#2c70dd] hover:underline font-mono text-[12px]">
                      +91 98111 22334
                    </a>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <div>
                      <p className="font-semibold text-[#333333] dark:text-[#f4f4f5]">Rajesh Sharma</p>
                      <p className="text-[11px] text-[#767676]">RWA Secretary</p>
                    </div>
                    <a href="tel:+919876543210" className="text-[#2c70dd] hover:underline font-mono text-[12px]">
                      +91 98765 43210
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {myDue && (
        <PayDueModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          due={myDue}
          config={config}
          onSuccess={loadData}
        />
      )}

      <NewComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
