// =============================================================================
// COLLEGE CRICKET TYPES & INTERFACES
// =============================================================================

export type UserRole =
  | 'super_admin'
  | 'organizer'
  | 'captain'
  | 'umpire'
  | 'player'
  // Legacy values kept temporarily so existing records continue to work.
  | 'college_admin'
  | 'tournament_organizer'
  | 'team_manager'
  | 'scorer'
  | 'spectator';

export type BattingStyle = 'right_hand' | 'left_hand';
export type BowlingStyle = 'right_arm_fast' | 'right_arm_medium' | 'right_arm_spin' | 'left_arm_fast' | 'left_arm_medium' | 'left_arm_spin' | 'none';
export type PlayerRole = 'batsman' | 'bowler' | 'all_rounder' | 'wicket_keeper';
export type MatchFormat = 't10' | 't20' | '30_overs' | '40_overs' | '50_overs' | 'custom';
export type BallType = 'leather' | 'tennis_heavy' | 'tennis_light';
export type MatchStatus = 'scheduled' | 'toss' | 'live' | 'innings_break' | 'completed' | 'abandoned' | 'cancelled';
export type TossDecision = 'bat' | 'bowl';
export type ExtraType = 'none' | 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'penalty';
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'retired_hurt' | 'obstructing_field' | 'timed_out' | 'other';
export type TournamentType = 'league' | 'round_robin' | 'knockout' | 'league_knockout' | 'custom';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  role: UserRole;
  college_id?: string;
  college_name?: string;
  city?: string;
  state?: string;
  jersey_number?: number;
  playing_role?: PlayerRole;
  batting_style?: BattingStyle;
  bowling_style?: BowlingStyle;
  is_verified?: boolean;
  created_at?: string;
}

export interface MatchRoom {
  id: string;
  room_code: string;
  room_name: string;
  match_name: string;
  venue: string;
  organizer_id: string;
  match_id?: string;
  status: 'live' | 'completed' | 'closed';
  created_at?: string;
  closed_at?: string;
}

export interface College { id: string; name: string; short_code: string; logo_url?: string; city: string; state: string; website?: string; description?: string; is_verified: boolean; teams_count?: number; players_count?: number; }
export interface Team { id: string; college_id: string; college_name?: string; name: string; short_name: string; logo_url?: string; jersey_color?: string; captain_id?: string; vice_captain_id?: string; wicket_keeper_id?: string; manager_id?: string; members?: TeamMember[]; stats?: { played: number; won: number; lost: number; tied: number; win_percentage: number; }; }
export interface TeamMember { id: string; team_id: string; player_id: string; player_name: string; avatar_url?: string; jersey_number?: number; playing_role: PlayerRole; batting_style: BattingStyle; bowling_style: BowlingStyle; is_active: boolean; }
export interface Tournament { id: string; name: string; short_name: string; organizer_id: string; organizer_name?: string; college_id?: string; college_name?: string; logo_url?: string; tournament_type: TournamentType; overs_per_match: number; ball_type: BallType; start_date: string; end_date: string; venue: string; rules?: string; is_active: boolean; teams_count?: number; }
export interface PointsTableEntry { id: string; tournament_id: string; team_id: string; team_name: string; team_logo?: string; group_name?: string; played: number; won: number; lost: number; tied: number; no_result: number; points: number; net_run_rate: number; runs_scored: number; overs_faced: number; runs_conceded: number; overs_bowled: number; }
export interface MatchPlayer { player_id: string; player_name: string; team_id: string; is_playing_xi: boolean; is_captain?: boolean; is_vice_captain?: boolean; is_wicket_keeper?: boolean; }
export interface Delivery { id: string; match_id: string; innings_id: string; over_number: number; ball_number: number; legal_ball_number: number; striker_id: string; striker_name: string; non_striker_id: string; non_striker_name: string; bowler_id: string; bowler_name: string; runs_bat: number; runs_extra: number; total_runs: number; extra_type: ExtraType; is_wicket: boolean; wicket_type?: WicketType; dismissed_player_id?: string; dismissed_player_name?: string; fielder_id?: string; fielder_name?: string; commentary: string; timestamp: string; scorer_id?: string; wagon_x?: number; wagon_y?: number; }
export interface BatterInnings { player_id: string; player_name: string; runs: number; balls: number; fours: number; sixes: number; strike_rate: number; is_out: boolean; dismissal_info?: string; }
export interface BowlerInnings { player_id: string; player_name: string; overs: number; balls_bowled: number; maidens: number; runs_conceded: number; wickets: number; economy: number; }
export interface InningsState { id: string; match_id: string; batting_team_id: string; batting_team_name: string; bowling_team_id: string; bowling_team_name: string; innings_number: number; total_runs: number; total_wickets: number; total_overs: number; legal_balls_bowled: number; target_runs?: number; extras: { wides: number; no_balls: number; byes: number; leg_byes: number; penalties: number; total: number; }; current_striker_id: string; current_non_striker_id: string; current_bowler_id: string; batters: Record<string, BatterInnings>; bowlers: Record<string, BowlerInnings>; deliveries: Delivery[]; fall_of_wickets: { wicket: number; runs: number; over: number; player_name: string }[]; partnerships: { current_runs: number; current_balls: number }; is_completed: boolean; }
export interface CricketMatch { id: string; tournament_id?: string; tournament_name?: string; team_a_id: string; team_a_name: string; team_a_logo?: string; team_b_id: string; team_b_name: string; team_b_logo?: string; venue: string; match_date: string; format: MatchFormat; total_overs: number; ball_type: BallType; status: MatchStatus; toss_winner_id?: string; toss_winner_name?: string; toss_decision?: TossDecision; first_innings_team_id?: string; second_innings_team_id?: string; current_innings_number: number; first_innings?: InningsState; second_innings?: InningsState; playing_xi_a: MatchPlayer[]; playing_xi_b: MatchPlayer[]; scorer_id?: string; scorer_name?: string; winner_id?: string; winner_name?: string; result_summary?: string; player_of_match_id?: string; player_of_match_name?: string; room_id?: string; room_code?: string; }
export interface PlayerCareerStats { player_id: string; player_name: string; matches: number; innings: number; not_outs: number; runs: number; highest_score: number; highest_score_not_out: boolean; balls_faced: number; batting_average: number; strike_rate: number; fours: number; sixes: number; fifties: number; hundreds: number; ducks: number; bowling_innings: number; balls_bowled: number; overs_bowled: number; runs_conceded: number; wickets: number; maidens: number; bowling_average: number; economy: number; best_bowling_wickets: number; best_bowling_runs: number; three_wickets: number; five_wickets: number; catches: number; stumpings: number; man_of_matches: number; }
export interface Achievement { id: string; code: string; title: string; description: string; badge_icon: string; unlocked_at?: string; }
export interface AuditLog { id: string; user_id: string; user_name: string; action: string; entity_type: string; entity_id: string; details: string; timestamp: string; }
