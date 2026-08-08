import React, { useState } from 'react';
import {
  Radio,
  Share2,
  Trophy,
  Users,
  MessageSquare,
  BarChart2,
  Calendar,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { db } from '../../services/db';

interface MatchDetailViewProps {
  matchId?: string;
  onShareMatch: () => void;
}

export const MatchDetailView: React.FC<MatchDetailViewProps> = ({
  matchId = 'match-live-1',
  onShareMatch,
}) => {
  const match = db.getMatch(matchId);
  const [activeTab, setActiveTab] = useState<'live' | 'scorecard' | 'commentary' | 'squads' | 'stats'>('live');

  if (!match) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Match not found.</p>
      </div>
    );
  }

  const isFirstInnings = match.current_innings_number === 1;
  const currentInnings = isFirstInnings ? match.first_innings : match.second_innings;
  const firstInnings = match.first_innings;
  const secondInnings = match.second_innings;

  // Chart data for Worm graph comparison
  const chartData = Array.from({ length: 20 }, (_, i) => {
    const overNum = i + 1;
    // Calculate simulated cumulative runs for both innings
    const inn1Runs = firstInnings ? Math.min(firstInnings.total_runs, Math.round(overNum * 8.65)) : 0;
    const inn2Runs = secondInnings && overNum <= Math.ceil(secondInnings.total_overs)
      ? Math.min(secondInnings.total_runs, Math.round(overNum * 8.6))
      : null;

    return {
      over: `Over ${overNum}`,
      [match.team_b_name]: inn1Runs,
      [match.team_a_name]: inn2Runs,
    };
  });

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
      {/* Match Header Card */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Live Indicator & Share Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            {match.status === 'live' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-red-600 text-white tracking-widest uppercase">
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-lime-500/20 text-lime-400 border border-lime-500/30 uppercase tracking-widest">
                <CheckCircle className="w-3.5 h-3.5" />
                COMPLETED
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
              {match.tournament_name || 'College Match'}
            </span>
          </div>

          <button
            onClick={onShareMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-lime-400" />
            <span>Share</span>
          </button>
        </div>

        {/* Teams & Score Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Team A (DTU) */}
          <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-3">
              <img
                src={match.team_a_logo || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=120'}
                alt={match.team_a_name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-lime-500/40"
              />
              <div>
                <h2 className="font-extrabold text-base text-white">{match.team_a_name}</h2>
                <span className="text-[11px] text-slate-400 font-medium">Chasing Target</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black font-mono text-lime-400">
                {secondInnings ? `${secondInnings.total_runs}/${secondInnings.total_wickets}` : 'Yet to Bat'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {secondInnings ? `(${secondInnings.total_overs} Ov)` : ''}
              </div>
            </div>
          </div>

          {/* Team B (IIT Bombay) */}
          <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center gap-3">
              <img
                src={match.team_b_logo || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=120'}
                alt={match.team_b_name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-cyan-500/40"
              />
              <div>
                <h2 className="font-extrabold text-base text-white">{match.team_b_name}</h2>
                <span className="text-[11px] text-slate-400 font-medium">1st Innings</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black font-mono text-cyan-400">
                {firstInnings ? `${firstInnings.total_runs}/${firstInnings.total_wickets}` : '0/0'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {firstInnings ? `(${firstInnings.total_overs} Ov)` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Result / Target Info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-lime-400 font-bold bg-lime-500/10 border border-lime-500/30 px-3 py-1 rounded-lg font-mono">
            {match.result_summary || `Target: 174 | DTU Gladiators need 32 runs off 21 balls`}
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> {match.venue}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto text-xs font-bold text-slate-400 gap-1 pb-1">
        {[
          { id: 'live', label: 'LIVE MATCH', icon: Radio },
          { id: 'scorecard', label: 'SCORECARD', icon: Trophy },
          { id: 'commentary', label: 'COMMENTARY', icon: MessageSquare },
          { id: 'squads', label: 'SQUADS XI', icon: Users },
          { id: 'stats', label: 'ANALYTICS', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0 ${
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

      {/* TAB CONTENT: LIVE */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Active Batters & Bowler Summary */}
          {currentInnings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-white shadow-xl">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-800 pb-2">
                  At The Crease
                </h4>
                <div className="space-y-2">
                  {Object.values(currentInnings.batters)
                    .filter((b) => !b.is_out)
                    .map((b) => (
                      <div
                        key={b.player_id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60"
                      >
                        <div className="font-bold text-sm text-slate-100">{b.player_name}</div>
                        <div className="font-mono text-sm font-bold text-lime-400">
                          {b.runs} <span className="text-xs text-slate-400">({b.balls}b)</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-white shadow-xl">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-800 pb-2">
                  Current Bowler
                </h4>
                {currentInnings.bowlers[currentInnings.current_bowler_id] && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
                    <div>
                      <div className="font-bold text-sm text-slate-100">
                        {currentInnings.bowlers[currentInnings.current_bowler_id].player_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Overs: {currentInnings.bowlers[currentInnings.current_bowler_id].overs}
                      </div>
                    </div>
                    <div className="text-right font-mono text-sm font-bold text-cyan-400">
                      {currentInnings.bowlers[currentInnings.current_bowler_id].wickets} /{' '}
                      {currentInnings.bowlers[currentInnings.current_bowler_id].runs_conceded}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Last 6 Balls Ticker */}
          {currentInnings && (
            <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-white shadow-xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Recent Over Ticker
              </h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {currentInnings.deliveries.slice(-8).map((del) => (
                  <div
                    key={del.id}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-md ${
                      del.is_wicket
                        ? 'bg-red-600 text-white font-black ring-2 ring-red-400'
                        : del.runs_bat === 6
                        ? 'bg-cyan-500 text-slate-900 font-black ring-2 ring-cyan-300'
                        : del.runs_bat === 4
                        ? 'bg-lime-500 text-slate-900 font-black ring-2 ring-lime-400'
                        : del.extra_type !== 'none'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {del.is_wicket ? 'W' : del.total_runs}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SCORECARD */}
      {activeTab === 'scorecard' && (
        <div className="space-y-4">
          {[firstInnings, secondInnings].filter(Boolean).map((inn, idx) => (
            <div key={inn!.id} className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 text-white space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm text-lime-400">
                  {inn!.batting_team_name} Innings Scorecard
                </h3>
                <span className="font-mono text-sm font-bold text-white">
                  {inn!.total_runs}/{inn!.total_wickets} ({inn!.total_overs} Ov)
                </span>
              </div>

              {/* Batting Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-widest">
                      <th className="py-2.5">Batter</th>
                      <th className="py-2.5">Dismissal</th>
                      <th className="py-2.5 text-right">R</th>
                      <th className="py-2.5 text-right">B</th>
                      <th className="py-2.5 text-right">4s</th>
                      <th className="py-2.5 text-right">6s</th>
                      <th className="py-2.5 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(inn!.batters).map((b) => (
                      <tr key={b.player_id} className="border-b border-slate-800/50 text-slate-200">
                        <td className="py-2.5 font-bold text-white">{b.player_name}</td>
                        <td className="py-2.5 text-slate-400 italic text-[11px]">
                          {b.is_out ? b.dismissal_info || 'out' : 'not out'}
                        </td>
                        <td className="py-2.5 text-right font-bold text-lime-400 font-mono">{b.runs}</td>
                        <td className="py-2.5 text-right font-mono">{b.balls}</td>
                        <td className="py-2.5 text-right font-mono">{b.fours}</td>
                        <td className="py-2.5 text-right font-mono">{b.sixes}</td>
                        <td className="py-2.5 text-right font-mono">{b.strike_rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: COMMENTARY */}
      {activeTab === 'commentary' && currentInnings && (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 text-white space-y-3 shadow-2xl">
          <h3 className="font-bold text-[10px] uppercase text-slate-400 tracking-widest">
            Ball-by-Ball Live Commentary
          </h3>
          <div className="space-y-2">
            {[...currentInnings.deliveries].reverse().map((del) => (
              <div key={del.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                <p className="text-slate-200 leading-relaxed">{del.commentary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ANALYTICS / CHARTS */}
      {activeTab === 'stats' && (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 text-white space-y-4 shadow-2xl">
          <h3 className="font-bold text-[10px] uppercase text-slate-400 tracking-widest">
            Run Rate Worm Comparison Chart
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="over" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Line type="monotone" dataKey={match.team_b_name} stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={match.team_a_name} stroke="#84cc16" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
