# 🎲 PolyDice — Procedural 3D Polyhedral Dice Physics & Simulator

**[🌐 Launch Interactive Online Demo](https://manthrax.github.io/three-polydice/polydice.html)** &bull; **[📷 2D Game Snapshot Demo](https://manthrax.github.io/three-polydice/demoHtml.html)** &bull; **[⚡ Server Sync Demo](https://manthrax.github.io/three-polydice/demoTargetRoll.html)**

A high-performance, 100% self-contained JavaScript 3D polyhedral dice simulation library powered by **Three.js**, **Ammo.js (Bullet Physics WebAssembly)**, and the **Web Audio API**.

PolyDice synthesizes all 3D geometries, multi-segment fillet chamfers, UV unwrapping, and engraved normal maps **entirely procedurally** at runtime—requiring **zero** external 3D models (`.obj`, `.gltf`) or static texture image assets.

Packaged as a zero-dependency, plug-and-play ES6 module (`polydice.js`) with an interactive host configurator app (`polydice.html`).

---

## 📑 Table of Contents
1. [Key Highlights](#-key-highlights)
2. [Target Use Cases & User Categories](#-target-use-cases--user-categories)
3. [Supported Polyhedral Dice (14 Shapes)](#-supported-polyhedral-dice-14-shapes)
4. [Physically-Based Material Finishes](#-physically-based-material-finishes)
5. [Quick Start & Local Demo](#-quick-start--local-demo)
6. [Minimal Integration Example](#-minimal-integration-example)
7. [Modular ES6 API Reference](#-modular-es6-api-reference)
   - [Constructor & Configuration](#constructor--configuration)
   - [Instance Methods](#instance-methods)
   - [Pub/Sub Events](#pubsub-events)
8. [Predetermined Rolls & Server Replay](#-predetermined-rolls--server-replay)
9. [Mathematical Face-Up Centroid Detection](#-mathematical-face-up-centroid-detection)
10. [Global Window Aliases & Custom Events](#-global-window-aliases--custom-events)
11. [Browser Compatibility](#-browser-compatibility)

---

## ✨ Key Highlights

- **14 Polyhedral Geometries**: Full polyhedral set: `d4`, `d6`, `d8`, `d10`, `d12`, `d14`, `d16`, `d20`, `d24`, `d30`, `d48`, `d60`, `d100`, and `d120`.
- **Zero Static Assets**: 100% procedural 3D math and dynamic 2048² canvas diffuse & Sobel height-to-normal engraved textures.
- **Authentic Rigid Body Physics**: Bullet physics via Ammo.js WebAssembly with Continuous Collision Detection (CCD), tumbling torque, restitution bounce, and variable mass distribution.
- **Predetermined Outcome Replay**: Headless pre-simulation solves for desired results in ~4ms and replays authentic tumbling without unnatural mid-air steering.
- **Positional Web Audio Synthesizer**: Momentum-attenuated acoustic synthesis producing distinct felt thuds, wooden wall clacks, and die-to-die collisions.
- **Multi-Segment Fillet Chamfers**: Adjustable edge bevels (`0.0` Sharp to `0.20` Round) with multi-segment spherical corner domes that import cleanly into 3D software without vertex-welding artifacts.
- **Direct 3D Asset Export**: Instant `.glb` (GLTF Binary) export with optional companion face-centroid point clouds.
- **Showcase Lineup & Result Snapshot**: Smooth camera reframing into an upright lineup with silhouette glow and 16:9 composite result cards.

---

## 🎯 Target Use Cases & User Categories

PolyDice is designed with clear architectural boundaries to serve distinct developer workflows:

### 1. 3D Model Generation & Asset Pipeline (Game Dev & 3D Artists)
*Users who need on-demand 3D polyhedral models for games, Blender, or 3D printing.*
- Call `dice.getDiceAsset(type, { bevel, material })` to generate procedural Three.js geometries and PBR materials at runtime.
- Export clean binary `.glb` models via `dice.exportGLTF({ emitCentroids: true })`.
- Utilize **companion centroid point clouds**: PolyDice computes the geometric centroid of every numerical face. By exporting or sampling these centroids, game engines can determine which face is up purely by vector transformation ($O(N)$ dot product against world $+Y$) without needing physics, colliders, or raycasting.

### 2. Embedded Virtual Tabletop (VTT) & Game Rolling Widget
*Developers embedding interactive dice rolling into web games, Discord bots, or tabletop apps (e.g. Foundry VTT, Roll20).*
- Full physics simulation with custom tray boundaries, gravity, and momentum.
- Guaranteed server outcomes via `dice.rollPredeterminedDice(types, targets, power)`: webhooks or backend RNG decide the values, and PolyDice simulates an authentic roll landing on those exact numbers.
- Built-in sound synthesis with zero external audio files.

### 3. Interactive Theming & Configurator Tool
*Game masters and developers customizing aesthetics, edge rounding, and roll configurations.*
- The companion `polydice.html` serves as a live visual workbench.
- Generate ready-to-paste ES6 integration snippets, natural language roll strings (`"2d20: 20, 1"`), and JSON presets.
- Real-time material swapping across individual dice or the entire active pool.

---

## 🎲 Supported Polyhedral Dice (14 Shapes)

| Die | Geometric Shape | Faces | Face Geometry | Reading Convention |
| :--- | :--- | :---: | :--- | :--- |
| **d4** | Regular Tetrahedron | 4 | Equilateral Triangles | Opposite apex pointing up (bottom resting face) |
| **d6** | Regular Hexahedron (Cube) | 6 | Squares | Top face normal aligned with $+Y$ |
| **d8** | Regular Octahedron | 8 | Equilateral Triangles | Top face normal aligned with $+Y$ |
| **d10** | Pentagonal Trapezohedron | 10 | Kites | Top face normal aligned with $+Y$ |
| **d12** | Regular Dodecahedron | 12 | Regular Pentagons | Top face normal aligned with $+Y$ |
| **d14** | Heptagonal Trapezohedron | 14 | Kites | Top face normal aligned with $+Y$ |
| **d16** | Octagonal Bipyramid | 16 | Isosceles Triangles | Top face normal aligned with $+Y$ |
| **d20** | Regular Icosahedron | 20 | Equilateral Triangles | Top face normal aligned with $+Y$ |
| **d24** | Deltoidal Icositetrahedron | 24 | Kites | Top face normal aligned with $+Y$ |
| **d30** | Rhombic Triacontahedron | 30 | Golden Rhombi ($e_1/e_2 = \phi$) | Top face normal aligned with $+Y$ |
| **d48** | Disdyakis Dodecahedron | 48 | Scalene Triangles | Top face normal aligned with $+Y$ |
| **d60** | Pentakis Dodecahedron | 60 | Isosceles Triangles | Top face normal aligned with $+Y$ |
| **d100** | Zocchihedron (Dual Spherical Lattice) | 100 | Spherical Facets | Top face normal aligned with $+Y$ |
| **d120** | Disdyakis Triacontahedron | 120 | Scalene Triangles | Top face normal aligned with $+Y$ |

---

## 💎 Physically-Based Material Finishes

All materials are physically rendered using `THREE.MeshPhysicalMaterial` or `THREE.MeshStandardMaterial` with custom procedural diffuse, normal, and sheen layers:

1. **Obsidian Resin (`obsidian`)**: Deep charcoal resin with fine mineral flecks, crisp silver/white enamel numerals, and glossy clearcoat.
2. **Royal Gold (`gold`)**: Forged metallic gold with anisotropic micro-noise, obsidian black enamel numerals, and high specular reflection.
3. **Sterling Silver (`silver`)**: Polished forged metallic silver with obsidian black numbers.
4. **Translucent Ruby (`ruby`)**: Crystal glass with physical transmission (`0.99`), interior attenuation absorption (`#b13333`), and warm gold enamel numbers.
5. **Imperial Emerald (`emerald`)**: Deep forest jade crystal glass with physical transmission, rich green volumetric core, and gold numerals.
6. **Celestial Sapphire (`sapphire`)**: Electric royal blue crystal glass with physical transmission and pure ice-white numerals.
7. **Opalescent Pearl (`pearl`)**: Organic nacre substrate with multi-layer iridescence thin-film interference, rosewood numerals, and satin sheen.

---

## 🚀 Quick Start & Local Demo

Clone the repository and serve locally using any standard static file server:

```bash
# Clone the repository
git clone https://github.com/manthrax/polydice.git
cd polydice

# Start a local server (Python 3)
python -m http.server 8080

# Or with Node.js
npx serve .
```

Open any of the included demos in a WebGL-capable browser:
- `http://localhost:8080/polydice.html` — Full 3D interactive simulator, visual configurator & inspector.
- `http://localhost:8080/demoHtml.html` — 2D web game integration using offscreen snapshot generation (5d6, 5 distinct colors).
- `http://localhost:8080/demoTargetRoll.html` — Multi-client deterministic server roll sync with dual 3D viewports.

---

## 💻 Minimal Integration Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/gh/kripken/ammo.js@main/builds/ammo.js"></script>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.183.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.183.0/examples/jsm/"
      }
    }
  </script>
</head>
<body style="margin: 0; overflow: hidden;">
  <div id="canvas-container" style="width: 100vw; height: 100vh;">
    <canvas id="dice-renderer-canvas" style="width: 100%; height: 100%;"></canvas>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { PolyDice } from './polydice.js';

    // 1. Host creates standard Three.js Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#131722');
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 14, 13);
    camera.lookAt(0, 0, 0);

    const canvas = document.getElementById('dice-renderer-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    // 2. Initialize PolyDice engine
    const dice = new PolyDice({
      THREE,
      Ammo: window.Ammo,
      scene,
      audio: true,
      defaultMaterial: 'ruby',
      defaultBevel: 0.20
    });

    await dice.init();
    dice.createDefaultVisualTray();
    dice.setDicePool(['d20', 'd6', 'd6']);

    // 3. Render loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      dice.update(clock.getDelta());
      renderer.render(scene, camera);
    }
    animate();

    // 4. Roll on click!
    window.addEventListener('click', async () => {
      const result = await dice.roll({ power: 1.2 });
      console.log('Settled Total:', result.total, result.summary);
    });
  </script>
</body>
</html>
```

---

## 📖 Modular ES6 API Reference

### Constructor & Configuration

```javascript
const dice = new PolyDice({
  THREE,                       // Required: Three.js library instance
  Ammo: window.Ammo,           // Required: Ammo.js WebAssembly loader or instance
  ConvexHull,                  // Optional: three/addons/math/ConvexHull.js
  GLTFExporter,                // Optional: three/addons/exporters/GLTFExporter.js
  scene,                       // Host Scene (dice.group mounts automatically)
  tray: {                      // Physics boundaries
    width: 12.0,
    depth: 12.0,
    wallHeight: 2.4,
    thickness: 0.6
  },
  audio: true,                 // Web Audio collision synthesizer
  audioListener,               // Optional: THREE.AudioListener attached to camera
  defaultMaterial: 'ruby',     // Default material finish
  defaultBevel: 0.20,          // 0.0 (Sharp) | 0.10 (Subtle) | 0.20 (Round)
  defaultBevelSegments: 4,     // 1 (Flat chamfer) .. 4 (Spherical dome)
  fastPhysics: true            // true (Fast unbeveled base vertices) | false (Accurate beveled fillet hull)
});
```

### Instance Methods

#### Rolling & Replay
- `dice.roll({ power = 1.0, targets = null, dice = null, instant = false })`: Returns a `Promise<RollResult>` resolving when all dice come to rest.
- `dice.rollInstant({ dice, targets, materials, snapshot })`: Instant RNG visual roll with single-frame render and snapshot generation—requires **zero** physics simulation and no Ammo.js!
- `dice.rollPredeterminedDice(diceTypes, targetValues, power = 1.0)`: Pre-simulates trajectory and replays with rotational offset, guaranteeing the specified face values.
- `dice.setFastPhysics(enabled = true)`: Toggles between fast base-vertex collision hulls (10x-50x less CPU) and full multi-segment beveled fillet collision hulls.
- `dice.parseTargetRollString(str)`: Converts roll notation (e.g. `"2d20: 20, 1"`, `"d6: 6"`) into `{ dice, targets }`.

#### Pool & Theming
- `dice.setDicePool(typesArray, materialsArray = null)`: Configures active dice pool.
- `dice.randomizePoolMaterials(materialKeys = null)`: Shuffles randomized materials across all pool dice.
- `dice.setDiceMaterial(materialName)`: Re-themes all active dice in real time without rerolling.
- `dice.setDieMaterial(dieOrId, materialName)`: Re-themes an individual die.
- `dice.setBevel(ratio, segments = null)`: Adjusts bevel chamfer size (`0.0` to `0.20`).
- `dice.selectDie(dieOrId)` / `dice.deselectDie()`: Toggles visual electric-cyan halo outline.

#### Mesh & Geometry Generation
- `dice.createDieMesh(type, options)`: Returns a standalone `THREE.Mesh` with geometry, UVs, normal map, and PBR material.
- `dice.getFaceCentroids(type)`: Computes ordered centroid vertices for all $N$ faces.
- `dice.createFaceCentroidPoints(type, options)`: Returns a `THREE.Points` cloud of centroids.
- `dice.exportGLTF(options)`: Exports `.glb` file Blob (pass `emitCentroids: true` for metadata).

#### Visuals & Capture
- `dice.createDefaultVisualTray()`: Spawns the emerald felt and walnut wooden arena.
- `dice.toggleShowcaseMode(camera)`: Glides settled dice into an upright camera-facing lineup.
- `dice.generateSnapshot(renderer, camera, options)`: Captures a calibrated 16:9 composite result card.

#### Teardown & Lifecycle
- `dice.dispose()`: Frees all GPU textures/materials/geometries and Ammo.js C++ WASM heap allocations.

### Pub/Sub Events

```javascript
dice.on('rollStart', ({ pool, power, targets }) => {});
dice.on('rollComplete', (result) => console.log('Score:', result.total));
dice.on('collision', ({ type, pos, intensity, mass }) => {});
dice.on('selectionChange', (selectedDie) => {});
dice.on('poolChange', (pool) => {});
```

---

## 🎯 Predetermined Rolls & Server Replay

To support multiplayer games, discord bots, and cryptographic server seeds:
1. `PolyDice` executes an invisible headless Ammo.js simulation in ~4ms.
2. It detects the settled landing orientation and computes a rotational delta quaternion `qOffset` to align the winning face with world $+Y$.
3. When rendered, the dice tumble with authentic physics collisions and sound effects, naturally settling into the exact predetermined numbers.

---

## 📐 Mathematical Face-Up Centroid Detection

For games or external applications that need to know which face is pointing up without using physics colliders or raycasts:

```javascript
import { PolyDice } from './polydice.js';

// Retrieve face centroids (sorted by numerical value: index 0 = face 1, index 1 = face 2, etc.)
const faceData = dice.getFaceCentroids('d20');

function getWinningFace(dieMesh) {
  let highestY = -Infinity;
  let winningValue = 1;

  for (let i = 0; i < faceData.length; i++) {
    // Transform local centroid to world coordinates
    const worldCentroid = faceData[i].centroid.clone().applyMatrix4(dieMesh.matrixWorld);
    if (worldCentroid.y > highestY) {
      highestY = worldCentroid.y;
      winningValue = faceData[i].value;
    }
  }
  return winningValue;
}
```

---

## 🌐 Global Window Aliases & Custom Events

For quick console testing or server webhook integration:
- `window.rollDicePool(power, targets)`
- `window.rollPredeterminedDice(diceTypes, targetValues, power)`
- `window.parseTargetRollString("2d6: 6, 6")`
- `window.dispatchEvent(new CustomEvent('serverDiceRoll', { detail: 'd20: 20' }))`
- `window.addEventListener('diceRollComplete', (e) => console.log(e.detail))`

---

## 🖥️ Browser Compatibility

PolyDice runs on all modern evergreen browsers (Chrome, Edge, Firefox, Safari) supporting:
- **WebGL 2.0**
- **WebAssembly (WASM)**
- **Web Audio API**
- **ES6 JavaScript Modules & Import Maps**

---

## 📄 License

MIT License. Designed and developed with high-performance procedural graphics and physics.
