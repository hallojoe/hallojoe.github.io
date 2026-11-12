const root = document.documentElement;
const appearance = document.querySelector('#appearance');
const themes = [...appearance.querySelectorAll('[data-theme-choice]')];
const picker = appearance.querySelector('.theme-picker');
const toggle = picker.querySelector('.theme-toggle');
const choices = picker.querySelector('.swatches');
const mode = appearance.querySelector('#color-mode');
const controls = document.querySelector('#scene-options');
const effects = controls.querySelector('#effects');
const wireframe = controls.querySelector('#wireframe');
const key = 'hallojoe.appearance.v1';
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Storage is optional. */ }
const settings = {
  theme: themes.some(b => b.dataset.themeChoice === saved?.theme) ? saved.theme : 'original',
  mode: ['light', 'dark'].includes(saved?.mode) ? saved.mode : 'system',
  mesh: saved?.mesh === 'wireframe' ? 'wireframe' : 'filled',
  effects: saved?.effects !== false,
};
let engine, unavailable = false;

function updateBrowserColor() {
  const color = getComputedStyle(document.body).backgroundColor;
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.content = color;
}
async function render() {
  root.dataset.theme = settings.theme;
  root.dataset.mode = settings.mode;
  mode.value = settings.mode;
  updateBrowserColor();
  for (const button of themes) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === settings.theme));
  effects.setAttribute('aria-pressed', String(settings.effects));
  wireframe.setAttribute('aria-pressed', String(settings.mesh === 'wireframe'));
  if (unavailable) return;
  try {
    engine ??= import('./scene.js').then(module => module.createScene());
    const configure = await engine;
    configure(settings);
  } catch (error) {
    unavailable = true;
    controls.hidden = true;
    document.querySelector('#scene-widget').hidden = true;
    delete root.dataset.sceneReady;
    console.warn('The 3D background could not start.', error);
  }
}
function saveAndRender() {
  try { localStorage.setItem(key, JSON.stringify(settings)); } catch { /* Apply for this visit. */ }
  render();
}
function setPickerOpen(open, returnFocus = false) {
  toggle.setAttribute('aria-expanded', String(open));
  if (returnFocus) toggle.focus({ preventScroll: true });
  choices.inert = !open;
  if (open) choices.querySelector('[aria-pressed="true"]').focus({ preventScroll: true });
}

toggle.addEventListener('click', () => setPickerOpen(choices.inert));
picker.addEventListener('focusout', event => {
  if (!picker.contains(event.relatedTarget)) setPickerOpen(false);
});
picker.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !choices.inert) {
    event.preventDefault();
    setPickerOpen(false, true);
  }
});
document.addEventListener('pointerdown', event => {
  if (!choices.inert && !picker.contains(event.target)) setPickerOpen(false);
});

for (const button of themes) button.addEventListener('click', () => {
  settings.theme = button.dataset.themeChoice;
  setPickerOpen(false, true);
  saveAndRender();
});
mode.addEventListener('change', () => {
  settings.mode = mode.value;
  saveAndRender();
});
effects.addEventListener('click', () => { settings.effects = !settings.effects; saveAndRender(); });
wireframe.addEventListener('click', () => {
  settings.mesh = settings.mesh === 'wireframe' ? 'filled' : 'wireframe';
  saveAndRender();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateBrowserColor);
appearance.hidden = false;
render();
