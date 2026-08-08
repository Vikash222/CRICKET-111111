// =============================================================================
// DATABASE STORE & REALTIME SIMULATION SERVICE
// Manages local state, Supabase client emulation, offline queue & event listeners
// =============================================================================

import {
  INITIAL_LIVE_MATCH,
  MOCK_COLLEGES,
  MOCK_POINTS_TABLE,
  MOCK_PROFILES,
  MOCK_TEAMS,
  MOCK_TOURNAMENTS,
} from '../data/mock-data';
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
  private currentUser: Profile;
  private listeners: Set<() => void> = new Set();
  private isOnline: boolean = true;
  private realtimeChannel: any = null;

  constructor() {
    this.currentUser = MOCK_PROFILES[0]; // Default user: Rahul Sharma (Player)
    this.initializeData();
    this.setupSupabaseRealtime();
  }

  private setupSupabaseRealtime() {
    try {
      this.realtimeChannel = supabase.channel('college-cricket-realtime');
      this.realtimeChannel
        .on('broadcast', { event: 'MATCH_UPDATE' }, (payload: any) => {
          if (payload?.payload?.match) {
            const incoming: CricketMatch = payload.payload.match;
            const index = this.matches.findIndex((m) => m.id === incoming.id);
            if (index >= 0) {
              this.matches[index] = incoming;
            } else {
              this.matches.push(incoming);
            }
            this.persistLocalOnly();
          }
        })
        .on('broadcast', { event: 'AUDIT_LOG' }, (payload: any) => {
          if (payload?.payload?.log) {
            this.auditLogs.unshift(payload.payload.log);
            if (this.auditLogs.length > 50) this.auditLogs.pop();
            this.persistLocalOnly();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase Realtime channel setup:', err);
    }
  }

  private initializeData() {
    try {
      const storedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
      this.matches = storedMatches ? JSON.parse(storedMatches) : [INITIAL_LIVE_MATCH];

      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : MOCK_PROFILES;

      const storedColleges = localStorage.getItem(STORAGE_KEYS.COLLEGES);
      this.colleges = storedColleges ? JSON.parse(storedColleges) : MOCK_COLLEGES;

      const storedTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
      this.teams = storedTeams ? JSON.parse(storedTeams) : MOCK_TEAMS;

      const storedTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
      this.tournaments = storedTournaments ? JSON.parse(storedTournaments) : MOCK_TOURNAMENTS;

      const storedPts = localStorage.getItem(STORAGE_KEYS.POINTS_TABLE);
      this.pointsTable = storedPts ? JSON.parse(storedPts) : MOCK_POINTS_TABLE;

      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      this.auditLogs = storedLogs
        ? JSON.parse(storedLogs)
        : [
            {
              id: 'log-1',
              user_id: 'p-1',
              user_name: 'Rahul Sharma',
              action: 'MATCH_STARTED',
              entity_type: 'MATCH',
              entity_id: 'match-live-1',
              details: 'Match initialized between DTU Gladiators and IIT Bombay Panthers',
              timestamp: new Date().toISOString(),
            },
          ];

      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn('LocalStorage error, falling back to mock defaults:', e);
      this.matches = [INITIAL_LIVE_MATCH];
      this.profiles = MOCK_PROFILES;
      this.colleges = MOCK_COLLEGES;
      this.teams = MOCK_TEAMS;
      this.tournaments = MOCK_TOURNAMENTS;
      this.pointsTable = MOCK_POINTS_TABLE;
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
      console.error('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  private persist(broadcastMatch?: CricketMatch, broadcastLog?: AuditLog) {
    this.persistLocalOnly();

    if (this.isOnline && this.realtimeChannel) {
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
  }


  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // --- ONLINE / OFFLINE TOGGLE ---
  public toggleNetworkStatus(): boolean {
    this.isOnline = !this.isOnline;
    if (this.isOnline && this.offlineQueue.length > 0) {
      this.syncOfflineQueue();
    }
    this.notify();
    return this.isOnline;
  }

  public getNetworkStatus(): boolean {
    return this.isOnline;
  }

  public getOfflineQueueCount(): number {
    return this.offlineQueue.length;
  }

  private syncOfflineQueue() {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    const matchId = 'match-live-1';
    queue.forEach((input) => {
      this.recordDelivery(matchId, input);
    });
    this.addAuditLog('OFFLINE_SYNC_COMPLETED', 'MATCH', matchId, `Synchronized ${queue.length} offline deliveries.`);
  }

  // --- USER & ROLE MANAGEMENT ---
  public getCurrentUser(): Profile {
    return this.currentUser;
  }

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
    if (index >= 0) {
      this.profiles[index] = { ...this.profiles[index], ...updated };
    } else {
      this.profiles.push(this.currentUser);
    }
    this.persist();
  }

  // --- SCORING ENGINE INTEGRATION ---
  public getMatch(id: string): CricketMatch | undefined {
    return this.matches.find((m) => m.id === id);
  }

  public getMatches(): CricketMatch[] {
    return this.matches;
  }

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

    // Log audit action
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
      this.addAuditLog('MATCH_UPDATED', 'MATCH', matchId, `Match status updated to ${updated.status}`);
      this.persist(this.matches[index]);
    }
  }

  // --- DATA GETTERS ---
  public getColleges(): College[] {
    return this.colleges;
  }

  public getCollege(id: string): College | undefined {
    return this.colleges.find((c) => c.id === id);
  }

  public getTeams(): Team[] {
    return this.teams;
  }

  public getTeam(id: string): Team | undefined {
    return this.teams.find((t) => t.id === id);
  }

  public getProfiles(): Profile[] {
    return this.profiles;
  }

  public getTournaments(): Tournament[] {
    return this.tournaments;
  }

  public getTournament(id: string): Tournament | undefined {
    return this.tournaments.find((t) => t.id === id);
  }

  public getPointsTable(tournamentId: string): PointsTableEntry[] {
    return this.pointsTable.filter((pt) => pt.tournament_id === tournamentId);
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

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

  // --- ADMIN CREATION FUNCTIONS ---
  public createCollege(college: Omit<College, 'id' | 'is_verified'>): College {
    const newCollege: College = {
      ...college,
      id: `col-${Date.now()}`,
      is_verified: true,
      teams_count: 0,
      players_count: 0,
    };
    this.colleges.push(newCollege);
    this.addAuditLog('COLLEGE_CREATED', 'COLLEGE', newCollege.id, `Created college ${newCollege.name}`);
    this.persist();
    return newCollege;
  }

  public createTeam(team: Omit<Team, 'id'>): Team {
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}`,
      stats: { played: 0, won: 0, lost: 0, tied: 0, win_percentage: 0 },
    };
    this.teams.push(newTeam);
    this.addAuditLog('TEAM_CREATED', 'TEAM', newTeam.id, `Created team ${newTeam.name}`);
    this.persist();
    return newTeam;
  }

  public createTournament(tournament: Omit<Tournament, 'id' | 'is_active'>): Tournament {
    const newTour: Tournament = {
      ...tournament,
      id: `tour-${Date.now()}`,
      is_active: true,
      teams_count: 0,
    };
    this.tournaments.push(newTour);
    this.addAuditLog('TOURNAMENT_CREATED', 'TOURNAMENT', newTour.id, `Created tournament ${newTour.name}`);
    this.persist();
    return newTour;
  }
}

export const db = new CricketDatabaseService();
