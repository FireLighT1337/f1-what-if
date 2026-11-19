import { RaceInfo } from '../../core/models';
import { selectScenarioDraft, selectStandingsQuery } from './explorer.selectors';

function race(round: number, id: number | null): RaceInfo {
  return {
    id,
    round,
    name: `Race ${round}`,
    date: null,
    circuit: 'Circuit',
    locality: null,
    country: null,
    hasSprint: false,
    shortened: false,
    shortenedNote: null,
  };
}

describe('selectStandingsQuery', () => {
  const races = [race(1, 101), race(2, 102), race(3, 103)];

  it('is null until a season and a points system are selected', () => {
    expect(selectStandingsQuery.projector(null, 'x', true, null, [], [], [])).toBeNull();
    expect(selectStandingsQuery.projector(1984, null, true, null, [], [], [])).toBeNull();
  });

  it('turns excluded rounds into race ids, because the endpoint wants ids', () => {
    const query = selectStandingsQuery.projector(1984, 'classic-1961', true, 11, [5, 9], [3, 1], races);

    expect(query).toEqual({
      year: 1984,
      ruleset: 'classic-1961',
      includeSprints: true,
      countBest: 11,
      excludeDrivers: [5, 9],
      excludeRaces: [103, 101],
    });
  });

  it('leaves out rounds whose race is not known yet', () => {
    const query = selectStandingsQuery.projector(1984, 'classic-1961', false, null, [], [2, 99], races);

    expect(query?.excludeRaces).toEqual([102]);
  });

  it('leaves out races that have no id', () => {
    const query = selectStandingsQuery.projector(1984, 'classic-1961', true, null, [], [1], [race(1, null)]);

    expect(query?.excludeRaces).toEqual([]);
  });

  it('waits for the races when rounds are excluded but the season is not loaded yet', () => {
    expect(selectStandingsQuery.projector(1984, 'classic-1961', true, null, [], [6], [])).toBeNull();
  });

  it('does not wait for the races when no round is excluded', () => {
    expect(selectStandingsQuery.projector(1984, 'classic-1961', true, null, [], [], [])).not.toBeNull();
  });
});

describe('selectScenarioDraft', () => {
  it('is null until a season and a points system are selected', () => {
    expect(selectScenarioDraft.projector(null, 'x', true, null, [], [])).toBeNull();
    expect(selectScenarioDraft.projector(1984, null, true, null, [], [])).toBeNull();
  });

  it('keeps rounds as rounds, which is how scenarios are saved', () => {
    expect(selectScenarioDraft.projector(1984, 'classic-1961', false, 11, [3], [6])).toEqual({
      seasonYear: 1984,
      rulesetCode: 'classic-1961',
      includeSprints: false,
      countBest: 11,
      excludedDriverIds: [3],
      excludedRounds: [6],
    });
  });
});
