import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Bake each rigid part into one vertex-coloured mesh, including its small details.
function sculpture(draw) {
  const parts = [];
  const matrix = new T.Matrix4();
  function add(geometry, color, xyz, scale = [1, 1, 1], rotation = [0, 0, 0]) {
    matrix.compose(new T.Vector3(...xyz), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(...scale));
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    part.applyMatrix4(matrix);
    part.deleteAttribute('uv');
    const tint = new T.Color(color);
    const count = part.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) tint.toArray(colors, i * 3);
    part.setAttribute('color', new T.BufferAttribute(colors, 3));
    parts.push(part);
    if (part !== geometry) geometry.dispose();
  }
  function box(xyz, size, color, radius = .035, rotation) {
    add(new RoundedBoxGeometry(...size, 1, radius), color, xyz, undefined, rotation);
  }
  function oval(xyz, size, color, rotation) {
    add(new T.SphereGeometry(1, 20, 14), color, xyz, size, rotation);
  }
  function stroke(points, color, radius = .022) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    add(new T.TubeGeometry(curve, Math.max(6, points.length * 3), radius, 5, false), color, [0, 0, 0]);
  }
  function relief(points, xyz, color, depth, bevel = .025, holes = []) {
    function trace(path, loop) {
      path.moveTo(...loop[0]);
      loop.slice(1).forEach(p => path.lineTo(...p));
      path.closePath();
      return path;
    }
    const shape = trace(new T.Shape(), points);
    shape.holes = holes.map(loop => trace(new T.Path(), loop));
    add(new T.ExtrudeGeometry(shape, { depth, bevelEnabled: !!bevel, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1 }), color, xyz);
  }
  draw({ add, box, oval, stroke, relief });
  const geometry = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  return new T.Mesh(geometry, new T.MeshStandardMaterial({ vertexColors: true, roughness: .7 }));
}

function terminal() {
  const model = sculpture(({ box, oval, stroke }) => {
    const caseGreen = '#628e76', rim = '#233f37', phosphor = '#b2ff90';
    box([0, .16, -.14], [2.14, 1.57, 1.27], caseGreen, .13);
    box([0, .17, .50], [1.90, 1.28, .13], rim, .13);
    box([0, .18, .58], [1.69, 1.05, .08], '#19392f', .12);
    // Rows of phosphor cells form a prompt and a block cursor inside the bezel.
    const glyphs = ['1000000000','0100000000','0010000000','0100001111','1000001111'];
    glyphs.forEach((row, y) => [...row].forEach((cell, x) => {
      if (cell === '1') box([-.53 + x * .075, .33 - y * .075, .635], [.061, .059, .022], phosphor, .005);
    }));
    box([0, -.71, .05], [1.48, .23, .95], rim, .055);
    box([0, -.91, .25], [2.38, .23, 1.70], '#739c80', .075);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 10; col++) {
        box([-.90 + col * .20, -.76, .58 + row * .17], [.145, .075, .12], row === 2 && col > 7 ? phosphor : rim, .017);
      }
    }
    for (let i = 0; i < 5; i++) box([1.073, .42, -.50 + i * .16], [.013, .47, .066], rim, .004);
    oval([.78, -.47, .594], [.047, .032, .018], phosphor);
    stroke([[-.62,.60,.633],[-.27,.60,.633]], '#518466', .014);
  });
  const effect = sculpture(({ box }) => {
    for (let i = 0; i < 8; i++) {
      const x = (i < 4 ? -1 : 1) * (1.29 + (i % 4) * .16);
      for (let j = 0; j < 3 + i % 3; j++) {
        box([x, .92 - j * .13 - (i * 7 % 4) * .23, -.45], [.055 + (i+j)%2*.045,.051,.04],
          j === 0 ? '#a2f396' : '#46795d', .003);
      }
    }
  });
  return { model, effect, tilt: [.14, -.34, -.035] };
}

function comic() {
  const ink = '#302638', paper = '#fff5c9';
  // Alternating long and short rays keep the impact silhouette asymmetric.
  const burst = (scale, phase) => Array.from({ length: 26 }, (_, i) => {
    const a = i * Math.PI / 13 + phase;
    const r = i % 2 ? .60 : .88 + (i * 11 % 7) * .025;
    return [Math.cos(a)*r*1.53*scale, Math.sin(a)*r*1.24*scale];
  });
  const model = sculpture(({ relief, oval }) => {
    relief(burst(1.06, .16), [.06, -.09, -.28], ink, .18);
    relief(burst(1.04, .16), [.02, -.04, -.08], '#e75038', .12);
    relief(burst(.94, .02), [0, .04, .10], ink, .09);
    relief(burst(.90, .02), [0, .04, .20], '#ffd244', .08);
    // Three hand-drawn, extruded letters across the face of the impact burst.
    const glyphs = [
      { x:-.95, path:[[0,-.32],[.13,.38],[.45,.38],[.56,.27],[.52,.03],[.40,-.05],[.22,-.05],[.17,-.32]],
        holes:[[[.26,.11],[.36,.11],[.40,.21],[.29,.21]]] },
      { x:-.39, path:[[0,-.20],[.09,.25],[.21,.38],[.47,.38],[.58,.24],[.49,-.20],[.36,-.32],[.11,-.32]],
        holes:[[[.20,-.13],[.30,-.13],[.38,.19],[.28,.19]]] },
      { x:.20, path:[[0,.38],[.16,.38],[.14,-.02],[.32,.25],[.43,.25],[.41,-.03],[.59,.38],[.76,.38],[.40,-.32],[.25,-.32],[.26,-.10],[.10,-.32],[-.04,-.32]] }
    ];
    glyphs.forEach(({x,path,holes}) => {
      relief(path,[x,0,.30],ink,.12,.035,holes);
      relief(path,[x,.015,.435],paper,.035,.005,holes);
    });
    for (let i = 0; i < 8; i++) oval([-.68+i*.17,-.46+Math.sin(i)*.035,.303], [.028,.028,.014], ink);
  });
  const effect = sculpture(({ relief }) => {
    for (let i = 0; i < 9; i++) {
      const a = i * 2.399, x = Math.cos(a), y = Math.sin(a);
      relief([[x*1.53,y*1.24],[x*1.98-y*.035,y*1.50+x*.035],[x*1.95+y*.035,y*1.49-x*.035]], [0,0,-.18], i%3 ? ink : '#e75038', .035, .005);
    }
  });
  return {model, effect, tilt: [-.08, -.24, .12]};
}

function kitten() {
  const cream = '#fff2d9', ink = '#503a40', pink = '#f5a4aa', red = '#c84652', gold = '#f4b943';
  const model = sculpture(({ oval, box, stroke, relief }) => {
    oval([0,-.47,0], [.69,.73,.53], cream);
    oval([-.37,-1.02,.26], [.33,.18,.36], cream);
    oval([.37,-1.02,.26], [.33,.18,.36], cream);
    oval([0,.33,.10], [.79,.67,.58], cream);
    for (const side of [-1,1]) {
      const x = side * .48;
      relief([[-.26,0],[.26,0],[side*.19,.56]], [x,.65,-.04], side < 0 ? '#ca895a' : ink, .27,.05);
      relief([[-.16,.05],[.16,.05],[side*.14,.41]], [x,.67,.245], pink, .022);
      const eye = side * .30;
      stroke([[eye-.113,.33,.625],[eye,.40,.65],[eye+.105,.34,.622]], ink, .024);
      oval([side*.48,.17,.56],[.105,.054,.028],pink,[0,side*.45,0]);
      for (let j=0; j<2; j++) stroke([[side*.56,.17-j*.086,.50],[side*.72,.20-j*.115,.375]],ink,.014);
    }
    oval([-.22,.87,.31],[.18,.07,.12],'#ca895a',[0,0,.20]);
    oval([0,.23,.682],[.068,.045,.035],'#b86a73');
    stroke([[-.13,.16,.663],[-.077,.116,.671],[0,.16,.684],[.077,.116,.671],[.13,.16,.663]],ink,.015);
    oval([0,-.235,.055],[.61,.12,.48], red);
    oval([0,-.38,.54],[.15,.15,.13],gold);
    box([0,-.40,.663],[.145,.024,.017], '#936135',.005);
    oval([-.57,-.52,.27],[.19,.37,.22],cream,[0,0,-.20]);
    stroke([[.56,-.59,.12],[.83,-.30,.18],[.91,.04,.21]],cream,.166);
    oval([.91,.17,.23],[.23,.25,.21],cream);
    oval([.92,.15,.432],[.099,.079,.022],pink);
    for (let i = 0; i < 3; i++) oval([.81+i*.083,.25+Math.sin(i*Math.PI/2)*.034,.418],[.030,.041,.015],pink);
    stroke([[-.46,-.79,-.18],[-.82,-.72,-.29],[-.98,-.40,-.20],[-.92,-.26,-.16]],'#c78b64',.113);
  });
  const effect = sculpture(({ oval }) => {
    for (const [x,y,size] of [[-1.20,.63,.11],[1.30,.80,.075],[1.33,-.58,.10],[-1.30,-.32,.055]]) {
      for (let i=0;i<5;i++) {
        const a=i*Math.PI*2/5;
        oval([x-Math.sin(a)*size*.65,y+Math.cos(a)*size*.65,-.25],[size*.49,size*.76,.026],pink,[0,0,a]);
      }
      oval([x,y,-.213],[size*.29,size*.29,.024],gold);
    }
  });
  return {model, effect, tilt: [.045, -.17, -.045]};
}

function times() {
  const navy = '#344487', teal = '#33978d', paper = '#fff7dd';
  const model = sculpture(({ box, oval, add }) => {
    // A beveled browser window, raised hyperlink and miniature globe.
    box([0, 0, -.12], [2.45, 1.85, .28], '#a6aaa8', .035);
    box([0, .69, .04], [2.28, .32, .08], navy);
    for (let i = 0; i < 2; i++) box([.78 + .22 * i, .70, .11], [.15, .15, .06], paper, .01);
    box([-.54, .70, .10], [.91, .047, .03], paper);
    box([0, -.15, .045], [2.23, 1.20, .09], paper);
    for (const [x, y, width] of [[.45, .13, .87], [.34, -.08, .65], [.40, -.30, .77]]) {
      box([x, y, .11], [width, .05, .025], navy, .005);
    }
    box([.40, -.38, .11], [.77, .018, .025], navy, .003);
    oval([-.58, -.12, .16], [.36, .36, .36], teal);
    for (const turn of [0, Math.PI / 3, -Math.PI / 3]) {
      add(new T.TorusGeometry(.365, .013, 5, 32), '#b4e1c7', [-.58, -.12, .16], undefined, [0, turn, 0]);
    }
    add(new T.TorusGeometry(.365, .013, 5, 32), '#b4e1c7', [-.58, -.12, .16], undefined, [Math.PI / 2, 0, 0]);
  });
  const effect = sculpture(({ relief }) => {
    const cursor = [[0, 0], [.12, -.63], [.24, -.46], [.39, -.66], [.51, -.57], [.34, -.37], [.54, -.34]];
    relief(cursor, [.60, -.19, .32], navy, .06, .032);
    relief(cursor, [.60, -.19, .40], paper, .025, .004);
  });
  return { model, effect, tilt: [.09, -.30, -.05] };
}

export const models = { matrix: terminal, comic, kittens: kitten, times };
