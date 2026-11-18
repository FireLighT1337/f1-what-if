import { DriverRaceResult } from '../../core/models';

/** What the position column of a race shows: the position, or a short code for why there is none. */
export function finishLabel(race: Pick<DriverRaceResult, 'entered' | 'finishPosition' | 'positionText'>): string {
  if (!race.entered) {
    return '–';
  }
  if (race.finishPosition !== null) {
    return String(race.finishPosition);
  }
  switch (race.positionText) {
    case 'R':
      return 'Ret';
    case 'D':
      return 'DSQ';
    case 'E':
      return 'EX';
    case 'W':
      return 'WD';
    case 'F':
      return 'DNQ';
    case 'N':
      return 'NC';
    default:
      return race.positionText && race.positionText !== '' ? race.positionText : '–';
  }
}

export function finishDescription(race: Pick<DriverRaceResult, 'entered' | 'finishPosition' | 'positionText'>): string {
  if (!race.entered) {
    return 'Did not take part';
  }
  if (race.finishPosition !== null) {
    return `Finished ${race.finishPosition}${suffix(race.finishPosition)}`;
  }
  switch (race.positionText) {
    case 'R':
      return 'Retired';
    case 'D':
      return 'Disqualified';
    case 'E':
      return 'Excluded';
    case 'W':
      return 'Withdrew';
    case 'F':
      return 'Failed to qualify';
    case 'N':
      return 'Not classified';
    default:
      return 'Not classified';
  }
}

/** Highlight colours for the podium; retirements and the like are shown in red. */
export function finishClass(race: Pick<DriverRaceResult, 'entered' | 'finishPosition'>): string {
  if (!race.entered) {
    return 'text-zinc-600';
  }
  switch (race.finishPosition) {
    case 1:
      return 'font-semibold text-amber-300';
    case 2:
      return 'font-semibold text-zinc-200';
    case 3:
      return 'font-semibold text-orange-300';
    case null:
      return 'text-red-400';
    default:
      return 'text-zinc-300';
  }
}

function suffix(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return 'th';
  }
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** "Alain Prost" -> "AP"; used when there is no photo. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('');
}
