import React from 'react';
import { BarChart2, Flame, Trophy, Award, Shield, Target } from 'lucide-react';

export const RankingsView: React.FC = () => {
  const batsmenRankings = [
    { rank: 1, name: 'Rahul Sharma', college: 'DTU Gladiators', runs: 840, avg: 42.0, sr: 148.5 },
    { rank: 2, name: 'Vikas Verma', college: 'IIT Bombay Panthers', runs: 760, avg: 38.0, sr: 152.1 },
    { rank: 3, name: 'Rohan Mehra', college: "Stephen's Strikers", runs: 680, avg: 35.5, sr: 139.8 },
    { rank: 4, name: 'Siddharth Roy', college: 'IIT Bombay Panthers', runs: 620, avg: 32.6, sr: 141.2 },
  ];

  const bowlerRankings = [
    { rank: 1, name: 'Aman Gupta', college: 'DTU Gladiators', wickets: 31, econ: 6.8, avg: 18.4 },
    { rank: 2, name: 'Vikas Verma', college: 'IIT Bombay Panthers', wickets: 28, econ: 7.2, avg: 19.8 },
    { rank: 3, name: 'Prakash Nair', college: 'Anna Super Kings', wickets: 24, econ: 7.5, avg: 21.2 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">College Player Rankings 2026</h2>
            <p className="text-xs text-slate-400">
              Official player rankings derived dynamically from verified match data.
            </p>
          </div>
        </div>
      </div>

      {/* Batsmen Rankings */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-[10px] font-bold uppercase text-lime-400 mb-3 tracking-widest flex items-center gap-1.5">
          <Target className="w-4 h-4 text-lime-400" /> Top College Batsmen
        </h3>

        <div className="space-y-2">
          {batsmenRankings.map((b) => (
            <div key={b.rank} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-lime-500/20 border border-lime-500/40 font-mono font-black text-lime-400 text-center flex items-center justify-center text-xs">
                  #{b.rank}
                </span>
                <div>
                  <div className="font-bold text-white text-sm">{b.name}</div>
                  <div className="text-[11px] text-slate-400">{b.college}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-lime-400 text-sm">{b.runs} runs</div>
                <div className="text-[10px] text-slate-400">Avg: {b.avg} | SR: {b.sr}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bowlers Rankings */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-[10px] font-bold uppercase text-cyan-400 mb-3 tracking-widest flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-cyan-400" /> Top College Bowlers
        </h3>

        <div className="space-y-2">
          {bowlerRankings.map((b) => (
            <div key={b.rank} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 font-mono font-black text-cyan-400 text-center flex items-center justify-center text-xs">
                  #{b.rank}
                </span>
                <div>
                  <div className="font-bold text-white text-sm">{b.name}</div>
                  <div className="text-[11px] text-slate-400">{b.college}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-cyan-400 text-sm">{b.wickets} wkts</div>
                <div className="text-[10px] text-slate-400">Econ: {b.econ} | Avg: {b.avg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
