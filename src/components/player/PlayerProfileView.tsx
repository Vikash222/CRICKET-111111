import React from 'react';
import {
  UserCheck,
  Award,
  Flame,
  Target,
  BarChart2,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { db } from '../../services/db';

interface PlayerProfileViewProps {
  playerId?: string;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  playerId = 'p-1',
}) => {
  const profile = db.getProfiles().find((p) => p.id === playerId) || db.getCurrentUser();

  // Mock auto-calculated statistics
  const stats = {
    matches: 25,
    innings: 24,
    notOuts: 4,
    runs: 840,
    highestScore: '104*',
    average: 42.0,
    strikeRate: 148.5,
    fours: 82,
    sixes: 34,
    fifties: 6,
    hundreds: 1,
    wickets: 31,
    bowlingAvg: 18.4,
    economy: 6.8,
    bestBowling: '5/18',
    catches: 14,
    manOfMatches: 5,
  };

  const achievements = [
    { title: 'First Fifty', icon: '🏏', desc: 'Scored 50+ runs vs IIT Bombay Panthers' },
    { title: 'Century Club', icon: '💯', desc: 'Scored 104* vs St. Stephen Strikers' },
    { title: '5-Wicket Haul', icon: '🔥', desc: 'Took 5/18 in AICCT Semi-Final' },
    { title: 'Player of Match', icon: '🏆', desc: 'Awarded MoM 5 times in 2026 Season' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
      {/* Player Header Banner */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={profile.full_name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-lime-500/40 shadow-xl"
            />
            <span className="absolute -bottom-2 -right-2 bg-lime-500 text-slate-900 font-black text-xs px-2 py-0.5 rounded-full border-2 border-slate-900 shadow">
              #{profile.jersey_number || 18}
            </span>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-white">{profile.full_name}</h2>
              {profile.is_verified && (
                <CheckCircle className="w-5 h-5 text-lime-400" title="Verified Player Profile" />
              )}
            </div>

            <p className="text-xs text-lime-400 font-bold">
              {profile.college_name || 'Delhi Technological University'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold uppercase">
                {profile.playing_role || 'Batsman'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {profile.batting_style?.replace('_', ' ') || 'Right Hand Bat'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {profile.bowling_style?.replace('_', ' ') || 'Right Arm Medium'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Matches</div>
          <div className="text-2xl font-black font-mono text-lime-400">{stats.matches}</div>
          <div className="text-[10px] text-slate-500">{stats.innings} Innings</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Runs</div>
          <div className="text-2xl font-black font-mono text-lime-400">{stats.runs}</div>
          <div className="text-[10px] text-slate-500">Highest: {stats.highestScore}</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Batting Average</div>
          <div className="text-2xl font-black font-mono text-cyan-400">{stats.average}</div>
          <div className="text-[10px] text-slate-500">SR: {stats.strikeRate}</div>
        </div>

        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Wickets Taken</div>
          <div className="text-2xl font-black font-mono text-lime-400">{stats.wickets}</div>
          <div className="text-[10px] text-slate-500">Econ: {stats.economy}</div>
        </div>
      </div>

      {/* Detailed Batting & Bowling Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Batting Stats */}
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 border-b border-slate-800 pb-2 tracking-widest flex items-center gap-2">
            <Target className="w-4 h-4 text-lime-400" /> Career Batting Record
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">50s / 100s:</span>
              <span className="font-bold font-mono text-white">{stats.fifties} / {stats.hundreds}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Fours / Sixes:</span>
              <span className="font-bold font-mono text-white">{stats.fours} / {stats.sixes}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Not Outs:</span>
              <span className="font-bold font-mono text-white">{stats.notOuts}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Strike Rate:</span>
              <span className="font-bold font-mono text-lime-400">{stats.strikeRate}</span>
            </div>
          </div>
        </div>

        {/* Bowling Stats */}
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
          <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 border-b border-slate-800 pb-2 tracking-widest flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" /> Career Bowling Record
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Best Bowling:</span>
              <span className="font-bold font-mono text-white">{stats.bestBowling}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Bowling Avg:</span>
              <span className="font-bold font-mono text-white">{stats.bowlingAvg}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Economy:</span>
              <span className="font-bold font-mono text-cyan-400">{stats.economy}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Catches:</span>
              <span className="font-bold font-mono text-white">{stats.catches}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Achievements Section */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2">
          <Award className="w-4 h-4 text-lime-400" /> Earned Player Achievements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {achievements.map((ach, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
              <div className="text-2xl">{ach.icon}</div>
              <div>
                <div className="font-bold text-xs text-white">{ach.title}</div>
                <div className="text-[11px] text-slate-400">{ach.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
