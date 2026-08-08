import React, { useRef, useState } from 'react';
import { Camera, Loader2, User, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { db } from '../services/db';
import { BattingStyle, BowlingStyle, PlayerRole } from '../types/cricket';

export const PlayerProfileEditor: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const user = db.getCurrentUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.full_name || '');
  const [jersey, setJersey] = useState<number | ''>(user.jersey_number ?? '');
  const [role, setRole] = useState<PlayerRole>(user.playing_role || 'batsman');
  const [batting, setBatting] = useState<BattingStyle>(user.batting_style || 'right_hand');
  const [bowling, setBowling] = useState<BowlingStyle>(user.bowling_style || 'right_arm_medium');
  const [bio, setBio] = useState(user.bio || '');
  const [photo, setPhoto] = useState(user.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) { setMessage('Use JPG, PNG or WEBP under 5 MB.'); return; }
    setMessage('Uploading photo…');
    const path = `${user.id}/profile-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
    if (error) { setMessage(error.message); return; }
    setPhoto(supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl);
    setMessage('Photo ready.');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage('');
    const { data, error } = await supabase.from('profiles').update({ full_name: name.trim(), jersey_number: jersey === '' ? null : jersey, playing_role: role, batting_style: batting, bowling_style: bowling, bio: bio.trim(), avatar_url: photo || null }).eq('id', user.id).select().single();
    if (error) { setMessage(error.message); setSaving(false); return; }
    if (data) db.setCurrentUser(data);
    setSaving(false); onClose();
  };

  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <form onSubmit={save} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-5 shadow-xl text-slate-900 space-y-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><User className="w-5 h-5 text-emerald-600"/><h2 className="font-bold">Player Profile</h2></div><button type="button" onClick={onClose}><X className="w-5 h-5 text-slate-500"/></button></div>
      <div className="flex items-center gap-4"><div className="relative"><img src={photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-20 h-20 rounded-full object-cover border"/><button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white"><Camera className="w-4 h-4"/></button><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])}/></div><p className="text-xs text-slate-500">Upload your cricket profile photo.<br/>Maximum 5 MB.</p></div>
      <label className="block text-xs font-semibold">Full name<input required value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Jersey number<input type="number" min="0" max="999" value={jersey} onChange={(e)=>setJersey(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"/></label><label className="text-xs font-semibold">Playing role<select value={role} onChange={(e)=>setRole(e.target.value as PlayerRole)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"><option value="batsman">Batsman</option><option value="bowler">Bowler</option><option value="all_rounder">All-rounder</option><option value="wicket_keeper">Wicketkeeper</option></select></label></div>
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-semibold">Batting<select value={batting} onChange={(e)=>setBatting(e.target.value as BattingStyle)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"><option value="right_hand">Right hand</option><option value="left_hand">Left hand</option></select></label><label className="text-xs font-semibold">Bowling<select value={bowling} onChange={(e)=>setBowling(e.target.value as BowlingStyle)} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal"><option value="right_arm_fast">Right-arm fast</option><option value="right_arm_medium">Right-arm medium</option><option value="right_arm_spin">Right-arm spin</option><option value="left_arm_fast">Left-arm fast</option><option value="left_arm_medium">Left-arm medium</option><option value="left_arm_spin">Left-arm spin</option><option value="none">None</option></select></label></div>
      <label className="block text-xs font-semibold">Bio<textarea value={bio} onChange={(e)=>setBio(e.target.value)} maxLength={300} rows={3} className="mt-1 w-full rounded-xl border p-2.5 text-sm font-normal resize-none"/></label>
      {message && <p className="text-xs text-slate-500">{message}</p>}
      <button disabled={saving} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 font-bold flex items-center justify-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin"/>}Save Profile</button>
    </form>
  </div>;
};
