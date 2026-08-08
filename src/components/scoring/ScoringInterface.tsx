import React, { useState } from 'react';
import {
  RotateCcw,
  Plus,
  X,
  Check,
  User,
  Shield,
  Zap,
  ArrowRightLeft,
  AlertTriangle,
  History,
} from 'lucide-react';
import { db } from '../../services/db';
import { ExtraType, WicketType } from '../../types/cricket';
import { ScoreInput } from '../../lib/scoring-engine';

interface ScoringInterfaceProps {
  matchId?: string;
  onViewLiveMatch: () => void;
}

export const ScoringInterface: React.FC<ScoringInterfaceProps> = ({
  matchId = 'match-live-1',
  onViewLiveMatch,
}) => {
  const match = db.getMatch(matchId);
  const isOnline = db.getNetworkStatus();

  // Modal states
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);

  // Custom Extras state
  const [selectedExtraType, setSelectedExtraType] = useState<ExtraType>('wide');
  const [extraRunsInput, setExtraRunsInput] = useState<number>(0);

  // Custom Wicket state
  const [selectedWicketType, setSelectedWicketType] = useState<WicketType>('caught');
  const [fielderNameInput, setFielderNameInput] = useState<string>('');
  const [newBatterNameInput, setNewBatterNameInput] = useState<string>('');

  if (!match) {
    return (
      <div className="p-8 text-center text-slate-400">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p>No active match selected for scoring.</p>
      </div>
    );
  }

  const isFirstInnings = match.current_innings_number === 1;
  const currentInnings = isFirstInnings ? match.first_innings : match.second_innings;

  if (!currentInnings) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Innings data not found for this match.</p>
      </div>
    );
  }

  const striker = currentInnings.batters[currentInnings.current_striker_id];
  const nonStriker = currentInnings.batters[currentInnings.current_non_striker_id];
  const bowler = currentInnings.bowlers[currentInnings.current_bowler_id];

  // Helper to submit delivery
  const handleScoreBall = (input: ScoreInput) => {
    db.recordDelivery(match.id, input);
  };

  // Quick 1-tap run scoring
  const handleQuickRun = (runs: number) => {
    handleScoreBall({
      runsBat: runs,
      extraType: 'none',
      isWicket: false,
    });
  };

  // Submit Extras
  const handleConfirmExtras = () => {
    handleScoreBall({
      runsBat: 0,
      extraType: selectedExtraType,
      runsExtra: extraRunsInput,
      isWicket: false,
    });
    setShowExtrasModal(false);
    setExtraRunsInput(0);
  };

  // Submit Wicket
  const handleConfirmWicket = () => {
    const newBatterId = newBatterNameInput ? `p-new-${Date.now()}` : undefined;
    handleScoreBall({
      runsBat: 0,
      extraType: 'none',
      isWicket: true,
      wicketType: selectedWicketType,
      dismissedPlayerId: currentInnings.current_striker_id,
      fielderName: fielderNameInput || undefined,
      newBatterId,
      newBatterName: newBatterNameInput || undefined,
    });
    setShowWicketModal(false);
    setFielderNameInput('');
    setNewBatterNameInput('');
  };

  // Swap Striker
  const handleSwapStriker = () => {
    if (currentInnings) {
      const temp = currentInnings.current_striker_id;
      currentInnings.current_striker_id = currentInnings.current_non_striker_id;
      currentInnings.current_non_striker_id = temp;
      db.updateMatchState(match.id, {
        [isFirstInnings ? 'first_innings' : 'second_innings']: currentInnings,
      });
    }
  };

  // Undo last ball
  const handleUndo = () => {
    db.undoDelivery(match.id);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
      {/* Top Banner Header */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-lime-500/20 text-lime-400 border border-lime-500/30 tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              OFFICIAL SCORER DESK
            </span>
            {!isOnline && (
              <span className="text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-semibold animate-pulse">
                Offline Mode (Local Storage)
              </span>
            )}
          </div>

          <button
            onClick={onViewLiveMatch}
            className="text-xs text-lime-400 hover:text-lime-300 font-semibold flex items-center gap-1 underline underline-offset-4"
          >
            View Live Match Center →
          </button>
        </div>

        {/* Live Match Main Score Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              {currentInnings.batting_team_name} ({isFirstInnings ? '1st Innings' : '2nd Innings'})
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                {currentInnings.total_runs}/{currentInnings.total_wickets}
              </span>
              <span className="text-lg text-lime-400 font-bold font-mono">
                ({currentInnings.total_overs} Overs)
              </span>
            </div>

            {currentInnings.target_runs && (
              <div className="mt-2 text-xs font-semibold text-lime-400 bg-lime-500/10 border border-lime-500/30 px-3 py-1 rounded-lg inline-block font-mono">
                Target: {currentInnings.target_runs} runs | Need{' '}
                <span className="font-bold text-white">
                  {Math.max(0, currentInnings.target_runs - currentInnings.total_runs)}
                </span>{' '}
                runs in{' '}
                <span className="font-bold text-white">
                  {Math.max(0, match.total_overs * 6 - currentInnings.legal_balls_bowled)}
                </span>{' '}
                balls
              </div>
            )}
          </div>

          {/* CRR & RRR Stats */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Current Run Rate</div>
              <div className="text-xl font-bold font-mono text-lime-400">
                {currentInnings.legal_balls_bowled > 0
                  ? (currentInnings.total_runs / (currentInnings.legal_balls_bowled / 6)).toFixed(2)
                  : '0.00'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Partnership</div>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {currentInnings.partnerships.current_runs} ({currentInnings.partnerships.current_balls}b)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batters & Bowlers Live Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Batters Card */}
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 shadow-xl text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-lime-400" /> Current Batters
            </h3>
            <button
              onClick={handleSwapStriker}
              className="text-xs text-slate-300 hover:text-lime-400 flex items-center gap-1 font-medium bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" /> Swap Striker
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Striker */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-lime-500/40 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-lime-400 flex items-center gap-1">
                  <span>{striker?.player_name || 'Striker'}</span>
                  <span className="text-lime-400 font-black text-xs">*</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  4s: {striker?.fours || 0} | 6s: {striker?.sixes || 0}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-base font-bold text-white">
                  {striker?.runs || 0} <span className="text-xs text-slate-400">({striker?.balls || 0}b)</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  SR: {striker?.strike_rate || 0}
                </div>
              </div>
            </div>

            {/* Non Striker */}
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-slate-200">
                  {nonStriker?.player_name || 'Non-Striker'}
                </div>
                <div className="text-[11px] text-slate-400">
                  4s: {nonStriker?.fours || 0} | 6s: {nonStriker?.sixes || 0}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-base font-medium text-slate-300">
                  {nonStriker?.runs || 0} <span className="text-xs text-slate-400">({nonStriker?.balls || 0}b)</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  SR: {nonStriker?.strike_rate || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bowler Card */}
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 shadow-xl text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Current Bowler
            </h3>
            <button
              onClick={() => setShowBowlerModal(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800 transition-colors"
            >
              Change Bowler
            </button>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-cyan-300">{bowler?.player_name || 'Bowler'}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Overs: {bowler?.overs || 0.0} | Maidens: {bowler?.maidens || 0}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-base font-bold text-white">
                {bowler?.wickets || 0} / {bowler?.runs_conceded || 0}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Econ: {bowler?.economy || 0.0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAST 1-TAP SCORING KEYPAD */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
          <span>Quick Ball Scoring (1-Tap Entry)</span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Undo Ball
          </button>
        </div>

        {/* Regular Runs Grid */}
        <div className="grid grid-cols-6 gap-2">
          <button
            onClick={() => handleQuickRun(0)}
            className="py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold text-xl shadow hover:scale-105 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={() => handleQuickRun(1)}
            className="py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-lime-400 font-extrabold text-xl shadow hover:scale-105 active:scale-95 transition-all"
          >
            1
          </button>
          <button
            onClick={() => handleQuickRun(2)}
            className="py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-lime-400 font-extrabold text-xl shadow hover:scale-105 active:scale-95 transition-all"
          >
            2
          </button>
          <button
            onClick={() => handleQuickRun(3)}
            className="py-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-lime-400 font-extrabold text-xl shadow hover:scale-105 active:scale-95 transition-all"
          >
            3
          </button>
          <button
            onClick={() => handleQuickRun(4)}
            className="py-4 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-900 font-black text-2xl shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            4
          </button>
          <button
            onClick={() => handleQuickRun(6)}
            className="py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-2xl shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            6
          </button>
        </div>

        {/* Extras & Wicket Action Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setShowExtrasModal(true)}
            className="py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition-all"
          >
            <Plus className="w-4 h-4" /> Extras (WD/NB/Bye)
          </button>

          <button
            onClick={() => setShowWicketModal(true)}
            className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 hover:scale-102 active:scale-95 transition-all"
          >
            <X className="w-4 h-4 stroke-[3]" /> WICKET OUT
          </button>

          <button
            onClick={handleSwapStriker}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 col-span-2 sm:col-span-1 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Change Striker
          </button>
        </div>
      </div>

      {/* Recent Ball-by-ball Ticker Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md text-white">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-emerald-400" /> Recent Deliveries (Ball Log)
        </h4>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {currentInnings.deliveries.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">No deliveries bowled in this innings yet.</div>
          ) : (
            [...currentInnings.deliveries].reverse().slice(0, 8).map((del) => (
              <div
                key={del.id}
                className="text-xs bg-slate-800/60 p-2 rounded border border-slate-700/60 flex items-center justify-between gap-2"
              >
                <div className="truncate text-slate-300">{del.commentary}</div>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                    del.is_wicket
                      ? 'bg-red-500 text-white'
                      : del.runs_bat === 6
                      ? 'bg-purple-600 text-white'
                      : del.runs_bat === 4
                      ? 'bg-emerald-600 text-white'
                      : del.extra_type !== 'none'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {del.is_wicket ? 'OUT' : del.total_runs}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EXTRAS MODAL */}
      {showExtrasModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-amber-400">Record Extra Delivery</h3>
              <button onClick={() => setShowExtrasModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Select Extra Type:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['wide', 'no_ball', 'bye', 'leg_bye'] as ExtraType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedExtraType(type)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all ${
                      selectedExtraType === type
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Additional Runs Off Bat / Byes (Optional):
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setExtraRunsInput(num)}
                      className={`flex-1 py-2 rounded-lg font-mono font-bold text-sm border ${
                        extraRunsInput === num
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmExtras}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-lg transition-all"
            >
              Confirm Extra Ball
            </button>
          </div>
        </div>
      )}

      {/* WICKET MODAL */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-red-400 flex items-center gap-2">
                <X className="w-5 h-5 text-red-500 stroke-[3]" /> Record Batter Dismissal
              </h3>
              <button onClick={() => setShowWicketModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Dismissal Method:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'] as WicketType[]).map((wType) => (
                  <button
                    key={wType}
                    onClick={() => setSelectedWicketType(wType)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-all ${
                      selectedWicketType === wType
                        ? 'bg-red-600 text-white border-red-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {wType.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {(selectedWicketType === 'caught' || selectedWicketType === 'run_out' || selectedWicketType === 'stumped') && (
                <div>
                  <label className="text-xs font-semibold text-slate-300">Fielder Name (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Aman Gupta"
                    value={fielderNameInput}
                    onChange={(e) => setFielderNameInput(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300">Incoming New Batter Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Mehra"
                  value={newBatterNameInput}
                  onChange={(e) => setNewBatterNameInput(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmWicket}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl shadow-lg transition-all"
            >
              Confirm Wicket
            </button>
          </div>
        </div>
      )}

      {/* CHANGE BOWLER MODAL */}
      {showBowlerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-cyan-400">Select Next Bowler</h3>
              <button onClick={() => setShowBowlerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {[
                { id: 'p-2', name: 'Vikas Verma (Fast)' },
                { id: 'p-3', name: 'Aman Gupta (Left-arm Spin)' },
                { id: 'p-p8', name: 'Kunal Deshmukh (Medium Fast)' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    if (currentInnings) {
                      currentInnings.current_bowler_id = b.id;
                      if (!currentInnings.bowlers[b.id]) {
                        currentInnings.bowlers[b.id] = {
                          player_id: b.id,
                          player_name: b.name.split(' ')[0] + ' ' + b.name.split(' ')[1],
                          overs: 0,
                          balls_bowled: 0,
                          maidens: 0,
                          runs_conceded: 0,
                          wickets: 0,
                          economy: 0,
                        };
                      }
                      db.updateMatchState(match.id, {
                        [isFirstInnings ? 'first_innings' : 'second_innings']: currentInnings,
                      });
                    }
                    setShowBowlerModal(false);
                  }}
                  className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left text-xs font-bold text-white transition-all flex items-center justify-between"
                >
                  <span>{b.name}</span>
                  <Check className="w-4 h-4 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
