import React from 'react';
import { Home, Radio, Trophy, User, ShieldCheck, BarChart2, DoorOpen } from 'lucide-react';
import { UserRole } from '../types/cricket';

export type NavTab = 'home' | 'live' | 'tournaments' | 'rankings' | 'profile' | 'admin' | 'scoring';
interface BottomNavProps { activeTab: NavTab; onTabChange: (tab: NavTab) => void; userRole: UserRole; }

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, userRole }) => {
  const isOrganizer = ['organizer', 'tournament_organizer', 'super_admin'].includes(userRole);
  const isAdmin = userRole === 'super_admin';
  const isUmpire = userRole === 'umpire';
  const isCaptain = userRole === 'captain';
  const isScorer = userRole === 'scorer' || userRole === 'super_admin';

  const button = (tab: NavTab, label: string, icon: React.ReactNode, activeClass = 'text-lime-400') => (
    <button onClick={() => onTabChange(tab)} className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${activeTab === tab ? `${activeClass} font-bold` : 'text-slate-400 hover:text-slate-200'}`}>
      {icon}<span className="text-[10px] tracking-tight">{label}</span>
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800 text-slate-400 py-1.5 px-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {button('home', 'Home', <Home className="w-5 h-5" />)}
        {button('live', 'Live', <Radio className="w-5 h-5" />)}
        {isOrganizer && button('admin', isAdmin ? 'Admin' : 'Rooms', <DoorOpen className="w-5 h-5" />, isAdmin ? 'text-purple-400' : 'text-cyan-400')}
        {(isScorer || isUmpire) && button('scoring', isUmpire ? 'Match' : 'Scorer', <Radio className="w-5 h-5" />)}
        {button('tournaments', isCaptain ? 'Team' : 'Tournaments', <Trophy className="w-5 h-5" />)}
        {button('rankings', 'Rankings', <BarChart2 className="w-5 h-5" />)}
        {button('profile', 'Profile', <User className="w-5 h-5" />)}
      </div>
    </nav>
  );
};
