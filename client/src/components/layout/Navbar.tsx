import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, LogOut, ChevronDown, Check, MessageSquarePlus, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenFeedback: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenFeedback,
  onOpenProfile
}) => {
  const { user, logout, quickSwitchAccount } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);

  const demoAccounts = [
    { email: 'admin@atrium.local', label: 'Royal Orchid Admin (Rajesh)', role: 'ADMIN', unit: 'Royal Orchid (4F/24U)' },
    { email: 'greenwoods.admin@atrium.local', label: 'Greenwoods Admin (Vikram)', role: 'ADMIN', unit: 'Greenwoods (3F/12U)' },
    { email: 'flat203@atrium.local', label: 'Royal Orchid 203 — Adarsh Singh', role: 'RESIDENT', unit: 'Flat 203 (Paid & Verified)' },
    { email: 'gw202@atrium.local', label: 'Greenwoods 202 — Anand Murthy', role: 'RESIDENT', unit: 'Flat 202 (Paid & Verified)' },
    { email: 'gw204@atrium.local', label: 'Greenwoods 204 — Sameer Kulkarni', role: 'RESIDENT', unit: 'Flat 204 (Pending Verification)' },
    { email: 'staff@atrium.local', label: 'Staff — Ramesh Kumar', role: 'STAFF', unit: 'Royal Orchid' },
    { email: 'greenwoods.staff@atrium.local', label: 'Staff — Suresh Gowda', role: 'STAFF', unit: 'Greenwoods Enclave' },
  ];

  const handleSwitch = async (email: string) => {
    setSwitching(true);
    setShowRoleDropdown(false);
    const pwd = email.includes('admin') ? 'admin123' : email.includes('staff') ? 'staff123' : 'resident123';
    await quickSwitchAccount(email, pwd);
    setSwitching(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'dues', label: user?.role === 'ADMIN' ? 'Dues & Collections' : 'My Dues & Receipts' },
    { id: 'complaints', label: 'Maintenance Tickets' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'notices', label: 'Notices' },
    { id: 'flats', label: 'Units Directory' },
    ...(user?.role === 'ADMIN' ? [{ id: 'feedback', label: 'Tester Feedback' }] : [])
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#27272a] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer min-w-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-7 h-7 rounded-full bg-[#333333] dark:bg-[#f4f4f5] flex items-center justify-center text-white dark:text-[#18181b] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-semibold text-[14px] sm:text-[15px] tracking-tight text-[#333333] dark:text-[#f4f4f5] truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                {user?.society?.name || 'Royal Orchid'}
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eff0f6] dark:bg-[#27272a] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46] shrink-0">
                {user?.society ? `${user.society.totalFloors} Floors` : '24 Units'}
              </span>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Feedback Trigger Button */}
            <button
              type="button"
              onClick={onOpenFeedback}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] hover:text-[#333333] dark:hover:text-[#ffffff] text-[13px] font-medium hover:border-[#545454] transition shadow-none cursor-pointer"
              title="Share feedback or report an issue"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </button>

            {/* Profile Button */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="p-1.5 sm:p-2 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#545454] hover:text-[#333333] dark:text-[#a1a1aa] dark:hover:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition shadow-none cursor-pointer"
              title="Resident Profile & Security"
            >
              <UserIcon className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[12px] sm:text-[13px] font-medium text-[#333333] dark:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition shadow-none cursor-pointer"
              >
                <span className="text-[#767676] hidden sm:inline">Role:</span>
                <span className="font-semibold text-[#333333] dark:text-[#f4f4f5] truncate max-w-[80px] sm:max-w-none">
                  {user?.role === 'ADMIN' ? 'Admin' : user?.flat ? `Flat ${user.flat.unitNumber}` : user?.role === 'STAFF' ? 'Staff' : user?.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#767676]" />
              </button>

              {showRoleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-68 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] shadow-none p-1.5 z-20">
                    <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[#767676] uppercase tracking-wider">
                      Switch Role (Testing)
                    </div>
                    <div className="space-y-0.5">
                      {demoAccounts.map((acc) => {
                        const isCurrent = user?.email === acc.email;
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            onClick={() => handleSwitch(acc.email)}
                            disabled={switching}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[13px] transition ${
                              isCurrent
                                ? 'bg-[#eff0f6] dark:bg-[#27272a] text-[#333333] dark:text-[#f4f4f5] font-semibold'
                                : 'text-[#545454] dark:text-[#a1a1aa] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a]/60 hover:text-[#333333]'
                            }`}
                          >
                            <div>
                              <p className="font-medium">{acc.label}</p>
                              <p className="text-[11px] text-[#767676]">{acc.unit}</p>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-[#333333] dark:text-[#f4f4f5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#767676] hover:text-[#333333] dark:text-[#a1a1aa] dark:hover:text-[#f4f4f5] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] hover:border-[#545454] transition shadow-none"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Pill Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-[#e5e7eb] dark:border-[#27272a] no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap px-3.5 py-1 rounded-full text-[13px] font-medium transition ${
                  isActive
                    ? 'bg-[#333333] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] shadow-none'
                    : 'text-[#545454] dark:text-[#a1a1aa] hover:text-[#333333] dark:hover:text-[#ffffff] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
