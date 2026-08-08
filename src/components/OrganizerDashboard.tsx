import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Radio, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MatchRoom {
  id: string;
  room_code: string;
  room_name: string;
  match_name: string;
  venue: string;
  status: 'live' | 'completed' | 'closed';
  created_at: string;
}

export const OrganizerDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<MatchRoom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ room_name: '', match_name: '', venue: '' });

  const loadRooms = async () => {
    const { data } = await supabase
      .from('match_rooms')
      .select('id, room_code, room_name, match_name, venue, status, created_at')
      .order('created_at', { ascending: false });
    setRooms((data || []) as MatchRoom[]);
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
    const channel = supabase
      .channel('match-room-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_rooms' }, loadRooms)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (rooms.filter((r) => r.status === 'live').length >= 8) {
      setError('8 live rooms are already running. Complete one match before starting another.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Please login first.'); setSaving(false); return; }

    const roomCode = `ROOM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const { error: insertError } = await supabase.from('match_rooms').insert({
      room_code: roomCode,
      room_name: form.room_name,
      match_name: form.match_name,
      venue: form.venue,
      organizer_id: user.id,
      status: 'live',
    });

    if (insertError) {
      setError(insertError.message.includes('Maximum 8') ? 'Maximum 8 live rooms are allowed.' : insertError.message);
    } else {
      setForm({ room_name: '', match_name: '', venue: '' });
      setShowCreate(false);
      await loadRooms();
    }
    setSaving(false);
  };

  const liveRooms = rooms.filter((room) => room.status === 'live');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5 pb-24 text-slate-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Match Rooms</h1>
          <p className="text-xs text-slate-400 mt-1">Create and manage up to 8 live matches at the same time.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={liveRooms.length >= 8}
          className="px-4 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Room
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="border border-slate-700 rounded-xl p-3 bg-slate-900/70">
          <div className="text-xs text-slate-400">Live</div>
          <div className="text-2xl font-bold text-lime-400">{liveRooms.length}</div>
        </div>
        <div className="border border-slate-700 rounded-xl p-3 bg-slate-900/70">
          <div className="text-xs text-slate-400">Capacity</div>
          <div className="text-2xl font-bold text-white">8</div>
        </div>
        <div className="border border-slate-700 rounded-xl p-3 bg-slate-900/70">
          <div className="text-xs text-slate-400">Available</div>
          <div className="text-2xl font-bold text-cyan-400">{8 - liveRooms.length}</div>
        </div>
      </div>

      {loading ? <div className="text-sm text-slate-400">Loading rooms...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rooms.map((room) => (
            <div key={room.id} className="border border-slate-700 rounded-xl p-4 bg-slate-900/70">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold ${room.status === 'live' ? 'text-red-400' : 'text-slate-400'}`}>
                  {room.status === 'live' ? '● LIVE' : room.status.toUpperCase()}
                </span>
                <span className="font-mono text-[11px] text-slate-500">{room.room_code}</span>
              </div>
              <h3 className="font-bold text-white mt-3">{room.room_name}</h3>
              <p className="text-sm text-slate-300 mt-1">{room.match_name}</p>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{room.venue}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Radio className="w-3.5 h-3.5 text-lime-400" /> Public live room
                <Users className="w-3.5 h-3.5 ml-2" /> Anyone can watch
              </div>
            </div>
          ))}
          {!rooms.length && <div className="sm:col-span-2 border border-dashed border-slate-700 rounded-xl p-8 text-center text-sm text-slate-500">No match rooms yet. Create the first room.</div>}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={createRoom} className="w-full max-w-md bg-slate-950 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Create Match Room</h2>
              <button type="button" onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-400">Every match gets its own unique room and public live page.</p>
            <input required value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} placeholder="Room name e.g. Ground A" className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-lime-500" />
            <input required value={form.match_name} onChange={(e) => setForm({ ...form, match_name: e.target.value })} placeholder="Match name e.g. IIT vs DTU" className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-lime-500" />
            <input required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Place e.g. DTU Main Ground, Delhi" className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-lime-500" />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button disabled={saving} className="w-full rounded-lg bg-lime-500 hover:bg-lime-400 disabled:opacity-50 text-slate-950 py-2.5 font-bold text-sm">{saving ? 'Creating...' : 'Start Live Room'}</button>
          </form>
        </div>
      )}
    </div>
  );
};
