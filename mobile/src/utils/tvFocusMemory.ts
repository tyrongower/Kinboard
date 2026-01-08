// TV focus memory is kept in module scope so it persists across screen remounts
// within the same JS runtime ("per user session").

export type TvFocusTarget = number;

interface JobsFocusMemory {
  lastFocusedHeaderButton?: TvFocusTarget;
  lastFocusedPersonCard?: TvFocusTarget;
}

const jobs: JobsFocusMemory = {};

export const tvFocusMemory = {
  jobs,
} as const;
