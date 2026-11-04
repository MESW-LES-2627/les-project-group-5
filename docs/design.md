# Design

Design models of the **Gesture-Based Web Instrument**. They describe the whole product vision; the parts outside the MVP are marked as hot spots. The models are updated at the end of each iteration.

The sources are in [`design/`](design/): the EventStorming board opens in [diagrams.net](https://app.diagrams.net) (`eventstorming.drawio`), and the UML diagrams are [PlantUML](https://plantuml.com) files (`.puml`).

## History

| Iteration | Changes |
|---|---|
| 0 | First version of the three models, covering the whole product vision. |
| 1 | Domain model: Preferences updated (dominant hand, camera preview) and moved to Playing, Calibration Profile added. Components: Vercel (static site + serverless API), Postgres hosted on Supabase, Health with the DatabaseStatus interface, Settings; parts not built yet marked as planned. Change scenario 1: per-user hand calibration. |

## 1. EventStorming

![EventStorming](design/eventstorming.png)

**Big picture.** The player's timeline in three phases. The optional account comes first; the pivotal events *Instrument Started* and *Exercise Started* begin the playing and the game phases.

**Process modelling.** Each subdomain shows who issues each command (actor), the aggregate that handles it, the events it produces, the policies that react to them and the external systems involved.

| Subdomain | Type | Why |
|---|---|---|
| Playing | Core | Playing notes with hand gestures is what makes the product different. |
| Game | Supporting | An ear-training game that gives the player a reason to practise, built on top of playing. |
| Accounts | Generic | Sign up, login and password reset work like in any other app. |

The policies link the subdomains: when settings change or an attempt passes and the player is logged in, the settings or the progress are saved in the account.

## 2. Domain model

![Domain model](design/domain-model.png)

The model uses the language of the problem, not of the code:

- **Playing:** a player makes hand gestures. The player's **calibration profile** normalizes each gesture: it says which part of the camera image covers the play area and how open the hand must be for silence and for full volume. The gesture then points at a pad of the instrument's layout (grid or piano), and the hand openness sets the volume. Each pad stands for a degree of the scale, so the instrument produces the note of that degree. The player's **preferences** (dominant hand, camera preview, and later key, scale, layout and sensitivity) configure the instrument.
- **Game:** the "Listen and Repeat" ear-training game. An exercise has a melody (a sequence of degrees) played in its own key and scale. The player makes attempts to repeat it. Passing an attempt unlocks the next exercise in the player's progress.
- **Accounts:** an account is optional. It saves the player's preferences and progress. Preferences exist without an account too, so they are part of Playing.

## 3. Component diagram

![Component diagram](design/component-diagram.png)

Components marked **«planned»** (Game, Accounts, Email Sender) are part of the design but are not in the code yet.

- The **player** uses only the Player App in the browser. **Vercel** serves the built app as a static site.
- Everything that happens in real time (hand tracking, notes, sound, game) runs in the browser, so the app works without an account. **Settings** (`SettingsStore`) holds the player's choices (dominant hand, camera preview) and tells the instrument when they change.
- **Instrument** and **Game** hold the rules and do not use the webcam, MediaPipe or Web Audio directly. **Hand Tracking** and **Sound** wrap those external systems.
- The **API** runs on Vercel as a serverless function. Today it has **Health** (`GET /api/health`), which reports whether the server and the database answer. Health depends on the **DatabaseStatus** interface, not on the database driver, so its tests use a fake.
- **Database access** is the only part that talks to the database: one `pg` connection pool and hand-written SQL, to a **Postgres database hosted on Supabase** (see [ADR 001](adr/001-database-choice.md)). **Accounts** will use it for its repositories and send emails through the **Email Sender**.

## 4. Change scenarios

### Scenario 1: per-user hand calibration

**Scenario.** Today everyone plays with the same `DEFAULT_CALIBRATION_PROFILE`: fixed ranges for the pointer and for the hand openness. Hands, arms and camera positions differ, so some players can't reach the edge pads or never reach full volume. In the future, a calibration assistant asks the player to move the hand to the edges and to open and close it, measures the ranges, and the instrument then uses **that player's profile**.

**Affected elements.**

| Element | Today | With per-user calibration |
|---|---|---|
| `domain/calibration/CalibrationProfile.ts` | The `CalibrationProfile` class and the `DEFAULT_CALIBRATION_PROFILE` constant | Unchanged. A measured profile is just another `CalibrationProfile` |
| `domain/calibration/ControlCalibration.ts` | One range, normalizes a value to 0–1, rejects invalid ranges | Unchanged. It already rejects a bad measurement (min ≥ max) |
| `web/main.ts` | Imports `DEFAULT_CALIBRATION_PROFILE` and passes it to `InstrumentLoop` | Takes the profile from Settings and passes changes to the loop |
| `web/instrument/InstrumentLoop.ts` | Receives the profile in its constructor (`readonly profile`) | Needs a way to change it while running, like `setDominantHand` |
| `web/settings/SettingsStore.ts` | Holds dominant hand and camera preview | Also holds the current profile (default until the player calibrates) |
| `web/pages/` | `InstrumentPage`, `SettingsPage` | New calibration page (the assistant), opened from Settings |
| Accounts «planned» | — | Saves the profile with the preferences |
| `web/instrument/InstrumentLoop.test.ts` | Uses the default profile | Adds a test for changing the profile |

**Coupling analysis.**

- Only two files use the global constant `DEFAULT_CALIBRATION_PROFILE`: `main.ts` (the composition root) and the loop's test. No rule or page depends on it.
- `InstrumentLoop` depends on the `CalibrationProfile` **type**, received through its constructor, not on the constant. It doesn't know where the profile comes from. This is the coupling we want to keep.
- The weak point is that the loop keeps the profile as `readonly`. A profile measured while the app runs can't reach it without a new method.
- The domain (`Instrument`, `HandFeatureExtractor`) never sees the profile. It only receives `HandControls` from 0 to 1, so it isn't affected at all.

**Cohesion analysis.**

- The `calibration` module has one responsibility: turning raw hand values into 0–1 controls. `ControlCalibration` handles one range, and `CalibrationProfile` groups the three ranges and applies them.
- **Which** profile to use is not decided there. That choice is made in `main.ts`. The only exception is the default values, which live next to the class as a constant. That is acceptable: they are the domain's starting values, not a choice per user.
- `SettingsStore` has a separate getter, setter and listener set for each setting. Adding the profile would make a third copy of the same code. This small duplication is worth fixing when the store grows.

**Options.**

- **(a) Read the profile from `SettingsStore` where it is used.** `InstrumentLoop` would receive the `SettingsStore` and read `settings.calibration` on every frame.
  - It needs fewer wiring lines.
  - But the loop, which runs the pipeline, also has to know about the settings. Its tests would need a settings store, and the loop would depend on a web class instead of only on domain types (more coupling, less cohesion).
- **(b) Inject the profile at the composition root, from one source.** `SettingsStore` is the only source of the current profile, starting with `DEFAULT_CALIBRATION_PROFILE`. `main.ts` passes it to the loop, subscribes to changes and calls `loop.setCalibrationProfile(profile)`, the same pattern already used for the dominant hand.
  - The loop and the domain only see a `CalibrationProfile` and never know where it comes from.
- **(c) A `CalibrationSource` interface that the loop asks on every frame.**
  - It is flexible.
  - But it adds an interface for a value that rarely changes, and pull on every frame hides when the change happens.

**Decision: (b).**

- It keeps coupling low: the loop depends only on the `CalibrationProfile` type, the domain depends on nothing new, and only `main.ts` knows that the profile comes from Settings.
- It keeps each part cohesive: Settings holds choices, the loop runs the pipeline, and `calibration` normalizes values.
- It follows a pattern the team already uses (`setDominantHand`), so it is easy to read and to test with a fake profile.

**Now:** no code change. The current design already injects the profile, and adding a setter before anyone needs it would be speculative.

**When the assistant is built:**

1. Add the profile to `SettingsStore`, default `DEFAULT_CALIBRATION_PROFILE`, ideally after making its listeners generic.
2. Add `InstrumentLoop.setCalibrationProfile()` and its test.
3. Add the wiring in `main.ts`.
4. Add the calibration page, which builds a `CalibrationProfile` from the measured ranges.
5. Have Accounts save the profile.
