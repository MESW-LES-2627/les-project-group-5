import './styles.css';
import {
  DEFAULT_CALIBRATION_PROFILE,
  HandFeatureExtractor,
  Instrument,
  TwoColumnLayout,
  ZigzagLayout,
  Scale,
  ScaleType,
  type Layout,
} from '@instrument/domain';
import { ApiClient } from './api/ApiClient';
import { SoundOutput } from './audio/SoundOutput';
import { WebAudioSynth } from './audio/WebAudioSynth';
import { Camera, CameraError, type CameraProblem } from './camera/Camera';
import { InstrumentLoop } from './instrument/InstrumentLoop';
import { InstrumentPage } from './pages/InstrumentPage';
import { MediaPipeHandTracker } from './tracking/MediaPipeHandTracker';
import { SettingsStore } from './settings/SettingsStore';
import { SettingsPage } from './pages/SettingsPage';

// Composition root: the only place that creates the concrete classes and connects them.
// Everything else receives what it needs through its constructor.

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app element');

// Both screens stay mounted and only one is visible. Removing the instrument page would destroy
// the video and stop the camera, so the player would have to press Start again after every visit to settings.
const instrumentRoot = document.createElement('div');
const settingsRoot = document.createElement('div');
root.append(instrumentRoot, settingsRoot);

const showRoute = () => {
  const onSettings = location.hash === '#/settings';
  instrumentRoot.hidden = onSettings;
  settingsRoot.hidden = !onSettings;
};

// The instrument starts with 8 notes in a zigzag of two rows and a fixed scale.
const scale = new Scale('C', ScaleType.MAJOR);
const hand = 'Right';
const mobileLayoutQuery = window.matchMedia('(max-width: 720px)');
let layout: Layout = mobileLayoutQuery.matches ? new TwoColumnLayout() : new ZigzagLayout();

const page = new InstrumentPage(instrumentRoot);
const settingsPage = new SettingsPage(settingsRoot);
const settings = new SettingsStore();
const tracker = new MediaPipeHandTracker();
const synth = new WebAudioSynth();
const camera = new Camera();
const instrument = new Instrument(layout);
const loop = new InstrumentLoop(
    tracker,
    new HandFeatureExtractor(),
    DEFAULT_CALIBRATION_PROFILE,
    instrument,
    page.video,
    hand,
);
const sound = new SoundOutput(synth, scale);
loop.subscribe((frame) => sound.onFrame(frame));
loop.subscribe((frame) => page.render(frame));

let instrumentStarted = false;
let trackerNeedsReset = false;
loop.subscribeError((error) => {
  console.error('Instrument tracking stopped unexpectedly.', error);
  loop.stop();
  instrument.update(null);
  sound.stop();
  camera.stop(page.video);
  instrumentStarted = false;
  trackerNeedsReset = true;
  page.setStatus('Hand tracking stopped. Press Try again to restart.');
  page.showStart('Try again');
});

showRoute();
addEventListener('hashchange', () => {
  showRoute();
  if (location.hash === '#/settings') {
    if (instrumentStarted) {
      loop.stop();
      instrument.update(null);
      sound.stop();
    }
  } else if (instrumentStarted) {
    loop.start();
  }
});

page.showCells(layout, scale);
mobileLayoutQuery.addEventListener('change', (event) => {
  layout = event.matches ? new TwoColumnLayout() : new ZigzagLayout();
  instrument.setLayout(layout);
  page.showCells(layout, scale);
});

settingsPage.setHand(settings.hand);
page.setHand(settings.hand);
settingsPage.onHandChange((hand) => settings.setHand(hand));
settings.subscribe((hand) => {
  loop.setDominantHand(hand);
  page.setHand(hand);
});
settingsPage.setCameraPreview(settings.cameraPreview);
page.setCameraPreviewVisible(settings.cameraPreview);
settingsPage.onCameraPreviewChange((visible) => settings.setCameraPreview(visible));
settings.subscribeCameraPreview((visible) => page.setCameraPreviewVisible(visible));

page.showInfo(scale, hand);
page.setStatus('Press Start, allow the camera, and play with your right hand.');

// Start loading the hand model right away, so Start is quicker. Errors are shown when Start is pressed.
tracker.init().catch((error: unknown) => {
  console.error('Could not preload the hand tracking model.', error);
});

// Show whether the server is reachable. The instrument works either way; the server is only needed for accounts.
const SERVER_CHECK_INTERVAL_MS = 10_000;
const api = new ApiClient();
const checkServer = async () => {
  const online = await api.isServerOnline();
  page.setServerStatus(online);
  settingsPage.setServerStatus(online);
};
void checkServer();
setInterval(checkServer, SERVER_CHECK_INTERVAL_MS);

const CAMERA_MESSAGES: Record<CameraProblem, string> = {
  denied: 'Camera access is blocked. Allow the camera in your browser (icon in the address bar), then press Try again.',
  'not-found': 'No camera found. Connect a camera, then press Try again.',
  unsupported: 'This page can’t use the camera. Open it from localhost or an https:// address.',
  unknown: 'The camera could not be started. Close other apps that use it, then press Try again.',
};

page.onStart(async () => {
  page.setStartEnabled(false);
  try {
    if (trackerNeedsReset) {
      tracker.resetForRetry();
      trackerNeedsReset = false;
    }
    // Audio must be unlocked inside the click, before anything else is awaited.
    await synth.start();
    page.setStatus('Opening the camera…');
    await camera.open(page.video);
    page.setStatus('Loading hand tracking…');
    await tracker.init();
  } catch (error) {
    camera.stop(page.video);
    page.setStatus(
      error instanceof CameraError
        ? CAMERA_MESSAGES[error.problem]
        : 'Hand tracking could not be loaded. Check your connection, then press Try again.',
    );
    page.showStart('Try again');
    return;
  }
  page.hideStart();
  page.setStatus('');
  instrumentStarted = true;
  if (location.hash !== '#/settings') loop.start();
});
