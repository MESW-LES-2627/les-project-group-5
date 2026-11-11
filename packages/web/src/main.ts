import "./styles.css";
import {
  DEFAULT_CALIBRATION_PROFILE,
  HandFeatureExtractor,
  Instrument,
  TwoColumnLayout,
  ZigzagLayout,
  Scale,
  type Layout,
} from "@instrument/domain";
import { ApiClient } from "./api/ApiClient";
import { SoundOutput } from "./audio/SoundOutput";
import { WebAudioSynth } from "./audio/WebAudioSynth";
import { Camera, CameraError, type CameraProblem } from "./camera/Camera";
import { InstrumentLoop } from "./instrument/InstrumentLoop";
import { InstrumentPage } from "./pages/InstrumentPage";
import { MediaPipeHandTracker } from "./tracking/MediaPipeHandTracker";
import { SettingsStore } from "./settings/SettingsStore";
import { SettingsPage } from "./pages/SettingsPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ConfirmEmailPage } from "./pages/ConfirmEmailPage";

// Composition root: the only place that creates the concrete classes and connects them.
// Everything else receives what it needs through its constructor.

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing #app element");

// All screens stay mounted and only one is visible. Removing the instrument page would destroy
// the video and stop the camera, so the player would have to press Start again after every visit to another page.
const instrumentRoot = document.createElement("div");
const settingsRoot = document.createElement("div");
const signUpRoot = document.createElement("div");
const confirmEmailRoot = document.createElement("div");
const screens = [instrumentRoot, settingsRoot, signUpRoot, confirmEmailRoot];
root.append(...screens);

// Each address after "#" shows one screen. Any other address shows the instrument.
// Some addresses carry values after "?" (like the token in #/confirm-email?token=...), so only the part before it counts.
const ROUTES: Record<string, HTMLElement> = {
  "#/settings": settingsRoot,
  "#/sign-up": signUpRoot,
  "#/confirm-email": confirmEmailRoot,
};
const routePath = (): string => location.hash.split("?")[0];
const routeParameter = (name: string): string =>
  new URLSearchParams(location.hash.split("?")[1] ?? "").get(name) ?? "";
const currentScreen = (): HTMLElement => ROUTES[routePath()] ?? instrumentRoot;
const onInstrument = (): boolean => currentScreen() === instrumentRoot;

const showRoute = () => {
  const visible = currentScreen();
  for (const screen of screens) screen.hidden = screen !== visible;
};
addEventListener("hashchange", showRoute);
showRoute();

// The instrument starts with 8 notes in a zigzag of two rows. Key and scale come from the settings.
const settings = new SettingsStore();
let currentScale = new Scale(settings.pitch, settings.scale);
const mobileLayoutQuery = window.matchMedia("(max-width: 720px)");
let layout: Layout = mobileLayoutQuery.matches
  ? new TwoColumnLayout()
  : new ZigzagLayout();

const page = new InstrumentPage(instrumentRoot);
const settingsPage = new SettingsPage(settingsRoot);
const signUpPage = new SignUpPage(signUpRoot);
const confirmEmailPage = new ConfirmEmailPage(confirmEmailRoot);
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
  settings.hand,
);
const sound = new SoundOutput(synth, currentScale);
loop.subscribe((frame) => sound.onFrame(frame));
loop.subscribe((frame) => page.render(frame));

let instrumentStarted = false;
let trackerNeedsReset = false;
loop.subscribeError((error) => {
  console.error("Instrument tracking stopped unexpectedly.", error);
  loop.stop();
  instrument.update(null);
  sound.stop();
  camera.stop(page.video);
  instrumentStarted = false;
  trackerNeedsReset = true;
  page.setStatus("Hand tracking stopped. Press Try again to restart.");
  page.showStart("Try again");
});

showRoute();
addEventListener("hashchange", () => {
  showRoute();
  // The instrument only runs while its page is visible.
  if (!onInstrument()) {
    if (instrumentStarted) {
      loop.stop();
      instrument.update(null);
      sound.stop();
    }
  } else if (instrumentStarted) {
    loop.start();
  }
});

page.showCells(layout, currentScale);
mobileLayoutQuery.addEventListener("change", (event) => {
  layout = event.matches ? new TwoColumnLayout() : new ZigzagLayout();
  instrument.setLayout(layout);
  page.showCells(layout, currentScale);
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
settingsPage.onCameraPreviewChange((visible) =>
  settings.setCameraPreview(visible),
);
settings.subscribeCameraPreview((visible) =>
  page.setCameraPreviewVisible(visible),
);

// One function rebuilds the scale from both settings, so it never works from a half-updated state.
const applyScale = () => {
  currentScale = new Scale(settings.pitch, settings.scale);
  sound.setScale(currentScale);
  page.showCells(layout, currentScale);
  page.showInfo(currentScale, settings.hand);
};
settings.subscribePitch(applyScale);
settings.subscribeScale(applyScale);

settingsPage.setPitch(settings.pitch);
settingsPage.setScale(settings.scale);
settingsPage.onPitchChange((pitch) => settings.setPitch(pitch));
settingsPage.onScaleChange((scale) => settings.setScale(scale));

page.showInfo(currentScale, settings.hand);
page.setStatus(`Press Start, allow the camera, and play with your ${settings.hand} hand.`);

// Start loading the hand model right away, so Start is quicker. Errors are shown when Start is pressed.
tracker.init().catch((error: unknown) => {
  console.error("Could not preload the hand tracking model.", error);
});

// Show whether the server and its database are reachable. The instrument works either way;
// they are only needed for accounts and saved data.
const SERVER_CHECK_INTERVAL_MS = 10_000;
const api = new ApiClient();
const checkServer = async () => {
  const health = await api.checkHealth();
  page.setHealthStatus(health);
  settingsPage.setServerStatus(health.server);
};
void checkServer();
setInterval(checkServer, SERVER_CHECK_INTERVAL_MS);

signUpPage.onSubmit((email, password) => api.signUp(email, password));

// The token is read when the button is clicked, from the link that opened the page.
confirmEmailPage.onConfirm(() => api.confirmEmail(routeParameter("token")));
addEventListener("hashchange", () => {
  if (currentScreen() === confirmEmailRoot) confirmEmailPage.reset();
});

const CAMERA_MESSAGES: Record<CameraProblem, string> = {
  denied:
    "Camera access is blocked. Allow the camera in your browser (icon in the address bar), then press Try again.",
  "not-found": "No camera found. Connect a camera, then press Try again.",
  unsupported:
    "This page can’t use the camera. Open it from localhost or an https:// address.",
  unknown:
    "The camera could not be started. Close other apps that use it, then press Try again.",
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
    page.setStatus("Opening the camera…");
    await camera.open(page.video);
    page.setStatus("Loading hand tracking…");
    await tracker.init();
  } catch (error) {
    camera.stop(page.video);
    page.setStatus(
      error instanceof CameraError
        ? CAMERA_MESSAGES[error.problem]
        : "Hand tracking could not be loaded. Check your connection, then press Try again.",
    );
    page.showStart("Try again");
    return;
  }
  page.hideStart();
  page.setStatus("");
  instrumentStarted = true;
  if (onInstrument()) loop.start();
});
