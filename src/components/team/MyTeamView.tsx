import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Shield, Users, UserPlus, X, Check, Clock3, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TeamRow { id: string; name: string; short_name: string; logo_url?: string | null; manager_id: string; college_id?: string | null; }
interface MemberRow { id: string; team_id: string; player_id: string; is_active: boolean; }
interface RequestRow { id: string; team_id: string; player_id: string; status: string; created_at: string; }
interface Props { userId: string; }

export const MyTeamView: React.FC<Props> = ({ userId }) => {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [memberships, setMemberships] = useState<MemberRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [searchResults, setSearchResults] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');

  const memberTeamIds = useMemo(() => new Set(memberships.filter(m => m.is_active).map(m => m.team_id)), [memberships]);

  const load = async () => {
    setLoading(true); setError('');
    const [teamRes, memberRes, requestRes] = await Promise.all([
      supabase.from('teams').select('id,name,short_name,logo_url,manager_id,college_id').order('created_at', { ascending: false }),
      supabase.from('team_members').select('id,team_id,player_id,is_active').eq('player_id', userId),
      supabase.from('team_join_requests').select('id,team_id,player_id,status,created_at').eq('player_id', userId).order('created_at', { ascending: false })
    ]);
    if (teamRes.error) setError(teamRes.error.message); else setTeams((teamRes.data || []) as TeamRow[]);
    if (!memberRes.error) setMemberships((memberRes.data || []) as MemberRow[]);
    if (!requestRes.error) setRequests((requestRes.data || []) as RequestRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [userId]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    const name = teamName.trim(); const code = shortName.trim().toUpperCase();
    if (!name || !code) { setError('Team name and short name are required.'); setBusy(false); return; }
    const { data, error: insertError } = await supabase.from('teams').insert({ name, short_name: code, manager_id: userId }).select('id,name,short_name,logo_url,manager_id,college_id').single();
    if (insertError || !data) { setError(insertError?.message || 'Team could not be created.'); setBusy(false); return; }
    const { error: memberError } = await supabase.from('team_members').insert({ team_id: data.id, player_id: userId, is_active: true });
    if (memberError) { await supabase.from('teams').delete().eq('id', data.id); setError(memberError.message); setBusy(false); return; }
    setTeamName(''); setShortName(''); setCreateOpen(false); setNotice(`You are now the manager of ${data.name}.`); await load(); setBusy(false);
  };

  const searchTeams = async () => {
    const q = query.trim(); if (!q) { setSearchResults([]); return; }
    setError('');
    const safe = q.replace(/[%_,]/g, '');
    const { data, error: searchError } = await supabase.from('teams').select('id,name,short_name,logo_url,manager_id,college_id').or(`name.ilike.%${safe}%,short_name.ilike.%${safe}%`).limit(20);
    if (searchError) setError(searchError.message); else setSearchResults((data || []) as TeamRow[]);
  };

  const requestJoin = async (team: TeamRow) => {
    setBusy(true); setError(''); setNotice('');
    if (memberTeamIds.has(team.id)) { setNotice('You are already a member of this team.'); setBusy(false); return; }
    if (requests.some(r => r.team_id === team.id && r.status === 'pending')) { setNotice('Your join request is already pending.'); setBusy(false); return; }
    const { error: requestError } = await supabase.from('team_join_requests').upsert({ team_id: team.id, player_id: userId, status: 'pending' }, { onConflict: 'team_id,player_id' });
    if (requestError) setError(requestError.message); else { setNotice(`Join request sent to ${team.name}.`); await load(); }
    setBusy(false);
  };

  const approve = async (requestId: string) => {
    setBusy(true); setError('');
    const { error: approveError } = await supabase.rpc('approve_team_join_request', { p_request_id: requestId });
    if (approveError) setError(approveError.message); else { setNotice('Player approved.'); await load(); }
    setBusy(false);
  };

  const myTeams = teams.filter(t => memberTeamIds.has(t.id) || t.manager_id === userId);
  return <section className="min-h-screen bg-slate-50 pb-24">
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-5 pt-8 pb-10 text-white">
      <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.18em]">Cricket workspace</p><h1 className="text-3xl font-black mt-1">My Team</h1><p className="text-slate-300 text-sm mt-2">Create your team, join a squad and manage your cricket group.</p>
    </div>
    <div className="max-w-3xl mx-auto px-4 -mt-5 space-y-4">
      {error && <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 p-3 text-sm">{error}</div>}{notice && <div className="rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 text-sm">{notice}</div>}
      <div className="grid grid-cols-2 gap-3"><button onClick={() => setCreateOpen(true)} className="rounded-2xl bg-emerald-600 text-white p-4 text-left shadow-lg hover:bg-emerald-700"><Plus className="w-5 h-5 mb-3"/><div className="font-bold">Create Team</div><div className="text-xs text-emerald-100 mt-1">Become Team Manager</div></button><button onClick={() => { setJoinOpen(true); setQuery(''); setSearchResults([]); }} className="rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-sm hover:border-emerald-300"><Search className="w-5 h-5 text-slate-700 mb-3"/><div className="font-bold text-slate-900">Join Team</div><div className="text-xs text-slate-500 mt-1">Find an existing squad</div></button></div>
      {loading ? <div className="bg-white rounded-2xl p-10 text-center text-slate-500">Loading your teams…</div> : myTeams.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center"><Shield className="w-11 h-11 mx-auto text-slate-300"/><h2 className="font-bold text-slate-900 mt-3">You are not in a team yet</h2><p className="text-sm text-slate-500 mt-1">Create a team and become its manager, or send a join request.</p></div> : myTeams.map(team => { const manager = team.manager_id === userId; const pending = requests.filter(r => r.team_id === team.id && r.status === 'pending'); return <div key={team.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center overflow-hidden">{team.logo_url ? <img src={team.logo_url} alt="" className="w-full h-full object-cover"/> : <Shield className="w-7 h-7 text-emerald-600"/>}</div><div className="flex-1"><div className="flex items-center gap-2"><h2 className="font-black text-lg text-slate-900">{team.name}</h2>{manager && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full"><Crown className="w-3 h-3"/> MANAGER</span>}</div><p className="text-sm text-slate-500">{team.short_name} · {manager ? 'You manage this team' : 'Team Member'}</p></div></div><div className="grid grid-cols-3 gap-2 mt-5"><div className="bg-slate-50 rounded-xl p-3"><Users className="w-4 h-4 text-slate-400"/><b className="block mt-1 text-sm">Squad</b><span className="text-xs text-slate-500">Team players</span></div><div className="bg-slate-50 rounded-xl p-3"><UserPlus className="w-4 h-4 text-slate-400"/><b className="block mt-1 text-sm">Invite</b><span className="text-xs text-slate-500">Add players</span></div><div className="bg-emerald-50 rounded-xl p-3"><Plus className="w-4 h-4 text-emerald-600"/><b className="block mt-1 text-sm">Match</b><span className="text-xs text-slate-500">{manager ? 'Manager access' : 'Manager only'}</span></div></div>{manager && <div className="mt-4 border-t pt-4"><div className="flex items-center justify-between"><span className="text-sm font-bold">Join requests</span><span className="text-xs text-slate-500">{pending.length} pending</span></div>{pending.map(r => <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 mt-2"><div><div className="text-sm font-semibold">Player request</div><div className="text-xs text-slate-500">{r.player_id.slice(0, 8)}…</div></div><button disabled={busy} onClick={() => void approve(r.id)} className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Approve</button></div>)}</div>}</div>; })}
    </div>
    {createOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={createTeam} className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl"><div className="flex justify-between"><div><h2 className="text-xl font-black">Create your team</h2><p className="text-sm text-slate-500 mt-1">You automatically become Team Manager.</p></div><button type="button" onClick={() => setCreateOpen(false)}><X className="text-slate-400"/></button></div><input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Team name" className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-5"/><input value={shortName} onChange={e=>setShortName(e.target.value)} placeholder="Short name e.g. IKG" maxLength={8} className="w-full border border-slate-200 rounded-xl px-4 py-3 mt-3 uppercase"/><button disabled={busy} className="w-full mt-5 bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-3 font-bold">{busy ? 'Creating…' : 'Create Team'}</button></form></div>}
    {joinOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"><div className="flex justify-between items-center"><h2 className="text-xl font-black">Join a Team</h2><button onClick={() => setJoinOpen(false)}><X className="text-slate-400"/></button></div><div className="flex gap-2 mt-5"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key === 'Enter' && void searchTeams()} placeholder="Team name or short name" className="flex-1 border border-slate-200 rounded-xl px-4 py-3"/><button onClick={() => void searchTeams()} className="bg-slate-900 text-white rounded-xl px-4"><Search className="w-5 h-5"/></button></div><div className="mt-4 space-y-2">{searchResults.map(team => { const already = memberTeamIds.has(team.id); const pending = requests.some(r => r.team_id === team.id && r.status === 'pending'); return <div key={team.id} className="border border-slate-200 rounded-xl p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Shield className="w-5 h-5 text-emerald-600"/></div><div className="flex-1"><div className="font-bold text-sm">{team.name}</div><div className="text-xs text-slate-500">{team.short_name}</div></div><button disabled={busy || already || pending} onClick={() => void requestJoin(team)} className="rounded-lg bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 text-white px-3 py-2 text-xs font-bold">{already ? 'Joined' : pending ? 'Pending' : 'Request'}</button></div>})}</div>{query && !searchResults.length && <div className="text-center text-sm text-slate-500 py-8"><Clock3 className="w-7 h-7 mx-auto mb-2 text-slate-300"/>No teams found.</div>}</div></div>}
  </section>;
};
