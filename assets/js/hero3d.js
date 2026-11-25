import * as THREE from "three";

/*
 * Hero3d — a living 3D greenhouse for the homepage hero.
 * Everything is built procedurally (no textures, models or other assets):
 * a glass greenhouse, a full IBC 1000L watering tank, tomato plants inside,
 * grapevines on the outside, and cyberpunk neon trim under a warm midday sky.
 */

export function init() {
  const canvas = document.getElementById("hero3d");
  if (!canvas || canvas.__hero3dInit) return;
  canvas.__hero3dInit = true;

  const container = canvas.parentElement;
  const reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch (err) {
    // No WebGL: the CSS sky-gradient on the canvas stays as the fallback.
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0xe9f3e4, 16, 42);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  const lookTarget = new THREE.Vector3(0, 1.5, 0);

  /* ------------------------------------------------------------------ */
  /* Lights: warm midday sun + cyberpunk neon fills                     */
  /* ------------------------------------------------------------------ */

  scene.add(new THREE.HemisphereLight(0xdff1ff, 0x24382c, 0.55));

  const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
  sun.position.set(5, 8, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 25;
  sun.shadow.bias = -0.0005;
  sun.target.position.set(0, 1, 0);
  scene.add(sun, sun.target);

  const neonCyan = new THREE.PointLight(0x00e5ff, 10, 8);
  neonCyan.position.set(0, 3.3, 0);
  const neonMagenta = new THREE.PointLight(0xff3fa4, 6, 7);
  neonMagenta.position.set(0, 2.05, 2.3);
  scene.add(neonCyan, neonMagenta);

  /* ------------------------------------------------------------------ */
  /* Ground: dark cyber grid                                            */
  /* ------------------------------------------------------------------ */

  const groundMap = makeGridTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.MeshStandardMaterial({ map: groundMap, roughness: 0.92, metalness: 0.05 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ------------------------------------------------------------------ */
  /* Greenhouse                                                         */
  /* ------------------------------------------------------------------ */

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xd8dee4,
    metalness: 0.85,
    roughness: 0.35,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfe6f0,
    transparent: true,
    opacity: 0.2,
    roughness: 0.08,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const greenhouse = new THREE.Group();
  const W = 6; // x length
  const D = 4; // z depth
  const EAVE = 2.2;
  const RIDGE = 3.4;
  const hw = W / 2;
  const hd = D / 2;

  function beam(a, b, mat = frameMat, radius = 0.03) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 6), mat);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = true;
    greenhouse.add(mesh);
    return mesh;
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // Vertical posts
  for (const x of [-hw, 0, hw]) {
    for (const z of [-hd, hd]) beam(V(x, 0, z), V(x, EAVE, z));
  }
  // Gable walls: girts + rafters
  for (const x of [-hw, hw]) {
    beam(V(x, EAVE, -hd), V(x, EAVE, hd));
    beam(V(x, EAVE, -hd), V(x, RIDGE, 0));
    beam(V(x, EAVE, hd), V(x, RIDGE, 0));
    beam(V(x, 1, -hd), V(x, 1, hd)); // mid rail
  }
  // Eave beams + mid rails along the long walls
  for (const z of [-hd, hd]) {
    beam(V(-hw, EAVE, z), V(hw, EAVE, z));
    beam(V(-hw, 1, z), V(hw, 1, z));
  }
  // Ridge
  beam(V(-hw, RIDGE, 0), V(hw, RIDGE, 0), frameMat, 0.035);

  // Glass surfaces
  function glass(w, h, x, y, z, ry = 0, rx = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    greenhouse.add(m);
    return m;
  }
  glass(W, EAVE, 0, EAVE / 2, -hd);
  glass(W, EAVE, 0, EAVE / 2, hd);
  glass(D, EAVE, -hw, EAVE / 2, 0, Math.PI / 2);
  glass(D, EAVE, hw, EAVE / 2, 0, Math.PI / 2);
  const slopeLen = Math.hypot(hd, RIDGE - EAVE);
  const roofAngle = Math.atan2(RIDGE - EAVE, hd);
  const roofY = (EAVE + RIDGE) / 2;
  const roofBack = glass(slopeLen, W, 0, roofY, -hd / 2, Math.PI / 2, roofAngle);
  roofBack.rotation.order = "YZX";
  const roofFront = glass(slopeLen, W, 0, roofY, hd / 2, Math.PI / 2, -roofAngle);
  roofFront.rotation.order = "YZX";

  scene.add(greenhouse);

  /* ------------------------------------------------------------------ */
  /* IBC tote — full 1000L watering tank                                */
  /* ------------------------------------------------------------------ */

  const ibc = new THREE.Group();
  const S = 1.1; // tote cube size
  const baseY = 0.22; // top of the pallet/legs
  const center = new THREE.Vector3(0, baseY + S / 2, 0);

  const toteMat = new THREE.MeshPhysicalMaterial({
    color: 0x2e6db4,
    transparent: true,
    opacity: 0.92,
    roughness: 0.35,
  });
  const gridMat = new THREE.MeshStandardMaterial({
    color: 0x9aa3ad,
    metalness: 0.9,
    roughness: 0.3,
  });

  // Legs + wheels
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, baseY, 0.07), gridMat);
      leg.position.set(sx * (S / 2 - 0.1), baseY / 2, sz * (S / 2 - 0.1));
      leg.castShadow = true;
      ibc.add(leg);
    }
  }
  const wheelGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12);
  wheelGeo.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wheel = new THREE.Mesh(
        wheelGeo,
        new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.8 })
      );
      wheel.position.set(sx * (S / 2 - 0.1), 0.09, sz * (S / 2 - 0.1));
      wheel.castShadow = true;
      ibc.add(wheel);
    }
  }

  // Water inside (full tank)
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2f9ce8,
    transparent: true,
    opacity: 0.85,
    emissive: 0x14548f,
    emissiveIntensity: 0.18,
    roughness: 0.25,
  });
  const water = new THREE.Mesh(new THREE.BoxGeometry(S * 0.88, S * 0.9, S * 0.88), waterMat);
  water.position.copy(center);
  ibc.add(water);

  // The tote body, slightly transparent so the water reads as full
  const tote = new THREE.Mesh(new THREE.BoxGeometry(S, S, S), toteMat);
  tote.position.copy(center);
  tote.castShadow = true;
  ibc.add(tote);

  // Corner verticals + edge grid of the tote
  const gridR = 0.045;
  const corners = [-1, 1];
  for (const sx of corners) {
    for (const sz of corners) {
      beam(
        V(sx * (S / 2 + gridR / 2), baseY, sz * (S / 2 + gridR / 2)),
        V(sx * (S / 2 + gridR / 2), baseY + S, sz * (S / 2 + gridR / 2)),
        gridMat,
        gridR
      ).parent = ibc;
    }
  }
  for (const sy of [baseY, baseY + S]) {
    for (const sx of corners) {
      beam(V(sx * (S / 2 + gridR / 2), sy, -(S / 2 + gridR / 2)), V(sx * (S / 2 + gridR / 2), sy, S / 2 + gridR / 2), gridMat, gridR).parent = ibc;
    }
    for (const sz of corners) {
      beam(V(-(S / 2 + gridR / 2), sy, sz * (S / 2 + gridR / 2)), V(S / 2 + gridR / 2, sy, sz * (S / 2 + gridR / 2)), gridMat, gridR).parent = ibc;
    }
  }

  // Top cap + handle
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), gridMat);
  cap.position.set(0, baseY + S + 0.04, 0);
  cap.castShadow = true;
  ibc.add(cap);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.06), gridMat);
  handle.position.set(0, baseY + S + 0.09, 0);
  ibc.add(handle);

  // Spigot on the front
  const spigot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), gridMat);
  spigot.position.set(0, baseY + 0.06, S / 2 + 0.11);
  ibc.add(spigot);
  const spigotHandle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), gridMat);
  spigotHandle.position.set(0, baseY + 0.13, S / 2 + 0.11);
  ibc.add(spigotHandle);

  // "1000 L" label on the front face
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.26),
    new THREE.MeshBasicMaterial({ map: makeTextLabelTexture("1000 L"), transparent: true })
  );
  label.position.set(0, center.y + 0.1, S / 2 + 0.006);
  ibc.add(label);

  // Water surface shimmer: a thin translucent disc on top of the water
  const waterTop = new THREE.Mesh(
    new THREE.CircleGeometry(S * 0.43, 24),
    new THREE.MeshBasicMaterial({ color: 0x9fd9ff, transparent: true, opacity: 0.5 })
  );
  waterTop.rotation.x = -Math.PI / 2;
  waterTop.position.set(0, baseY + S * 0.92, 0);
  ibc.add(waterTop);

  // Drops falling from the spigot
  const drops = [];
  const dropGeo = new THREE.SphereGeometry(0.02, 6, 6);
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 3; i++) {
    const drop = new THREE.Mesh(dropGeo, dropMat);
    drop.position.set(0, baseY - 0.02 - i * 0.09, S / 2 + 0.11);
    ibc.add(drop);
    drops.push({ mesh: drop, offset: i / 3 });
  }

  ibc.position.set(-1.6, 0, 0.55);
  ibc.rotation.y = 0.18;
  scene.add(ibc);

  // Hose from the spigot to the tomato plants
  const hoseStart = ibc.localToWorld(V(0, baseY + 0.02, S / 2 + 0.22));
  const hoseCurve = new THREE.CatmullRomCurve3([
    hoseStart,
    hoseStart.clone().add(V(0.5, -0.12, 0.7)),
    V(0.4, 0.03, 0.35).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0)),
    V(0.9, 0.05, 0.1),
  ]);
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 32, 0.022, 6),
    new THREE.MeshStandardMaterial({ color: 0x2e7d4f, roughness: 0.7 })
  );
  hose.castShadow = true;
  scene.add(hose);

  /* ------------------------------------------------------------------ */
  /* Tomato plants (inside)                                             */
  /* ------------------------------------------------------------------ */

  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5b8c3e, roughness: 0.8 });
  const leafMatA = new THREE.MeshStandardMaterial({ color: 0x3f8f3f, roughness: 0.85 });
  const leafMatB = new THREE.MeshStandardMaterial({ color: 0x54a24a, roughness: 0.85 });
  const tomatoMat = new THREE.MeshStandardMaterial({
    color: 0xd43a2a,
    roughness: 0.3,
    emissive: 0x47100a,
    emissiveIntensity: 0.35,
  });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 1 });
  const stakeMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3f, roughness: 0.9 });

  const leafGeo = new THREE.SphereGeometry(0.12, 7, 5);
  leafGeo.scale(1.4, 0.35, 1);
  const tomatoGeo = new THREE.SphereGeometry(0.055, 8, 6);

  const swayers = [];
  function sway(obj, axis, amp, speed, phase = 0) {
    swayers.push({ obj, axis, amp, speed, phase, base: obj.rotation[axis] });
  }

  function tomatoPlant(x, z, scale = 1) {
    const plant = new THREE.Group();

    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.9), soilMat);
    bed.position.y = 0.08;
    bed.castShadow = true;
    bed.receiveShadow = true;
    plant.add(bed);

    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 1.25, 6), stakeMat);
    stake.position.set(0.18, 0.78, -0.1);
    plant.add(stake);

    // Curved stem
    const stemCurve = new THREE.CatmullRomCurve3([
      V(0, 0.12, 0),
      V(0.02, 0.4, 0.03),
      V(-0.03, 0.7, -0.02),
      V(0.06, 1.0, 0.04),
      V(0.02, 1.15, 0),
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 12, 0.02, 5), stemMat);
    stem.castShadow = true;
    plant.add(stem);

    // Leaf tufts and tomatoes along the stem
    for (let i = 1; i <= 6; i++) {
      const y = 0.25 + i * 0.16;
      const tuft = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const leaf = new THREE.Mesh(leafGeo, k % 2 ? leafMatA : leafMatB);
        const a = (k / 4) * Math.PI * 2 + i;
        leaf.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13);
        leaf.rotation.set(Math.random() * 0.5 - 0.25, a, 0);
        leaf.scale.setScalar(0.8 + Math.random() * 0.5);
        leaf.castShadow = true;
        tuft.add(leaf);
      }
      tuft.position.set(Math.sin(i * 1.7) * 0.05, y, Math.cos(i * 2.3) * 0.05);
      plant.add(tuft);
      sway(tuft, "z", 0.08, 1.1 + Math.random() * 0.4, i);

      for (let t = 0; t < 2; t++) {
        if (Math.random() < 0.75) {
          const tomato = new THREE.Mesh(tomatoGeo, tomatoMat);
          const a = Math.random() * Math.PI * 2;
          tomato.position.set(
            tuft.position.x + Math.cos(a) * 0.1,
            y - 0.09 - Math.random() * 0.05,
            tuft.position.z + Math.sin(a) * 0.1
          );
          tomato.castShadow = true;
          plant.add(tomato);
        }
      }
    }

    plant.position.set(x, 0, z);
    plant.scale.setScalar(scale);
    scene.add(plant);
    sway(plant, "z", 0.015, 0.9, x * 3);
    return plant;
  }

  tomatoPlant(1.5, -0.35, 1.0);
  tomatoPlant(2.2, 0.6, 0.85);
  tomatoPlant(0.7, 0.85, 0.9);

  /* ------------------------------------------------------------------ */
  /* Grapevines outside (front wall, above the eaves)                   */
  /* ------------------------------------------------------------------ */

  const grapeMat = new THREE.MeshStandardMaterial({
    color: 0x5a2e6e,
    roughness: 0.35,
    emissive: 0x1d0b22,
    emissiveIntensity: 0.5,
  });
  const grapeGeo = new THREE.SphereGeometry(0.05, 8, 6);

  function grapeCluster(parent, pos) {
    const cluster = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const g = i / 9;
      const berry = new THREE.Mesh(grapeGeo, grapeMat);
      const a = i * 2.4;
      berry.position.set(Math.cos(a) * 0.055 * (1 - g * 0.6), -g * 0.22, Math.sin(a) * 0.055 * (1 - g * 0.6));
      berry.castShadow = true;
      cluster.add(berry);
    }
    cluster.position.copy(pos);
    parent.add(cluster);
    sway(cluster, "z", 0.1, 1.4, pos.x * 5);
    return cluster;
  }

  const vineMat = new THREE.MeshStandardMaterial({ color: 0x4a6b34, roughness: 0.9 });
  const vineCurve = new THREE.CatmullRomCurve3(
    [
      V(-hw + 0.05, EAVE + 0.08, hd + 0.05),
      V(-hw + 0.8, EAVE + 0.22, hd + 0.06),
      V(-1.5, EAVE + 0.06, hd + 0.05),
      V(-0.4, EAVE + 0.26, hd + 0.06),
      V(0.8, EAVE + 0.1, hd + 0.05),
      V(1.9, EAVE + 0.3, hd + 0.06),
      V(hw - 0.05, EAVE + 0.12, hd + 0.05),
    ],
    false,
    "catmullrom",
    0.3
  );
  const vine = new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 48, 0.028, 6), vineMat);
  vine.castShadow = true;
  scene.add(vine);

  for (let i = 0; i < 16; i++) {
    const t = (i + 0.5) / 16;
    const p = vineCurve.getPoint(t);
    const leaf = new THREE.Mesh(leafGeo, i % 2 ? leafMatA : leafMatB);
    leaf.position.copy(p).add(V(0, 0.1, (i % 3 === 0 ? -1 : 1) * 0.06));
    leaf.rotation.set(0.5, t * 9, 0.3);
    leaf.scale.setScalar(0.55 + (i % 4) * 0.1);
    leaf.castShadow = true;
    scene.add(leaf);
    sway(leaf, "z", 0.12, 1.6, i);
  }
  grapeCluster(scene, vineCurve.getPoint(0.16).add(V(0, -0.05, 0)));
  grapeCluster(scene, vineCurve.getPoint(0.42).add(V(0, -0.05, 0)));
  grapeCluster(scene, vineCurve.getPoint(0.7).add(V(0, -0.05, 0)));
  grapeCluster(scene, vineCurve.getPoint(0.9).add(V(0, -0.05, 0)));

  /* ------------------------------------------------------------------ */
  /* Cyberpunk dressing: neon trim + flickering sign                    */
  /* ------------------------------------------------------------------ */

  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xff3fa4 });

  function neonStrip(w, h, d, x, y, z, mat) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    strip.position.set(x, y, z);
    scene.add(strip);
    return strip;
  }

  const ridgeNeon = neonStrip(W, 0.05, 0.05, 0, RIDGE + 0.1, 0, neonCyanMat);
  neonStrip(W, 0.04, 0.04, 0, EAVE + 0.06, hd + 0.06, neonPinkMat);
  neonStrip(W, 0.04, 0.04, 0, EAVE + 0.06, -hd - 0.06, neonPinkMat);

  // Flickering neon sign hanging above the ridge
  const signMat = new THREE.MeshBasicMaterial({
    map: makeSignTexture(),
    transparent: true,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.32), signMat);
  sign.position.set(0, 2.85, 0);
  scene.add(sign);
  // Hangers from the ridge to the sign corners
  for (const sx of [-0.52, 0.52]) {
    const hanger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.38, 5),
      frameMat
    );
    hanger.position.set(sx, 3.14, 0);
    scene.add(hanger);
  }

  /* ------------------------------------------------------------------ */
  /* Floating pollen / ember particles                                  */
  /* ------------------------------------------------------------------ */

  const PARTICLES = 180;
  const pPositions = new Float32Array(PARTICLES * 3);
  const pSpeeds = new Float32Array(PARTICLES);
  for (let i = 0; i < PARTICLES; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 10;
    pPositions[i * 3 + 1] = Math.random() * 4;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 7;
    pSpeeds[i] = 0.05 + Math.random() * 0.12;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xfff2c9,
    size: 0.045,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ------------------------------------------------------------------ */
  /* Sizing, motion, lifecycle                                          */
  /* ------------------------------------------------------------------ */

  let baseDistance = 5.6;
  let mouse = { x: 0, y: 0 }; // target
  let mouseSmooth = { x: 0, y: 0 };
  let visible = true;
  let flickerUntil = 0;
  let signOn = true;

  function onResize() {
    const w = container.clientWidth || container.offsetWidth || window.innerWidth;
    const h = container.clientHeight || container.offsetHeight || window.innerHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull the camera back so the whole greenhouse fits on narrow screens
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const widthNeeded = 7.8 / (2 * Math.tan(halfFov) * camera.aspect);
    baseDistance = Math.max(5.6, widthNeeded);
    camera.updateProjectionMatrix();
    if (reducedMotion || !visible) renderer.render(scene, camera);
  }

  if (typeof ResizeObserver === "function") {
    new ResizeObserver(onResize).observe(container);
  }
  window.addEventListener("resize", onResize);
  onResize();

  if (!reducedMotion) {
    window.addEventListener("pointermove", (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  let lastTime = 0;
  function animate(time) {
    const t = time * 0.001;
    const dt = Math.min(lastTime ? (time - lastTime) * 0.001 : 0.016, 0.05);
    lastTime = time;

    // Camera: slow drift + smoothed mouse parallax
    mouseSmooth.x += (mouse.x - mouseSmooth.x) * 0.04;
    mouseSmooth.y += (mouse.y - mouseSmooth.y) * 0.04;
    const angle = t * 0.06;
    camera.position.set(
      Math.sin(angle) * 1.6 + mouseSmooth.x * 0.45,
      1.7 + Math.cos(angle * 0.7) * 0.2 - mouseSmooth.y * 0.3,
      baseDistance
    );
    camera.lookAt(lookTarget);

    // Plant & grape sway
    for (const s of swayers) {
      s.obj.rotation[s.axis] = s.base + Math.sin(t * s.speed + s.phase) * s.amp;
    }

    // Neon pulse + sign flicker
    neonCyan.intensity = 8 + Math.sin(t * 2.1) * 3;
    neonMagenta.intensity = 5 + Math.cos(t * 1.7) * 1.8;
    ridgeNeon.material.color.setHSL(0.5, 1, 0.55 + Math.sin(t * 2.1) * 0.15);
    if (t >= flickerUntil) {
      if (!signOn && Math.random() < 0.5) {
        signOn = true;
        flickerUntil = t + 0.15 + Math.random() * 1.6;
      } else if (signOn) {
        signOn = false;
        flickerUntil = t + 0.03 + Math.random() * 0.05;
      }
    }
    signMat.opacity = signOn ? 1 : 0.15;

    // Water shimmer + drip
    waterMat.emissiveIntensity = 0.15 + Math.sin(t * 1.3) * 0.07;
    waterTop.material.opacity = 0.35 + Math.sin(t * 2.3) * 0.15;
    for (const d of drops) {
      d.mesh.position.y -= dt * 0.55;
      if (d.mesh.position.y < 0.02) {
        d.mesh.position.y = baseY - 0.02;
      }
    }

    // Drifting pollen
    const pos = pGeo.attributes.position;
    for (let i = 0; i < PARTICLES; i++) {
      let y = pos.getY(i) + pSpeeds[i] * dt * 3;
      if (y > 4) y = 0.05;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.5 + i) * 0.0008);
    }
    pos.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function startLoop() {
    if (visible && !reducedMotion && renderer.setAnimationLoop) {
      renderer.setAnimationLoop(animate);
    }
  }
  function stopLoop() {
    renderer.setAnimationLoop(null);
  }

  // Pause when the hero is scrolled out of view
  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) startLoop();
        else stopLoop();
      },
      { threshold: 0.02 }
    );
    io.observe(container);
  }

  if (reducedMotion) {
    // One nice static frame instead of animation
    lastTime = 2000;
    camera.position.set(0.5, 1.7, baseDistance);
    camera.lookAt(lookTarget);
    renderer.render(scene, camera);
  } else {
    startLoop();
  }
}

/* ---------------------------------------------------------------------- */
/* Texture helpers (all generated on a canvas — zero external assets)     */
/* ---------------------------------------------------------------------- */

function makeCanvasTexture(width, height, draw) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  draw(c.getContext("2d"), width, height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSkyTexture() {
  return makeCanvasTexture(16, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#79bdea");
    g.addColorStop(0.55, "#c9e9f4");
    g.addColorStop(1, "#fdf2d3");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeGridTexture() {
  const tex = makeCanvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = "#15251d";
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "#1f3d31";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    // faint neon-major grid lines
    ctx.strokeStyle = "rgba(0, 229, 255, 0.22)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 512, 512);
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(9, 9);
  tex.anisotropy = 4;
  return tex;
}

function makeTextLabelTexture(text) {
  return makeCanvasTexture(256, 128, (ctx) => {
    ctx.clearRect(0, 0, 256, 128);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 58);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "20px monospace";
    ctx.fillText("DRINK / GROW", 128, 100);
  });
}

function makeSignTexture() {
  return makeCanvasTexture(512, 128, (ctx) => {
    ctx.clearRect(0, 0, 512, 128);
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#8ff4ff";
    ctx.font = "bold 54px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KWEKERIJ // 01", 256, 58);
    ctx.shadowColor = "#ff3fa4";
    ctx.fillStyle = "#ff9bd0";
    ctx.fillRect(126, 92, 260, 5);
  });
}

/* ---------------------------------------------------------------------- */
/* Self-start                                                              */
/* ---------------------------------------------------------------------- */

function selfStart() {
  init();
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", selfStart, { once: true });
  } else {
    selfStart();
  }
}
