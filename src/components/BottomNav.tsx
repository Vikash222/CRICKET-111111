import React from 'react';
import {
  Home,
  Radio,
  Trophy,
  Search,
  User,
  ShieldCheck,
  BarChart2,
} from 'lucide-react';
import { UserRole } from '../types/cricket';

export type NavTab = 'home' | 'live' | 'tournaments' | 'rankings' | 'profile' | 'admin' | 'scoring';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, userRole }) => {
  const isScorer = userRole === 'scorer' || userRole === 'super_admin' || userRole === 'tournament_organizer';
  const isAdmin = userRole === 'super_admin' || userRole === 'college_admin';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800 text-slate-400 py-1.5 px-2 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-lime-400 font-bold scale-105' : 'hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Live Match */}
        <button
          onClick={() => onTabChange('live')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all relative ${
            activeTab === 'live' ? 'text-lime-400 font-bold scale-105' : 'hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Radio className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
          </div>
          <span className="text-[10px] tracking-tight">Live Score</span>
        </button>

        {/* Scorer Mode (If Scorer or Admin) */}
        {isScorer && (
          <button
            onClick={() => onTabChange('scoring')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
              activeTab === 'scoring' ? 'text-lime-400 font-bold scale-105' : 'text-lime-400/80 hover:text-lime-300'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-lime-500/20 ring-1 ring-lime-500/40 flex items-center justify-center">
              <span className="text-xs font-black text-lime-400">12</span>
            </div>
            <span className="text-[10px] font-bold text-lime-400">Scorer Desk</span>
          </button>
        )}

        {/* Tournaments */}
        <button
          onClick={() => onTabChange('tournaments')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'tournaments' ? 'text-lime-400 font-bold scale-105' : 'hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Tournaments</span>
        </button>

        {/* Rankings */}
        <button
          onClick={() => onTabChange('rankings')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'rankings' ? 'text-lime-400 font-bold scale-105' : 'hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Rankings</span>
        </button>

        {/* Admin Dashboard (If Admin) */}
        {isAdmin && (
          <button
            onClick={() => onTabChange('admin')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
              activeTab === 'admin' ? 'text-purple-400 font-bold scale-105' : 'text-purple-400/70 hover:text-purple-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Admin</span>
          </button>
        )}

        {/* Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-lime-400 font-bold scale-105' : 'hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
};
