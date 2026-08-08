// =============================================================================
// CRICKET SCORING ENGINE (DETERMINISTIC & TESTABLE)
// =============================================================================

import {
  CricketMatch,
  Delivery,
  ExtraType,
  InningsState,
  WicketType,
} from '../types/cricket';

export interface ScoreInput {
  runsBat: number;
  extraType: ExtraType;
  runsExtra?: number; // extra penalty or bye runs
  isWicket: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  fielderId?: string;
  fielderName?: string;
  newBatterId?: string;
  newBatterName?: string;
  wagonX?: number;
  wagonY?: number;
  commentaryOverride?: string;
}

/**
 * Calculates current overs in standard notation (e.g., 34 legal balls -> 5.4 overs)
 */
export function legalBallsToOvers(legalBalls: number): number {
  const fullOvers = Math.floor(legalBalls / 6);
  const remainderBalls = legalBalls % 6;
  return Number(`${fullOvers}.${remainderBalls}`);
}

/**
 * Calculates current run rate (CRR)
 */
export function calculateCRR(totalRuns: number, legalBalls: number): number {
  if (legalBalls === 0) return 0.0;
  const oversDecimal = legalBalls / 6;
  return Number((totalRuns / oversDecimal).toFixed(2));
}

/**
 * Calculates required run rate (RRR)
 */
export function calculateRRR(
  targetRuns: number,
  currentRuns: number,
  totalOvers: number,
  legalBallsBowled: number
): number {
  const remainingRuns = targetRuns - currentRuns;
  const totalLegalBalls = totalOvers * 6;
  const remainingBalls = totalLegalBalls - legalBallsBowled;

  if (remainingRuns <= 0) return 0.0;
  if (remainingBalls <= 0) return 99.99;

  const remainingOvers = remainingBalls / 6;
  return Number((remainingRuns / remainingOvers).toFixed(2));
}

/**
 * Formats a default commentary string for a delivery
 */
export function generateCommentary(
  overNum: number,
  ballNum: number,
  bowlerName: string,
  strikerName: string,
  input: ScoreInput
): string {
  if (input.commentaryOverride) return input.commentaryOverride;

  const overBall = `${overNum}.${ballNum}`;

  if (input.isWicket) {
    const wType = input.wicketType ? input.wicketType.replace('_', ' ').toUpperCase() : 'OUT';
    return `${overBall} | ${bowlerName} to ${strikerName}, OUT! (${wType}). ${strikerName} departs!`;
  }

  if (input.extraType === 'wide') {
    const totalExtra = (input.runsExtra || 0) + 1;
    return `${overBall} | ${bowlerName} to ${strikerName}, WIDE! ${totalExtra} run(s).`;
  }

  if (input.extraType === 'no_ball') {
    const totalRuns = input.runsBat + 1 + (input.runsExtra || 0);
    return `${overBall} | ${bowlerName} to ${strikerName}, NO BALL! ${totalRuns} run(s).`;
  }

  if (input.extraType === 'bye' || input.extraType === 'leg_bye') {
    return `${overBall} | ${bowlerName} to ${strikerName}, ${input.extraType.replace('_', ' ').toUpperCase()} (${input.runsExtra || input.runsBat} runs).`;
  }

  if (input.runsBat === 6) {
    return `${overBall} | ${bowlerName} to ${strikerName}, SIX! Huge hit over the boundary! 🚀`;
  }

  if (input.runsBat === 4) {
    return `${overBall} | ${bowlerName} to ${strikerName}, FOUR! Beautiful placement to the fence! 🏏`;
  }

  if (input.runsBat === 0) {
    return `${overBall} | ${bowlerName} to ${strikerName}, Dot ball. No run.`;
  }

  return `${overBall} | ${bowlerName} to ${strikerName}, ${input.runsBat} run(s).`;
}

/**
 * Main Pure Function: Processes a single delivery and returns updated InningsState and MatchState
 */
export function processDelivery(
  match: CricketMatch,
  input: ScoreInput,
  scorerId: string = 'scorer-1'
): CricketMatch {
  const isFirstInnings = match.current_innings_number === 1;
  const currentInnings = isFirstInnings ? match.first_innings! : match.second_innings!;

  if (!currentInnings || currentInnings.is_completed) {
    return match; // Innings already finished
  }

  // Clone current state for immutability
  const updatedInnings: InningsState = JSON.parse(JSON.stringify(currentInnings));
  const totalMatchOvers = match.total_overs;

  // Determine striker, non-striker, bowler
  let strikerId = updatedInnings.current_striker_id;
  let nonStrikerId = updatedInnings.current_non_striker_id;
  let bowlerId = updatedInnings.current_bowler_id;

  let striker = updatedInnings.batters[strikerId];
  let nonStriker = updatedInnings.batters[nonStrikerId];
  let bowler = updatedInnings.bowlers[bowlerId];

  // Check extra calculations
  let isLegalBall = true;
  let batRuns = input.runsBat;
  let extraRuns = 0;

  if (input.extraType === 'wide') {
    isLegalBall = false;
    extraRuns = 1 + (input.runsExtra || 0);
    updatedInnings.extras.wides += extraRuns;
  } else if (input.extraType === 'no_ball') {
    isLegalBall = false;
    extraRuns = 1 + (input.runsExtra || 0);
    updatedInnings.extras.no_balls += extraRuns;
  } else if (input.extraType === 'bye') {
    extraRuns = input.runsExtra || batRuns;
    batRuns = 0;
    updatedInnings.extras.byes += extraRuns;
  } else if (input.extraType === 'leg_bye') {
    extraRuns = input.runsExtra || batRuns;
    batRuns = 0;
    updatedInnings.extras.leg_byes += extraRuns;
  } else if (input.extraType === 'penalty') {
    extraRuns = input.runsExtra || 5;
    batRuns = 0;
    updatedInnings.extras.penalties += extraRuns;
  }

  const deliveryTotalRuns = batRuns + extraRuns;
  updatedInnings.extras.total += extraRuns;
  updatedInnings.total_runs += deliveryTotalRuns;

  // Legal balls update
  if (isLegalBall) {
    updatedInnings.legal_balls_bowled += 1;
  }

  // Over & Ball counts
  const fullOvers = Math.floor(updatedInnings.legal_balls_bowled / 6);
  const ballsInOver = updatedInnings.legal_balls_bowled % 6;
  const ballDisplayNum = isLegalBall ? (ballsInOver === 0 ? 6 : ballsInOver) : ballsInOver + 1;
  const overDisplayNum = isLegalBall && ballsInOver === 0 ? fullOvers - 1 : fullOvers;

  updatedInnings.total_overs = legalBallsToOvers(updatedInnings.legal_balls_bowled);

  // Update Batter Stats
  if (striker) {
    if (input.extraType !== 'wide') {
      striker.balls += 1; // Wides don't count as ball faced
    }
    striker.runs += batRuns;
    if (batRuns === 4) striker.fours += 1;
    if (batRuns === 6) striker.sixes += 1;
    striker.strike_rate = striker.balls > 0 ? Number(((striker.runs / striker.balls) * 100).toFixed(2)) : 0;
  }

  // Update Bowler Stats
  if (bowler) {
    if (isLegalBall) {
      bowler.balls_bowled += 1;
      bowler.overs = legalBallsToOvers(bowler.balls_bowled);
    }
    // Runs conceded by bowler (Bat runs + Wides + No Balls; Byes/Leg Byes don't count against bowler)
    const runsAgainstBowler = batRuns + (input.extraType === 'wide' || input.extraType === 'no_ball' ? extraRuns : 0);
    bowler.runs_conceded += runsAgainstBowler;
    bowler.economy = bowler.balls_bowled > 0 ? Number(((bowler.runs_conceded / bowler.balls_bowled) * 6).toFixed(2)) : 0;
  }

  // Handle Wicket
  if (input.isWicket) {
    updatedInnings.total_wickets += 1;
    const dismissedId = input.dismissedPlayerId || strikerId;

    if (updatedInnings.batters[dismissedId]) {
      updatedInnings.batters[dismissedId].is_out = true;
      updatedInnings.batters[dismissedId].dismissal_info = input.wicketType
        ? `${input.wicketType.replace('_', ' ')} b ${bowler?.player_name || ''} ${
            input.fielderName ? `c ${input.fielderName}` : ''
          }`
        : 'Out';
    }

    // Bowler gets wicket for non-runout/retired dismissals
    if (
      bowler &&
      input.wicketType !== 'run_out' &&
      input.wicketType !== 'retired_hurt' &&
      input.wicketType !== 'obstructing_field' &&
      input.wicketType !== 'timed_out'
    ) {
      bowler.wickets += 1;
    }

    // Fall of wicket entry
    updatedInnings.fall_of_wickets.push({
      wicket: updatedInnings.total_wickets,
      runs: updatedInnings.total_runs,
      over: updatedInnings.total_overs,
      player_name: updatedInnings.batters[dismissedId]?.player_name || 'Batter',
    });

    // Reset partnership
    updatedInnings.partnerships = { current_runs: 0, current_balls: 0 };

    // Set new batter if available
    if (input.newBatterId && input.newBatterName) {
      if (!updatedInnings.batters[input.newBatterId]) {
        updatedInnings.batters[input.newBatterId] = {
          player_id: input.newBatterId,
          player_name: input.newBatterName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strike_rate: 0,
          is_out: false,
        };
      }
      if (dismissedId === strikerId) {
        updatedInnings.current_striker_id = input.newBatterId;
      } else {
        updatedInnings.current_non_striker_id = input.newBatterId;
      }
    }
  } else {
    // Update partnership
    updatedInnings.partnerships.current_runs += deliveryTotalRuns;
    if (isLegalBall) updatedInnings.partnerships.current_balls += 1;
  }

  // Generate Delivery Record
  const deliveryRecord: Delivery = {
    id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    match_id: match.id,
    innings_id: updatedInnings.id,
    over_number: overDisplayNum,
    ball_number: ballDisplayNum,
    legal_ball_number: updatedInnings.legal_balls_bowled,
    striker_id: strikerId,
    striker_name: striker?.player_name || 'Striker',
    non_striker_id: nonStrikerId,
    non_striker_name: nonStriker?.player_name || 'Non-Striker',
    bowler_id: bowlerId,
    bowler_name: bowler?.player_name || 'Bowler',
    runs_bat: batRuns,
    runs_extra: extraRuns,
    total_runs: deliveryTotalRuns,
    extra_type: input.extraType,
    is_wicket: input.isWicket,
    wicket_type: input.wicketType,
    dismissed_player_id: input.dismissedPlayerId,
    dismissed_player_name: updatedInnings.batters[input.dismissedPlayerId || '']?.player_name,
    fielder_id: input.fielderId,
    fielder_name: input.fielderName,
    commentary: generateCommentary(
      overDisplayNum,
      ballDisplayNum,
      bowler?.player_name || 'Bowler',
      striker?.player_name || 'Striker',
      input
    ),
    timestamp: new Date().toISOString(),
    scorer_id: scorerId,
    wagon_x: input.wagonX,
    wagon_y: input.wagonY,
  };

  updatedInnings.deliveries.push(deliveryRecord);

  // Strike Rotation Logic
  // 1. Odd runs on bat or extras -> swap strikers
  const runsToRotate = input.extraType === 'bye' || input.extraType === 'leg_bye' ? extraRuns : batRuns;
  if (runsToRotate % 2 !== 0 && !input.isWicket) {
    const temp = updatedInnings.current_striker_id;
    updatedInnings.current_striker_id = updatedInnings.current_non_striker_id;
    updatedInnings.current_non_striker_id = temp;
  }

  // 2. End of over (6 legal balls completed) -> swap strikers
  if (isLegalBall && ballsInOver === 0) {
    const temp = updatedInnings.current_striker_id;
    updatedInnings.current_striker_id = updatedInnings.current_non_striker_id;
    updatedInnings.current_non_striker_id = temp;
  }

  // Check Innings Completion Conditions
  let matchStatus = match.status;
  let winnerId = match.winner_id;
  let winnerName = match.winner_name;
  let resultSummary = match.result_summary;

  const isAllOut = updatedInnings.total_wickets >= 10;
  const isOversFinished = updatedInnings.legal_balls_bowled >= totalMatchOvers * 6;

  // Second Innings Target Check
  if (!isFirstInnings && match.first_innings) {
    const target = match.first_innings.total_runs + 1;
    updatedInnings.target_runs = target;

    // Chased down target -> Team B wins!
    if (updatedInnings.total_runs >= target) {
      updatedInnings.is_completed = true;
      matchStatus = 'completed';
      winnerId = currentInnings.batting_team_id;
      winnerName = currentInnings.batting_team_name;
      const wicketsLeft = 10 - updatedInnings.total_wickets;
      resultSummary = `${currentInnings.batting_team_name} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}! 🏆`;
    } else if (isAllOut || isOversFinished) {
      // Innings finished without chasing target -> Team A wins or Tie
      updatedInnings.is_completed = true;
      matchStatus = 'completed';
      if (updatedInnings.total_runs === match.first_innings.total_runs) {
        resultSummary = 'Match Tied!';
      } else {
        const marginRuns = match.first_innings.total_runs - updatedInnings.total_runs;
        winnerId = match.first_innings.batting_team_id;
        winnerName = match.first_innings.batting_team_name;
        resultSummary = `${match.first_innings.batting_team_name} won by ${marginRuns} run${marginRuns > 1 ? 's' : ''}! 🏆`;
      }
    }
  } else if (isFirstInnings) {
    if (isAllOut || isOversFinished) {
      updatedInnings.is_completed = true;
      matchStatus = 'innings_break';
    } else {
      matchStatus = 'live';
    }
  }

  // Assemble updated match object
  return {
    ...match,
    status: matchStatus,
    winner_id: winnerId,
    winner_name: winnerName,
    result_summary: resultSummary,
    first_innings: isFirstInnings ? updatedInnings : match.first_innings,
    second_innings: !isFirstInnings ? updatedInnings : match.second_innings,
  };
}

/**
 * Undoes the last delivery from the match innings
 */
export function undoLastDelivery(match: CricketMatch): CricketMatch {
  const isFirstInnings = match.current_innings_number === 1;
  const currentInnings = isFirstInnings ? match.first_innings : match.second_innings;

  if (!currentInnings || currentInnings.deliveries.length === 0) {
    return match;
  }

  // Re-build state from scratch up to last delivery - 1
  const allDeliveries = [...currentInnings.deliveries];
  allDeliveries.pop();

  // Reset current innings object
  const cleanInnings: InningsState = {
    ...currentInnings,
    total_runs: 0,
    total_wickets: 0,
    total_overs: 0.0,
    legal_balls_bowled: 0,
    extras: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0, penalties: 0, total: 0 },
    deliveries: [],
    fall_of_wickets: [],
    partnerships: { current_runs: 0, current_balls: 0 },
    is_completed: false,
  };

  // Replay deliveries
  let updatedMatch: CricketMatch = {
    ...match,
    status: 'live',
    first_innings: isFirstInnings ? cleanInnings : match.first_innings,
    second_innings: !isFirstInnings ? cleanInnings : match.second_innings,
  };

  // Re-run deliveries
  for (const del of allDeliveries) {
    const input: ScoreInput = {
      runsBat: del.runs_bat,
      extraType: del.extra_type,
      runsExtra: del.runs_extra,
      isWicket: del.is_wicket,
      wicketType: del.wicket_type,
      dismissedPlayerId: del.dismissed_player_id,
      fielderId: del.fielder_id,
      fielderName: del.fielder_name,
      wagonX: del.wagon_x,
      wagonY: del.wagon_y,
      commentaryOverride: del.commentary,
    };
    updatedMatch = processDelivery(updatedMatch, input, del.scorer_id);
  }

  return updatedMatch;
}
