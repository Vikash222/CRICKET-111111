import React, { useState } from 'react';
import { Search, X, User, Shield, Building2, Trophy, ChevronRight } from 'lucide-react';
import { db } from '../services/db';

interface SearchModalProps {
  onClose: () => void;
  onSelectPlayer: (id: string) => void;
  onSelectMatch: (id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  onClose,
  onSelectPlayer,
  onSelectMatch,
}) => {
  const [query, setQuery] = useState('');
  const profiles = db.getProfiles();
  const colleges = db.getColleges();
  const teams = db.getTeams();
  const matches = db.getMatches();

  const filteredPlayers = profiles.filter((p) =>
    p.full_name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.short_code.toLowerCase().includes(query.toLowerCase())
  );
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 shadow-2xl text-white space-y-4">
        <div className="flex items-center gap-3 bg-slate-800 border border-slate-700/80 px-3.5 py-2.5 rounded-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search players, teams, colleges, matches..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm text-white flex-1 outline-none placeholder:text-slate-500 font-medium"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-80 overflow-y-auto pr-1 text-xs">
          {/* Players */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-lime-400" /> Players ({filteredPlayers.length})
            </h4>
            <div className="space-y-1">
              {filteredPlayers.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPlayer(p.id);
                    onClose();
                  }}
                  className="p-2.5 bg-slate-800/60 hover:bg-slate-800 rounded-xl cursor-pointer flex items-center justify-between transition-colors border border-slate-700/50"
                >
                  <div className="font-bold text-slate-200">{p.full_name}</div>
                  <div className="text-lime-400 text-[11px] font-medium">{p.college_name || 'College Player'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Colleges */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Colleges ({filteredColleges.length})
            </h4>
            <div className="space-y-1">
              {filteredColleges.map((c) => (
                <div key={c.id} className="p-2.5 bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-700/50">
                  <div className="font-bold text-slate-200">{c.name} ({c.short_code})</div>
                  <div className="text-slate-400 text-[11px]">{c.city}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
