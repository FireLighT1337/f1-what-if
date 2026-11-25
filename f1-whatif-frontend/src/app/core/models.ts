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

/** Accounts and saved scenarios. */

export interface UserInfo {
  id: number;
  username: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface ScenarioRequest {
  name: string;
  seasonYear: number;
  rulesetCode: string;
  includeSprints: boolean;
  countBest: number | null;
  excludedDriverIds: number[];
  /** Races are saved by round number, because race ids change when a season is imported again. */
  excludedRounds: number[];
}

export interface ScenarioResponse extends ScenarioRequest {
  id: number;
  /** Set while the scenario is shared; anyone with this id can view it. */
  publicId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The scenario settings that the driver page needs; races are excluded by round, as in saved scenarios. */
export interface ScenarioParams {
  ruleset: string;
  includeSprints: boolean;
  countBest: number | null;
  excludeDrivers: number[];
  excludeRounds: number[];
}

/** A sprint under a scenario: what really happened, and the position and points the scenario gives. */
export interface DriverScenarioSprint {
  realFinishPosition: number | null;
  realPositionText: string | null;
  finishPosition: number | null;
  points: number;
}

export interface DriverScenarioRace {
  round: number;
  raceName: string;
  date: string | null;
  shortened: boolean;
  entered: boolean;
  /** The scenario leaves this race out. */
  excluded: boolean;
  team: string | null;
  grid: number | null;
  status: string | null;
  realFinishPosition: number | null;
  realPositionText: string | null;
  /** The position the scenario gives; null when the race is excluded or not entered. */
  finishPosition: number | null;
  points: number;
  /** False for excluded races and for rounds dropped because only the best results count. */
  counted: boolean;
  sprint: DriverScenarioSprint | null;
}

export interface DriverScenarioSummary {
  rank: number;
  points: number;
  racesCounted: number;
  wins: number;
  podiums: number;
}

export interface DriverScenarioResponse {
  driver: DriverProfile;
  season: number;
  rulesetCode: string;
  rulesetName: string;
  includeSprints: boolean;
  countBest: number | null;
  summary: DriverScenarioSummary;
  races: DriverScenarioRace[];
}
