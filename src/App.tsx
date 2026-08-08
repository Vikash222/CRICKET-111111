import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { supabase } from './lib/supabase';
import { UserRole, Profile } from './types/cricket';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ScoringInterface } from './components/scoring/ScoringInterface';
import { MatchDetailView } from './components/match/MatchDetailView';
import { PlayerProfileView } from './components/player/PlayerProfileView';
import { TournamentView } from './components/tournament/TournamentView';
import { RankingsView } from './components/rankings/RankingsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SearchModal } from './components/SearchModal';
import { PublicMatchLinkModal } from './components/PublicMatchLinkModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthScreen } from './components/AuthScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [sessionReady, setSessionReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const [selectedMatchId, setSelectedMatchId] = useState<string>('match-live-1');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('p-1');

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!session?.user) {
        setAuthenticated(false);
        setCurrentUser(null);
        setSessionReady(true);
        return;
      }

      await loadProfile(session.user.id, session.user.email || '');
      if (mounted) setSessionReady(true);
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setAuthenticated(false);
        setCurrentUser(null);
        return;
      }
      await loadProfile(session.user.id, session.user.email || '');
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // The database trigger normally creates this row. This fallback also supports
      // projects where the migration has not yet been applied.
      const fallback: Profile = {
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'player',
        is_verified: false,
      };
      setCurrentUser(fallback);
      db.setCurrentUser(fallback);
      setAuthenticated(true);
      return;
    }

    const profile = data as Profile;
    setCurrentUser(profile);
    db.setCurrentUser(profile);
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveTab('live');
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab('profile');
  };

  if (!sessionReady) {
    return <div className="min-h-screen bg-[#070D19] flex items-center justify-center text-lime-400 font-bold">Loading CollegeCricket.live…</div>;
  }

  if (!authenticated || !currentUser) {
    return <AuthScreen onAuthenticated={() => setSessionReady(true)} />;
  }

  const currentRole: UserRole = currentUser.role;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans antialiased selection:bg-lime-500 selection:text-slate-900">
      <Navbar
        currentRole={currentRole}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenProfile={() => setShowOnboardingModal(true)}
        onShareMatch={() => setShowShareModal(true)}
        onLogout={handleLogout}
      />

      <main className="transition-all duration-200">
        {activeTab === 'home' && (
          <HomeView onSelectMatch={handleSelectMatch} onSelectPlayer={handleSelectPlayer} onNavigateToScorer={() => setActiveTab('scoring')} />
        )}
        {activeTab === 'live' && <MatchDetailView matchId={selectedMatchId} onShareMatch={() => setShowShareModal(true)} />}
        {activeTab === 'scoring' && <ScoringInterface matchId={selectedMatchId} onViewLiveMatch={() => setActiveTab('live')} />}
        {activeTab === 'tournaments' && <TournamentView onSelectMatch={handleSelectMatch} />}
        {activeTab === 'rankings' && <RankingsView />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'profile' && <PlayerProfileView playerId={selectedPlayerId} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={currentRole} />

      {showSearchModal && <SearchModal onClose={() => setShowSearchModal(false)} onSelectPlayer={handleSelectPlayer} onSelectMatch={handleSelectMatch} />}
      {showShareModal && <PublicMatchLinkModal matchId={selectedMatchId} onClose={() => setShowShareModal(false)} />}
      {showOnboardingModal && <OnboardingModal onClose={() => setShowOnboardingModal(false)} />}
    </div>
  );
}
