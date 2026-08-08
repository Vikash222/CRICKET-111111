import React, { useEffect, useMemo, useState } from 'react';
import {
  Award, BarChart3, CheckCircle2, ChevronRight, CircleDot, Loader2,
  Pencil, ShieldCheck, Trophy, UserRound, Activity, Target, Medal
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PlayerCareerStats, Profile } from '../../types/cricket';

interface PlayerProfileViewProps { playerId?: string; onEdit?: () => void; }
type Tab = 'overview' | 'batting' | 'bowling' | 'fielding' | 'matches' | 'achievements';

const emptyStats: PlayerCareerStats = {
  player_id: '', player_name: '', matches: 0, innings: 0, not_outs: 0, runs: 0,
  highest_score: 0, highest_score_not_out: false, balls_faced: 0, batting_average: 0,
  strike_rate: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, ducks: 0,
  bowling_innings: 0, balls_bowled: 0, overs_bowled: 0, runs_conceded: 0, wickets: 0,
  maidens: 0, bowling_average: 0, economy: 0, best_bowling_wickets: 0,
  best_bowling_runs: 0, three_wickets: 0, five_wickets: 0, catches: 0, stumpings: 0,
  man_of_matches: 0
};

const fmt = (n: number | null | undefined, digits = 2) => Number.isFinite(Number(n)) ? Number(n).toFixed(digits) : '—';

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({ playerId, onEdit }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerCareerStats>(emptyStats);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
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
      if (!data) { setError('Player profile not found. Complete your profile first.'); setLoading(false); return; }
      setProfile(data as Profile); setLoading(false);

      setStatsLoading(true);
      const { data: career } = await supabase.from('player_career_stats').select('*').eq('player_id', id).maybeSingle();
      if (mounted && career) setStats({ ...emptyStats, ...career } as PlayerCareerStats);
      if (mounted) setStatsLoading(false);
    };
    void load(); return () => { mounted = false; };
  }, [playerId]);

  const derived = useMemo(() => ({
    average: stats.innings - stats.not_outs > 0 ? stats.runs / (stats.innings - stats.not_outs) : 0,
    strikeRate: stats.balls_faced > 0 ? (stats.runs / stats.balls_faced) * 100 : 0,
    economy: stats.balls_bowled > 0 ? (stats.runs_conceded / stats.balls_bowled) * 6 : 0,
    bowlingAverage: stats.wickets > 0 ? stats.runs_conceded / stats.wickets : 0,
    bestBowling: stats.wickets > 0 ? `${stats.best_bowling_wickets}/${stats.best_bowling_runs}` : '—'
  }), [stats]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-lime-400 font-bold"><Loader2 className="w-5 h-5 animate-spin mr-2"/>Loading player profile…</div>;
  if (error || !profile) return <div className="max-w-xl mx-auto p-6"><div className="rounded-2xl border border-red-400/20 bg-red-950/30 p-5 text-red-200"><b>Unable to load profile</b><p className="text-sm mt-1 break-words">{error}</p>{onEdit && <button onClick={onEdit} className="mt-4 rounded-xl bg-lime-400 px-4 py-2 text-slate-950 font-black">Complete Profile</button>}</div></div>;

  const avatar = profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
  const displayStats = [
    ['Matches', stats.matches], ['Runs', stats.runs], ['Wickets', stats.wickets], ['Avg', fmt(derived.average)],
    ['Strike Rate', fmt(derived.strikeRate)], ['Highest', `${stats.highest_score}${stats.highest_score_not_out ? '*' : ''}`],
    ['4s', stats.fours], ['6s', stats.sixes]
  ];
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'batting', label: 'Batting' }, { id: 'bowling', label: 'Bowling' },
    { id: 'fielding', label: 'Fielding' }, { id: 'matches', label: 'Matches' }, { id: 'achievements', label: 'Achievements' }
  ];

  return <div className="max-w-5xl mx-auto p-3 sm:p-5 space-y-4 pb-28 text-slate-100">
    <section className="relative overflow-hidden rounded-[28px] border border-slate-700 bg-gradient-to-br from-[#111b32] via-[#0b1428] to-[#07111f] shadow-2xl">
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="relative shrink-0"><img src={avatar} alt={profile.full_name || 'Player'} className="w-28 h-28 sm:w-32 sm:h-32 rounded-[24px] object-cover ring-4 ring-lime-400/30 shadow-2xl"/><span className="absolute -bottom-2 -right-2 rounded-full border-2 border-[#0b1428] bg-lime-400 px-2.5 py-1 text-xs font-black text-slate-950">#{profile.jersey_number ?? '—'}</span></div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2"><h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">{profile.full_name || 'Player'}</h1>{profile.is_verified && <CheckCircle2 className="w-5 h-5 shrink-0 text-lime-400"/>}</div>
            <p className="mt-1 text-sm font-bold text-lime-300">{profile.college_name || 'College not added yet'}</p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2 text-xs">
              <Badge>{profile.playing_role?.replaceAll('_', ' ') || 'Player'}</Badge><Badge>{profile.batting_style?.replaceAll('_', ' ') || 'Batting style not set'}</Badge><Badge>{profile.bowling_style?.replaceAll('_', ' ') || 'Bowling style not set'}</Badge>
            </div>
            {(profile.city || profile.state) && <p className="mt-3 text-xs text-slate-400">{[profile.city, profile.state].filter(Boolean).join(', ')}</p>}
            {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{profile.bio}</p>}
          </div>
          {onEdit && <button onClick={onEdit} className="rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 px-4 py-2.5 font-black flex items-center gap-2 shrink-0"><Pencil className="w-4 h-4"/>Edit Profile</button>}
        </div>
      </div>
      <div className="grid grid-cols-4 border-t border-slate-700/80 bg-black/10">{[['Matches', stats.matches], ['Runs', stats.runs], ['Wickets', stats.wickets], ['MOM', stats.man_of_matches]].map(([l, v]) => <div key={String(l)} className="px-2 py-4 text-center border-r last:border-r-0 border-slate-700/70"><div className="text-lg sm:text-xl font-black text-white">{v}</div><div className="text-[9px] uppercase tracking-widest font-bold text-slate-500">{l}</div></div>)}</div>
    </section>

    <nav className="sticky top-2 z-20 overflow-x-auto rounded-2xl border border-slate-700 bg-[#0b1428]/95 p-1.5 backdrop-blur-xl shadow-xl"><div className="flex min-w-max gap-1">{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 rounded-xl text-xs font-black transition ${tab === t.id ? 'bg-lime-400 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>{t.label}</button>)}</div></nav>

    {statsLoading && <div className="rounded-xl border border-slate-700 bg-[#0b1428] p-3 text-xs text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Syncing official career statistics…</div>}

    {tab === 'overview' && <Overview stats={stats} derived={derived} displayStats={displayStats} />}
    {tab === 'batting' && <StatPanel title="Career Batting" icon={<Target className="w-5 h-5 text-lime-400"/>} items={[
      ['Matches', stats.matches], ['Innings', stats.innings], ['Not Outs', stats.not_outs], ['Runs', stats.runs], ['Highest Score', `${stats.highest_score}${stats.highest_score_not_out ? '*' : ''}`], ['Average', fmt(derived.average)], ['Strike Rate', fmt(derived.strikeRate)], ['Balls Faced', stats.balls_faced], ['4s', stats.fours], ['6s', stats.sixes], ['50s', stats.fifties], ['100s', stats.hundreds], ['Ducks', stats.ducks]
    ]} />}
    {tab === 'bowling' && <StatPanel title="Career Bowling" icon={<CircleDot className="w-5 h-5 text-cyan-400"/>} items={[
      ['Matches', stats.matches], ['Bowling Innings', stats.bowling_innings], ['Overs', fmt(stats.balls_bowled / 6, 1)], ['Maidens', stats.maidens], ['Runs Conceded', stats.runs_conceded], ['Wickets', stats.wickets], ['Economy', fmt(derived.economy)], ['Average', fmt(derived.bowlingAverage)], ['Best Bowling', derived.bestBowling], ['3 Wickets', stats.three_wickets], ['5 Wickets', stats.five_wickets]
    ]} />}
    {tab === 'fielding' && <StatPanel title="Career Fielding" icon={<ShieldCheck className="w-5 h-5 text-amber-400"/>} items={[['Catches', stats.catches], ['Stumpings', stats.stumpings], ['Player of the Match', stats.man_of_matches]]} />}
    {tab === 'matches' && <EmptyState icon={<Activity className="w-6 h-6 text-lime-400"/>} title="Match history is ready for live match data" text="Once official matches are scored and completed, this profile will show the player's match-by-match batting, bowling, fielding and result history here." />}
    {tab === 'achievements' && <EmptyState icon={<Medal className="w-6 h-6 text-amber-400"/>} title="Achievements are automatic" text="Verified completed matches will unlock milestones such as First Fifty, Century, 5-Wicket Haul, 1,000 Runs and Player of the Match." />}
  </div>;
};

const Badge = ({ children }: { children: React.ReactNode }) => <span className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 capitalize">{children}</span>;

const Overview = ({ stats, derived, displayStats }: { stats: PlayerCareerStats; derived: { average: number; strikeRate: number; economy: number; bowlingAverage: number; bestBowling: string }; displayStats: [string, string | number][] }) => <>
  <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">{displayStats.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-700 bg-[#0b1428] p-4 shadow-xl"><div className="text-[9px] uppercase tracking-widest text-slate-500 font-black">{label}</div><div className="mt-1 text-xl sm:text-2xl font-black text-lime-400">{value}</div></div>)}</section>
  <div className="grid md:grid-cols-2 gap-4"><StatPanel title="Batting snapshot" icon={<Target className="w-5 h-5 text-lime-400"/>} items={[['Average', fmt(derived.average)], ['Strike Rate', fmt(derived.strikeRate)], ['Highest', `${stats.highest_score}${stats.highest_score_not_out ? '*' : ''}`], ['50s / 100s', `${stats.fifties} / ${stats.hundreds}`], ['4s / 6s', `${stats.fours} / ${stats.sixes}`], ['Ducks', stats.ducks]]}/><StatPanel title="Bowling snapshot" icon={<BarChart3 className="w-5 h-5 text-cyan-400"/>} items={[['Wickets', stats.wickets], ['Economy', fmt(derived.economy)], ['Average', fmt(derived.bowlingAverage)], ['Best', derived.bestBowling], ['3W / 5W', `${stats.three_wickets} / ${stats.five_wickets}`], ['Maidens', stats.maidens]]}/></div>
  <section className="rounded-2xl border border-slate-700 bg-[#0b1428] p-5 shadow-xl"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><Award className="w-4 h-4 text-lime-400"/> Career milestones</div><div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"><Milestone icon="🏏" value={stats.runs >= 1000 ? '1K+' : `${stats.runs}`} label="Career Runs"/><Milestone icon="🎯" value={stats.wickets >= 100 ? '100+' : `${stats.wickets}`} label="Career Wickets"/><Milestone icon="💯" value={stats.hundreds} label="Centuries"/><Milestone icon="🏆" value={stats.man_of_matches} label="MOM Awards"/></div></section>
</>;

const StatPanel = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: [string, string | number][] }) => <section className="rounded-2xl border border-slate-700 bg-[#0b1428] p-5 shadow-xl"><h2 className="flex items-center gap-2 text-sm font-black text-white">{icon}{title}</h2><div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">{items.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-900/60 border border-slate-800 px-3.5 py-3"><span className="text-xs text-slate-400">{label}</span><span className="text-sm font-black text-white">{value}</span></div>)}</div></section>;

const Milestone = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3"><div className="text-lg">{icon}</div><div className="mt-1 text-lg font-black text-white">{value}</div><div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{label}</div></div>;

const EmptyState = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => <section className="rounded-2xl border border-slate-700 bg-[#0b1428] p-8 text-center shadow-xl"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-700">{icon}</div><h2 className="mt-4 text-lg font-black text-white">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{text}</p></section>;
