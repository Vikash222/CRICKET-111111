import React from 'react';
import { Trophy, Wifi, WifiOff, UserCheck, Search, Share2, ChevronDown, LogOut, Settings } from 'lucide-react';
import { db } from '../services/db';
import { UserRole } from '../types/cricket';
import { useLanguage } from '../i18n';

interface NavbarProps {
  currentRole: UserRole;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onShareMatch: () => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Player', captain: 'Captain', umpire: 'Umpire', organizer: 'Organizer', super_admin: 'Super Admin',
  scorer: 'Official Scorer', team_manager: 'Team Manager', tournament_organizer: 'Tournament Organizer', college_admin: 'College Admin', spectator: 'Spectator',
};

const ROLE_COLORS: Record<UserRole, string> = {
  player: 'bg-emerald-50 text-emerald-700 border-emerald-200', captain: 'bg-blue-50 text-blue-700 border-blue-200', umpire: 'bg-amber-50 text-amber-700 border-amber-200', organizer: 'bg-violet-50 text-violet-700 border-violet-200', super_admin: 'bg-red-50 text-red-700 border-red-200', scorer: 'bg-amber-50 text-amber-700 border-amber-200', team_manager: 'bg-blue-50 text-blue-700 border-blue-200', tournament_organizer: 'bg-violet-50 text-violet-700 border-violet-200', college_admin: 'bg-indigo-50 text-indigo-700 border-indigo-200', spectator: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onOpenSearch, onOpenProfile, onOpenSettings, onShareMatch, onLogout }) => {
  const { t } = useLanguage();
  const isOnline = db.getNetworkStatus();
  const offlineCount = db.getOfflineQueueCount();
  const currentUser = db.getCurrentUser();
  const roleLabel = currentRole === 'player' ? t('player') : currentRole === 'captain' ? t('captain') : currentRole === 'umpire' ? t('umpire') : currentRole === 'organizer' ? t('organizer') : currentRole === 'super_admin' ? t('superAdmin') : ROLE_LABELS[currentRole];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center"><Trophy className="w-5 h-5" /></div>
          <div><h1 className="text-lg font-bold tracking-tight">CollegeCricket<span className="text-emerald-600">.live</span></h1><p className="text-[11px] text-slate-500 hidden sm:block">College cricket scoring & player platform</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${ROLE_COLORS[currentRole]}`}><UserCheck className="w-3.5 h-3.5" /><span>{roleLabel}</span><ChevronDown className="w-3 h-3 opacity-40" /></div>
          <button onClick={() => db.toggleNetworkStatus()} title={isOnline ? 'Online' : `Offline (${offlineCount})`} className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${isOnline ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}<span>{isOnline ? t('online') : `Offline (${offlineCount})`}</span></button>
          <button onClick={onOpenSearch} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600" title={t('search')}><Search className="w-4 h-4" /></button>
          <button onClick={onOpenSettings} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600" title={t('settings')}><Settings className="w-4 h-4" /></button>
          <button onClick={onShareMatch} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"><Share2 className="w-3.5 h-3.5 text-emerald-400" />{t('share')}</button>
          <button onClick={onOpenProfile} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200 bg-white"><img src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={currentUser.full_name} className="w-7 h-7 rounded-full object-cover" /><span className="text-xs font-medium hidden lg:inline max-w-[100px] truncate">{currentUser.full_name}</span></button>
          <button onClick={onLogout} className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500" title={t('logout')}><LogOut className="w-4 h-4" /></button>
        </div>
      </div>
    </header>
  );
};
