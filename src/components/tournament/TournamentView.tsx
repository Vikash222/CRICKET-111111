import React from 'react';
import { Trophy, Calendar, ListOrdered, Flame } from 'lucide-react';
import { db } from '../../services/db';

interface TournamentViewProps {
  onSelectMatch: (matchId: string) => void;
}

export const TournamentView: React.FC<TournamentViewProps> = () => {
  const tournaments = db.getTournaments();
  const selectedTour = tournaments[0];
  const pointsTable = selectedTour ? db.getPointsTable(selectedTour.id) : [];

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-white">
      {selectedTour ? (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-lime-400" />
            <div>
              <h2 className="text-xl font-black">{selectedTour.name}</h2>
              <p className="text-xs text-slate-400 mt-1">{selectedTour.venue || 'Venue not set'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-8 shadow-2xl text-center">
          <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h2 className="font-bold text-white">No tournaments yet</h2>
          <p className="text-xs text-slate-500 mt-1">Real tournaments created by organizers will appear here.</p>
        </div>
      )}

      {selectedTour && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5">
            <ListOrdered className="w-5 h-5 text-lime-400 mb-2" />
            <div className="text-xs font-bold">Points Table</div>
            <div className="text-[10px] text-slate-500 mt-1">{pointsTable.length} teams</div>
          </div>
          <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5">
            <Calendar className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-xs font-bold">Fixtures & Results</div>
            <div className="text-[10px] text-slate-500 mt-1">Generated from real matches</div>
          </div>
          <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5">
            <Flame className="w-5 h-5 text-orange-400 mb-2" />
            <div className="text-xs font-bold">Leaderboards</div>
            <div className="text-[10px] text-slate-500 mt-1">Generated from verified stats</div>
          </div>
        </div>
      )}
    </div>
  );
};
