import React from 'react';
import { Trophy, Wifi, WifiOff, UserCheck, Search, Share2, ChevronDown, LogOut } from 'lucide-react';
import { db } from '../services/db';
import { UserRole } from '../types/cricket';

interface NavbarProps {
  currentRole: UserRole;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onShareMatch: () => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Player',
  scorer: 'Official Scorer',
  team_manager: 'Team Manager',
  tournament_organizer: 'Tournament Organizer',
  college_admin: 'College Admin',
  super_admin: 'Super Admin',
  spectator: 'Spectator',
};

const ROLE_COLORS: Record<UserRole, string> = {
  player: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  scorer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  team_manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tournament_organizer: 'bg-lime-400/20 text-lime-300 border-lime-400/30',
  college_admin: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  super_admin: 'bg-red-600/30 text-red-400 border-red-500/40',
  spectator: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
};

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onOpenSearch, onOpenProfile, onShareMatch, onLogout }) => {
  const isOnline = db.getNetworkStatus();
  const offlineCount = db.getOfflineQueueCount();
  const currentUser = db.getCurrentUser();

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-500 text-slate-900 font-bold flex items-center justify-center shadow-lg shadow-lime-500/20 ring-1 ring-lime-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">CollegeCricket<span className="text-lime-400 font-black">.live</span></h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-lime-500/20 text-lime-400 border border-lime-500/30 tracking-wider">PRO</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Inter-College Live Scoring & Player Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${ROLE_COLORS[currentRole]}`} title="Your account role">
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Role:</span>
            <span>{ROLE_LABELS[currentRole]}</span>
            <ChevronDown className="w-3 h-3 opacity-40" />
          </div>

          <button onClick={() => db.toggleNetworkStatus()} title={isOnline ? 'Online Mode (click to test offline scoring)' : 'Offline Mode (click to sync)'} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${isOnline ? 'bg-slate-800 border-lime-500/40 text-lime-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : `Offline (${offlineCount})`}</span>
          </button>

          <button onClick={onOpenSearch} className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300" title="Global Search"><Search className="w-4 h-4" /></button>
          <button onClick={onShareMatch} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200" title="Share Public Match Link"><Share2 className="w-3.5 h-3.5 text-lime-400" /><span>Share Match</span></button>

          <button onClick={onOpenProfile} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-800 border border-slate-700" title="Open profile">
            <img src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={currentUser.full_name} className="w-7 h-7 rounded-full object-cover ring-2 ring-lime-500/50" />
            <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[100px] truncate">{currentUser.full_name}</span>
          </button>

          <button onClick={onLogout} className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-red-500/20 hover:text-red-300 text-slate-400" title="Logout"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>
    </header>
  );
};
