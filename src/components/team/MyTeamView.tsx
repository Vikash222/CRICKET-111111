import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Shield, UserPlus, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Team, TeamMember } from '../../types/cricket';

interface MyTeamViewProps { userId: string; onCreateMatch?: () => void; }

export const MyTeamView: React.FC<MyTeamViewProps> = ({ userId, onCreateMatch }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [error, setError] = useState('');

  const loadTeams = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, teams(*)')
      .eq('player_id', userId)
      .eq('is_active', true);
    if (error) { setError(error.message); setTeams([]); }
    else setTeams((data || []).map((row: any) => row.teams).filter(Boolean) as Team[]);
    setLoading(false);
  };

  useEffect(() => { void loadTeams(); }, [userId]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!name.trim() || !shortName.trim()) { setError('Enter team name and short name.'); return; }
    const { data: team, error: teamError } = await supabase.from('teams').insert({ name: name.trim(), short_name: shortName.trim().toUpperCase(), manager_id: userId }).select('*').single();
    if (teamError || !team) { setError(teamError?.message || 'Could not create team.'); return; }
    const { error: memberError } = await supabase.from('team_members').insert({ team_id: team.id, player_id: userId, is_active: true });
    if (memberError) { setError(memberError.message); return; }
    setName(''); setShortName(''); setShowCreate(false); await loadTeams();
  };

  return <section className="min-h-screen bg-slate-50 pb-24">
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 pt-8 pb-10 text-white">
      <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.18em]">My Cricket</p>
      <h1 className="text-3xl font-black mt-1">My Team</h1>
      <p className="text-slate-300 text-sm mt-2">Manage your squad, join teams and build your cricket journey.</p>
    </div>
    <div className="max-w-3xl mx-auto px-4 -mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowCreate(true)} className="rounded-2xl bg-emerald-600 text-white p-4 text-left shadow-lg"><Plus className="w-5 h-5 mb-3"/><div className="font-bold">Create Team</div><div className="text-xs text-emerald-100 mt-1">Become team manager</div></button>
        <button className="rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-sm"><Search className="w-5 h-5 text-slate-700 mb-3"/><div className="font-bold text-slate-900">Join Team</div><div className="text-xs text-slate-500 mt-1">Find an existing team</div></button>
      </div>
      {error && <div className="rounded-xl bg-red-50 text-red-700 border border-red-100 p-3 text-sm">{error}</div>}
      {loading ? <div className="bg-white rounded-2xl p-8 text-center text-slate-500">Loading your teams…</div> : teams.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center"><Users className="w-10 h-10 mx-auto text-slate-300"/><h2 className="font-bold text-slate-900 mt-3">You are not in a team yet</h2><p className="text-sm text-slate-500 mt-1">Create your own team or join an existing college team.</p></div> : teams.map(team => <div key={team.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center"><Shield className="w-7 h-7 text-emerald-600"/></div><div className="flex-1"><h2 className="font-black text-lg text-slate-900">{team.name}</h2><p className="text-sm text-slate-500">{team.short_name} · {team.manager_id === userId ? 'Team Manager' : 'Team Member'}</p></div><ChevronRight className="text-slate-300"/></div><div className="grid grid-cols-3 gap-2 mt-5"><div className="bg-slate-50 rounded-xl p-3"><Users className="w-4 h-4 text-slate-400"/><b className="block mt-1">Squad</b><span className="text-xs text-slate-500">Manage players</span></div><div className="bg-slate-50 rounded-xl p-3"><UserPlus className="w-4 h-4 text-slate-400"/><b className="block mt-1">Invite</b><span className="text-xs text-slate-500">Add players</span></div><button disabled={team.manager_id !== userId} onClick={onCreateMatch} className="bg-emerald-50 disabled:opacity-40 rounded-xl p-3 text-left"><Plus className="w-4 h-4 text-emerald-600"/><b className="block mt-1">Match</b><span className="text-xs text-slate-500">Create match</span></button></div></div>)}
    </div>
    {showCreate && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={createTeam} className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"><h2 className="text-xl font-black">Create your team</h2><p className="text-sm text-slate-500 mt-1 mb-5">You will become the Team Manager.</p><input value={name} onChange={e=>setName(e.target.value)} placeholder="Team name" className="w-full border rounded-xl px-4 py-3 mb-3"/><input value={shortName} onChange={e=>setShortName(e.target.value)} placeholder="Short name e.g. IKG" maxLength={8} className="w-full border rounded-xl px-4 py-3 mb-5"/><div className="flex gap-3"><button type="button" onClick={()=>setShowCreate(false)} className="flex-1 border rounded-xl py-3 font-bold">Cancel</button><button className="flex-1 bg-emerald-600 text-white rounded-xl py-3 font-bold">Create Team</button></div></form></div>}
  </section>;
};
