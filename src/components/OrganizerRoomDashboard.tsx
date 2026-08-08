import React, { useEffect, useState } from 'react';
import { Copy, MapPin, Plus, Radio, Share2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../i18n';

type Team = { id: string; name: string; short_name: string; logo_url?: string };
type Room = { id: string; room_code: string; room_name: string; match_name: string; venue: string; status: string; match_id?: string | null };

export const OrganizerRoomDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ room_name: '', match_name: '', venue: '', team_a_id: '', team_b_id: '', overs: 20 });

  const load = async () => {
    const [{ data: roomData }, { data: teamData }] = await Promise.all([
      supabase.from('match_rooms').select('id,room_code,room_name,match_name,venue,status,match_id').order('created_at', { ascending: false }),
      supabase.from('teams').select('id,name,short_name,logo_url').order('name'),
    ]);
    setRooms((roomData || []) as Room[]); setTeams((teamData || []) as Team[]);
  };
  useEffect(() => { load(); const channel = supabase.channel('ccl-rooms').on('postgres_changes', { event: '*', schema: 'public', table: 'match_rooms' }, load).subscribe(); return () => { supabase.removeChannel(channel); }; }, []);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.team_a_id || !form.team_b_id || form.team_a_id === form.team_b_id) { setError('Select two different teams.'); return; }
    if (rooms.filter((r) => r.status === 'live').length >= 8) { setError('Maximum 8 live matches are allowed.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please login first.'); setSaving(false); return; }
    const roomCode = `CCL-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { data: room, error: roomError } = await supabase.from('match_rooms').insert({ room_code: roomCode, room_name: form.room_name, match_name: form.match_name, venue: form.venue, organizer_id: user.id, status: 'live', is_public: true }).select().single();
    if (roomError || !room) { setError(roomError?.message || 'Could not create room.'); setSaving(false); return; }
    const { data: match, error: matchError } = await supabase.from('matches').insert({ team_a_id: form.team_a_id, team_b_id: form.team_b_id, venue: form.venue, match_date: new Date().toISOString(), format: 't20', total_overs: form.overs, status: 'live', current_innings_number: 1, room_id: room.id, public_share_code: roomCode }).select('id').single();
    if (matchError || !match) { await supabase.from('match_rooms').delete().eq('id', room.id); setError(matchError?.message || 'Could not create match.'); setSaving(false); return; }
    await supabase.from('match_rooms').update({ match_id: match.id }).eq('id', room.id);
    setForm({ room_name: '', match_name: '', venue: '', team_a_id: '', team_b_id: '', overs: 20 }); setOpen(false); await load(); setSaving(false);
  };

  const copy = async (room: Room) => { const url = `${window.location.origin}/match/${room.match_id || room.room_code}`; await navigator.clipboard?.writeText(url); };
  const share = async (room: Room) => { const url = `${window.location.origin}/match/${room.match_id || room.room_code}`; if (navigator.share) await navigator.share({ title: room.match_name, url }); else await copy(room); };
  const live = rooms.filter((r) => r.status === 'live');

  return <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24 space-y-5 text-slate-900">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-xl font-bold">{t('rooms')}</h1><p className="text-sm text-slate-500">Create and run up to 8 live match rooms.</p></div><button onClick={() => setOpen(true)} disabled={live.length >= 8} className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-bold disabled:opacity-40 flex items-center gap-2"><Plus className="w-4 h-4"/>{t('createRoom')}</button></div>
    <div className="grid grid-cols-3 gap-3"><div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Live</p><p className="text-2xl font-bold text-emerald-600">{live.length}</p></div><div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Capacity</p><p className="text-2xl font-bold">8</p></div><div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Available</p><p className="text-2xl font-bold">{Math.max(0, 8-live.length)}</p></div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{rooms.map((room) => <div key={room.id} className="bg-white border rounded-2xl p-4"><div className="flex items-center justify-between"><span className={`text-xs font-bold ${room.status === 'live' ? 'text-red-600' : 'text-slate-500'}`}>{room.status === 'live' ? '● LIVE' : room.status.toUpperCase()}</span><span className="text-xs font-mono text-slate-400">{room.room_code}</span></div><h3 className="font-bold mt-3">{room.match_name}</h3><p className="text-sm text-slate-500">{room.room_name}</p><p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{room.venue}</p><div className="mt-4 flex gap-2"><button onClick={() => copy(room)} className="flex-1 rounded-lg border py-2 text-xs font-semibold flex items-center justify-center gap-1"><Copy className="w-3.5 h-3.5"/>Copy Link</button><button onClick={() => share(room)} className="flex-1 rounded-lg bg-slate-900 text-white py-2 text-xs font-semibold flex items-center justify-center gap-1"><Share2 className="w-3.5 h-3.5"/>Share</button></div></div>)}{!rooms.length && <div className="md:col-span-2 bg-white border border-dashed rounded-2xl p-10 text-center text-sm text-slate-500">No rooms yet.</div>}</div>

    {open && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><form onSubmit={createRoom} className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl space-y-3"><div className="flex justify-between"><h2 className="font-bold">{t('createRoom')}</h2><button type="button" onClick={() => setOpen(false)}><X className="w-5 h-5"/></button></div><input required placeholder="Room name" value={form.room_name} onChange={(e)=>setForm({...form,room_name:e.target.value})} className="w-full border rounded-xl p-2.5 text-sm"/><input required placeholder="Match name" value={form.match_name} onChange={(e)=>setForm({...form,match_name:e.target.value})} className="w-full border rounded-xl p-2.5 text-sm"/><select required value={form.team_a_id} onChange={(e)=>setForm({...form,team_a_id:e.target.value})} className="w-full border rounded-xl p-2.5 text-sm"><option value="">Team A</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select required value={form.team_b_id} onChange={(e)=>setForm({...form,team_b_id:e.target.value})} className="w-full border rounded-xl p-2.5 text-sm"><option value="">Team B</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><input required placeholder="Venue / place" value={form.venue} onChange={(e)=>setForm({...form,venue:e.target.value})} className="w-full border rounded-xl p-2.5 text-sm"/><input type="number" min="1" max="50" value={form.overs} onChange={(e)=>setForm({...form,overs:Number(e.target.value)})} className="w-full border rounded-xl p-2.5 text-sm"/><p className="text-xs text-slate-500">Room becomes public immediately. Share the unique link with anyone.</p>{error&&<p className="text-xs text-red-600">{error}</p>}<button disabled={saving} className="w-full rounded-xl bg-emerald-600 text-white py-2.5 font-bold disabled:opacity-50">{saving ? 'Creating…' : 'Create & Start Match'}</button></form></div>}
  </div>;
};
