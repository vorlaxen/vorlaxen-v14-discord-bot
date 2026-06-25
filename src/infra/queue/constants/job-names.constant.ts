export const BackgroundJobNames = {
  EXECUTE: 'background:execute',
} as const;

export type BackgroundJobName =
  (typeof BackgroundJobNames)[keyof typeof BackgroundJobNames];
