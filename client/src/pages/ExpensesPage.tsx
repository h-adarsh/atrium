import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getFileUrl } from '../services/api';
import { Expense, FinancialSummary } from '../types';
import { AddExpenseModal } from '../components/finance/AddExpenseModal';
import { Plus, ExternalLink } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const loadExpenses = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        api.finance.getExpenses({
          month: selectedMonth,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined
        }),
        api.finance.getSummary(selectedMonth)
      ]);

      if (expRes.success) setExpenses(expRes.expenses);
      if (sumRes.success) setSummary(sumRes.summary);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, categoryFilter]);

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'WATER': return 'Water Tanker';
      case 'CLEANING': return 'Cleaning';
      case 'ELECTRICITY': return 'Common Electricity';
      case 'LIFT_AMC': return 'Lift AMC';
      case 'REPAIRS': return 'Repairs';
      default: return 'Misc';
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb] dark:border-[#27272a]">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] leading-tight">
            Society Expenses Ledger
          </h1>
          <p className="text-[13px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">
            Transparent records of all building operational expenses and vouchers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] font-medium text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none cursor-pointer"
          />

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition cursor-pointer shadow-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-1 shadow-none">
            <span className="text-[13px] text-[#767676] dark:text-[#a1a1aa] font-medium">Dues Collected</span>
            <p className="text-[26px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5]">
              ₹ {(summary?.totalCollected || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[12px] text-[#767676]">Total monthly resident contributions</p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-1 shadow-none">
            <span className="text-[13px] text-[#767676] dark:text-[#a1a1aa] font-medium">Total Expenses Paid</span>
            <p className="text-[26px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5]">
              ₹ {totalExpenseAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-[12px] text-[#767676]">Lift, water tankers, cleaning, repairs</p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-1 shadow-none">
            <span className="text-[13px] text-[#767676] dark:text-[#a1a1aa] font-medium">Net Monthly Balance</span>
            <p className="text-[26px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5]">
              ₹ {((summary?.totalCollected || 0) - totalExpenseAmount).toLocaleString('en-IN')}
            </p>
            <p className="text-[12px] text-[#767676]">Inflow minus operational outflow</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-1 shadow-none">
            <span className="text-[13px] text-[#767676] dark:text-[#a1a1aa] font-medium">Monthly Common Expenses</span>
            <p className="text-[26px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5]">
              ₹ {totalExpenseAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-[12px] text-[#767676]">Water tankers, lift AMC, cleaning, electricity</p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-1 shadow-none">
            <span className="text-[13px] text-[#767676] dark:text-[#a1a1aa] font-medium">Recorded Vouchers</span>
            <p className="text-[26px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5]">
              {expenses.length} Entries
            </p>
            <p className="text-[12px] text-[#767676]">Vendor bills & verified payment receipts</p>
          </div>

          <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-1 shadow-none">
            <span className="text-[13px] text-[#767676] dark:text-[#a1a1aa] font-medium">Operational Transparency</span>
            <p className="text-[26px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5]">
              100% Accounted
            </p>
            <p className="text-[12px] text-[#767676]">Shared building expenses audit log</p>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {['ALL', 'WATER', 'CLEANING', 'ELECTRICITY', 'LIFT_AMC', 'REPAIRS', 'MISC'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition cursor-pointer ${
              categoryFilter === cat
                ? 'bg-[#333333] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] shadow-none'
                : 'border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] hover:border-[#545454]'
            }`}
          >
            {cat === 'ALL' ? 'All' : getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] overflow-hidden shadow-none">
        <div className="p-4.5 border-b border-[#e5e7eb] dark:border-[#27272a] flex justify-between items-center">
          <h2 className="text-[15px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Itemized Ledger</h2>
          <span className="text-[12px] text-[#767676]">{expenses.length} Records</span>
        </div>

        {expenses.length === 0 ? (
          <p className="text-[13px] text-[#767676] text-center py-8">
            No expenses recorded for this month and filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#333333] dark:text-[#f4f4f5]">
              <thead className="bg-[#eff0f6] dark:bg-[#1f1f23] text-[#545454] dark:text-[#a1a1aa] uppercase text-[11px] tracking-wider border-b border-[#e5e7eb] dark:border-[#27272a]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#27272a]">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-[#f9f9fb] dark:hover:bg-[#1f1f23] transition">
                    <td className="py-3 px-4 text-[#767676] font-mono text-[11px]">
                      {new Date(e.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#eff0f6] dark:bg-[#27272a] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46]">
                        {getCategoryLabel(e.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#333333] dark:text-[#f4f4f5]">
                      {e.title}
                    </td>
                    <td className="py-3 px-4 text-[#545454] dark:text-[#a1a1aa]">
                      {e.vendorName || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#333333] dark:text-[#f4f4f5]">
                      ₹ {Number(e.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-[#767676]">
                      {e.recordedBy?.fullName.split(' ')[0] || 'Admin'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {e.billImageUrl ? (
                        <a
                          href={getFileUrl(e.billImageUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[#2c70dd] hover:underline"
                        >
                          <span>Bill</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#767676]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadExpenses}
      />
    </div>
  );
};
