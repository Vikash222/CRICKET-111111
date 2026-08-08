import React from 'react';
import { Home, Radio, Trophy, User, BarChart2 } from 'lucide-react';
import { UserRole } from '../types/cricket';
import { useLanguage } from '../i18n';

export type NavTab = 'home' | 'live' | 'tournaments' | 'rankings' | 'profile' | 'admin' | 'scoring';
interface BottomNavProps { activeTab: NavTab; onTabChange: (tab: NavTab) => void; userRole: UserRole; }

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, userRole: _userRole }) => {
  const { t } = useLanguage();
  const button = (tab: NavTab, label: string, icon: React.ReactNode, activeClass = 'text-emerald-600') => <button onClick={() => onTabChange(tab)} className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${activeTab === tab ? `${activeClass} font-bold` : 'text-slate-500 hover:text-slate-900'}`}>{icon}<span className="text-[10px] tracking-tight">{label}</span></button>;

  return <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 text-slate-500 py-1.5 px-2"><div className="max-w-md mx-auto flex items-center justify-around">
    {button('home', t('home'), <Home className="w-5 h-5" />)}
    {button('live', t('live'), <Radio className="w-5 h-5" />)}
    {button('tournaments', t('tournaments'), <Trophy className="w-5 h-5" />)}
    {button('rankings', t('rankings'), <BarChart2 className="w-5 h-5" />)}
    {button('profile', t('profile'), <User className="w-5 h-5" />)}
  </div></nav>;
};
