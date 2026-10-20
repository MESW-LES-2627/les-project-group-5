# MVP

**Goal:** show that a beginner can make music with only a webcam, and that a simple game makes them want to keep playing.

## In

- **Instrument:** one hand; the pointer picks the note and hand opening sets the volume. One sound. Volume bar, camera preview on/off, debug view. Default movement ranges plus a **sensitivity** setting.
- **Layouts:** 2×4 pad grid (2 rows × 4 columns on desktop, 4 × 2 on a phone held upright, low notes at the bottom) and piano (one octave, scale notes highlighted).
- **Game, Listen and Repeat:** levels 1 and 2, 1 to 3 stars, success unlocks the next exercise. Each exercise sets its own key and scale.
- **Settings:** key, scale (major or natural minor), layout, dominant hand, sensitivity, camera preview.
- **Optional account:** sign up with email confirmation, log in, log out, password reset, lock after too many wrong passwords. Logged-in users have their settings saved.
- **Platforms:** desktop Chrome and Edge first. Android Chrome and iPhone Safari supported.

## Out

- Calibration wizard.
- Head mode and vibrato.
- Other layouts, sounds and octaves.
- Harder game levels, exercise editor and rankings.
- Recordings, online jam rooms and MIDI.
- Changing the password while logged in, and deleting the account.
- Putting the app online. It runs on our own machines.

## Vertical prototype

A thin slice that proves the stack works together: camera → the hand selects **one box** → the box plays its note. The page also shows whether the server is online. There is no login and no database.

## Validation criteria (proposal, to be validated with the group)

We test with 10 people who have never used the app, before the demo.

| Criterion | Target |
|---|---|
| Plays the scale from note 1 to note 8 without help, within 2 minutes of pressing Start | 8 of 10 |
| Passes the first level-1 exercise (at least 1 star) in 3 attempts or fewer | 7 of 10 |
| Rates "The sound follows my hand" (1–5) | average ≥ 4 |
