const root = document.documentElement;
const menu = document.querySelector('#site-menu');
const opener = document.querySelector('#open-menu');
const themes = [...menu.querySelectorAll('input[name="theme"]')];
const mode = menu.querySelector('#color-mode');
const controls = document.querySelector('#scene-options');
const effects = controls.querySelector('#effects');
const wireframe = controls.querySelector('#wireframe');
const key = 'hallojoe.appearance.v1';
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Storage is optional. */ }
const settings = {
  theme: themes.some(b => b.value === saved?.theme) ? saved.theme : 'original',
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
  for (const radio of themes) radio.checked = radio.value === settings.theme;
  effects.checked = settings.effects;
  wireframe.checked = settings.mesh === 'wireframe';
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

opener.addEventListener('click', () => {
  menu.showModal();
  opener.setAttribute('aria-expanded', 'true');
});
// Escape and the Close button both use the native dialog close behavior.
menu.addEventListener('close', () => {
  opener.setAttribute('aria-expanded', 'false');
  opener.focus({ preventScroll: true });
});
menu.addEventListener('click', event => {
  if (event.target !== menu) return;
  const rect = menu.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) menu.close();
});

for (const radio of themes) radio.addEventListener('change', () => {
  settings.theme = radio.value;
  saveAndRender();
});
mode.addEventListener('change', () => {
  settings.mode = mode.value;
  saveAndRender();
});
effects.addEventListener('change', () => { settings.effects = effects.checked; saveAndRender(); });
wireframe.addEventListener('change', () => {
  settings.mesh = wireframe.checked ? 'wireframe' : 'filled';
  saveAndRender();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateBrowserColor);
opener.hidden = false;
render();
