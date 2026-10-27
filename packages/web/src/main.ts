import './styles.css';
import {
  DEFAULT_CALIBRATION_PROFILE,
  HandFeatureExtractor,
  Instrument,
  SingleBoxLayout,
  Scale,
  ScaleType,
  type Handedness,
} from '@instrument/domain';
import { ApiClient } from './api/ApiClient';
import { SoundOutput } from './audio/SoundOutput';
import { WebAudioSynth } from './audio/WebAudioSynth';
import { Camera, CameraError, type CameraProblem } from './camera/Camera';
import { InstrumentLoop } from './instrument/InstrumentLoop';
import { InstrumentPage } from './pages/InstrumentPage';
import { MediaPipeHandTracker } from './tracking/MediaPipeHandTracker';

// Composition root: the only place that creates the concrete classes and connects them.
// Everything else receives what it needs through its constructor.

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app element');

// Vertical prototype: one box that plays C, with a fixed scale and hand. Settings come in Sprint 2.
// Sprint 1: replace SingleBoxLayout with PadGridLayout (task B) here; nothing else needs to change.
const scale = new Scale('C', ScaleType.MAJOR);
const layout = new SingleBoxLayout();
const DEFAULT_HAND: Handedness = 'Right';

const page = new InstrumentPage(root);
const tracker = new MediaPipeHandTracker();
const synth = new WebAudioSynth();
const camera = new Camera();
const loop = new InstrumentLoop(
    tracker,
    new HandFeatureExtractor(),
    DEFAULT_CALIBRATION_PROFILE,
    new Instrument(layout),
    page.video,
    DEFAULT_HAND,
);
const sound = new SoundOutput(synth, scale);
loop.subscribe((frame) => sound.onFrame(frame));
loop.subscribe((frame) => page.render(frame));

const startInstruction = (hand: Handedness) => `Press Start, allow the camera, and play with your ${hand.toLowerCase()} hand.`;

// The instruction before Start is the only text main.ts replaces on a hand change.
// After Start, the status line belongs to the start flow and to page.render().
let started = false;

page.showCells(layout, scale);
page.setHand(DEFAULT_HAND);
page.setStatus(startInstruction(DEFAULT_HAND));

page.onHandChange((hand) => {
  loop.setDominantHand(hand);
  if (!started) page.setStatus(startInstruction(hand));
});

// Start loading the hand model right away, so Start is quicker. Errors are shown when Start is pressed.
tracker.init().catch(() => undefined);

// Show whether the server is reachable. The instrument works either way; the server is only needed for accounts.
const SERVER_CHECK_INTERVAL_MS = 10_000;
const api = new ApiClient();
const checkServer = async () => page.setServerStatus(await api.isServerOnline());
void checkServer();
setInterval(checkServer, SERVER_CHECK_INTERVAL_MS);

const CAMERA_MESSAGES: Record<CameraProblem, string> = {
  denied: 'Camera access is blocked. Allow the camera in your browser (icon in the address bar), then press Try again.',
  'not-found': 'No camera found. Connect a camera, then press Try again.',
  unsupported: 'This page can’t use the camera. Open it from localhost or an https:// address.',
  unknown: 'The camera could not be started. Close other apps that use it, then press Try again.',
};

page.onStart(async () => {
  started = true;
  page.setStartEnabled(false);
  try {
    // Audio must be unlocked inside the click, before anything else is awaited.
    await synth.start();
    page.setStatus('Opening the camera…');
    await camera.open(page.video);
    page.setStatus('Loading hand tracking…');
    await tracker.init();
  } catch (error) {
    page.setStatus(
        error instanceof CameraError ? CAMERA_MESSAGES[error.problem] : 'Hand tracking could not be loaded. Check your connection, then press Try again.',
    );
    page.showStart('Try again');
    return;
  }
  page.hideStart();
  page.setStatus('');
  loop.start();
});
