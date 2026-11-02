/** Indexes of the hand landmarks used by the project, in the standard 21-point hand model. */
export const HandLandmark = {
  /** Base of the hand. Distances for openness are measured from here. */
  WRIST: 0,
  /** Tip of the index finger. It drives the pointer. */
  INDEX_TIP: 8,
  /** Knuckle of the middle finger. Wrist to here gives the palm size. */
  MIDDLE_BASE: 9,
  /** Tip of the middle finger. */
  MIDDLE_TIP: 12,
  /** Tip of the ring finger. */
  RING_TIP: 16,
  /** Tip of the little finger. */
  PINKY_TIP: 20,
} as const;

/** Number of landmarks in a complete hand. */
export const LANDMARK_COUNT = 21;
