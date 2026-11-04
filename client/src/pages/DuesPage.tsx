import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getReceiptUrl } from '../services/api';
import { MaintenanceDue, MaintenanceConfig } from '../types';
import { DueStatusBadge } from '../components/common/Badge';
import { PayDueModal } from '../components/finance/PayDueModal';
import { VerifyPaymentModal } from '../components/finance/VerifyPaymentModal';
import { Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const DuesPage: React.FC = () => {
  const { user } = useAuth();
  const [dues, setDues] = useState<MaintenanceDue[]>([]);
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-10');

  // Modals
  const [activeDueForPayment, setActiveDueForPayment] = useState<MaintenanceDue | null>(null);
  const [activeDueForVerify, setActiveDueForVerify] = useState<MaintenanceDue | null>(null);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [batchPeriodInput, setBatchPeriodInput] = useState('2026-11');
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [duesRes, confRes] = await Promise.all([
        api.finance.getDues({ period: selectedPeriod }),
        api.finance.getConfig()
      ]);

      if (duesRes.success) setDues(duesRes.dues);
      if (confRes.success) setConfig(confRes.config);
    } catch (err) {
      console.error('Failed to load dues:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, user]);

  const handleGenerateBatch = async () => {
    if (!window.confirm(`Generate dues for all units for period ${batchPeriodInput}?`)) {
      return;
    }

    setGeneratingBatch(true);
    setBatchMessage(null);
    try {
      const res = await api.finance.generateMonthlyDues(batchPeriodInput);
      setBatchMessage(`Generated dues for ${res.count} units`);
      setSelectedPeriod(batchPeriodInput);
      loadData();
    } catch (err: any) {
      setBatchMessage(`Error: ${err.message}`);
    } finally {
      setGeneratingBatch(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const myFlatDue = dues.find(d => d.flatId === user?.flat?.id) || dues[0];
  const pendingVerifications = dues.filter(d => d.status === 'SUBMITTED_FOR_VERIFICATION');

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb] dark:border-[#27272a]">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] leading-tight">
            {isAdmin ? 'Maintenance Billing & Collections' : 'My Dues & Receipts'}
          </h1>
          <p className="text-[13px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">
            Formula: ₹{Number(config?.baseFixedCharge || 500).toFixed(0)} base + (Area × ₹{Number(config?.ratePerSqFt || 2.50).toFixed(2)}/sq.ft.)
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <label className="text-[13px] text-[#767676]">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] font-medium text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none cursor-pointer"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
        </div>
      </div>

      {/* RESIDENT VIEW: Clean Unit Card */}
      {!isAdmin && myFlatDue && (
        <div className="p-6 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-4 shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#e5e7eb] dark:border-[#27272a]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[22px] font-bold text-[#333333] dark:text-[#f4f4f5]">Flat {myFlatDue.flat.unitNumber}</span>
                <DueStatusBadge status={myFlatDue.status} />
              </div>
              <p className="text-[13px] text-[#767676] mt-0.5">
                Floor {myFlatDue.flat.floorNumber} • Super Built-Up: {myFlatDue.areaSqFt} sq. ft.
              </p>
            </div>

            <div>
              <span className="text-[12px] text-[#767676] block sm:text-right">Total Due</span>
              <span className="text-[26px] sm:text-[30px] font-bold text-[#333333] dark:text-[#f4f4f5]">
                ₹ {Number(myFlatDue.totalDue).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[8px] bg-[#eff0f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] text-[13px]">
            <div>
              <span className="text-[#767676] dark:text-[#a1a1aa]">Fixed Base Fee</span>
              <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] mt-0.5">₹ {Number(myFlatDue.fixedCharge).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[#767676] dark:text-[#a1a1aa]">Variable Fee</span>
              <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] mt-0.5">
                ₹ {Number(myFlatDue.variableCharge).toFixed(2)} ({myFlatDue.areaSqFt} sq. ft. × ₹{Number(myFlatDue.sqFtRate).toFixed(2)})
              </p>
            </div>
            <div>
              <span className="text-[#767676] dark:text-[#a1a1aa]">Due Date</span>
              <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] mt-0.5">
                {new Date(myFlatDue.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div>
              {myFlatDue.status === 'PAID' && myFlatDue.payment && (
                <div className="text-[13px] text-[#545454] dark:text-[#a1a1aa]">
                  <span className="text-[#24b26d] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified on {new Date(myFlatDue.payment.verifiedAt || '').toLocaleDateString('en-IN')}
                  </span>
                  <p className="mt-0.5 font-mono text-[12px] text-[#767676]">UTR: {myFlatDue.payment.utrNumber} • Receipt: {myFlatDue.payment.receiptNumber}</p>
                </div>
              )}

              {myFlatDue.status === 'SUBMITTED_FOR_VERIFICATION' && myFlatDue.payment && (
                <div className="text-[13px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>UTR submitted ({myFlatDue.payment.utrNumber}). Verification in progress.</span>
                </div>
              )}

              {myFlatDue.status === 'PENDING' && myFlatDue.payment?.verificationStatus === 'REJECTED' && (
                <div className="space-y-1">
                  <div className="text-[13px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Previous Payment Rejected by Admin</span>
                  </div>
                  <p className="text-[12px] text-[#545454] dark:text-[#a1a1aa]">
                    <strong className="text-rose-700 dark:text-rose-300">Feedback:</strong> {myFlatDue.payment.rejectionReason}
                  </p>
                  <p className="text-[11px] text-[#767676] font-mono">
                    Previous UTR: {myFlatDue.payment.utrNumber}
                    {myFlatDue.payment.verifiedBy && ` • Reviewed by ${myFlatDue.payment.verifiedBy.fullName}`}
                  </p>
                </div>
              )}

              {myFlatDue.status === 'PENDING' && myFlatDue.payment?.verificationStatus !== 'REJECTED' && (
                <div className="text-[13px] text-[#767676] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#767676]" />
                  <span>Due is pending payment.</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {myFlatDue.status === 'PAID' && myFlatDue.payment?.receiptNumber && (
                <a
                  href={getReceiptUrl(myFlatDue.payment.receiptNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition shadow-none"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Receipt</span>
                </a>
              )}

              {myFlatDue.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => setActiveDueForPayment(myFlatDue)}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold transition cursor-pointer shadow-none ${
                    myFlatDue.payment?.verificationStatus === 'REJECTED'
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white'
                  }`}
                >
                  {myFlatDue.payment?.verificationStatus === 'REJECTED' ? 'Resubmit Payment Details' : 'Pay via UPI'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN VIEW: Verification Queue */}
      {isAdmin && pendingVerifications.length > 0 && (
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-3.5 shadow-none">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#e5e7eb] dark:border-[#27272a]">
            <h2 className="text-[12px] font-semibold text-[#333333] dark:text-[#f4f4f5] uppercase tracking-wider">
              Pending Verifications ({pendingVerifications.length})
            </h2>
            <span className="text-[11px] text-[#767676]">Match against bank statement</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingVerifications.map((due) => (
              <div key={due.id} className="p-3.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] space-y-2 text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#333333] dark:text-[#f4f4f5]">Flat {due.flat.unitNumber} ({due.flat.resident?.fullName})</span>
                  <span className="font-bold text-[#333333] dark:text-[#f4f4f5]">₹ {Number(due.totalDue).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[#767676] font-mono text-[11px]">UTR: {due.payment?.utrNumber}</p>
                <button
                  type="button"
                  onClick={() => setActiveDueForVerify(due)}
                  className="w-full py-1.5 rounded-full text-[12px] font-semibold border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition cursor-pointer shadow-none"
                >
                  Inspect & Verify
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN VIEW: Batch Generation */}
      {isAdmin && (
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-none">
          <div>
            <h3 className="text-[15px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Generate Batch Dues</h3>
            <p className="text-[13px] text-[#767676]">Auto-generates pro-rated dues for all units in this complex.</p>
            {batchMessage && <p className="text-[12px] text-[#24b26d] font-semibold mt-1">{batchMessage}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={batchPeriodInput}
              onChange={(e) => setBatchPeriodInput(e.target.value)}
              className="px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[13px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none"
            />
            <button
              type="button"
              disabled={generatingBatch}
              onClick={handleGenerateBatch}
              className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition disabled:opacity-50 cursor-pointer shadow-none"
            >
              {generatingBatch ? 'Generating...' : 'Generate Batch'}
            </button>
          </div>
        </div>
      )}

      {/* RESIDENT VIEW: Society Bank Account & Payment Instructions */}
      {!isAdmin && config && (
        <div className="p-5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] space-y-3 shadow-none">
          <h2 className="text-[12px] font-semibold text-[#333333] dark:text-[#f4f4f5] uppercase tracking-wider">
            Official RWA Bank & UPI Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            <div className="p-3.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] space-y-0.5">
              <span className="text-[#767676] text-[11px]">Bank Account</span>
              <p className="font-semibold text-[#333333] dark:text-[#f4f4f5]">{config.bankAccountName}</p>
              <p className="font-mono text-[#545454] dark:text-[#a1a1aa] text-[11px]">{config.bankAccountNumber}</p>
              <p className="font-mono text-[#767676] text-[10px]">IFSC: {config.bankIfscCode}</p>
            </div>
            <div className="p-3.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] space-y-0.5">
              <span className="text-[#767676] text-[11px]">Direct UPI VPA</span>
              <p className="font-mono font-semibold text-[#333333] dark:text-[#f4f4f5] text-[12px]">{config.upiId}</p>
              <p className="text-[#767676] text-[10px]">Scan & Pay via GPay, PhonePe, Paytm</p>
            </div>
            <div className="p-3.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] space-y-0.5">
              <span className="text-[#767676] text-[11px]">Payment Note</span>
              <p className="text-[#545454] dark:text-[#a1a1aa] text-[11px] leading-relaxed">
                Due by 5th of every month. Please submit your 12-digit UTR reference number after payment for instant verification and automated receipt generation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ONLY: Building Dues Registry Table */}
      {isAdmin && (
        <div className="rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] overflow-hidden shadow-none">
          <div className="p-4.5 border-b border-[#e5e7eb] dark:border-[#27272a] flex justify-between items-center">
            <h2 className="text-[15px] font-semibold text-[#333333] dark:text-[#f4f4f5]">
              Building Dues Ledger ({dues.length || 24} Units)
            </h2>
            <span className="text-[12px] text-[#767676]">
              {dues.filter(d => d.status === 'PAID').length} of {dues.length} Units Paid
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#333333] dark:text-[#f4f4f5]">
              <thead className="bg-[#eff0f6] dark:bg-[#1f1f23] text-[#545454] dark:text-[#a1a1aa] uppercase text-[11px] tracking-wider border-b border-[#e5e7eb] dark:border-[#27272a]">
                <tr>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Area (sq.ft.)</th>
                  <th className="py-3 px-4">Base + Variable</th>
                  <th className="py-3 px-4">Total Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#27272a]">
                {dues.map((due) => {
                  return (
                    <tr key={due.id} className="hover:bg-[#f9f9fb] dark:hover:bg-[#1f1f23] transition">
                      <td className="py-3 px-4 font-semibold text-[#333333] dark:text-[#f4f4f5]">
                        Flat {due.flat.unitNumber}
                      </td>
                      <td className="py-3 px-4 text-[#545454] dark:text-[#a1a1aa]">
                        {due.flat.resident?.fullName || 'Occupant'}
                      </td>
                      <td className="py-3 px-4 text-[#767676]">
                        {due.areaSqFt}
                      </td>
                      <td className="py-3 px-4 text-[#767676] font-mono text-[11px]">
                        ₹{Number(due.fixedCharge)} + ₹{Number(due.variableCharge).toFixed(0)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#333333] dark:text-[#f4f4f5]">
                        ₹ {Number(due.totalDue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <DueStatusBadge status={due.status} />
                          {due.payment?.verificationStatus === 'REJECTED' && (
                            <span
                              className="text-[10px] text-rose-600 dark:text-rose-400 font-medium cursor-help"
                              title={`Payment rejected: ${due.payment.rejectionReason || 'Invalid details'}`}
                            >
                              Rejected claim ({due.payment.utrNumber})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {due.status === 'SUBMITTED_FOR_VERIFICATION' ? (
                          <button
                            type="button"
                            onClick={() => setActiveDueForVerify(due)}
                            className="px-3 py-1 rounded-full text-[12px] font-medium border border-[#e5e7eb] dark:border-[#27272a] text-[#333333] dark:text-[#f4f4f5] hover:bg-[#eff0f6] dark:hover:bg-[#27272a] cursor-pointer"
                          >
                            Verify
                          </button>
                        ) : due.status === 'PAID' && due.payment?.receiptNumber ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.finance.downloadReceipt(due.payment!.receiptNumber!);
                              } catch (err: any) {
                                alert(err.message || 'Could not download receipt');
                              }
                            }}
                            className="text-[12px] text-[#2c70dd] hover:underline cursor-pointer"
                          >
                            Receipt
                          </button>
                        ) : (
                          <span className="text-[#767676]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeDueForPayment && (
        <PayDueModal
          isOpen={Boolean(activeDueForPayment)}
          onClose={() => setActiveDueForPayment(null)}
          due={activeDueForPayment}
          config={config}
          onSuccess={loadData}
        />
      )}

      {activeDueForVerify && (
        <VerifyPaymentModal
          isOpen={Boolean(activeDueForVerify)}
          onClose={() => setActiveDueForVerify(null)}
          due={activeDueForVerify}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
