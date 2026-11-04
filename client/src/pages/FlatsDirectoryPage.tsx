import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FlatItem } from '../types';
import { DueStatusBadge } from '../components/common/Badge';
import { EditFlatModal } from '../components/flats/EditFlatModal';
import { Phone, Mail, Edit2, Search, LayoutGrid, Layers } from 'lucide-react';

export const FlatsDirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [activeFlatForEdit, setActiveFlatForEdit] = useState<FlatItem | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'unified' | 'by-floor'>('unified');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadFlats = async () => {
    try {
      const res = await api.flats.getAll();
      if (res.success) {
        setFlats(res.flats);
      }
    } catch (err) {
      console.error('Failed to load flats:', err);
    }
  };

  useEffect(() => {
    loadFlats();
  }, []);

  const floors = Array.from(new Set(flats.map(f => f.floorNumber))).sort((a, b) => b - a);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const layout = useMemo(() => {
    const total = flats.length;
    if (total <= 0) return { cols: 4, rows: 0 };
    if (total <= 4) return { cols: total, rows: 1 };
    
    if (total % 4 === 0) {
      return { cols: 4, rows: total / 4 };
    }
    
    if (total % 3 === 0 && total <= 18) {
      return { cols: 3, rows: total / 3 };
    }
    
    const cols = total < 8 ? 3 : 4;
    return { cols, rows: Math.ceil(total / cols) };
  }, [flats.length]);

  const getGridClass = (cols: number) => {
    switch (cols) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  const sortedFlats = useMemo(() => {
    return [...flats].sort((a, b) => {
      if (b.floorNumber !== a.floorNumber) {
        return b.floorNumber - a.floorNumber;
      }
      return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
    });
  }, [flats]);

  const displayedFlats = useMemo(() => {
    let result = sortedFlats;
    if (selectedFloor !== 'ALL') {
      result = result.filter(f => f.floorNumber === Number(selectedFloor));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        f =>
          f.unitNumber.toLowerCase().includes(q) ||
          f.resident?.fullName?.toLowerCase().includes(q) ||
          f.resident?.phone?.includes(q) ||
          f.resident?.email?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sortedFlats, selectedFloor, searchQuery]);

  const renderFlatCard = (flat: FlatItem) => {
    const latestDue = flat.dues?.[0];
    const isMyFlat = user?.flat && flat.id === user.flat.id;

    return (
      <div
        key={flat.id}
        className={`p-5 rounded-[12px] bg-white dark:bg-[#18181b] border transition flex flex-col justify-between space-y-3.5 shadow-none ${
          isMyFlat
            ? 'border-[#333333] dark:border-[#f4f4f5]'
            : 'border-[#e5e7eb] dark:border-[#27272a] hover:border-[#545454]'
        }`}
      >
        <div className="space-y-3">
          {/* Unit & Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[17px] font-bold text-[#333333] dark:text-[#f4f4f5]">
                Flat {flat.unitNumber}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#eff0f6] dark:bg-[#27272a] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46]">
                Floor {flat.floorNumber}
              </span>
              {isMyFlat && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#27272a] text-[#24b26d] border border-[#24b26d]">
                  You
                </span>
              )}
            </div>
            {(isAdmin || isMyFlat) && latestDue && (
              <DueStatusBadge status={latestDue.status} />
            )}
          </div>

          {/* Resident info */}
          <div className="space-y-1.5 text-[13px]">
            <p className="font-semibold text-[#333333] dark:text-[#f4f4f5] truncate">
              {flat.resident?.fullName || 'Occupant'}
            </p>

            {flat.resident?.phone && (
              <p className="flex items-center gap-1.5 text-[#767676] dark:text-[#a1a1aa]">
                <Phone className="w-3.5 h-3.5 text-[#767676] shrink-0" />
                <a href={`tel:${flat.resident.phone}`} className="hover:underline text-[#2c70dd] font-mono text-[12px]">
                  {flat.resident.phone}
                </a>
              </p>
            )}

            {flat.resident?.email && (
              <p className="flex items-center gap-1.5 text-[#767676] dark:text-[#a1a1aa] text-[12px] truncate">
                <Mail className="w-3.5 h-3.5 text-[#767676] shrink-0" />
                <span className="truncate">{flat.resident.email}</span>
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-[#e5e7eb] dark:border-[#27272a] text-[12px] text-[#767676] flex justify-between items-center">
            <span>Super Built-Up:</span>
            <span className="font-medium text-[#333333] dark:text-[#f4f4f5]">{flat.superBuiltUpSqFt} sq. ft.</span>
          </div>
        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="pt-3 border-t border-[#e5e7eb] dark:border-[#27272a] flex justify-end">
            <button
              type="button"
              onClick={() => setActiveFlatForEdit(flat)}
              className="inline-flex items-center gap-1.5 text-[12px] text-[#545454] dark:text-[#a1a1aa] hover:text-[#333333] dark:hover:text-[#ffffff] transition py-0.5 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Unit</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb] dark:border-[#27272a]">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#333333] dark:text-[#f4f4f5] leading-tight">
            Units Directory
          </h1>
          <p className="text-[13px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">
            {user?.society?.name || 'Apartment Society'} • {floors.length || 4} Floors • {flats.length} Units {user?.society?.hasTerrace !== false ? '• Shared Terrace' : ''} • Resident Directory
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[#eff0f6] dark:bg-[#27272a] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46]">
            {layout.cols} units / row • {layout.rows} rows ({flats.length} units)
          </span>
        </div>
      </div>

      {/* Shared Terrace Asset Header */}
      <div className="p-4.5 rounded-[12px] bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] flex items-center justify-between shadow-none">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#333333] dark:text-[#f4f4f5]">
            Top Floor: Shared Terrace & Assets
          </h2>
          <p className="text-[12px] text-[#767676] mt-0.5">
            Water tanks, lift machine room, solar panels • Gate hours: 6 AM – 10 PM
          </p>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#f9f9fb] dark:bg-[#27272a] text-[#545454] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#3f3f46]">
          Common Asset
        </span>
      </div>

      {/* Controls Bar: Floor Filter, Search, and View Mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Floor Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedFloor('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition cursor-pointer ${
              selectedFloor === 'ALL'
                ? 'bg-[#333333] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] shadow-none'
                : 'border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] hover:border-[#545454]'
            }`}
          >
            All Units ({flats.length})
          </button>
          {floors.map((floor) => {
            const floorCount = flats.filter(f => f.floorNumber === floor).length;
            return (
              <button
                key={floor}
                type="button"
                onClick={() => setSelectedFloor(String(floor))}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedFloor === String(floor)
                    ? 'bg-[#333333] text-white dark:bg-[#f4f4f5] dark:text-[#18181b] shadow-none'
                    : 'border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[#545454] dark:text-[#a1a1aa] hover:border-[#545454]'
                }`}
              >
                Floor {floor} ({floorCount})
              </button>
            );
          })}
        </div>

        {/* Search & Layout View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#767676]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unit, name, phone..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[13px] text-[#333333] dark:text-[#f4f4f5] placeholder-[#808080] focus:outline-none focus:border-[#333333] shadow-none"
            />
          </div>

          <div className="flex items-center rounded-full border border-[#e5e7eb] dark:border-[#27272a] bg-[#eff0f6] dark:bg-[#27272a] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`p-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                viewMode === 'unified'
                  ? 'bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] shadow-none'
                  : 'text-[#767676] hover:text-[#333333] dark:hover:text-[#f4f4f5]'
              }`}
              title={`Unified Grid (${layout.cols} units/row)`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('by-floor')}
              className={`p-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                viewMode === 'by-floor'
                  ? 'bg-white dark:bg-[#18181b] text-[#333333] dark:text-[#f4f4f5] shadow-none'
                  : 'text-[#767676] hover:text-[#333333] dark:hover:text-[#f4f4f5]'
              }`}
              title="Grouped by Floors"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid Presentation */}
      {displayedFlats.length === 0 ? (
        <div className="p-8 text-center rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] space-y-1 shadow-none">
          <p className="text-[15px] font-semibold text-[#333333] dark:text-[#f4f4f5]">No units found</p>
          <p className="text-[13px] text-[#767676]">Try adjusting your floor filter or search query.</p>
        </div>
      ) : viewMode === 'unified' || selectedFloor !== 'ALL' ? (
        <div className={`grid ${getGridClass(layout.cols)} gap-4`}>
          {displayedFlats.map(renderFlatCard)}
        </div>
      ) : (
        <div className="space-y-6">
          {floors.map((floor) => {
            const floorFlats = displayedFlats.filter(f => f.floorNumber === floor);
            if (floorFlats.length === 0) return null;
            return (
              <div key={floor} className="space-y-3">
                <div className="flex items-center justify-between px-0.5 border-b border-[#e5e7eb] dark:border-[#27272a] pb-1.5">
                  <h3 className="text-[12px] font-semibold text-[#333333] dark:text-[#f4f4f5] uppercase tracking-wider">
                    Floor {floor} ({floorFlats.length} Units)
                  </h3>
                  <span className="text-[11px] text-[#767676] font-mono">
                    {floorFlats.map(f => f.unitNumber).join(' • ')}
                  </span>
                </div>

                <div className={`grid ${getGridClass(layout.cols)} gap-4`}>
                  {floorFlats.map(renderFlatCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {activeFlatForEdit && (
        <EditFlatModal
          isOpen={Boolean(activeFlatForEdit)}
          onClose={() => setActiveFlatForEdit(null)}
          flat={activeFlatForEdit}
          onSuccess={loadFlats}
        />
      )}
    </div>
  );
};
