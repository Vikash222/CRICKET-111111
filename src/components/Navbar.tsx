import React from 'react';
import {
  Trophy,
  Wifi,
  WifiOff,
  UserCheck,
  Search,
  Share2,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { db } from '../services/db';
import { UserRole } from '../types/cricket';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onShareMatch: () => void;
}

const ROLES: { id: UserRole; label: string; badgeColor: string }[] = [
  { id: 'player', label: 'Player', badgeColor: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
  { id: 'scorer', label: 'Official Scorer', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'team_manager', label: 'Team Manager', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'tournament_organizer', label: 'Tournament Organizer', badgeColor: 'bg-lime-400/20 text-lime-300 border-lime-400/30' },
  { id: 'college_admin', label: 'College Admin', badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'super_admin', label: 'Super Admin', badgeColor: 'bg-red-600/30 text-red-400 border-red-500/40' },
  { id: 'spectator', label: 'Spectator', badgeColor: 'bg-slate-700/40 text-slate-400 border-slate-600/40' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  onOpenSearch,
  onOpenProfile,
  onShareMatch,
}) => {
  const isOnline = db.getNetworkStatus();
  const offlineCount = db.getOfflineQueueCount();
  const currentUser = db.getCurrentUser();

  const handleToggleNetwork = () => {
    db.toggleNetworkStatus();
  };

  const currentRoleInfo = ROLES.find((r) => r.id === currentRole) || ROLES[0];

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-500 text-slate-900 font-bold flex items-center justify-center shadow-lg shadow-lime-500/20 ring-1 ring-lime-400">
            <Trophy className="w-5 h-5 text-slate-900 font-extrabold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                CollegeCricket<span className="text-lime-400 font-black">.live</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-lime-500/20 text-lime-400 border border-lime-500/30 tracking-wider">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Inter-College Live Scoring & Player Platform
            </p>
          </div>
        </div>

        {/* Center Actions / Role Switcher */}
        <div className="flex items-center gap-2">
          {/* Persona Role Dropdown Switcher */}
          <div className="relative group">
            <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentRoleInfo.badgeColor}`}>
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Role:</span>
              <span>{currentRoleInfo.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            <div className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:block group-focus-within:block z-50">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-700/60 mb-1 tracking-wider">
                Switch Persona / Role View
              </div>
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => onRoleChange(role.id)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center justify-between ${
                    currentRole === role.id
                      ? 'bg-lime-500/20 text-lime-400 font-bold border border-lime-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{role.label}</span>
                  {currentRole === role.id && <span className="w-2 h-2 rounded-full bg-lime-400"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Network Status Toggle */}
          <button
            onClick={handleToggleNetwork}
            title={isOnline ? 'Online Mode (Click to test Offline Scoring)' : 'Offline Mode (Click to sync)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isOnline
                ? 'bg-slate-800 border-lime-500/40 text-lime-400 hover:bg-slate-700'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-lime-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : `Offline (${offlineCount})`}</span>
          </button>

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Share Public Link */}
          <button
            onClick={onShareMatch}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            title="Share Public Match Link"
          >
            <Share2 className="w-3.5 h-3.5 text-lime-400" />
            <span>Share Match</span>
          </button>

          {/* Profile Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.full_name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-lime-500/50"
            />
            <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[100px] truncate">
              {currentUser.full_name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
