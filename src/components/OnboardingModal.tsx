import React, { useState } from 'react';
import { User, Check, X, Shield, Trophy } from 'lucide-react';
import { db } from '../services/db';
import { BattingStyle, BowlingStyle, PlayerRole, UserRole } from '../types/cricket';

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const currentUser = db.getCurrentUser();

  const [fullName, setFullName] = useState(currentUser.full_name || 'Rahul Sharma');
  const [role, setRole] = useState<UserRole>(currentUser.role || 'player');
  const [jerseyNum, setJerseyNum] = useState<number>(currentUser.jersey_number || 18);
  const [playingRole, setPlayingRole] = useState<PlayerRole>(currentUser.playing_role || 'batsman');
  const [battingStyle, setBattingStyle] = useState<BattingStyle>(currentUser.batting_style || 'right_hand');
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle>(currentUser.bowling_style || 'right_arm_medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateUserProfile({
      full_name: fullName,
      role,
      jersey_number: jerseyNum,
      playing_role: playingRole,
      batting_style: battingStyle,
      bowling_style: bowlingStyle,
      is_verified: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#0F172A] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-lime-400" />
            <h3 className="font-bold text-base text-white">Player & Role Profile Onboarding</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold">Full Name:</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-300 font-semibold">Platform Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 font-medium"
              >
                <option value="player">Player</option>
                <option value="scorer">Official Scorer</option>
                <option value="team_manager">Team Manager</option>
                <option value="tournament_organizer">Tournament Organizer</option>
                <option value="college_admin">College Admin</option>
                <option value="spectator">Spectator</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold">Jersey #:</label>
              <input
                type="number"
                value={jerseyNum}
                onChange={(e) => setJerseyNum(Number(e.target.value))}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-300 font-semibold">Playing Role:</label>
              <select
                value={playingRole}
                onChange={(e) => setPlayingRole(e.target.value as PlayerRole)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 font-medium"
              >
                <option value="batsman">Batsman</option>
                <option value="bowler">Bowler</option>
                <option value="all_rounder">All Rounder</option>
                <option value="wicket_keeper">Wicket Keeper</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold">Batting Style:</label>
              <select
                value={battingStyle}
                onChange={(e) => setBattingStyle(e.target.value as BattingStyle)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500 font-medium"
              >
                <option value="right_hand">Right Hand Bat</option>
                <option value="left_hand">Left Hand Bat</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-slate-900 font-black rounded-xl shadow-lg shadow-lime-500/20 transition-all text-sm"
        >
          Save & Update Profile
        </button>
      </form>
    </div>
  );
};
