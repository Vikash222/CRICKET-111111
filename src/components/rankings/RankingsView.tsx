import React from 'react';
import { Trophy, Shield, Target } from 'lucide-react';

export const RankingsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">College Player Rankings</h2>
            <p className="text-xs text-slate-400">
              Rankings will appear automatically from verified completed match data.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-8 shadow-2xl text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-slate-500" />
        </div>
        <h3 className="text-base font-bold text-white">No rankings yet</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          No verified match statistics are available yet. Create and complete real matches to generate player rankings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-[10px] font-bold uppercase text-lime-400 mb-2 tracking-widest flex items-center gap-1.5">
            <Target className="w-4 h-4" /> Top College Batsmen
          </h3>
          <p className="text-xs text-slate-500">No verified batting statistics yet.</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-[10px] font-bold uppercase text-cyan-400 mb-2 tracking-widest flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Top College Bowlers
          </h3>
          <p className="text-xs text-slate-500">No verified bowling statistics yet.</p>
        </div>
      </div>
    </div>
  );
};
