// Composition root: this is where the app's objects will be created and connected.
// For now it only shows that the setup works.
const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.textContent = 'Gesture Web Instrument: setup OK';
}
