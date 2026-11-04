import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { Building2, AlertCircle } from 'lucide-react';

interface CreateSocietyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSlug: string) => void;
}

export const CreateSocietyModal: React.FC<CreateSocietyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [totalFloors, setTotalFloors] = useState<number>(4);
  const [flatsPerFloor, setFlatsPerFloor] = useState<number>(6);
  const [hasTerrace, setHasTerrace] = useState(true);
  const [hasBasement, setHasBasement] = useState(false);
  const [baseFixedCharge, setBaseFixedCharge] = useState<number>(500);
  const [ratePerSqFt, setRatePerSqFt] = useState<number>(2.50);
  const [upiId, setUpiId] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the apartment society name');
      return;
    }
    if (!address.trim()) {
      setError('Please provide the full society address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.societies.create({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim() || undefined,
        totalFloors: Number(totalFloors),
        flatsPerFloor: Number(flatsPerFloor),
        hasTerrace,
        hasBasement,
        baseFixedCharge: Number(baseFixedCharge),
        ratePerSqFt: Number(ratePerSqFt),
        upiId: upiId.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined
      });

      if (res.success && res.society) {
        onSuccess(res.society.slug);
        onClose();
        setName('');
        setAddress('');
        setPincode('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to onboard society');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard New Apartment Society"
      subtitle="Expand your software to another residential complex in your area"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Society Name */}
        <div>
          <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
            Society / Apartment Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise Heights, Green Meadows"
            className="w-full px-3.5 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
          />
        </div>

        {/* Full Society Address */}
        <div>
          <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
            Society Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. #42, 12th Main Road, HAL 2nd Stage, Indiranagar"
            className="w-full px-3.5 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
          />
        </div>

        {/* City, State & Pincode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
              City <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
              className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
              Pincode
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="560038"
              className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Karnataka"
              className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
            />
          </div>
        </div>

        {/* Building Layout Configuration */}
        <div className="p-3.5 rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#333333] dark:text-[#f4f4f5] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Building Layout</span>
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#eff0f6] dark:bg-[#27272a] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46]">
              {(Number(totalFloors) || 0) * (Number(flatsPerFloor) || 0)} Units Total
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[#767676] dark:text-[#a1a1aa] mb-1">
                Total Floors
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={totalFloors}
                onChange={(e) => setTotalFloors(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none"
              />
            </div>

            <div>
              <label className="block text-[12px] text-[#767676] dark:text-[#a1a1aa] mb-1">
                Flats per Floor
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={flatsPerFloor}
                onChange={(e) => setFlatsPerFloor(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-[13px] pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[#545454] dark:text-[#a1a1aa]">
              <input
                type="checkbox"
                checked={hasTerrace}
                onChange={(e) => setHasTerrace(e.target.checked)}
                className="rounded border-[#e5e7eb] text-[#333333] focus:ring-0"
              />
              <span>Shared Rooftop Terrace</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[#545454] dark:text-[#a1a1aa]">
              <input
                type="checkbox"
                checked={hasBasement}
                onChange={(e) => setHasBasement(e.target.checked)}
                className="rounded border-[#e5e7eb] text-[#333333] focus:ring-0"
              />
              <span>Basement Parking</span>
            </label>
          </div>
        </div>

        {/* Maintenance Config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-[13px]">
          <div>
            <label className="block font-medium text-[#545454] dark:text-[#a1a1aa] mb-1">
              Fixed Base Charge (₹)
            </label>
            <input
              type="number"
              value={baseFixedCharge}
              onChange={(e) => setBaseFixedCharge(Number(e.target.value))}
              placeholder="500"
              className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#545454] dark:text-[#a1a1aa] mb-1">
              Rate per sq. ft. (₹)
            </label>
            <input
              type="number"
              step="0.1"
              value={ratePerSqFt}
              onChange={(e) => setRatePerSqFt(Number(e.target.value))}
              placeholder="2.50"
              className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none"
            />
          </div>
        </div>

        {/* Banking / UPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-[13px]">
          <div>
            <label className="block font-medium text-[#545454] dark:text-[#a1a1aa] mb-1">
              Society UPI ID / VPA
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="society.rwa@bank"
              className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none"
            />
          </div>

          <div>
            <label className="block font-medium text-[#545454] dark:text-[#a1a1aa] mb-1">
              RWA Account Name
            </label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder="e.g. Sunrise Heights RWA"
              className="w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[14px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] shadow-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e5e7eb] dark:border-[#27272a]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-[13px] font-medium border border-[#e5e7eb] dark:border-[#27272a] text-[#545454] dark:text-[#a1a1aa] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition shadow-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-full text-[13px] font-semibold bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition disabled:opacity-50 shadow-none cursor-pointer"
          >
            {loading ? 'Creating Society...' : 'Create Society'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
