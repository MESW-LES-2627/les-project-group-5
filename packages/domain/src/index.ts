// Everything the domain package offers to the other packages is exported from here.

// Exports music related types and classes.
export { DEGREES, isDegree } from './music/Degree';
export type { Degree } from './music/Degree';
export { PITCH_CLASSES } from './music/PitchClass';
export type { PitchClass } from './music/PitchClass';
export { Scale } from './music/Scale';
export { ScaleType } from './music/ScaleType';

export type { Point } from './geometry/Point';