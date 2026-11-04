import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MaintenanceDue, MaintenanceConfig } from '../../types';
import { api } from '../../services/api';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface PayDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: MaintenanceDue;
  config: MaintenanceConfig | null;
  onSuccess: () => void;
}

export const PayDueModal: React.FC<PayDueModalProps> = ({
  isOpen,
  onClose,
  due,
  config,
  onSuccess
}) => {
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upiId = config?.upiId || 'payments.rwa@hdfcbank';
  const amount = Number(due.totalDue);
  const payeeName = config?.bankAccountName || 'Apartment RWA';

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Flat ${due.flat.unitNumber} Maint ${due.billingPeriod}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setError('Please enter your Bank UTR or Transaction Reference number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('dueId', due.id);
      formData.append('utrNumber', utrNumber.trim());
      formData.append('paymentMethod', paymentMethod);
      formData.append('amountPaid', amount.toString());
      if (proofFile) {
        formData.append('proofImage', proofFile);
      }

      await api.finance.submitPayment(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pay Maintenance — Flat ${due.flat.unitNumber}`}
      subtitle={`Period: ${due.billingPeriod} • Amount: ₹${amount.toLocaleString('en-IN')}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Rejection Alert if previously rejected */}
        {due.payment?.verificationStatus === 'REJECTED' && (
          <div className="p-3 rounded-md bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Previous Payment Claim Rejected</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              <strong>Admin Feedback:</strong> {due.payment.rejectionReason || 'UTR not verified on bank statement.'}
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Previous reference: <span className="font-mono">{due.payment.utrNumber}</span>. Please verify your receipt or bank SMS and provide the correct reference below.
            </p>
          </div>
        )}

        {/* Scan & Pay Card */}
        <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Step 1: Scan via any UPI App</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">₹ {amount.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-md border border-zinc-200 dark:border-zinc-700 shrink-0">
              <img
                src={qrCodeUrl}
                alt="UPI QR"
                className="w-28 h-28 object-contain"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div>
                <span className="text-zinc-500 text-[11px] block">Society UPI ID</span>
                <div className="flex items-center justify-between gap-1 mt-0.5 p-1.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <span className="font-mono text-zinc-800 dark:text-zinc-200 text-[11px] select-all truncate">{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[11px] block">Beneficiary</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">{payeeName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 Input */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Step 2: Bank Reference / UTR Number <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">UPI / IMPS / NEFT</span>
            </div>
            <input
              type="text"
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. UPI410294829103 or 16-digit NEFT/IMPS RRN"
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-300 uppercase"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Supports 6 to 35 alphanumeric characters from your payment confirmation SMS or banking app.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Payment Screenshot (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded file:border file:border-zinc-300 dark:file:border-zinc-700 file:text-xs file:font-medium file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-800 dark:file:text-zinc-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
