import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { UserRole } from './types/cricket';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentRole, setCurrentRole] = useState<UserRole>(db.getCurrentUser().role);

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Active Selected Entity IDs
  const [selectedMatchId, setSelectedMatchId] = useState<string>('match-live-1');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('p-1');

  // Subscribe to DB updates
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setCurrentRole(db.getCurrentUser().role);
    });
    return unsubscribe;
  }, []);

  const handleRoleChange = (role: UserRole) => {
    db.switchRole(role);
    setCurrentRole(role);
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveTab('live');
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab('profile');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans antialiased selection:bg-lime-500 selection:text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenProfile={() => setShowOnboardingModal(true)}
        onShareMatch={() => setShowShareModal(true)}
      />

      {/* Main View Router */}
      <main className="transition-all duration-200">
        {activeTab === 'home' && (
          <HomeView
            onSelectMatch={handleSelectMatch}
            onSelectPlayer={handleSelectPlayer}
            onNavigateToScorer={() => setActiveTab('scoring')}
          />
        )}

        {activeTab === 'live' && (
          <MatchDetailView
            matchId={selectedMatchId}
            onShareMatch={() => setShowShareModal(true)}
          />
        )}

        {activeTab === 'scoring' && (
          <ScoringInterface
            matchId={selectedMatchId}
            onViewLiveMatch={() => setActiveTab('live')}
          />
        )}

        {activeTab === 'tournaments' && (
          <TournamentView onSelectMatch={handleSelectMatch} />
        )}

        {activeTab === 'rankings' && <RankingsView />}

        {activeTab === 'admin' && <AdminDashboard />}

        {activeTab === 'profile' && (
          <PlayerProfileView playerId={selectedPlayerId} />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={currentRole}
      />

      {/* Global Modals */}
      {showSearchModal && (
        <SearchModal
          onClose={() => setShowSearchModal(false)}
          onSelectPlayer={handleSelectPlayer}
          onSelectMatch={handleSelectMatch}
        />
      )}

      {showShareModal && (
        <PublicMatchLinkModal
          matchId={selectedMatchId}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showOnboardingModal && (
        <OnboardingModal onClose={() => setShowOnboardingModal(false)} />
      )}
    </div>
  );
}
