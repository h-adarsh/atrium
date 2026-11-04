import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Building2, Clock, ShieldCheck, RefreshCw, LogOut, Phone, Mail, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

export const PendingApprovalScreen: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshUser();
    } finally {
      setTimeout(() => setChecking(false), 400);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Did you choose the wrong apartment or unit? This will cancel your current request and allow you to register for your correct complex.')) {
      return;
    }
    setCancelling(true);
    try {
      await api.auth.cancelPendingRegistration();
      await logout();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel registration');
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-[#eff0f6] font-sans">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-none p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb] dark:border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#333333] dark:bg-[#f4f4f5] flex items-center justify-center text-white dark:text-[#18181b]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-[15px] text-[#333333] dark:text-[#f4f4f5]">
                {user?.society?.name || 'Royal Orchid'}
              </h1>
              <p className="text-[12px] text-[#767676]">Unit Verification Gate</p>
            </div>
          </div>

          {user?.approvalStatus === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Registration Rejected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Review</span>
            </span>
          )}
        </div>

        {/* Informative description */}
        <div className="space-y-2">
          <h2 className="text-[20px] font-bold text-[#333333] dark:text-[#f4f4f5] tracking-tight">
            {user?.approvalStatus === 'REJECTED'
              ? 'Registration Not Approved'
              : 'Account Awaiting Administrator Approval'}
          </h2>
          <p className="text-[14px] text-[#545454] dark:text-[#a1a1aa] leading-relaxed">
            {user?.approvalStatus === 'REJECTED' ? (
              <>
                Hello <strong className="text-[#333333] dark:text-[#f4f4f5]">{user?.fullName}</strong>. Your account registration for Flat {user?.flat?.unitNumber || 'selected unit'} was not approved by building management. Please contact the society secretary to verify unit allocation or tenant agreement details.
              </>
            ) : (
              <>
                Welcome, <strong className="text-[#333333] dark:text-[#f4f4f5]">{user?.fullName}</strong>. To protect resident financial privacy and prevent unauthorized access to building ledger data, all new resident accounts must be verified by the building administrator.
              </>
            )}
          </p>
        </div>

        {/* Summary Card */}
        <div className="rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#eff0f6] dark:bg-[#1f1f23] p-4.5 space-y-2.5 text-[13px] font-mono">
          <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb] dark:border-[#27272a]">
            <span className="text-[#767676]">Allocated Unit:</span>
            <span className="font-semibold text-[#333333] dark:text-[#f4f4f5]">
              Flat {user?.flat?.unitNumber || 'Assigned Flat'} (Floor {user?.flat?.floorNumber || '—'})
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb] dark:border-[#27272a]">
            <span className="text-[#767676]">Occupancy Claim:</span>
            <span className="font-semibold text-[#333333] dark:text-[#f4f4f5]">
              {user?.occupancyType === 'TENANT' ? 'Tenant' : 'Property Owner'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#e5e7eb] dark:border-[#27272a]">
            <span className="text-[#767676]">Registered Phone:</span>
            <span className="text-[#333333] dark:text-[#f4f4f5]">{user?.phone || '—'}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-[#767676]">Verification Status:</span>
            {user?.approvalStatus === 'REJECTED' ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Rejected by RWA Secretary</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Under Review by RWA Secretary</span>
            )}
          </div>
        </div>

        {/* Security assurance */}
        {user?.approvalStatus === 'REJECTED' ? (
          <div className="p-3.5 rounded-[8px] bg-[#f9f9fb] dark:bg-[#1f1f23] border border-rose-200 dark:border-rose-900/40 flex items-start gap-3 text-[13px] text-rose-800 dark:text-rose-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="space-y-1">
              <p className="font-semibold">Verification Request Closed</p>
              <p className="text-[12px] leading-relaxed text-[#545454] dark:text-[#a1a1aa]">
                If you believe this rejection was made in error, please reach out to the RWA Secretary office using the contact details below with your lease or possession document.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-[8px] bg-[#f9f9fb] dark:bg-[#1f1f23] border border-[#e5e7eb] dark:border-[#27272a] flex items-start gap-3 text-[13px]">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#24b26d]" />
            <div className="space-y-1">
              <p className="font-semibold text-[#333333] dark:text-[#f4f4f5]">Admin Notification Dispatched</p>
              <p className="text-[12px] leading-relaxed text-[#545454] dark:text-[#a1a1aa]">
                Building Administrator Rajesh Sharma has received your unit allocation request. You will be able to access dues, payment receipts, and maintenance tickets as soon as verification is confirmed.
              </p>
            </div>
          </div>
        )}

        {/* Mistaken Apartment Registration Recovery */}
        <div className="p-4 rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-none">
          <div className="space-y-0.5">
            <p className="text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Registered for the wrong apartment by mistake?</span>
            </p>
            <p className="text-[12px] text-[#767676] leading-normal">
              You can cancel this submission to immediately unlock your email and register for your correct complex.
            </p>
          </div>
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancelRegistration}
            className="px-4 py-1.5 rounded-full text-[12px] font-semibold text-rose-600 bg-white dark:bg-[#18181b] border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0 disabled:opacity-50 shadow-none"
          >
            {cancelling ? 'Cancelling...' : 'Cancel & Re-select'}
          </button>
        </div>

        {/* Secretary contact */}
        <div className="pt-2 text-[12px] text-[#767676] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-[#e5e7eb] dark:border-[#27272a]">
          <span>RWA Secretary Office:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#333333] dark:text-[#f4f4f5]">
              <Phone className="w-3 h-3 text-[#767676]" />
              +91 98765 43210
            </span>
            <span className="flex items-center gap-1 text-[#333333] dark:text-[#f4f4f5]">
              <Mail className="w-3 h-3 text-[#767676]" />
              admin@atrium.local
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] hover:text-[#333333] dark:hover:text-[#ffffff] border border-[#e5e7eb] dark:border-[#27272a] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] transition shadow-none cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            disabled={checking}
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition shadow-none disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Check Approval Status'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
