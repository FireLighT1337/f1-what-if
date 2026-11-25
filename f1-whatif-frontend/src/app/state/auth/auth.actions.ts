import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserInfo } from '../../core/models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Form Opened': emptyProps(),
    'Login Submitted': props<{ username: string; password: string }>(),
    'Register Submitted': props<{ username: string; password: string }>(),
    'Login Succeeded': props<{ token: string; expiresAt: number }>(),
    'Session Restored': props<{ token: string; expiresAt: number }>(),
    'User Loaded': props<{ user: UserInfo }>(),
    'Auth Failed': props<{ error: string }>(),
    'Logout Clicked': emptyProps(),
    'Session Expired': emptyProps(),
  },
});
