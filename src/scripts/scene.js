import * as T from 'three';
import { models } from './models.js';

export function createScene() {
  const backdrop = document.querySelector('#page-scene');
  const hero = document.querySelector('#hero-scene');
  const footer = document.querySelector('#footer-scene');
  const widget = document.querySelector('#scene-widget');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '3D model. Drag or use the arrow keys to rotate.');
  widget.append(canvas);
  const scene = new T.Scene();
  const rig = new T.Group();
  scene.add(rig, new T.HemisphereLight(0xfff8e7, 0xbab5c6, 1.9));
  const key = new T.DirectionalLight(0xfff8ed, 2.3);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const camera = new T.OrthographicCamera(-2, 2, 1.55, -1.55, .1, 30);
  camera.position.z = 8;

  let active = null, theme, effects, frame = 0, previous = 0, elapsed = 0;
  let following = true, drag = null;
  let targetX = 0, targetY = 0, angleX = 0, angleY = 0;
  let heroVisible = false, footerVisible = false, slot = null;
  function queue() {
    if (!frame && active && slot && !document.hidden && !renderer.getContext().isContextLost()) {
      frame = requestAnimationFrame(draw);
    }
  }
  function draw(now) {
    frame = 0;
    if (!active || !slot || document.hidden) return;
    const dt = Math.min((now - previous) / 1000, .07);
    if (now - previous < 32) { queue(); return; }
    previous = now;
    const animate = effects && !reduced.matches;
    if (animate) elapsed += dt;
    if (following && reduced.matches) {
      angleX = angleY = 0;
    } else {
      const ease = following ? 1 - Math.exp(-dt * 10) : 1;
      angleX += (targetX - angleX) * ease;
      angleY += (targetY - angleY) * ease;
    }
    const [pitch, yaw, roll] = active.tilt;
    rig.rotation.set(pitch + angleY, yaw + angleX, roll);
    const phase = animate ? elapsed : 0;
    active.effect.position.y = Math.sin(phase * (theme === 'matrix' ? 1.6 : .8)) * .075;
    active.effect.rotation.z = Math.sin(phase * .9) * (theme === 'comic' ? .035 : .018);
    renderer.render(scene, camera);
    if (animate || (!reduced.matches && Math.abs(targetX-angleX)+Math.abs(targetY-angleY) > .001)) queue();
  }
  function resize() {
    if (!slot) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(Math.round(width), Math.round(height), false);
    const aspect = width / height;
    const halfHeight = Math.max(1.56, (theme === 'comic' ? 2.06 : 1.83) / aspect);
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.right = halfHeight * aspect; camera.left = -camera.right;
    camera.updateProjectionMatrix();
    queue();
  }
  const sizes = new ResizeObserver(resize);
  function place() {
    const next = active ? (heroVisible ? hero : footerVisible ? footer : backdrop) : null;
    if (slot === next) return;
    cancelAnimationFrame(frame); frame = 0;
    sizes.disconnect();
    drag = null;
    widget.remove();
    slot = next;
    if (slot) {
      slot.append(widget);
      sizes.observe(slot);
      resize();
    }
  }
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === hero) heroVisible = entry.isIntersecting;
      else footerVisible = entry.isIntersecting;
    }
    place();
  });
  visibility.observe(hero);
  visibility.observe(document.querySelector('footer'));

  function takeControl() {
    if (following) {
      targetX = angleX;
      targetY = angleY;
      following = false;
    }
  }

  function aim(x, y) {
    if (!slot || drag || (following && reduced.matches)) return;
    const rect = slot.getBoundingClientRect();
    targetX = T.MathUtils.clamp((x - rect.left - rect.width / 2) / (innerWidth * .45), -1, 1) * .45;
    targetY = T.MathUtils.clamp((y - rect.top - rect.height / 2) / (innerHeight * .45), -1, 1) * .26;
    if (!following) {
      // Resume from the equivalent pose nearest the target after any number of turns.
      const turn = Math.PI * 2;
      angleX -= Math.round((angleX - targetX) / turn) * turn;
      angleY -= Math.round((angleY - targetY) / turn) * turn;
      previous = performance.now();
      following = true;
    }
    queue();
  }
  function followOutside(event) {
    if (following || event.target !== canvas) aim(event.clientX, event.clientY);
  }
  window.addEventListener('pointermove', followOutside, { passive: true });
  window.addEventListener('pointerdown', followOutside, { passive: true });
  window.addEventListener('wheel', followOutside, { passive: true });
  document.addEventListener('focusin', e => {
    if (e.target === canvas) return;
    const rect = e.target.getBoundingClientRect();
    aim(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  canvas.addEventListener('pointerdown', e => {
    if (drag || !e.isPrimary || e.button !== 0) return;
    takeControl();
    canvas.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointermove', e => {
    if (drag?.id !== e.pointerId) return;
    const radiansPerPixel = Math.PI / Math.max(80, canvas.clientWidth);
    targetX += (e.clientX - drag.x) * radiansPerPixel;
    targetY += (e.clientY - drag.y) * radiansPerPixel;
    drag.x = e.clientX;
    drag.y = e.clientY;
    queue();
  });
  canvas.addEventListener('lostpointercapture', e => {
    if (drag?.id === e.pointerId) drag = null;
  });
  canvas.addEventListener('keydown', e => {
    const step = Math.PI / 12;
    const turns = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const turn = turns[e.key];
    if (!turn) return;
    takeControl();
    targetX += turn[0];
    targetY += turn[1];
    e.preventDefault();
    queue();
  });
  reduced.addEventListener('change', queue);
  document.addEventListener('visibilitychange', queue);
  canvas.addEventListener('webglcontextlost', () => {
    cancelAnimationFrame(frame); frame = 0;
    widget.hidden = true;
    delete document.documentElement.dataset.sceneReady;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    widget.hidden = !active;
    if (active) document.documentElement.dataset.sceneReady = '';
    resize();
    queue();
  });

  return function configure(settings) {
    if (settings.theme !== theme) {
      if (active) {
        for (const mesh of [active.model, active.effect]) {
          rig.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
      }
      theme = settings.theme;
      active = models[theme]?.() ?? null;
      if (active) rig.add(active.model, active.effect);
      following = true;
      angleX = angleY = targetX = targetY = elapsed = 0;
      widget.hidden = !active;
      document.documentElement.toggleAttribute('data-scene-ready', !!active);
      place();
      resize();
    }
    if (!active) return;
    effects = settings.effects;
    active.effect.visible = effects;
    for (const mesh of [active.model, active.effect]) mesh.material.wireframe = settings.mesh === 'wireframe';
    queue();
  };
}
