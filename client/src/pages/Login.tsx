import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, AlertCircle, Shield, CheckCircle2, UserPlus, LogIn, ArrowRight, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { PlatformShowcase } from '../components/common/PlatformShowcase';
import { CreateSocietyModal } from '../components/society/CreateSocietyModal';
import { api } from '../services/api';
import { Society } from '../types';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showCreateSocietyModal, setShowCreateSocietyModal] = useState(false);

  // Multi-Society States
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSocietySlug, setSelectedSocietySlug] = useState<string>('royal-orchid');
  const [buildingFloors, setBuildingFloors] = useState<Array<{ floor: number; units: string[] }>>([
    { floor: 1, units: ['101', '102', '103', '104', '105', '106'] },
    { floor: 2, units: ['201', '202', '203', '204', '205', '206'] },
    { floor: 3, units: ['301', '302', '303', '304', '305', '306'] },
    { floor: 4, units: ['401', '402', '403', '404', '405', '406'] },
  ]);

  // Login Form States
  const [email, setEmail] = useState('admin@atrium.local');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register Form States
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<string>('101');
  const [areaSqFt, setAreaSqFt] = useState<number>(1150);
  const [occupancyType, setOccupancyType] = useState<'OWNER' | 'TENANT'>('OWNER');
  const [occupantCount, setOccupantCount] = useState<number>(2);
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  useEffect(() => {
    const loadSocieties = async () => {
      try {
        const res = await api.societies.getAll();
        if (res.success && res.societies.length > 0) {
          setSocieties(res.societies);
        }
      } catch (err) {
        console.error('Failed to load societies:', err);
      }
    };
    loadSocieties();
  }, [authMode]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const res = await api.auth.getBuildingUnits(selectedSocietySlug);
        if (res.success && res.floors.length > 0) {
          setBuildingFloors(res.floors);
          const firstFloor = res.floors[0];
          setSelectedFloor(firstFloor.floor);
          if (firstFloor.units.length > 0) {
            setSelectedUnit(firstFloor.units[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load building units:', err);
      }
    };
    loadUnits();
  }, [selectedSocietySlug]);

  const defaultUnitAreaMap: Record<string, number> = {
    '101': 1150, '102': 1200, '103': 980, '104': 1150, '105': 1200, '106': 980,
    '201': 1150, '202': 1200, '203': 980, '204': 1150, '205': 1200, '206': 980,
    '301': 1150, '302': 1200, '303': 980, '304': 1150, '305': 1200, '306': 980,
    '401': 1150, '402': 1200, '403': 980, '404': 1150, '405': 1200, '406': 980,
  };

  const handleFloorChange = (floor: number) => {
    setSelectedFloor(floor);
    const units = buildingFloors.find(f => f.floor === floor)?.units || [];
    if (units.length > 0) {
      setSelectedUnit(units[0]);
      setAreaSqFt(defaultUnitAreaMap[units[0]] || 1150);
    }
  };

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    setAreaSqFt(defaultUnitAreaMap[unit] || 1150);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (regPassword !== regPasswordConfirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      await register({
        societySlug: selectedSocietySlug,
        fullName,
        email: regEmail,
        phone,
        unitNumber: selectedUnit,
        superBuiltUpSqFt: Number(areaSqFt),
        occupancyType,
        occupantCount,
        password: regPassword,
        passwordConfirmation: regPasswordConfirm
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoPresets = [
    {
      role: 'Royal Orchid Admin (Rajesh)',
      email: 'admin@atrium.local',
      pwd: 'admin123',
      sub: 'Royal Orchid (4 Floors, 24 Units) • Full RWA Ledger'
    },
    {
      role: 'Greenwoods Admin (Vikram)',
      email: 'greenwoods.admin@atrium.local',
      pwd: 'admin123',
      sub: 'Greenwoods Enclave (3 Floors, 12 Units) • Multi-Tenant Proof'
    },
    {
      role: 'Resident — Flat 203 (Adarsh Singh)',
      email: 'flat203@atrium.local',
      pwd: 'resident123',
      sub: 'Royal Orchid • October dues Paid & Verified • PDF receipt'
    },
    {
      role: 'Resident — Greenwoods 202 (Anand Murthy)',
      email: 'gw202@atrium.local',
      pwd: 'resident123',
      sub: 'Greenwoods Enclave • October dues Paid & Verified • PDF receipt'
    },
    {
      role: 'Royal Orchid Staff (Ramesh Kumar)',
      email: 'staff@atrium.local',
      pwd: 'staff123',
      sub: 'View assigned electrical & plumbing complaints, update status'
    },
    {
      role: 'Greenwoods Staff (Suresh Gowda)',
      email: 'greenwoods.staff@atrium.local',
      pwd: 'staff123',
      sub: 'View assigned parking seepage & solar inverter tickets'
    }
  ];

  const handleSelectPreset = (pEmail: string, pPwd: string) => {
    setEmail(pEmail);
    setPassword(pPwd);
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-start sm:justify-center items-center py-5 sm:py-10 px-3.5 sm:px-6 pb-28 font-sans overflow-x-hidden">
      {/* Top right theme toggle */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-30">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-4xl m-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start lg:items-center">
        {/* LEFT COLUMN: Modern Multi-Tenant Platform Showcase */}
        <PlatformShowcase
          className="lg:col-span-6"
          onOpenOnboardSociety={() => setShowCreateSocietyModal(true)}
        />

        {/* RIGHT COLUMN: Sign In / Registration Form */}
        <div className="lg:col-span-6 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-none p-5 sm:p-7 space-y-4 sm:space-y-5">
          {/* Auth Mode Segmented Pill Toggle */}
          <div className="flex p-1 rounded-full bg-[#eff0f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-full text-[13px] font-semibold text-center transition flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] shadow-none'
                  : 'text-[#767676] hover:text-[#333333] dark:hover:text-[#ffffff]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-full text-[13px] font-semibold text-center transition flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] shadow-none'
                  : 'text-[#767676] hover:text-[#333333] dark:hover:text-[#ffffff]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Resident Register</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= MODE: SIGN IN ================= */}
          {authMode === 'login' && (
            <div className="space-y-3.5 sm:space-y-4">
              <div className="pb-0.5">
                <h2 className="text-[18px] sm:text-[19px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Sign in to your account</h2>
                <p className="text-[12px] sm:text-[13px] text-[#767676] dark:text-[#a1a1aa]">Access maintenance dues, tickets, and building ledger.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-3.5">
                <div>
                  <label className="block text-[12px] sm:text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="flat203@atrium.local"
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] sm:text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-5 rounded-full text-[14px] sm:text-[15px] font-semibold bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-none"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              {/* Quick Demo Accounts */}
              <div className="pt-3 border-t border-[#e5e7eb] dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold text-[#767676] dark:text-[#a1a1aa] uppercase tracking-wider">
                    Quick Demo Accounts
                  </p>
                  <span className="text-[11px] text-[#767676] dark:text-[#a1a1aa] hidden sm:inline">
                    1-Click Fast Login
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {demoPresets.map((p) => {
                    const isSelected = email === p.email;
                    return (
                      <button
                        key={p.email}
                        type="button"
                        onClick={() => handleSelectPreset(p.email, p.pwd)}
                        className={`w-full text-left p-2 rounded-[8px] text-[12px] transition border cursor-pointer ${
                          isSelected
                            ? 'bg-[#eff0f6] dark:bg-[#27272a] border-[#333333] dark:border-[#f4f4f5] text-[#333333] dark:text-[#f4f4f5]'
                            : 'border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] text-[#545454] dark:text-[#a1a1aa] hover:border-[#545454]'
                        }`}
                      >
                        <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] truncate">{p.role}</p>
                        <p className="text-[10px] text-[#767676] dark:text-[#a1a1aa] truncate">{p.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE: REGISTRATION ================= */}
          {authMode === 'register' && (
            <div className="space-y-4">
              <div className="pb-1">
                <h2 className="text-[19px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Resident Self-Registration</h2>
                <p className="text-[13px] text-[#767676] dark:text-[#a1a1aa]">Provide contact details to request unit access.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Apartment / Society Selection */}
                <div>
                  <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                    Apartment / Society <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSocietySlug}
                      onChange={(e) => setSelectedSocietySlug(e.target.value)}
                      className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[15px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition cursor-pointer font-medium shadow-none"
                    >
                      {societies.length > 0 ? (
                        societies.map((soc) => (
                          <option key={soc.id} value={soc.slug}>
                            {soc.name} ({soc.city || 'Bengaluru'}) — {soc.totalFloors} Floors
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="royal-orchid">Royal Orchid Apartments (Bengaluru) — 4 Floors</option>
                          <option value="greenwoods">Greenwoods Enclave (Bengaluru) — 3 Floors</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#767676] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Adarsh Singh"
                    className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                  />
                </div>

                {/* Email and Mobile Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="resident@example.com"
                      className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98201 10000"
                      className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                    />
                  </div>
                </div>

                {/* Floor, Flat & Manual Area Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      1. Floor <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedFloor}
                        onChange={(e) => handleFloorChange(Number(e.target.value))}
                        className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition cursor-pointer shadow-none"
                      >
                        {buildingFloors.map((bf) => (
                          <option key={bf.floor} value={bf.floor}>
                            Floor {bf.floor}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#767676] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      2. Flat <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedUnit}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition cursor-pointer shadow-none"
                      >
                        {(buildingFloors.find(f => f.floor === selectedFloor)?.units || []).map((u) => (
                          <option key={u} value={u}>
                            Flat {u}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#767676] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      3. Area <span className="text-[#767676] font-normal">(sq. ft.)</span> <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={200}
                      max={10000}
                      value={areaSqFt}
                      onChange={(e) => setAreaSqFt(Number(e.target.value))}
                      placeholder="e.g. 1150"
                      className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] font-mono focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                    />
                  </div>
                </div>

                {/* Owner / Tenant Claim & Resident Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      Occupancy Claim <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-[#eff0f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46]">
                      <button
                        type="button"
                        onClick={() => setOccupancyType('OWNER')}
                        className={`py-1.5 text-[13px] rounded-full text-center transition font-semibold ${
                          occupancyType === 'OWNER'
                            ? 'bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] shadow-none'
                            : 'text-[#767676] hover:text-[#333333] dark:hover:text-[#ffffff]'
                        }`}
                      >
                        Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => setOccupancyType('TENANT')}
                        className={`py-1.5 text-[13px] rounded-full text-center transition font-semibold ${
                          occupancyType === 'TENANT'
                            ? 'bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] shadow-none'
                            : 'text-[#767676] hover:text-[#333333] dark:hover:text-[#ffffff]'
                        }`}
                      >
                        Tenant
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      Residents in Flat <span className="text-[#767676] text-[11px]">(Total People)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={occupantCount}
                        onChange={(e) => setOccupantCount(Number(e.target.value))}
                        className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[15px] text-[#333333] dark:text-[#f4f4f5] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition cursor-pointer shadow-none"
                      >
                        <option value={1}>1 Person</option>
                        <option value={2}>2 Persons</option>
                        <option value={3}>3 Persons</option>
                        <option value={4}>4 Persons</option>
                        <option value={5}>5+ Persons</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#767676] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Password & Confirmation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#545454] dark:text-[#a1a1aa] mb-1.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-[16px] sm:text-[15px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] dark:focus:border-[#f4f4f5] transition shadow-none"
                    />
                  </div>
                </div>

                {/* Admin Approval Notice */}
                <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] text-[12px] text-[#545454] dark:text-[#a1a1aa] flex items-start gap-2.5">
                  <Shield className="w-4 h-4 mt-0.5 text-[#545454] dark:text-[#a1a1aa] shrink-0" />
                  <p className="leading-snug">
                    <strong className="text-[#333333] dark:text-[#f4f4f5]">Admin Approval Required:</strong> Your request will be queued for RWA Secretary verification. Assigned role is strictly <span className="font-mono text-[#333333] dark:text-[#f4f4f5] font-semibold">Resident</span>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-5 rounded-full text-[15px] font-semibold bg-[#333333] text-white hover:bg-[#1f1f1f] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-none"
                >
                  <span>{loading ? 'Submitting registration...' : 'Submit Resident Registration'}</span>
                  {!loading && <CheckCircle2 className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Onboard New Society Modal */}
      <CreateSocietyModal
        isOpen={showCreateSocietyModal}
        onClose={() => setShowCreateSocietyModal(false)}
        onSuccess={async (newSlug) => {
          try {
            const res = await api.societies.getAll();
            if (res.success && res.societies.length > 0) {
              setSocieties(res.societies);
            }
            setSelectedSocietySlug(newSlug);
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
};
