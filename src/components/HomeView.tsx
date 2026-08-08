import React from 'react';
import { ArrowRight, Building2, ChevronRight, CircleDot, Medal, Radio, Search, Trophy, Users, Zap } from 'lucide-react';
import { db } from '../services/db';

interface HomeViewProps {
  onSelectMatch: (matchId: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onNavigateToScorer: () => void;
}

const StatTile = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
    <div className="text-2xl font-black tracking-tight text-slate-950">{value}</div>
    <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
  </div>
);

export const HomeView: React.FC<HomeViewProps> = ({ onSelectMatch, onSelectPlayer, onNavigateToScorer }) => {
  const matches = db.getMatches();
  const liveMatches = matches.filter((match) => match.status === 'live');
  const upcomingMatches = matches.filter((match) => match.status === 'scheduled').slice(0, 4);
  const colleges = db.getColleges();
  const players = db.getProfiles().filter((profile) => profile.role === 'player').slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f5f7f4] pb-28">
      <section className="mx-auto max-w-6xl px-4 pb-5 pt-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] bg-[#082b22] text-white shadow-xl">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime-300/10 blur-2xl" />
            <div className="absolute bottom-0 right-16 h-24 w-24 rounded-full bg-emerald-400/10 blur-xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-200">
                  <CircleDot className="h-3.5 w-3.5 text-lime-300" /> College cricket network
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Every run. Every wicket. Your cricket story.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/75 sm:text-base">Follow live college matches, discover players, manage tournaments and build verified career statistics from real scorecards.</p>
              </div>
              <button onClick={onNavigateToScorer} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-lime-300 px-5 py-3 text-sm font-black text-[#12352b] shadow-lg shadow-lime-950/20 transition hover:bg-lime-200">
                <Zap className="h-4 w-4" /> Scorer Desk <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-white/10 bg-white/[0.04]">
            <div className="px-4 py-4"><div className="text-xl font-black">{matches.length}</div><div className="text-[9px] font-bold uppercase tracking-widest text-emerald-200/60">Matches</div></div>
            <div className="border-x border-white/10 px-4 py-4"><div className="text-xl font-black">{colleges.length}</div><div className="text-[9px] font-bold uppercase tracking-widest text-emerald-200/60">Colleges</div></div>
            <div className="px-4 py-4"><div className="text-xl font-black">{db.getProfiles().filter((p) => p.role === 'player').length}</div><div className="text-[9px] font-bold uppercase tracking-widest text-emerald-200/60">Players</div></div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-7 px-4 sm:px-6 lg:px-8">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile icon={<Radio className="h-4 w-4 text-red-600" />} label="Live now" value={liveMatches.length} tone="bg-red-50" />
          <StatTile icon={<Trophy className="h-4 w-4 text-amber-600" />} label="Tournaments" value={db.getTournaments().length} tone="bg-amber-50" />
          <StatTile icon={<Building2 className="h-4 w-4 text-emerald-600" />} label="Colleges" value={colleges.length} tone="bg-emerald-50" />
          <StatTile icon={<Users className="h-4 w-4 text-blue-600" />} label="Players" value={players.length} tone="bg-blue-50" />
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Match centre</p><h2 className="text-xl font-black text-slate-950">Live right now</h2></div>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-600">● LIVE</span>
          </div>
          {liveMatches.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {liveMatches.slice(0, 6).map((match) => (
                <button key={match.id} onClick={() => onSelectMatch(match.id)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                  <div className="flex items-center justify-between"><span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-black uppercase text-red-600">Live</span><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" /></div>
                  <div className="mt-4 text-sm font-black text-slate-950">{match.team_a_name} <span className="mx-1 font-normal text-slate-300">vs</span> {match.team_b_name}</div>
                  <div className="mt-2 text-xs text-slate-400">{match.venue || 'Venue not set'} · {match.format || 'Cricket'}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><Radio className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-bold text-slate-700">No live matches</p><p className="mt-1 text-xs text-slate-400">When a scorer starts an official match, its live room will appear here.</p></div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Next up</p><h2 className="text-xl font-black text-slate-950">Upcoming matches</h2></div></div>
            <div className="space-y-2">
              {upcomingMatches.length ? upcomingMatches.map((match) => <button key={match.id} onClick={() => onSelectMatch(match.id)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200"><div><div className="text-sm font-black text-slate-900">{match.team_a_name} <span className="mx-1 text-slate-300">vs</span> {match.team_b_name}</div><div className="mt-1 text-[11px] text-slate-400">{match.venue || 'Venue not set'} · {match.format || 'Match'}</div></div><ChevronRight className="h-4 w-4 text-slate-300" /></button>) : <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400">No scheduled matches yet.</div>}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Discover</p><h2 className="text-xl font-black text-slate-950">Players</h2></div><Search className="h-4 w-4 text-slate-300" /></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {players.length ? players.map((player) => <button key={player.id} onClick={() => onSelectPlayer(player.id)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-700">{(player.full_name || 'P').charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-black text-slate-900">{player.full_name}</div><div className="truncate text-[10px] text-slate-400">{player.email}</div></div><Medal className="h-4 w-4 text-slate-300" /></button>) : <div className="p-5 text-xs text-slate-400">Players will appear after profiles are created.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
