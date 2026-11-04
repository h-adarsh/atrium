import React from 'react';
import { ShieldCheck, Receipt, Wrench, Building2, Plus, ArrowRight } from 'lucide-react';

interface PlatformShowcaseProps {
  className?: string;
  onOpenOnboardSociety?: () => void;
}

export const PlatformShowcase: React.FC<PlatformShowcaseProps> = ({
  className = '',
  onOpenOnboardSociety
}) => {
  return (
    <div className={`p-4 sm:p-7 rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] space-y-3.5 sm:space-y-5 shadow-none ${className}`}>
      {/* Platform Header */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] text-[#767676] dark:text-[#a1a1aa]">
            Apartment Operations
          </span>
          <span className="text-[11px] text-[#767676] dark:text-[#a1a1aa] hidden sm:inline">Multi-Tenant Architecture</span>
        </div>

        <h1 className="text-[22px] sm:text-[32px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] leading-tight flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#333333] dark:bg-[#f4f4f5] flex items-center justify-center text-white dark:text-[#18181b] shrink-0">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span>Atrium</span>
        </h1>

        <p className="text-[13px] sm:text-[15px] text-[#545454] dark:text-[#a1a1aa] leading-relaxed">
          The transparent, security-first management platform built for residential apartment complexes and RWAs.
        </p>
      </div>

      {/* Onboard New Society Callout */}
      {onOpenOnboardSociety && (
        <div className="p-3 sm:p-3.5 rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-none">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#eff0f6] dark:bg-[#27272a] text-[#333333] dark:text-[#f4f4f5] flex items-center justify-center shrink-0 border border-[#e5e7eb] dark:border-[#3f3f46]">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[12px] sm:text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5] truncate">
                RWA or Management Committee?
              </p>
              <p className="text-[11px] sm:text-[12px] text-[#767676] dark:text-[#a1a1aa] truncate">
                Onboard a new apartment complex with 1-click unit layouts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenOnboardSociety}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#333333] hover:bg-[#1f1f1f] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-white text-[12px] sm:text-[13px] font-semibold transition shrink-0 cursor-pointer shadow-none"
          >
            <span>Onboard Society</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      )}

      {/* Architectural Blueprint SVG: Pale daylight drafting lines - Desktop showcase */}
      <div className="hidden lg:block p-4 rounded-[12px] bg-[#f9f9fb] dark:bg-[#141416] border border-[#e5e7eb] dark:border-[#27272a]">
        <div className="w-full flex justify-center py-1">
          <svg
            viewBox="0 0 340 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-[310px] h-auto"
          >
            {/* Ground Baseline */}
            <line x1="6" y1="120" x2="334" y2="120" className="stroke-[#545454] dark:stroke-[#767676]" strokeWidth="1.2" />
            <line x1="6" y1="123" x2="334" y2="123" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46]" strokeWidth="0.75" strokeDasharray="3 3" />
            <text x="6" y="115" fontSize="7" className="fill-[#767676] dark:fill-[#a1a1aa] font-mono">±0.00m</text>

            {/* Tower A (Left - 4 Floors) */}
            <rect x="35" y="45" width="70" height="75" rx="3" className="stroke-[#545454] dark:stroke-[#767676] fill-[#ffffff] dark:fill-[#1f1f23]" strokeWidth="1.2" />
            {/* Windows Tower A */}
            <rect x="42" y="53" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="62" y="53" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="82" y="53" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="42" y="69" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="62" y="69" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="82" y="69" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="42" y="85" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="62" y="85" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="82" y="85" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] dark:stroke-[#3f3f46] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="58" y="103" width="22" height="17" className="stroke-[#545454] fill-[#f9f9fb] dark:fill-[#27272a]" strokeWidth="0.8" />

            {/* Tower B (Center - Main High-Rise, 6 Floors) */}
            <rect x="120" y="20" width="100" height="100" rx="3" className="stroke-[#333333] dark:stroke-[#f4f4f5] fill-[#ffffff] dark:fill-[#18181b]" strokeWidth="1.5" />
            {/* Rooftop Solar Pergola */}
            <line x1="125" y1="12" x2="215" y2="12" className="stroke-[#545454] dark:stroke-[#767676]" strokeWidth="1.5" />
            <line x1="135" y1="20" x2="135" y2="12" className="stroke-[#e5e7eb]" strokeWidth="1" />
            <line x1="170" y1="20" x2="170" y2="12" className="stroke-[#e5e7eb]" strokeWidth="1" />
            <line x1="205" y1="20" x2="205" y2="12" className="stroke-[#e5e7eb]" strokeWidth="1" />
            {/* Windows Tower B */}
            <rect x="130" y="28" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="152" y="28" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="174" y="28" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="196" y="28" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />

            <rect x="130" y="44" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="152" y="44" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="174" y="44" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="196" y="44" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />

            <rect x="130" y="60" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="152" y="60" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="174" y="60" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="196" y="60" width="16" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />

            {/* Main Entrance Canopy */}
            <rect x="155" y="98" width="30" height="22" rx="1.5" className="stroke-[#545454] fill-[#f9f9fb] dark:fill-[#27272a]" strokeWidth="1" />
            <line x1="150" y1="98" x2="190" y2="98" className="stroke-[#333333] dark:stroke-[#f4f4f5]" strokeWidth="2" />

            {/* Tower C (Right - 3 Floors) */}
            <rect x="235" y="55" width="70" height="65" rx="3" className="stroke-[#545454] dark:stroke-[#767676] fill-[#ffffff] dark:fill-[#1f1f23]" strokeWidth="1.2" />
            <rect x="243" y="63" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="263" y="63" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="283" y="63" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="243" y="79" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="263" y="79" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="283" y="79" width="14" height="10" rx="1.5" className="stroke-[#e5e7eb] fill-[#eff0f6] dark:fill-[#27272a]" strokeWidth="0.8" />
            <rect x="258" y="99" width="22" height="21" className="stroke-[#545454] fill-[#f9f9fb] dark:fill-[#27272a]" strokeWidth="0.8" />

            {/* Emerald Pulse dot */}
            <circle cx="142" cy="8" r="3.5" className="fill-[#24b26d]" />
            <text x="150" y="10" className="fill-[#24b26d] font-mono text-[8px] font-semibold">LIVE PLATFORM</text>
          </svg>
        </div>
      </div>

      {/* Feature Capabilities - Desktop showcase */}
      <div className="hidden lg:block space-y-2.5">
        <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-[#24b26d] mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Verified Resident Security</p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa]">1-click RWA admin verification gate prevents unauthorized ledger access.</p>
          </div>
        </div>

        <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] flex items-start gap-3">
          <Receipt className="w-4 h-4 text-[#2c70dd] mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Transparent Dues & Receipts</p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa]">Area pro-rated calculations, bank reference validation, and official PDF receipts.</p>
          </div>
        </div>

        <div className="p-3 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9f9fb] dark:bg-[#1f1f23] flex items-start gap-3">
          <Wrench className="w-4 h-4 text-[#545454] dark:text-[#a1a1aa] mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-[#333333] dark:text-[#f4f4f5]">Helpdesk & Maintenance Staff</p>
            <p className="text-[12px] text-[#767676] dark:text-[#a1a1aa]">End-to-end ticketing for electrical, plumbing, and building upkeep.</p>
          </div>
        </div>
      </div>

      {/* Bottom Architectural Metadata Bar - Desktop showcase */}
      <div className="hidden lg:grid grid-cols-3 gap-2 pt-3 text-center text-[#767676] dark:text-[#a1a1aa] border-t border-[#e5e7eb] dark:border-[#27272a]">
        <div>
          <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] text-[13px]">Multi-Tenant</p>
          <p className="text-[11px]">Any Apartment</p>
        </div>
        <div>
          <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] text-[13px]">Isolated</p>
          <p className="text-[11px]">100% Privacy</p>
        </div>
        <div>
          <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] text-[13px]">Dynamic</p>
          <p className="text-[11px]">Custom Layouts</p>
        </div>
      </div>
    </div>
  );
};
