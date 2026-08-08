import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Trophy,
  History,
  Plus,
  CheckCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { db } from '../../services/db';

export const AdminDashboard: React.FC = () => {
  const colleges = db.getColleges();
  const teams = db.getTeams();
  const auditLogs = db.getAuditLogs();

  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCode, setNewCollegeCode] = useState('');
  const [newCollegeCity, setNewCollegeCity] = useState('');
  const [newCollegeState, setNewCollegeState] = useState('');

  const handleCreateCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName || !newCollegeCode) return;
    db.createCollege({
      name: newCollegeName,
      short_code: newCollegeCode,
      city: newCollegeCity || 'New Delhi',
      state: newCollegeState || 'Delhi',
      description: 'College created via Super Admin Panel',
    });
    setShowCollegeModal(false);
    setNewCollegeName('');
    setNewCollegeCode('');
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 pb-24 text-slate-200">
      {/* Admin Header Banner */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-lime-500/20 text-lime-400 border border-lime-500/30 tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> SUPER ADMIN CONTROL
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">Platform Operations & Audit Console</h2>
            <p className="text-xs text-slate-400">
              Manage varsity entities, verify college teams, and monitor data integrity.
            </p>
          </div>

          <button
            onClick={() => setShowCollegeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-900 font-bold text-xs shadow-lg shadow-lime-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add College
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Colleges</div>
          <div className="text-2xl font-black font-mono text-lime-400">{colleges.length}</div>
        </div>
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Active Teams</div>
          <div className="text-2xl font-black font-mono text-lime-400">{teams.length}</div>
        </div>
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Verified Players</div>
          <div className="text-2xl font-black font-mono text-cyan-400">128</div>
        </div>
        <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-4 text-center shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Audit Events</div>
          <div className="text-2xl font-black font-mono text-amber-400">{auditLogs.length}</div>
        </div>
      </div>

      {/* Colleges Directory */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-lime-400" /> College Varsity Directory
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {colleges.map((col) => (
            <div key={col.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-1">
                  <span>{col.name}</span>
                  {col.is_verified && <CheckCircle className="w-3.5 h-3.5 text-lime-400" />}
                </div>
                <div className="text-[11px] text-slate-400">
                  {col.city}, {col.state} | Code: {col.short_code}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-500/20 text-lime-300 border border-lime-500/30">
                VERIFIED
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-1.5">
          <History className="w-4 h-4 text-amber-400" /> System Audit Logs (Official Record)
        </h3>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50 text-xs flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-200">{log.action}</div>
                <div className="text-[11px] text-slate-400">{log.details}</div>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD COLLEGE MODAL */}
      {showCollegeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCollege} className="bg-[#0F172A] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <h3 className="font-bold text-base text-lime-400">Add New College Varsity</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold">College Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BITS Pilani"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold">Short Code:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BITS"
                  value={newCollegeCode}
                  onChange={(e) => setNewCollegeCode(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold">City:</label>
                  <input
                    type="text"
                    placeholder="e.g. Pilani"
                    value={newCollegeCity}
                    onChange={(e) => setNewCollegeCity(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">State:</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajasthan"
                    value={newCollegeState}
                    onChange={(e) => setNewCollegeState(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCollegeModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-xs text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-lime-500 hover:bg-lime-400 font-black rounded-xl text-xs text-slate-900 shadow-lg shadow-lime-500/20"
              >
                Create College
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
