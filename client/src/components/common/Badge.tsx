import React from 'react';
import { DueStatus, ComplaintStatus, ComplaintPriority, NoticePriority } from '../../types';

export const DueStatusBadge: React.FC<{ status: DueStatus }> = ({ status }) => {
  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#24b26d] shrink-0" />
          Paid & Verified
        </span>
      );
    case 'SUBMITTED_FOR_VERIFICATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Verification Pending
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Overdue
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-[#f9f9fb] dark:bg-[#18181b] text-[#767676] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#808080] shrink-0" />
          Unpaid
        </span>
      );
  }
};

export const ComplaintStatusBadge: React.FC<{ status: ComplaintStatus }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-[#2c70dd] border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2c70dd] shrink-0" />
          Open
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#545454] shrink-0" />
          Assigned
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-amber-600 dark:text-amber-400 border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-[#24b26d] border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#24b26d] shrink-0" />
          Resolved
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-[#f9f9fb] dark:bg-[#18181b] text-[#767676] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#808080] shrink-0" />
          Closed
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-white dark:bg-[#18181b] text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Rejected
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: ComplaintPriority }> = ({ priority }) => {
  switch (priority) {
    case 'EMERGENCY':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Emergency
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
          Medium
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white dark:bg-[#18181b] text-[#767676] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
          Low
        </span>
      );
  }
};

export const NoticePriorityBadge: React.FC<{ priority: NoticePriority }> = ({ priority }) => {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Urgent
        </span>
      );
    case 'IMPORTANT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Important
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f9f9fb] dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
          Notice
        </span>
      );
  }
};
