// =============================================================================
// DATABASE STORE & REALTIME SERVICE
// Starts clean: no demo/mock cricket data is loaded into the application.
// =============================================================================

import { processDelivery, ScoreInput, undoLastDelivery } from '../lib/scoring-engine';
import { supabase } from '../lib/supabase';
import {
  AuditLog,
  College,
  CricketMatch,
  PointsTableEntry,
  Profile,
  Team,
  Tournament,
} from '../types/cricket';

const STORAGE_KEYS = {
  MATCHES: 'college_cricket_matches_v1',
  PROFILES: 'college_cricket_profiles_v1',
  COLLEGES: 'college_cricket_colleges_v1',
  TEAMS: 'college_cricket_teams_v1',
  TOURNAMENTS: 'college_cricket_tournaments_v1',
  POINTS_TABLE: 'college_cricket_points_table_v1',
  AUDIT_LOGS: 'college_cricket_audit_logs_v1',
  CURRENT_USER: 'college_cricket_current_user_v1',
  OFFLINE_QUEUE: 'college_cricket_offline_queue_v1',
};

class CricketDatabaseService {
  private matches: CricketMatch[] = [];
  private profiles: Profile[] = [];
  private colleges: College[] = [];
  private teams: Team[] = [];
  private tournaments: Tournament[] = [];
  private pointsTable: PointsTableEntry[] = [];
  private auditLogs: AuditLog[] = [];
  private offlineQueue: ScoreInput[] = [];
  private currentUser: Profile = {
    id: 'guest',
    email: '',
    full_name: '',
    role: 'player',
    language: 'english',
    is_verified: false,
  };
  private listeners: Set<() => void> = new Set();
  private isOnline = true;
  private realtimeChannel: any = null;

  constructor() {
    this.clearLegacyDemoData();
    this.initializeData();
    this.setupSupabaseRealtime();
  }

  private clearLegacyDemoData() {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Could not clear legacy local data:', e);
    }
  }

  private initializeData() {
    // Intentionally empty. Real users, teams, tournaments and matches must be
    // created through the authenticated application/Supabase workflow.
    this.matches = [];
    this.profiles = [];
    this.colleges = [];
    this.teams = [];
    this.tournaments = [];
    this.pointsTable = [];
    this.auditLogs = [];
    this.offlineQueue = [];
  }

  private setupSupabaseRealtime() {
    try {
      this.realtimeChannel = supabase.channel('college-cricket-realtime');
      this.realtimeChannel
        .on('broadcast', { event: 'MATCH_UPDATE' }, (payload: any) => {
          const incoming = payload?.payload?.match as CricketMatch | undefined;
          if (!incoming) return;
          const index = this.matches.findIndex((m) => m.id === incoming.id);
          if (index >= 0) this.matches[index] = incoming;
          else this.matches.push(incoming);
          this.notify();
        })
        .on('broadcast', { event: 'AUDIT_LOG' }, (payload: any) => {
          const log = payload?.payload?.log as AuditLog | undefined;
          if (!log) return;
          this.auditLogs.unshift(log);
          if (this.auditLogs.length > 50) this.auditLogs.pop();
          this.notify();
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase Realtime channel setup:', err);
    }
  }

  private persistLocalOnly() {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(this.matches));
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
      localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(this.colleges));
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(this.teams));
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(this.tournaments));
      localStorage.setItem(STORAGE_KEYS.POINTS_TABLE, JSON.stringify(this.pointsTable));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    } catch (e) {
      console.error('Failed to save local state:', e);
    }
    this.notify();
  }

  private persist(broadcastMatch?: CricketMatch, broadcastLog?: AuditLog) {
    this.persistLocalOnly();
    if (!this.isOnline || !this.realtimeChannel) return;

    if (broadcastMatch) {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'MATCH_UPDATE',
        payload: { match: broadcastMatch },
      }).catch(() => {});
    }
    if (broadcastLog) {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'AUDIT_LOG',
        payload: { log: broadcastLog },
      }).catch(() => {});
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public toggleNetworkStatus(): boolean {
    this.isOnline = !this.isOnline;
    if (this.isOnline && this.offlineQueue.length > 0) this.syncOfflineQueue();
    this.notify();
    return this.isOnline;
  }

  public getNetworkStatus() { return this.isOnline; }
  public getOfflineQueueCount() { return this.offlineQueue.length; }

  private syncOfflineQueue() {
    // Offline scoring must be associated with a real room. There is no demo
    // match fallback anymore, so queued entries are only synced when a real
    // room implementation supplies the match id.
    this.offlineQueue = [];
    this.notify();
  }

  public getCurrentUser(): Profile { return this.currentUser; }

  public setCurrentUser(user: Profile) {
    this.currentUser = user;
    this.persist();
  }

  public switchRole(role: Profile['role']) {
    this.currentUser = { ...this.currentUser, role };
    this.persist();
  }

  public updateUserProfile(updated: Partial<Profile>) {
    this.currentUser = { ...this.currentUser, ...updated };
    const index = this.profiles.findIndex((p) => p.id === this.currentUser.id);
    if (index >= 0) this.profiles[index] = { ...this.profiles[index], ...updated };
    else this.profiles.push(this.currentUser);
    this.persist();
  }

  public getMatch(id: string): CricketMatch | undefined {
    return this.matches.find((m) => m.id === id);
  }

  public getMatches(): CricketMatch[] { return this.matches; }

  public recordDelivery(matchId: string, input: ScoreInput) {
    if (!this.isOnline) {
      this.offlineQueue.push(input);
      this.persist();
      return;
    }
    const index = this.matches.findIndex((m) => m.id === matchId);
    if (index === -1) return;

    const updatedMatch = processDelivery(this.matches[index], input, this.currentUser.id);
    this.matches[index] = updatedMatch;
    this.addAuditLog(
      'DELIVERY_RECORDED',
      'MATCH',
      matchId,
      `Delivery recorded: ${input.runsBat} run(s), Extra: ${input.extraType}, Wicket: ${input.isWicket}`
    );
    this.persist(updatedMatch);
  }

  public undoDelivery(matchId: string) {
    const index = this.matches.findIndex((m) => m.id === matchId);
    if (index === -1) return;
    const updatedMatch = undoLastDelivery(this.matches[index]);
    this.matches[index] = updatedMatch;
    this.addAuditLog('DELIVERY_UNDONE', 'MATCH', matchId, 'Undid previous delivery');
    this.persist(updatedMatch);
  }

  public updateMatchState(matchId: string, updated: Partial<CricketMatch>) {
    const index = this.matches.findIndex((m) => m.id === matchId);
    if (index >= 0) {
      this.matches[index] = { ...this.matches[index], ...updated };
      this.addAuditLog('MATCH_UPDATED', 'MATCH', matchId, `Match status updated to ${updated.status ?? 'changed'}`);
      this.persist(this.matches[index]);
    }
  }

  public getColleges(): College[] { return this.colleges; }
  public getCollege(id: string) { return this.colleges.find((c) => c.id === id); }
  public getTeams(): Team[] { return this.teams; }
  public getTeam(id: string) { return this.teams.find((t) => t.id === id); }
  public getProfiles(): Profile[] { return this.profiles; }
  public getTournaments(): Tournament[] { return this.tournaments; }
  public getTournament(id: string) { return this.tournaments.find((t) => t.id === id); }
  public getPointsTable(tournamentId: string) { return this.pointsTable.filter((pt) => pt.tournament_id === tournamentId); }
  public getAuditLogs(): AuditLog[] { return this.auditLogs; }

  private addAuditLog(action: string, entityType: string, entityId: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
  }

  public createCollege(college: Omit<College, 'id' | 'is_verified'>): College {
    const newCollege: College = { ...college, id: `col-${Date.now()}`, is_verified: true, teams_count: 0, players_count: 0 };
    this.colleges.push(newCollege);
    this.addAuditLog('COLLEGE_CREATED', 'COLLEGE', newCollege.id, `Created college ${newCollege.name}`);
    this.persist();
    return newCollege;
  }

  public createTeam(team: Omit<Team, 'id'>): Team {
    const newTeam: Team = { ...team, id: `team-${Date.now()}`, stats: { played: 0, won: 0, lost: 0, tied: 0, win_percentage: 0 } };
    this.teams.push(newTeam);
    this.addAuditLog('TEAM_CREATED', 'TEAM', newTeam.id, `Created team ${newTeam.name}`);
    this.persist();
    return newTeam;
  }

  public createTournament(tournament: Omit<Tournament, 'id' | 'is_active'>): Tournament {
    const newTour: Tournament = { ...tournament, id: `tour-${Date.now()}`, is_active: true, teams_count: 0 };
    this.tournaments.push(newTour);
    this.addAuditLog('TOURNAMENT_CREATED', 'TOURNAMENT', newTour.id, `Created tournament ${newTour.name}`);
    this.persist();
    return newTour;
  }
}

export const db = new CricketDatabaseService();
