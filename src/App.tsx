import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { supabase } from './lib/supabase';
import { UserRole, Profile } from './types/cricket';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ScoringInterface } from './components/scoring/ScoringInterface';
import { MatchDetailView } from './components/match/MatchDetailView';
import { PublicMatchRoomView } from './components/PublicMatchRoomView';
import { PlayerProfileView } from './components/player/PlayerProfileView';
import { TournamentView } from './components/tournament/TournamentView';
import { RankingsView } from './components/rankings/RankingsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OrganizerRoomDashboard } from './components/OrganizerRoomDashboard';
import { SearchModal } from './components/SearchModal';
import { PublicMatchLinkModal } from './components/PublicMatchLinkModal';
import { PlayerProfileEditor } from './components/PlayerProfileEditor';
import { LanguageSettingsModal } from './components/LanguageSettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { LanguageProvider, Language } from './i18n';

export default function App() {
  const publicMatchMatch = window.location.pathname.match(/^\/match\/([^/]+)\/?$/);
  const publicMatchId = publicMatchMatch?.[1] || null;
  const isPublicMatchRoute = Boolean(publicMatchId);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [sessionReady, setSessionReady] = useState(isPublicMatchRoute);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  useEffect(() => {
    if (isPublicMatchRoute) return;
    let mounted = true;
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session?.user) { setAuthenticated(false); setCurrentUser(null); setSessionReady(true); return; }
      await loadProfile(session.user.id, session.user.email || '');
      if (mounted) setSessionReady(true);
    };
    loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) { setAuthenticated(false); setCurrentUser(null); return; }
      await loadProfile(session.user.id, session.user.email || '');
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [isPublicMatchRoute]);

  const loadProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const fallback: Profile = { id: userId, email, full_name: email.split('@')[0], role: 'player', language: 'english', is_verified: false };
    const profile = (!error && data ? data : fallback) as Profile;
    setCurrentUser(profile); db.setCurrentUser(profile); setAuthenticated(true);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setAuthenticated(false); setCurrentUser(null); setActiveTab('home'); };
  const handleSelectMatch = (matchId: string) => { setSelectedMatchId(matchId); setActiveTab('live'); };
  const handleSelectPlayer = (playerId: string) => { setSelectedPlayerId(playerId); setActiveTab('profile'); };

  if (isPublicMatchRoute) {
    return <LanguageProvider><div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased"><PublicMatchRoomView matchId={publicMatchId!} /></div></LanguageProvider>;
  }

  if (!sessionReady) return <LanguageProvider><div className="min-h-screen bg-slate-50 flex items-center justify-center text-emerald-600 font-bold">Loading CollegeCricket.live…</div></LanguageProvider>;
  if (!authenticated || !currentUser) return <LanguageProvider><AuthScreen onAuthenticated={() => setSessionReady(true)} /></LanguageProvider>;

  const currentRole: UserRole = currentUser.role;
  const isOrganizer = ['organizer', 'tournament_organizer', 'super_admin'].includes(currentRole);
  const language = (currentUser.language || 'english') as Language;

  return <LanguageProvider initialLanguage={language}>
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar currentRole={currentRole} onOpenSearch={() => setShowSearchModal(true)} onOpenProfile={() => setShowProfileEditor(true)} onOpenSettings={() => setShowSettingsModal(true)} onShareMatch={() => selectedMatchId && setShowShareModal(true)} onLogout={handleLogout} />
      <main>
        {activeTab === 'home' && <HomeView onSelectMatch={handleSelectMatch} onSelectPlayer={handleSelectPlayer} onNavigateToScorer={() => selectedMatchId && setActiveTab('scoring')} />}
        {activeTab === 'live' && selectedMatchId && <MatchDetailView matchId={selectedMatchId} onShareMatch={() => setShowShareModal(true)} />}
        {activeTab === 'scoring' && selectedMatchId && <ScoringInterface matchId={selectedMatchId} onViewLiveMatch={() => setActiveTab('live')} />}
        {activeTab === 'tournaments' && <TournamentView onSelectMatch={handleSelectMatch} />}
        {activeTab === 'rankings' && <RankingsView />}
        {activeTab === 'admin' && (isOrganizer ? <OrganizerRoomDashboard /> : <AdminDashboard />)}
        {activeTab === 'profile' && selectedPlayerId && <PlayerProfileView playerId={selectedPlayerId} />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={currentRole} />
      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} onSelectPlayer={handleSelectPlayer} onSelectMatch={handleSelectMatch} />}
      {showShareModal && selectedMatchId && <PublicMatchLinkModal matchId={selectedMatchId} onClose={() => setShowShareModal(false)} />}
      {showProfileEditor && <PlayerProfileEditor onClose={() => setShowProfileEditor(false)} />}
      {showSettingsModal && <LanguageSettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  </LanguageProvider>;
}
