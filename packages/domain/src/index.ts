// Everything the domain package offers to the other packages is exported from here.

// Exports music related types and classes.
export { DEGREES, isDegree } from "./music/Degree";
export type { Degree } from "./music/Degree";
export { PITCH_CLASSES } from "./music/PitchClass";
export type { PitchClass } from "./music/PitchClass";
export { Scale } from "./music/Scale";
export { ScaleType } from "./music/ScaleType";

export type { Point } from "./geometry/Point";
export type { Layout } from "./layouts/Layout";
export { SingleBoxLayout } from './layouts/SingleBoxLayout';
export { PadGridLayout } from './layouts/PadGridLayout';
export { ZigzagLayout } from './layouts/ZigzagLayout';
export { TwoColumnLayout } from './layouts/TwoColumnLayout';
export type { Region } from './layouts/Region';

export type { Handedness, Landmark, TrackedHand } from './hand/TrackedHand';
export type { HandFeatures } from './hand/HandFeatures';
export { HandFeatureExtractor } from './hand/HandFeatureExtractor';
export { HandLandmark, LANDMARK_COUNT } from './hand/HandLandmark';
export { pickHand } from './hand/pickHand';

export { CalibrationProfile, DEFAULT_CALIBRATION_PROFILE } from './calibration/CalibrationProfile';
export { ControlCalibration } from './calibration/ControlCalibration';
export type { HandControls } from './calibration/HandControls';

export { DEFAULT_VOLUME_THRESHOLD, Instrument } from './instrument/Instrument';
export type { InstrumentFrame, NoteChange } from './instrument/InstrumentFrame';
