import * as THREE from "three";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.domElement.className = "three-atmosphere";
renderer.domElement.setAttribute("aria-hidden", "true");
document.body.prepend(renderer.domElement);

scene.add(new THREE.AmbientLight(0x9f7bff, 1.05));
const keyLight = new THREE.PointLight(0xb44dff, 130, 32, 1.8);
keyLight.position.set(-7, 5, 7);
scene.add(keyLight);
const rimLight = new THREE.PointLight(0x5100ff, 170, 35, 1.7);
rimLight.position.set(8, -5, 5);
scene.add(rimLight);

const sphereSpecs = [
  { x: -0.025, y: 0.08, size: 0.205, z: -2.6, speed: 0.22 },
  { x: 0.275, y: 0.30, size: 0.078, z: -1.5, speed: 0.34 },
  { x: 0.49, y: 0.55, size: 0.105, z: -2.1, speed: 0.27 },
  { x: 0.34, y: 0.66, size: 0.17, z: -3.0, speed: 0.18 },
  { x: 0.72, y: 0.78, size: 0.145, z: -1.7, speed: 0.25 },
  { x: 1.015, y: 0.94, size: 0.245, z: -2.4, speed: 0.16 },
];

const spheres = sphereSpecs.map((spec, index) => {
  const material = new THREE.MeshPhysicalMaterial({
    color: index % 2 ? 0x29004f : 0x18002f,
    emissive: index % 2 ? 0x5000b8 : 0x300078,
    emissiveIntensity: 0.6,
    metalness: 0.18,
    roughness: 0.24,
    clearcoat: 0.8,
    clearcoatRoughness: 0.16,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), material);
  mesh.scale.setScalar(spec.size * 16.6);
  mesh.userData = { ...spec, seed: index * 1.7 };
  scene.add(mesh);

  const rim = new THREE.Mesh(new THREE.SphereGeometry(1.012, 48, 32), new THREE.ShaderMaterial({
    uniforms: { uRimColor: { value: new THREE.Color(index % 2 ? 0xa522ff : 0x7700ff) } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -viewPosition.xyz;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uRimColor;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 2.0);
        float rim = smoothstep(0.08, 0.82, fresnel);
        gl_FragColor = vec4(uRimColor, rim * 0.78);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }));
  rim.scale.setScalar(spec.size * 16.6);
  rim.userData = { ...spec, seed: index * 1.7 };
  scene.add(rim);
  mesh.userData.rim = rim;

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: index % 2 ? 0x9f00ff : 0x6400ff,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  glow.scale.set(2.8, 2.8, 1);
  mesh.add(glow);
  return mesh;
});

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 1, 64, 64, 64);
  gradient.addColorStop(0, "rgba(165, 40, 255, 0.5)");
  gradient.addColorStop(0.3, "rgba(112, 0, 255, 0.22)");
  gradient.addColorStop(1, "rgba(70, 0, 180, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
window.addEventListener("pointermove", (event) => {
  pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 0.42;
  pointer.targetY = (event.clientY / window.innerHeight - 0.5) * -0.32;
}, { passive: true });

function placeSpheres(time = 0) {
  const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const viewWidth = viewHeight * camera.aspect;
  spheres.forEach((mesh) => {
    const { x, y, z, speed, seed } = mesh.userData;
    const depthScale = (camera.position.z - z) / camera.position.z;
    const targetX = (x - 0.5) * viewWidth * depthScale;
    const targetY = (0.5 - y) * viewHeight * depthScale;
    const driftX = reducedMotion.matches ? 0 : Math.sin(time * speed + seed) * 0.24;
    const driftY = reducedMotion.matches ? 0 : Math.cos(time * speed * 0.72 + seed) * 0.2;
    mesh.position.set(targetX + driftX, targetY + driftY, z);
    mesh.rotation.y = time * speed * 0.24 + seed;
    mesh.rotation.x = Math.sin(time * speed * 0.5 + seed) * 0.12;
    mesh.userData.rim.position.copy(mesh.position);
    mesh.userData.rim.rotation.copy(mesh.rotation);
  });
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  placeSpheres();
  renderer.render(scene, camera);
}

window.addEventListener("resize", resize, { passive: true });
let frameId;
const clock = new THREE.Clock();
function animate() {
  if (document.hidden || reducedMotion.matches) return;
  frameId = requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  pointer.x += (pointer.targetX - pointer.x) * 0.025;
  pointer.y += (pointer.targetY - pointer.y) * 0.025;
  camera.position.x = pointer.x;
  camera.position.y = pointer.y;
  placeSpheres(time);
  renderer.render(scene, camera);
}
function startScene() {
  cancelAnimationFrame(frameId);
  if (!document.hidden && !reducedMotion.matches) animate();
  else {
    placeSpheres(0);
    renderer.render(scene, camera);
  }
}
startScene();

document.addEventListener("visibilitychange", () => {
  startScene();
});
reducedMotion.addEventListener("change", startScene);
