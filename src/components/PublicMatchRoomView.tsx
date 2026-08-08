import React, { useEffect, useState } from 'react';
import { MapPin, Radio, Share2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props { matchId: string; onShare?: () => void; }
interface MatchRow { id: string; team_a_id: string; team_b_id: string; venue: string; status: string; total_overs: number; match_date: string; result_summary?: string | null; }
interface TeamRow { id: string; name: string; short_name: string; logo_url?: string | null; }

export const PublicMatchRoomView: React.FC<Props> = ({ matchId, onShare }) => {
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [teams, setTeams] = useState<Record<string, TeamRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error: matchError } = await supabase.from('matches').select('id,team_a_id,team_b_id,venue,status,total_overs,match_date,result_summary').eq('id', matchId).single();
    if (matchError || !data) { setError('Match not found.'); setLoading(false); return; }
    setMatch(data as MatchRow);
    const ids = [data.team_a_id, data.team_b_id];
    const { data: teamData } = await supabase.from('teams').select('id,name,short_name,logo_url').in('id', ids);
    setTeams(Object.fromEntries((teamData || []).map((team) => [team.id, team as TeamRow])));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel(`public-match-${matchId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-emerald-600 font-semibold">Loading match…</div>;
  if (error || !match) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">{error || 'Match not found.'}</div>;
  const a = teams[match.team_a_id]; const b = teams[match.team_b_id];

  return <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8"><div className="max-w-3xl mx-auto space-y-4">
    <div className="bg-white border rounded-2xl p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${match.status === 'live' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Radio className="inline w-3.5 h-3.5 mr-1"/>{match.status === 'live' ? 'LIVE' : match.status.toUpperCase()}</span><span className="text-sm text-slate-500">Public Match Room</span></div><button onClick={onShare} className="rounded-lg border px-3 py-1.5 text-sm font-semibold flex items-center gap-1"><Share2 className="w-4 h-4"/>Share</button></div>
      <div className="grid grid-cols-2 gap-3 mt-6"><div className="border rounded-xl p-4"><div className="font-bold">{a?.name || 'Team A'}</div><div className="text-3xl font-black mt-2">0/0</div><div className="text-xs text-slate-500">0.0 overs</div></div><div className="border rounded-xl p-4"><div className="font-bold">{b?.name || 'Team B'}</div><div className="text-3xl font-black mt-2">0/0</div><div className="text-xs text-slate-500">{match.total_overs} overs</div></div></div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500"><span className="flex items-center gap-1"><MapPin className="w-4 h-4"/>{match.venue}</span><span className="flex items-center gap-1"><Users className="w-4 h-4"/>Anyone can watch without login</span></div>
    </div>
    <div className="bg-white border rounded-2xl p-5"><h2 className="font-bold">Live commentary</h2><p className="text-sm text-slate-500 mt-2">Ball-by-ball updates will appear here as the official scorer records deliveries.</p></div>
  </div></div>;
};
