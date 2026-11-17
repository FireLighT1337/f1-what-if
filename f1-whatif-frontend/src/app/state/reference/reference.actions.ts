import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RaceInfo, RulesetDetail, RulesetSummary, SeasonDriver, SeasonSummary } from '../../core/models';

export const ReferenceActions = createActionGroup({
  source: 'Reference',
  events: {
    'Initial Load Requested': emptyProps(),
    'Initial Load Succeeded': props<{ seasons: SeasonSummary[]; rulesets: RulesetSummary[] }>(),
    'Initial Load Failed': props<{ error: string }>(),
    'Season Data Succeeded': props<{ year: number; races: RaceInfo[]; drivers: SeasonDriver[] }>(),
    'Season Data Failed': props<{ year: number; error: string }>(),
    'Ruleset Detail Succeeded': props<{ detail: RulesetDetail }>(),
    'Ruleset Detail Failed': props<{ code: string; error: string }>(),
  },
});
