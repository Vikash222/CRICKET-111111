import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  ListOrdered,
  Flame,
  Award,
  Users,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { db } from '../../services/db';

interface TournamentViewProps {
  onSelectMatch: (matchId: string) => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({ onSelectMatch }) => {
  const tournaments = db.getTournaments();
  const selectedTour = tournaments[0];
  const pointsTable = db.getPointsTable(selectedTour?.id || 'tour-1');
  const [activeTab, setActiveTab] = useState<'fixtures' | 'table' | 'leaderboards'>('table');

  const leaderboards = {
    topScorers: [
      { name: 'Rahul Sharma', team: 'DTU Gladiators', runs: 284, avg: 71.0, sr: 162.2, fifties: 3 },
      { name: 'Vikas Verma', team: 'IIT Bombay Panthers', runs: 242, avg: 60.5, sr: 158.0, fifties: 2 },
      { name: 'Siddharth Roy', team: 'IIT Bombay Panthers', runs: 198, avg: 49.5, sr: 141.2, fifties: 1 },
    ],
    topWicketTakers: [
      { name: 'Aman Gupta', team: 'DTU Gladiators', wickets: 12, econ: 5.8, best: '4/16' },
      { name: 'Vikas Verma', team: 'IIT Bombay Panthers', wickets: 10, econ: 6.4, best: '3/22' },
      { name: 'Rohan Mehra', team: "Stephen's Strikers", wickets: 8, econ: 7.1, best: '3/18' },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-white">
      {/* Tournament Header */}
      {selectedTour && (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src={selectedTour.logo_url || 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=120'}
              alt={selectedTour.name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-lime-500/40 shadow-lg"
            />
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-lime-500/20 text-lime-400 border border-lime-500/30 px-2.5 py-0.5 rounded-full">
                {selectedTour.tournament_type.replace('_', ' ').toUpperCase()} • {selectedTour.overs_per_match} OVERS
              </span>
              <h2 className="text-xl font-black text-white">{selectedTour.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> {selectedTour.start_date} to {selectedTour.end_date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {selectedTour.venue}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 text-xs font-bold text-slate-400 gap-1 pb-1">
        {[
          { id: 'table', label: 'POINTS TABLE', icon: ListOrdered },
          { id: 'fixtures', label: 'FIXTURES & RESULTS', icon: Calendar },
          { id: 'leaderboards', label: 'LEADERBOARDS', icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-lime-500/20 text-lime-400 font-black border border-lime-500/30'
                  : 'hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: POINTS TABLE */}
      {activeTab === 'table' && (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-widest font-bold">
                <th className="py-2.5">POS</th>
                <th className="py-2.5">COLLEGE TEAM</th>
                <th className="py-2.5 text-center">P</th>
                <th className="py-2.5 text-center">W</th>
                <th className="py-2.5 text-center">L</th>
                <th className="py-2.5 text-center">PTS</th>
                <th className="py-2.5 text-right">NRR</th>
              </tr>
            </thead>
            <tbody>
              {pointsTable
                .sort((a, b) => b.points - a.points || b.net_run_rate - a.net_run_rate)
                .map((pt, index) => (
                  <tr
                    key={pt.id}
                    className={`border-b border-slate-800/60 font-medium ${
                      index === 0 ? 'bg-lime-500/10 text-lime-300 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <td className="py-3 font-mono text-center font-bold">{index + 1}</td>
                    <td className="py-3 font-bold flex items-center gap-2">
                      <span>{pt.team_name}</span>
                    </td>
                    <td className="py-3 text-center font-mono">{pt.played}</td>
                    <td className="py-3 text-center font-mono text-lime-400">{pt.won}</td>
                    <td className="py-3 text-center font-mono text-red-400">{pt.lost}</td>
                    <td className="py-3 text-center font-mono font-black text-lime-400 text-sm">{pt.points}</td>
                    <td className="py-3 text-right font-mono text-cyan-400 font-bold">
                      {pt.net_run_rate > 0 ? `+${pt.net_run_rate.toFixed(3)}` : pt.net_run_rate.toFixed(3)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: FIXTURES */}
      {activeTab === 'fixtures' && (
        <div className="space-y-3">
          <div
            onClick={() => onSelectMatch('match-live-1')}
            className="bg-[#0F172A] border border-lime-500/40 rounded-2xl p-5 shadow-2xl cursor-pointer hover:border-lime-400 transition-all"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" /> LIVE NOW • MATCH 12
              </span>
              <span className="text-slate-400">DTU Main Grounds</span>
            </div>

            <div className="flex items-center justify-between font-bold text-sm">
              <span>DTU Gladiators vs IIT Bombay Panthers</span>
              <ChevronRight className="w-4 h-4 text-lime-400" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARDS */}
      {activeTab === 'leaderboards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Runs / Orange Cap */}
          <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase text-lime-400 mb-3 tracking-widest flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-lime-400" /> Top Run Scorers (Orange Cap)
            </h3>
            <div className="space-y-2">
              {leaderboards.topScorers.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl text-xs">
                  <div>
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.team}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-lime-400 text-sm">
                    {s.runs} <span className="text-[10px] text-slate-400">runs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Wickets / Purple Cap */}
          <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase text-cyan-400 mb-3 tracking-widest flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-cyan-400" /> Top Wicket Takers (Purple Cap)
            </h3>
            <div className="space-y-2">
              {leaderboards.topWicketTakers.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl text-xs">
                  <div>
                    <div className="font-bold text-white">{w.name}</div>
                    <div className="text-[11px] text-slate-400">{w.team}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-cyan-400 text-sm">
                    {w.wickets} <span className="text-[10px] text-slate-400">wkts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
