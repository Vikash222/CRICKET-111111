import React from 'react';
import {
  Radio,
  Trophy,
  ChevronRight,
  Flame,
  Award,
  Calendar,
  Building2,
  Users,
  Zap,
} from 'lucide-react';
import { db } from '../services/db';

interface HomeViewProps {
  onSelectMatch: (matchId: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onNavigateToScorer: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectMatch,
  onSelectPlayer,
  onNavigateToScorer,
}) => {
  const liveMatch = db.getMatch('match-live-1');
  const colleges = db.getColleges();
  const profiles = db.getProfiles().filter((p) => p.role === 'player');

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-5 pb-24 text-slate-200">
      {/* Welcome & Live Banner */}
      {liveMatch && (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-600 text-white tracking-widest uppercase">
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
              LIVE MATCH
            </span>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">Match #12 • AICCT 2026</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {liveMatch.team_a_name} <span className="text-lime-400">vs</span> {liveMatch.team_b_name}
              </h2>
              <div className="text-xs text-slate-300 mt-1">
                Target: <span className="font-bold text-lime-400 font-mono">174 Runs</span> | DTU Gladiators <span className="font-bold text-white font-mono">142/3</span> (16.3 Overs)
              </div>
            </div>

            <button
              onClick={() => onSelectMatch(liveMatch.id)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-900 font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-lime-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Watch Live Center</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={onNavigateToScorer}
          className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/80 hover:border-lime-500/50 text-left transition-all group shadow-xl"
        >
          <Zap className="w-6 h-6 text-lime-400 mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-xs text-white">Scorer Desk</div>
          <div className="text-[10px] text-slate-400">1-Tap Live Ball Scoring</div>
        </button>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/80 text-left shadow-xl">
          <Trophy className="w-6 h-6 text-lime-400 mb-2" />
          <div className="font-bold text-xs text-white">Varsity Trophy</div>
          <div className="text-[10px] text-slate-400">8 Colleges Competing</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/80 text-left col-span-2 sm:col-span-1 shadow-xl">
          <Building2 className="w-6 h-6 text-lime-400 mb-2" />
          <div className="font-bold text-xs text-white">4 Verified Colleges</div>
          <div className="text-[10px] text-slate-400">DTU, IIT Bombay, SSC, Anna</div>
        </div>
      </div>

      {/* Featured Top Players */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-lime-400" /> Top College Performers
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profiles.slice(0, 4).map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectPlayer(p.id)}
              className="p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 cursor-pointer flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={p.full_name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-lime-500/40"
                />
                <div>
                  <div className="font-bold text-xs text-white">{p.full_name}</div>
                  <div className="text-[11px] text-slate-400">{p.college_name || 'College Player'}</div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-1 rounded bg-lime-500/20 text-lime-400 font-mono border border-lime-500/30">
                #{p.jersey_number || 18}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
