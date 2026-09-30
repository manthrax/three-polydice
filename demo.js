import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';

export { THREE, ConvexHull, OrbitControls };

/**
 * Creates a calibrated, moody studio environment map with warm key, cool rim,
 * and high-specular overhead strip lights for realistic dice PBR reflections.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @returns {THREE.Texture} Equirectangular PMREM environment texture
 */
export function createMoodyEnvironment(renderer) {
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();

  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Deep Vignette Studio Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
  bgGrad.addColorStop(0, '#2d3a52');
  bgGrad.addColorStop(0.35, '#202a3c');
  bgGrad.addColorStop(0.7, '#161d2a');
  bgGrad.addColorStop(1, '#0e121a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Warm Key Softbox Light
  const warmGlow = ctx.createRadialGradient(512, 110, 5, 512, 110, 280);
  warmGlow.addColorStop(0, 'rgba(255, 245, 230, 0.85)');
  warmGlow.addColorStop(0.25, 'rgba(245, 210, 150, 0.60)');
  warmGlow.addColorStop(0.65, 'rgba(190, 125, 45, 0.25)');
  warmGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = warmGlow;
  ctx.fillRect(0, 0, 1024, 512);

  // Cool Rim Softbox Light
  const coolRim = ctx.createRadialGradient(260, 180, 5, 260, 180, 280);
  coolRim.addColorStop(0, 'rgba(210, 240, 255, 0.75)');
  coolRim.addColorStop(0.35, 'rgba(130, 190, 255, 0.45)');
  coolRim.addColorStop(0.75, 'rgba(30, 80, 170, 0.18)');
  coolRim.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coolRim;
  ctx.fillRect(0, 0, 1024, 512);

  // Overhead Studio Strip Light for Crystal Specular Highlights
  const stripGrad = ctx.createLinearGradient(0, 50, 0, 150);
  stripGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  stripGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.55)');
  stripGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = stripGrad;
  ctx.fillRect(100, 50, 824, 100);

  const envTexture = new THREE.CanvasTexture(c);
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  if (THREE.SRGBColorSpace) {
    envTexture.colorSpace = THREE.SRGBColorSpace;
  } else if (THREE.sRGBEncoding) {
    envTexture.encoding = THREE.sRGBEncoding;
  }

  const envMap = pmremGen.fromEquirectangular(envTexture).texture;
  envTexture.dispose();
  pmremGen.dispose();
  return envMap;
}

/**
 * Encapsulated Three.js Viewport Boilerplate.
 * Sets up Scene, Camera, AudioListener, WebGLRenderer, Studio Environment,
 * and OrbitControls.
 *
 * @param {Object} options
 * @param {HTMLCanvasElement} options.canvas Target canvas element
 * @param {number} [options.cameraX=0]
 * @param {number} [options.cameraY=14]
 * @param {number} [options.cameraZ=13]
 * @param {number} [options.fov=42]
 * @param {boolean} [options.enableControls=true]
 * @param {boolean} [options.autoResize=true]
 * @returns {Object} { scene, camera, renderer, controls, audioListener, moodyEnvMap, resize }
 */
export function setupDemoViewport(options = {}) {
  const canvas = options.canvas;
  if (!canvas) throw new Error('[demo.js] canvas element is required');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#131722');

  const parent = canvas.parentElement || document.body;
  const initialW = options.width || parent.clientWidth || window.innerWidth;
  const initialH = options.height || parent.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(
    options.fov || 42,
    initialW / initialH,
    0.1,
    100
  );
  camera.position.set(
    options.cameraX !== undefined ? options.cameraX : 0,
    options.cameraY !== undefined ? options.cameraY : 14,
    options.cameraZ !== undefined ? options.cameraZ : 13
  );
  camera.lookAt(0, 0, 0);

  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
  });
  renderer.setSize(initialW, initialH, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  if (THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if (THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const moodyEnvMap = createMoodyEnvironment(renderer);
  scene.environment = moodyEnvMap;

  // Multi-light studio rig: Ambient, Sky/Ground Hemi, Key, Fill & Rim
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x1a2e22, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaee, 2.8);
  keyLight.position.set(6, 18, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 1.0;
  keyLight.shadow.camera.far = 40.0;
  keyLight.shadow.camera.left = -14.0;
  keyLight.shadow.camera.right = 14.0;
  keyLight.shadow.camera.top = 18.0;
  keyLight.shadow.camera.bottom = -14.0;
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.035;
  scene.add(keyLight);
  scene.add(keyLight.target);
  keyLight.target.position.set(0, 0, 0);

  const fillLight = new THREE.DirectionalLight(0x8ec5fc, 1.4);
  fillLight.position.set(-8, 12, -6);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffeedd, 1.5);
  rimLight.position.set(0, 8, -12);
  scene.add(rimLight);

  let controls = null;
  if (options.enableControls !== false) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 3.0;
    controls.maxDistance = 35.0;
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function resize(targetW = null, targetH = null) {
    const p = canvas.parentElement || document.body;
    const w = targetW || p.clientWidth || window.innerWidth;
    const h = targetH || p.clientHeight || window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  if (options.autoResize !== false) {
    window.addEventListener('resize', () => resize());
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    audioListener,
    moodyEnvMap,
    resize
  };
}
