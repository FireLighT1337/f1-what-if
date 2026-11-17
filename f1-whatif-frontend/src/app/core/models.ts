/** Shapes of the JSON returned by the backend. */

export interface SeasonSummary {
  year: number;
  raceCount: number;
  sprintRaceCount: number;
}

export interface RulesetSummary {
  code: string;
  name: string;
  description: string;
}

export type ShortenedPolicy = 'NONE' | 'HALF_1980' | 'TIERED_2022';

export interface RulesetDetail {
  code: string;
  name: string;
  description: string;
  /** Finishing position -> points. JSON object keys are strings. */
  racePoints: Record<string, number>;
  sprintPoints: Record<string, number>;
  fastestLapPoint: number;
  fastestLapRequiresTopTen: boolean;
  shortenedPolicy: ShortenedPolicy;
}

export interface RaceInfo {
  /** Database id; only used to build standings requests. Scenarios refer to races by round. */
  id: number | null;
  round: number;
  name: string;
  date: string | null;
  circuit: string;
  locality: string | null;
  country: string | null;
  hasSprint: boolean;
  shortened: boolean;
  shortenedNote: string | null;
}

export interface SeasonDriver {
  id: number;
  code: string | null;
  name: string;
  nationality: string | null;
  teams: string[];
}

export interface StandingRow {
  rank: number;
  driverId: number;
  driver: string;
  points: number;
  actualRank: number | null;
  /** Places gained (positive) or lost (negative) compared with the real standings. */
  positionChange: number | null;
}

export interface StandingsResponse {
  season: number;
  ruleset: string;
  standings: StandingRow[];
}

/** What the standings endpoint needs; excluded races are database ids, not rounds. */
export interface StandingsQuery {
  year: number;
  ruleset: string;
  includeSprints: boolean;
  countBest: number | null;
  excludeDrivers: number[];
  excludeRaces: number[];
}
