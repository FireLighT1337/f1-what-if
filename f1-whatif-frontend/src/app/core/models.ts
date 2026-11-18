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

/** One driver's season: how they finished every race. */

export interface DriverProfile {
  id: number;
  name: string;
  code: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
  wikipediaUrl: string | null;
}

export interface SprintResultInfo {
  grid: number | null;
  finishPosition: number | null;
  positionText: string | null;
  points: number | null;
}

export interface DriverRaceResult {
  round: number;
  raceName: string;
  date: string | null;
  shortened: boolean;
  /** False when the driver did not take part in this race. */
  entered: boolean;
  team: string | null;
  grid: number | null;
  /** Null when the driver was not classified; positionText then says why. */
  finishPosition: number | null;
  positionText: string | null;
  status: string | null;
  points: number | null;
  sprint: SprintResultInfo | null;
}

export interface DriverSeasonSummary {
  racesEntered: number;
  wins: number;
  podiums: number;
  points: number;
}

export interface DriverSeasonResponse {
  driver: DriverProfile;
  season: number;
  summary: DriverSeasonSummary;
  races: DriverRaceResult[];
}

/** A freely licensed photo from Wikimedia Commons; photoUrl is null when there is none. */
export interface DriverPhoto {
  photoUrl: string | null;
  sourceUrl: string | null;
  articleUrl: string | null;
  width: number | null;
  height: number | null;
}
