const root = document.documentElement;
const appearance = document.querySelector('#appearance');
const themes = [...appearance.querySelectorAll('[data-theme-choice]')];
const meshes = [...appearance.querySelectorAll('[data-mesh]')];
const effects = appearance.querySelector('#effects');
const options = appearance.querySelector('#scene-options');
const key = 'hallojoe.appearance.v1';
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Storage is optional. */ }
const settings = {
  theme: themes.some(b => b.dataset.themeChoice === saved?.theme) ? saved.theme : 'original',
  mesh: saved?.mesh === 'wireframe' ? 'wireframe' : 'filled',
  effects: saved?.effects !== false,
};

let engine, configure, unavailable = false;
async function render() {
  root.dataset.theme = settings.theme;
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--page').trim();
  for (const button of themes) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === settings.theme));
  for (const button of meshes) button.setAttribute('aria-pressed', String(button.dataset.mesh === settings.mesh));
  effects.textContent = settings.effects ? 'Effects on' : 'Effects off';
  effects.setAttribute('aria-pressed', String(settings.effects));
  options.hidden = settings.theme === 'original' || unavailable;
  if (!configure && (options.hidden || unavailable)) return;
  try {
    engine ??= import('./scene.js').then(module => module.createScene());
    configure = await engine;
    configure(settings);
  } catch (error) {
    unavailable = true;
    options.hidden = true;
    delete root.dataset.sceneReady;
    console.warn('The 3D background could not start.', error);
  }
}
appearance.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.themeChoice) settings.theme = button.dataset.themeChoice;
  else if (button.dataset.mesh) settings.mesh = button.dataset.mesh;
  else if (button === effects) settings.effects = !settings.effects;
  try { localStorage.setItem(key, JSON.stringify(settings)); } catch { /* Apply for this visit. */ }
  render();
});
appearance.hidden = false;
render();
