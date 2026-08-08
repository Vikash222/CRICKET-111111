import React, { useEffect, useState } from 'react';
import { Award, Target, BarChart2, CheckCircle, Pencil, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types/cricket';

interface PlayerProfileViewProps { playerId?: string; onEdit?: () => void; }

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({ playerId, onEdit }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true); setError('');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { if (mounted) { setError('Login session not found.'); setLoading(false); } return; }
      const id = playerId || user.id;
      const { data, error: profileError } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (!mounted) return;
      if (profileError) { setError(profileError.message); setLoading(false); return; }
      if (!data) { setError('Player profile not found. Click Edit Profile to create it.'); setLoading(false); return; }
      setProfile(data as Profile); setLoading(false);
    };
    void load(); return () => { mounted = false; };
  }, [playerId]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-emerald-600 font-bold"><Loader2 className="w-5 h-5 animate-spin mr-2"/>Loading profile…</div>;
  if (error || !profile) return <div className="max-w-xl mx-auto p-6"><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"><b>Unable to load profile</b><p className="text-sm mt-1 break-words">{error}</p>{onEdit && <button onClick={onEdit} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-white font-bold">Edit Profile</button>}</div></div>;

  const stats = { matches: 0, innings: 0, notOuts: 0, runs: 0, highestScore: '—', average: '—', strikeRate: '—', fours: 0, sixes: 0, fifties: 0, hundreds: 0, wickets: 0, bowlingAvg: '—', economy: '—', bestBowling: '—', catches: 0 };
  const avatar = profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  return <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"/><div className="flex flex-col sm:flex-row items-center gap-5 relative"><div className="relative"><img src={avatar} alt={profile.full_name || 'Player'} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-lime-500/40 shadow-xl"/><span className="absolute -bottom-2 -right-2 bg-lime-500 text-slate-900 font-black text-xs px-2 py-0.5 rounded-full border-2 border-slate-900">#{profile.jersey_number ?? '—'}</span></div><div className="text-center sm:text-left flex-1 space-y-1"><div className="flex items-center justify-center sm:justify-start gap-2"><h2 className="text-2xl font-black text-white">{profile.full_name || 'Player'}</h2>{profile.is_verified && <CheckCircle className="w-5 h-5 text-lime-400"/>}</div><p className="text-xs text-lime-400 font-bold">{profile.college_name || 'College not added yet'}</p><div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1 text-xs"><span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 capitalize">{profile.playing_role?.replaceAll('_',' ') || 'Player'}</span><span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">{profile.batting_style?.replaceAll('_',' ') || 'Batting style not set'}</span><span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">{profile.bowling_style?.replaceAll('_',' ') || 'Bowling style not set'}</span></div>{profile.bio && <p className="text-sm text-slate-400 mt-2">{profile.bio}</p>}</div>{onEdit && <button onClick={onEdit} className="rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 px-4 py-2 font-bold flex items-center gap-2"><Pencil className="w-4 h-4"/>Edit</button>}</div></div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['Matches',stats.matches],['Total Runs',stats.runs],['Batting Average',stats.average],['Wickets',stats.wickets]].map(([label,value])=><div key={String(label)} className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl"><div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{label}</div><div className="text-2xl font-black font-mono text-lime-400">{value}</div></div>)}</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Record title="Career Batting Record" icon={<Target className="w-4 h-4 text-lime-400"/>} items={[["Innings",stats.innings],["Runs",stats.runs],["Highest",stats.highestScore],["50s / 100s",`${stats.fifties} / ${stats.hundreds}`],["Fours / Sixes",`${stats.fours} / ${stats.sixes}`],["Strike Rate",stats.strikeRate]]}/><Record title="Career Bowling Record" icon={<BarChart2 className="w-4 h-4 text-cyan-400"/>} items={[["Wickets",stats.wickets],["Economy",stats.economy],["Best Bowling",stats.bestBowling],["Bowling Avg",stats.bowlingAvg],["Catches",stats.catches]]}/></div>
    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl"><h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2"><Award className="w-4 h-4 text-lime-400"/>Achievements</h3><p className="text-sm text-slate-400">Achievements will appear automatically after verified official matches.</p></div>
  </div>;
};

const Record = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: [string, string | number][] }) => <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl"><h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2">{icon}{title}</h3><div className="grid grid-cols-2 gap-2 text-xs">{items.map(([label,value])=><div key={label} className="flex justify-between gap-2 p-2.5 bg-slate-800/60 rounded-xl"><span className="text-slate-400">{label}</span><span className="font-bold text-white">{value}</span></div>)}</div></div>;
