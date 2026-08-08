import React from 'react';
import { Radio, Trophy, Building2, Users, Zap } from 'lucide-react';
import { db } from '../services/db';

interface HomeViewProps {
  onSelectMatch: (matchId: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onNavigateToScorer: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateToScorer }) => {
  const liveMatches = db.getMatches().filter((match) => match.status === 'live');
  const colleges = db.getColleges();
  const profiles = db.getProfiles().filter((profile) => profile.role === 'player');

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-5 pb-24 text-slate-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">CollegeCricket.live</h1>
            <p className="text-xs text-slate-400">College cricket scoring & player platform</p>
          </div>
        </div>
        <p className="text-sm text-slate-400">Your cricket data will appear here after real matches, teams and players are created.</p>
      </div>

      {liveMatches.length > 0 ? (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-lime-400 flex items-center gap-1.5 mb-3">
            <Radio className="w-4 h-4" /> Live Matches
          </h2>
          <div className="space-y-2">
            {liveMatches.slice(0, 8).map((match) => (
              <div key={match.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="font-bold text-white text-sm">{match.team_a_name} vs {match.team_b_name}</div>
                <div className="text-xs text-slate-400 mt-1">{match.venue || 'Venue not set'}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-7 shadow-2xl text-center">
          <Radio className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h2 className="font-bold text-white">No live matches</h2>
          <p className="text-xs text-slate-500 mt-1">Live matches will appear here when an organizer starts a real match room.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button onClick={onNavigateToScorer} className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/80 text-left shadow-xl hover:border-lime-500/40 transition-all">
          <Zap className="w-6 h-6 text-lime-400 mb-2" />
          <div className="font-bold text-xs text-white">Scorer Desk</div>
          <div className="text-[10px] text-slate-400">Start scoring a selected match</div>
        </button>
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/80 shadow-xl">
          <Building2 className="w-6 h-6 text-emerald-400 mb-2" />
          <div className="font-bold text-xs text-white">Colleges</div>
          <div className="text-[10px] text-slate-400">{colleges.length} registered</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/80 shadow-xl">
          <Users className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="font-bold text-xs text-white">Players</div>
          <div className="text-[10px] text-slate-400">{profiles.length} registered</div>
        </div>
      </div>
    </div>
  );
};
