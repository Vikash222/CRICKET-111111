import React from 'react';
import { Award, Target, BarChart2, CheckCircle, Pencil } from 'lucide-react';
import { db } from '../../services/db';

interface PlayerProfileViewProps {
  playerId?: string;
  onEdit?: () => void;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({ playerId, onEdit }) => {
  const profile = db.getProfiles().find((p) => p.id === playerId) || db.getCurrentUser();

  // Statistics are intentionally zero until official match deliveries are recorded.
  // They must never be shown as fake/demo career numbers.
  const stats = {
    matches: 0, innings: 0, notOuts: 0, runs: 0, highestScore: '—', average: '—',
    strikeRate: '—', fours: 0, sixes: 0, fifties: 0, hundreds: 0, wickets: 0,
    bowlingAvg: '—', economy: '—', bestBowling: '—', catches: 0, manOfMatches: 0,
  };

  return <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row items-center gap-5 relative">
        <div className="relative"><img src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={profile.full_name || 'Player'} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-lime-500/40 shadow-xl"/><span className="absolute -bottom-2 -right-2 bg-lime-500 text-slate-900 font-black text-xs px-2 py-0.5 rounded-full border-2 border-slate-900">#{profile.jersey_number ?? '—'}</span></div>
        <div className="text-center sm:text-left space-y-1 flex-1"><div className="flex items-center justify-center sm:justify-start gap-2"><h2 className="text-2xl font-black text-white">{profile.full_name || 'Player'}</h2>{profile.is_verified && <CheckCircle className="w-5 h-5 text-lime-400"/>}</div><p className="text-xs text-lime-400 font-bold">{profile.college_name || 'College not added yet'}</p><div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs"><span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold uppercase">{profile.playing_role?.replace('_',' ') || 'Player'}</span><span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">{profile.batting_style?.replaceAll('_',' ') || 'Batting style not set'}</span><span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">{profile.bowling_style?.replaceAll('_',' ') || 'Bowling style not set'}</span></div>{profile.bio && <p className="text-sm text-slate-400 mt-2 max-w-xl">{profile.bio}</p>}</div>
        {onEdit && <button onClick={onEdit} className="absolute top-0 right-0 sm:static rounded-xl bg-lime-500 text-slate-950 px-3 py-2 text-xs font-black flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5"/>Edit</button>}
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['Matches',stats.matches,`${stats.innings} Innings`],['Total Runs',stats.runs,`Highest: ${stats.highestScore}`],['Batting Average',stats.average,`SR: ${stats.strikeRate}`],['Wickets Taken',stats.wickets,`Econ: ${stats.economy}`]].map(([label,value,sub])=><div key={String(label)} className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{label}</div><div className="text-2xl font-black font-mono text-lime-400">{value}</div><div className="text-[10px] text-slate-500">{sub}</div></div>)}</div>

    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl"><h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-lime-400"/>Career Batting Record</h3><div className="grid grid-cols-2 gap-2 text-xs"><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">50s / 100s</span><span className="font-bold text-white">{stats.fifties} / {stats.hundreds}</span></div><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">Fours / Sixes</span><span className="font-bold text-white">{stats.fours} / {stats.sixes}</span></div><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">Not Outs</span><span className="font-bold text-white">{stats.notOuts}</span></div><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">Strike Rate</span><span className="font-bold text-lime-400">{stats.strikeRate}</span></div></div></div>

    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl"><h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2"><BarChart2 className="w-4 h-4 text-cyan-400"/>Career Bowling Record</h3><div className="grid grid-cols-2 gap-2 text-xs"><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">Best Bowling</span><span className="font-bold text-white">{stats.bestBowling}</span></div><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">Bowling Avg</span><span className="font-bold text-white">{stats.bowlingAvg}</span></div><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">Economy</span><span className="font-bold text-cyan-400">{stats.economy}</span></div><div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">Catches</span><span className="font-bold text-white">{stats.catches}</span></div></div></div>

    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl"><h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2"><Award className="w-4 h-4 text-lime-400"/>Achievements</h3><p className="text-sm text-slate-400">No official achievements yet. They will appear automatically after verified matches are completed.</p></div>
  </div>;
};
