/**
 * PolyDice - Procedural Polyhedral 3D Dice Simulation Engine
 * (d4, d6, d8, d10, d12, d14, d16, d20, d24, d30, d48, d60, d100, d120)
 *
 * Zero-asset runtime geometry construction, optical font alignment,
 * procedural diffuse/normal map baking, Ammo.js physics, and acoustic Web Audio synthesis.
 */

// =========================================================================
// 1. PROCEDURAL POLYHEDRAL POINT DEFINITIONS
// =========================================================================
const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio: ~1.6180339887

const PolyhedronPoints = {
  // Regular Tetrahedron (4 faces)
  d4: () => [
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(-1, -1, 1),
    new THREE.Vector3(-1, 1, -1),
    new THREE.Vector3(1, -1, -1)
  ],

  // Regular Hexahedron / Cube (6 faces)
  d6: () => {
    const pts = [];
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        for (const z of [-1, 1]) {
          pts.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return pts;
  },

  // Regular Octahedron (8 faces)
  d8: () => [
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
  ],

  // Pentagonal Trapezohedron points (dual of pentagonal antiprism -> 10 kite faces)
  d10: (k = 5, r = 1.0, h = 0.75) => {
    const pts = [];
    for (let i = 0; i < k; i++) {
      const theta1 = (i * 2 * Math.PI) / k;
      pts.push(new THREE.Vector3(r * Math.cos(theta1), h, r * Math.sin(theta1)));
      const theta2 = ((i + 0.5) * 2 * Math.PI) / k;
      pts.push(new THREE.Vector3(r * Math.cos(theta2), -h, r * Math.sin(theta2)));
    }
    return pts;
  },

  // Regular Dodecahedron (12 pentagonal faces)
  d12: () => {
    const pts = [];
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        for (const z of [-1, 1]) {
          pts.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    const invP = 1 / PHI;
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        pts.push(new THREE.Vector3(0, s1 * invP, s2 * PHI));
        pts.push(new THREE.Vector3(s1 * invP, s2 * PHI, 0));
        pts.push(new THREE.Vector3(s2 * PHI, 0, s1 * invP));
      }
    }
    return pts;
  },

  // Heptagonal Bipyramid (14 triangular faces)
  d14: (k = 7, r = 1.1, h = 1.4) => {
    const pts = [
      new THREE.Vector3(0, h, 0),
      new THREE.Vector3(0, -h, 0)
    ];
    for (let i = 0; i < k; i++) {
      const theta = (i * 2 * Math.PI) / k;
      pts.push(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)));
    }
    return pts;
  },

  // Octagonal Bipyramid (16 triangular faces)
  d16: (k = 8, r = 1.1, h = 1.35) => {
    const pts = [
      new THREE.Vector3(0, h, 0),
      new THREE.Vector3(0, -h, 0)
    ];
    for (let i = 0; i < k; i++) {
      const theta = (i * 2 * Math.PI) / k;
      pts.push(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)));
    }
    return pts;
  },

  // Regular Icosahedron (20 triangular faces)
  d20: () => {
    const pts = [];
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        pts.push(new THREE.Vector3(0, s1 * 1, s2 * PHI));
        pts.push(new THREE.Vector3(s1 * 1, s2 * PHI, 0));
        pts.push(new THREE.Vector3(s2 * PHI, 0, s1 * 1));
      }
    }
    return pts;
  },

  // Dual of Truncated Cube (Triakis Octahedron -> 24 triangular faces)
  d24: () => {
    const pts = [];
    const c0 = Math.sqrt(2) - 1;
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        for (const z of [-1, 1]) {
          pts.push(new THREE.Vector3(x * c0, y, z));
          pts.push(new THREE.Vector3(x, y * c0, z));
          pts.push(new THREE.Vector3(x, y, z * c0));
        }
      }
    }
    return pts;
  },

  // True Canonical Rhombic Triacontahedron (30 congruent golden rhombic faces)
  d30: () => {
    const pts = [];
    const f = PHI;
    const f2 = PHI * PHI;

    // 1. (±ϕ, ±ϕ, ±ϕ) (8 order-3 vertices)
    for (const x of [-f, f]) {
      for (const y of [-f, f]) {
        for (const z of [-f, f]) {
          pts.push(new THREE.Vector3(x, y, z));
        }
      }
    }

    // 2. (0, ±ϕ², ±1) and even cyclic permutations (12 order-3 vertices)
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        pts.push(new THREE.Vector3(0, s1 * f2, s2 * 1.0));
        pts.push(new THREE.Vector3(s2 * 1.0, 0, s1 * f2));
        pts.push(new THREE.Vector3(s1 * f2, s2 * 1.0, 0));
      }
    }

    // 3. (0, ±ϕ, ±ϕ²) and even cyclic permutations (12 order-5 vertices)
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        pts.push(new THREE.Vector3(0, s1 * f, s2 * f2));
        pts.push(new THREE.Vector3(s2 * f2, 0, s1 * f));
        pts.push(new THREE.Vector3(s1 * f, s2 * f2, 0));
      }
    }

    return pts;
  },

  // Dual of Great Rhombicuboctahedron (Disdyakis Dodecahedron -> 48 triangular faces)
  d48: () => {
    const pts = [];
    const a = 1.0;
    const b = 1 + Math.SQRT2;
    const c = 1 + 2 * Math.SQRT2;
    const coords = [a, b, c];
    const perms = [
      [0, 1, 2], [0, 2, 1],
      [1, 0, 2], [1, 2, 0],
      [2, 0, 1], [2, 1, 0]
    ];
    for (const [ix, iy, iz] of perms) {
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          for (const sz of [-1, 1]) {
            pts.push(new THREE.Vector3(sx * coords[ix], sy * coords[iy], sz * coords[iz]));
          }
        }
      }
    }
    return pts;
  },

  // Dual of Truncated Icosahedron (Pentakis Dodecahedron -> 60 triangular faces)
  d60: () => {
    const pts = [];
    const f = PHI;

    // 1. (0, ±1, ±3ϕ) (12 vertices)
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        pts.push(new THREE.Vector3(0, s1 * 1.0, s2 * 3 * f));
        pts.push(new THREE.Vector3(s2 * 3 * f, 0, s1 * 1.0));
        pts.push(new THREE.Vector3(s1 * 1.0, s2 * 3 * f, 0));
      }
    }

    // 2. (±2, ±(1+2ϕ), ±ϕ) (24 vertices)
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        for (const s3 of [-1, 1]) {
          pts.push(new THREE.Vector3(s1 * 2, s2 * (1 + 2 * f), s3 * f));
          pts.push(new THREE.Vector3(s3 * f, s1 * 2, s2 * (1 + 2 * f)));
          pts.push(new THREE.Vector3(s2 * (1 + 2 * f), s3 * f, s1 * 2));
        }
      }
    }

    // 3. (±1, ±(2+ϕ), ±2ϕ) (24 vertices)
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        for (const s3 of [-1, 1]) {
          pts.push(new THREE.Vector3(s1 * 1, s2 * (2 + f), s3 * 2 * f));
          pts.push(new THREE.Vector3(s3 * 2 * f, s1 * 1, s2 * (2 + f)));
          pts.push(new THREE.Vector3(s2 * (2 + f), s3 * 2 * f, s1 * 1));
        }
      }
    }

    return pts;
  },

  // Canonical 100-Faceted Zocchihedron (Dual of 100-Point Spherical Fibonacci Lattice)
  d100: () => {
    const pts = [];
    const N = 100;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996323

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  },

  // Dual of Great Rhombicosidodecahedron (Disdyakis Triacontahedron -> 120 triangular faces)
  d120: () => {
    const pts = [];
    const f = PHI;
    const invF = 1 / f;

    const tuples = [
      [invF, invF, 3 + f],
      [2 * invF, f, 1 + 2 * f],
      [invF, f * f, 3 * f - 1],
      [2 * f - 1, 2, 2 + f],
      [f, 3, 2 * f]
    ];

    for (const [c0, c1, c2] of tuples) {
      for (const s0 of [-1, 1]) {
        for (const s1 of [-1, 1]) {
          for (const s2 of [-1, 1]) {
            pts.push(new THREE.Vector3(s0 * c0, s1 * c1, s2 * c2));
            pts.push(new THREE.Vector3(s2 * c2, s0 * c0, s1 * c1));
            pts.push(new THREE.Vector3(s1 * c1, s2 * c2, s0 * c0));
          }
        }
      }
    }

    return pts;
  }
};

// =========================================================================
// 2. CONVEX HULL MESH & BOUNDED INRADIUS UV BUILDER
// =========================================================================
function pointToSegmentDistance(p, a, b) {
  const ab = new THREE.Vector2().subVectors(b, a);
  const ap = new THREE.Vector2().subVectors(p, a);
  const lenSq = ab.lengthSq();
  if (lenSq === 0) return ap.length();
  const t = Math.max(0, Math.min(1, ap.dot(ab) / lenSq));
  const proj = new THREE.Vector2().copy(a).addScaledVector(ab, t);
  return p.distanceTo(proj);
}

/**
 * Sanitizes floating-point coordinates into clean fixed-precision strings,
 * specifically preventing "-0.0000" vs "0.0000" mismatch in Map keys.
 */
function formatCoord(n) {
  const v = Math.abs(n) < 1e-5 ? 0 : n;
  return v.toFixed(4);
}

function buildHedronMesh(rawPoints, isDual = false, bevel = 0.0, bevelSegments = 2) {
  const points = rawPoints.map(p => p.clone());
  const hull = new ConvexHull();
  hull.setFromPoints(points);

  let targetFaces = hull.faces;

  // When dual shape is requested (e.g. d10 pentagonal trapezohedron, d24 triakis octahedron)
  if (isDual) {
    const dualPoints = [];
    for (let i = 0; i < hull.faces.length; i++) {
      const f = hull.faces[i];
      const d = -f.constant;
      const dist = Math.abs(d) > 1e-4 ? d : 1.0;
      dualPoints.push(f.normal.clone().multiplyScalar(1 / dist));
    }
    const dualHull = new ConvexHull();
    dualHull.setFromPoints(dualPoints);
    targetFaces = dualHull.faces;
  }

  // Group coplanar triangular facets into polygon faces
  const polygonFaces = [];
  const visited = new Set();

  for (let i = 0; i < targetFaces.length; i++) {
    if (visited.has(i)) continue;
    const baseFace = targetFaces[i];
    visited.add(i);

    const group = [baseFace];
    for (let j = i + 1; j < targetFaces.length; j++) {
      if (visited.has(j)) continue;
      const testFace = targetFaces[j];
      if (baseFace.normal.dot(testFace.normal) > 0.999 && Math.abs(baseFace.constant - testFace.constant) < 1e-3) {
        visited.add(j);
        group.push(testFace);
      }
    }

    // Trace perimeter boundary edges, canceling out internal shared edges
    const edgeCount = new Map();
    group.forEach(face => {
      let edge = face.edge;
      do {
        const pA = edge.tail().point;
        const pB = edge.head().point;
        const k1 = `${formatCoord(pA.x)},${formatCoord(pA.y)},${formatCoord(pA.z)}->${formatCoord(pB.x)},${formatCoord(pB.y)},${formatCoord(pB.z)}`;
        const k2 = `${formatCoord(pB.x)},${formatCoord(pB.y)},${formatCoord(pB.z)}->${formatCoord(pA.x)},${formatCoord(pA.y)},${formatCoord(pA.z)}`;
        if (edgeCount.has(k2)) {
          edgeCount.delete(k2);
        } else {
          edgeCount.set(k1, { from: pA, to: pB });
        }
        edge = edge.next;
      } while (edge !== face.edge);
    });

    const boundaryEdges = Array.from(edgeCount.values());
    if (boundaryEdges.length >= 3) {
      const poly = [boundaryEdges[0].from];
      let cur = boundaryEdges[0].to;
      const used = new Set([0]);

      while (poly.length < boundaryEdges.length) {
        poly.push(cur);
        const nextIdx = boundaryEdges.findIndex((e, idx) => !used.has(idx) && e.from.distanceToSquared(cur) < 1e-6);
        if (nextIdx === -1) break;
        used.add(nextIdx);
        cur = boundaryEdges[nextIdx].to;
      }
      if (poly.length >= 3) {
        polygonFaces.push({ normal: baseFace.normal.clone(), poly });
      }
    } else {
      const poly = [];
      let edge = baseFace.edge;
      do {
        poly.push(edge.head().point);
        edge = edge.next;
      } while (edge !== baseFace.edge);
      polygonFaces.push({ normal: baseFace.normal.clone(), poly });
    }
  }

  const numFaces = Math.max(1, polygonFaces.length);
  const cols = Math.ceil(Math.sqrt(numFaces));
  const rows = Math.ceil(numFaces / cols);
  const cellW = 1.0 / cols;
  const cellH = 1.0 / rows;
  const cellDim = Math.min(cellW, cellH);
  const margin = 0.08;

  const positions = [];
  const normals = [];
  const uvs = [];

  const e0 = new THREE.Vector3();
  const t = new THREE.Vector3();
  const b = new THREE.Vector3();
  const diff = new THREE.Vector3();
  const faceInfos = [];
  const faceDescriptors = [];

  polygonFaces.forEach((face, fIdx) => {
    const fn = face.normal;
    let poly = face.poly;

    // Verify outward winding order
    if (poly.length >= 3) {
      const v01 = new THREE.Vector3().subVectors(poly[1], poly[0]);
      const v02 = new THREE.Vector3().subVectors(poly[2], poly[0]);
      const cross = new THREE.Vector3().crossVectors(v01, v02);
      if (cross.dot(fn) < 0) {
        poly = poly.slice().reverse();
        face.poly = poly;
      }
    }

    e0.subVectors(poly[1], poly[0]);
    t.copy(e0).normalize();
    b.crossVectors(fn, t).normalize();

    const local2D = poly.map(pt => {
      diff.subVectors(pt, poly[0]);
      return new THREE.Vector2(diff.dot(t), diff.dot(b));
    });

    const center = new THREE.Vector2(0, 0);
    local2D.forEach(p => center.add(p));
    center.divideScalar(local2D.length);

    let maxExtX = 0, maxExtY = 0;
    local2D.forEach(p => {
      const dx = Math.abs(p.x - center.x);
      const dy = Math.abs(p.y - center.y);
      if (dx > maxExtX) maxExtX = dx;
      if (dy > maxExtY) maxExtY = dy;
    });
    const maxExtent = Math.max(maxExtX, maxExtY, 1e-4);

    let minEdgeDist = Infinity;
    for (let i = 0; i < local2D.length; i++) {
      const p1 = local2D[i];
      const p2 = local2D[(i + 1) % local2D.length];
      const dist = pointToSegmentDistance(center, p1, p2);
      if (dist < minEdgeDist) minEdgeDist = dist;
    }

    // Bounding span calibrated so face polygons utilize ~94% of available cell texture space
    const paddingFactor = 1.06;
    const boundingSpan = maxExtent * 2.0 * paddingFactor;
    const inradiusNorm = minEdgeDist / maxExtent;

    const col = fIdx % cols;
    const row = Math.floor(fIdx / cols);

    faceInfos.push({ inradiusNorm });

    // 3D center of this face for physics roll evaluation
    const center3D = new THREE.Vector3();
    poly.forEach(pt => center3D.add(pt));
    center3D.divideScalar(poly.length);

    faceDescriptors.push({
      value: fIdx + 1,
      normal: fn.clone().normalize(),
      center: center3D,
      tangent: t.clone().normalize(),
      bitangent: b.clone().normalize()
    });

    const drawPoly = bevel > 0.001
      ? poly.map(pt => new THREE.Vector3().lerpVectors(pt, center3D, bevel))
      : poly;
    if (bevel > 0.001) face.inset3D = drawPoly;

    const draw2D = bevel > 0.001
      ? local2D.map(p => new THREE.Vector2().lerpVectors(p, center, bevel))
      : local2D;

    for (let i = 1; i < drawPoly.length - 1; i++) {
      const tri = [0, i, i + 1];
      for (const idx of tri) {
        const pt = drawPoly[idx];
        const p2 = draw2D[idx];

        positions.push(pt.x, pt.y, pt.z);
        normals.push(fn.x, fn.y, fn.z);

        const uLocal = (p2.x - center.x) / boundingSpan;
        const vLocal = (p2.y - center.y) / boundingSpan;

        const uvU = (col + 0.5) * cellW + uLocal * cellDim;
        const uvV = (row + 0.5) * cellH + vLocal * cellDim;

        uvs.push(uvU, uvV);
      }
    }
  });

  // Procedural Multi-Segment Edge Chamfers and Vertex Corner Caps
  if (bevel > 0.001) {
    const segments = Math.max(1, Math.min(6, Math.round(bevelSegments) || 1));
    const edgeMap = new Map();

    polygonFaces.forEach((face, fIdx) => {
      const poly = face.poly;
      const inset = face.inset3D;
      const k = poly.length;

      for (let i = 0; i < k; i++) {
        const pA = poly[i];
        const pB = poly[(i + 1) % k];
        const kA = `${formatCoord(pA.x)},${formatCoord(pA.y)},${formatCoord(pA.z)}`;
        const kB = `${formatCoord(pB.x)},${formatCoord(pB.y)},${formatCoord(pB.z)}`;
        const fwdKey = `${kA}->${kB}`;
        const revKey = `${kB}->${kA}`;

        if (edgeMap.has(revKey)) {
          const other = edgeMap.get(revKey);
          const vA1 = inset[i];
          const vB1 = inset[(i + 1) % k];
          const vB2 = other.inset[other.i];
          const vA2 = other.inset[(other.i + 1) % other.k];

          const n1 = face.normal;
          const n2 = other.normal;
          const avgN = new THREE.Vector3().addVectors(n1, n2).normalize();
          const dotN = Math.max(-1, Math.min(1, n1.dot(n2)));
          const w = Math.sqrt((1 + dotN) / 2);

          const ptsA = [];
          const ptsB = [];
          const arcNormals = [];

          for (let s = 0; s <= segments; s++) {
            const t = s / segments;
            if (segments === 1) {
              ptsA.push(s === 0 ? vA1 : vA2);
              ptsB.push(s === 0 ? vB1 : vB2);
              arcNormals.push(avgN);
            } else {
              const b0 = (1 - t) * (1 - t);
              const b1 = 2 * w * (1 - t) * t;
              const b2 = t * t;
              const denom = b0 + b1 + b2;

              ptsA.push(new THREE.Vector3(
                (b0 * vA1.x + b1 * pA.x + b2 * vA2.x) / denom,
                (b0 * vA1.y + b1 * pA.y + b2 * vA2.y) / denom,
                (b0 * vA1.z + b1 * pA.z + b2 * vA2.z) / denom
              ));
              ptsB.push(new THREE.Vector3(
                (b0 * vB1.x + b1 * pB.x + b2 * vB2.x) / denom,
                (b0 * vB1.y + b1 * pB.y + b2 * vB2.y) / denom,
                (b0 * vB1.z + b1 * pB.z + b2 * vB2.z) / denom
              ));
              const an = new THREE.Vector3().lerpVectors(n1, n2, t).normalize();
              arcNormals.push(an);
            }
          }

          // Quad strips with verified counter-clockwise outward winding & healthy UVs
          for (let s = 0; s < segments; s++) {
            const pA0 = ptsA[s];
            const pA1 = ptsA[s + 1];
            const pB0 = ptsB[s];
            const pB1 = ptsB[s + 1];

            const nA0 = arcNormals[s];
            const nA1 = arcNormals[s + 1];
            const nB0 = arcNormals[s];
            const nB1 = arcNormals[s + 1];

            const u0 = 0.003;
            const u1 = 0.007;
            const v0 = 0.003 + 0.004 * (s / segments);
            const v1 = 0.003 + 0.004 * ((s + 1) / segments);

            // Tri 1: pA0 -> pB1 -> pB0 (CCW outward)
            positions.push(pA0.x, pA0.y, pA0.z);
            normals.push(nA0.x, nA0.y, nA0.z);
            uvs.push(u0, v0);

            positions.push(pB1.x, pB1.y, pB1.z);
            normals.push(nB1.x, nB1.y, nB1.z);
            uvs.push(u1, v1);

            positions.push(pB0.x, pB0.y, pB0.z);
            normals.push(nB0.x, nB0.y, nB0.z);
            uvs.push(u1, v0);

            // Tri 2: pA0 -> pA1 -> pB1 (CCW outward)
            positions.push(pA0.x, pA0.y, pA0.z);
            normals.push(nA0.x, nA0.y, nA0.z);
            uvs.push(u0, v0);

            positions.push(pA1.x, pA1.y, pA1.z);
            normals.push(nA1.x, nA1.y, nA1.z);
            uvs.push(u0, v1);

            positions.push(pB1.x, pB1.y, pB1.z);
            normals.push(nB1.x, nB1.y, nB1.z);
            uvs.push(u1, v1);
          }
        } else {
          edgeMap.set(fwdKey, { fIdx, i, k, inset, normal: face.normal });
        }
      }
    });

    // Corner caps for each original vertex
    const cornerMap = new Map();
    polygonFaces.forEach((face) => {
      const poly = face.poly;
      const inset = face.inset3D;
      for (let i = 0; i < poly.length; i++) {
        const pt = poly[i];
        const key = `${formatCoord(pt.x)},${formatCoord(pt.y)},${formatCoord(pt.z)}`;
        if (!cornerMap.has(key)) {
          cornerMap.set(key, { origPt: pt.clone(), incident: [] });
        }
        cornerMap.get(key).incident.push({
          pt: inset[i],
          normal: face.normal
        });
      }
    });

    cornerMap.forEach((val) => {
      const origPt = val.origPt;
      const incident = val.incident;
      if (incident.length < 3) return;

      const cNorm = origPt.clone().normalize();
      const ref = new THREE.Vector3().subVectors(incident[0].pt, origPt);
      let u = ref.clone().addScaledVector(cNorm, -ref.dot(cNorm)).normalize();
      if (u.lengthSq() < 1e-4) {
        u.set(1, 0, 0);
        if (Math.abs(cNorm.dot(u)) > 0.9) u.set(0, 1, 0);
        u.addScaledVector(cNorm, -cNorm.dot(u)).normalize();
      }
      const v = new THREE.Vector3().crossVectors(cNorm, u).normalize();

      incident.sort((a, b) => {
        const da = new THREE.Vector3().subVectors(a.pt, origPt);
        const db = new THREE.Vector3().subVectors(b.pt, origPt);
        const angA = Math.atan2(da.dot(v), da.dot(u));
        const angB = Math.atan2(db.dot(v), db.dot(u));
        return angA - angB;
      });

      const uCenter = 0.005, vCenter = 0.005, rUV = 0.0025;

      if (segments === 1) {
        // Flat polygon fan for 1-segment chamfer with healthy non-zero UVs
        const uvCoords = incident.map((inc, idx) => {
          const ang = (idx / incident.length) * Math.PI * 2;
          return {
            u: uCenter + rUV * Math.cos(ang),
            v: vCenter + rUV * Math.sin(ang)
          };
        });

        for (let j = 1; j < incident.length - 1; j++) {
          const tri = [
            { pt: incident[0].pt, uv: uvCoords[0] },
            { pt: incident[j].pt, uv: uvCoords[j] },
            { pt: incident[j + 1].pt, uv: uvCoords[j + 1] }
          ];
          for (const vert of tri) {
            positions.push(vert.pt.x, vert.pt.y, vert.pt.z);
            normals.push(cNorm.x, cNorm.y, cNorm.z);
            uvs.push(vert.uv.u, vert.uv.v);
          }
        }
      } else {
        // Rounded dome fan for multi-segment bevel
        const boundaryPoints = [];
        const m = incident.length;
        let sumBaseProj = 0;
        let sumW = 0;

        for (let j = 0; j < m; j++) {
          sumBaseProj += incident[j].pt.dot(cNorm);
          const curInc = incident[j];
          const nextInc = incident[(j + 1) % m];
          const dotN = Math.max(-1, Math.min(1, curInc.normal.dot(nextInc.normal)));
          const w = Math.sqrt((1 + dotN) / 2);
          sumW += w;

          for (let s = 0; s < segments; s++) {
            const t = s / segments;
            const b0 = (1 - t) * (1 - t);
            const b1 = 2 * w * (1 - t) * t;
            const b2 = t * t;
            const denom = b0 + b1 + b2;

            const pArc = new THREE.Vector3(
              (b0 * curInc.pt.x + b1 * origPt.x + b2 * nextInc.pt.x) / denom,
              (b0 * curInc.pt.y + b1 * origPt.y + b2 * nextInc.pt.y) / denom,
              (b0 * curInc.pt.z + b1 * origPt.z + b2 * nextInc.pt.z) / denom
            );
            const nArc = new THREE.Vector3().lerpVectors(curInc.normal, nextInc.normal, t).normalize();
            boundaryPoints.push({ pt: pArc, normal: nArc });
          }
        }

        // Apex center point: push outward to seamlessly match edge fillet crest height
        const rBase = sumBaseProj / m;
        const rOrig = origPt.dot(cNorm);
        const wAvg = sumW / m;
        const pushFactor = wAvg / (1 + wAvg);
        const rApex = rBase + pushFactor * (rOrig - rBase);
        const pApex = cNorm.clone().multiplyScalar(rApex);

        const K = boundaryPoints.length;
        for (let j = 0; j < K; j++) {
          const bp0 = boundaryPoints[j];
          const bp1 = boundaryPoints[(j + 1) % K];

          const ang0 = (j / K) * Math.PI * 2;
          const ang1 = ((j + 1) / K) * Math.PI * 2;

          const u0 = uCenter + rUV * Math.cos(ang0);
          const v0 = vCenter + rUV * Math.sin(ang0);
          const u1 = uCenter + rUV * Math.cos(ang1);
          const v1 = vCenter + rUV * Math.sin(ang1);

          // Triangle: pApex -> bp0 -> bp1 (CCW outward)
          positions.push(pApex.x, pApex.y, pApex.z);
          normals.push(cNorm.x, cNorm.y, cNorm.z);
          uvs.push(uCenter, vCenter);

          positions.push(bp0.pt.x, bp0.pt.y, bp0.pt.z);
          normals.push(bp0.normal.x, bp0.normal.y, bp0.normal.z);
          uvs.push(u0, v0);

          positions.push(bp1.pt.x, bp1.pt.y, bp1.pt.z);
          normals.push(bp1.normal.x, bp1.normal.y, bp1.normal.z);
          uvs.push(u1, v1);
        }
      }
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  geometry.computeBoundingSphere();
  const scale = 1.0 / (geometry.boundingSphere.radius || 1.0);
  geometry.scale(scale, scale, scale);

  faceDescriptors.forEach(fd => {
    fd.center.multiplyScalar(scale);
  });

  // Extract unique base/unbeveled vertices scaled to match the normalized mesh size
  const basePoints = [];
  const baseKeys = new Set();
  polygonFaces.forEach(f => {
    f.poly.forEach(pt => {
      const sp = pt.clone().multiplyScalar(scale);
      const k = `${sp.x.toFixed(4)},${sp.y.toFixed(4)},${sp.z.toFixed(4)}`;
      if (!baseKeys.has(k)) {
        baseKeys.add(k);
        basePoints.push(sp);
      }
    });
  });

  return { geometry, basePoints, numFaces, cols, rows, faceInfos, faceDescriptors };
}


// =========================================================================
// 3. FAST DIFFUSE & ENGRAVED NORMAL MAP BAKER & MATERIAL FACTORY
// =========================================================================
const DICE_MATERIALS = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Resin',
    baseColor: '#131313',
    fleckColor1: 'rgba(255,255,255,1)',
    fleckColor2: 'rgba(0,0,0,1)',
    hasFlecks: false,
    numOcclusionColor: 'rgba(0, 0, 0, 0.95)',
    numFillColor: '#f0f3f6', // crisp silver/white enamel
    roughness: 0.024,
    metalness: 0.08,
    clearcoat: 0.1,
    clearcoatRoughness: 0.1,
    transmission: 0.0,
    ior: 1.5
  },
  gold: {
    id: 'gold',
    name: 'Royal Gold',
    baseColor: '#f99500', // rich forged gold
    fleckColor1: 'rgba(255,235,170,1)',
    fleckColor2: 'rgba(160,110,20,1)',
    hasFlecks: false,
    numOcclusionColor: 'rgba(20, 15, 5, 0.98)',
    numFillColor: '#121215', // deep obsidian black enamel inlay
    roughness: 0.020,
    metalness: 0.92,
    clearcoat: 0.35,
    clearcoatRoughness: 0.015,
    transmission: 0.0,
    ior: 1.5
  },
  ruby: {
    id: 'ruby',
    name: 'Translucent Ruby',
    baseColor: '#ec0000', // rich jewel ruby body
    fleckColor1: 'rgba(255,140,160,',
    fleckColor2: 'rgba(70,0,10,',
    hasFlecks: false,
    numOcclusionColor: 'rgba(255, 255, 255, 0.98)',
    numFillColor: '#fffaed', // radiant warm gold enamel inlay
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.04,
    transmission: 0.99,
    thickness: 1.2,
    ior: 1.54,
    attenuationColor: '#b13333', // deep saturated crimson ruby core
    attenuationDistance: 1.8,
    transparent: false
  },
  emerald: {
    id: 'emerald',
    name: 'Imperial Emerald',
    baseColor: '#1ac000', // deep imperial emerald jade body
    fleckColor1: 'rgba(130,255,190,',
    fleckColor2: 'rgba(0,40,20,',
    hasFlecks: false,
    numOcclusionColor: 'rgba(0, 40, 20, 0.98)',
    numFillColor: '#ffffffff', // brilliant gold leaf inlay
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.04,
    transmission: 0.99,
    thickness: 1.2,
    ior: 1.54,
    attenuationColor: '#054726', // rich deep forest-emerald core
    attenuationDistance: 1.8,
    transparent: false
  },
  sapphire: {
    id: 'sapphire',
    name: 'Celestial Sapphire',
    baseColor: '#033eff', // deep rich sapphire blue body
    fleckColor1: 'rgba(160, 0, 189, 1)',
    fleckColor2: 'rgba(0, 247, 255, 1)',
    hasFlecks: false,
    numOcclusionColor: 'rgba(0, 20, 50, 0.98)',
    numFillColor: '#ffffff', // pure ice white enamel inlay
    roughness: 0.08,
    metalness: 0.02,
    clearcoat: 0.9,
    clearcoatRoughness: 0.04,
    transmission: 0.99,
    thickness: 1.2,
    ior: 1.54,
    attenuationColor: '#0d2d6c', // deep midnight sapphire core
    attenuationDistance: 1.8,
    transparent: false
  },
  pearl: {
    id: 'pearl',
    name: 'Opalescent Pearl',
    baseColor: '#f0ece1', // rich creamy nacre base
    fleckColor1: 'rgba(255, 215, 235,1.)',
    fleckColor2: 'rgba(200, 248, 232,1.)',
    hasFlecks: true,
    isPearl: true,
    useIridescenceMap: true,
    numOcclusionColor: 'rgba(45, 25, 35, 0.95)',
    numFillColor: '#251b22', // deep rosewood bronze lacquer inlay
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    iridescence: 0.8,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [140, 680],
    sheen: 0.6,
    sheenColor: '#ffb3d9',
    sheenRoughness: 0.1,
    transmission: 0.0,
    ior: 1.54
  },
  silver: {
    id: 'silver',
    name: 'Sterling Silver',
    baseColor: '#c8d0da', // polished forged sterling silver
    fleckColor1: 'rgba(255,255,255,1.)',
    fleckColor2: 'rgba(180,195,210,1.)',
    hasFlecks: true,
    numOcclusionColor: 'rgba(10, 15, 24, 0.98)',
    numFillColor: '#0f1218', // deep obsidian black enamel inlay
    roughness: 0.022,
    metalness: 0.94,
    clearcoat: 0.035,
    clearcoatRoughness: 0.012,
    transmission: 0.0,
    ior: 1.5
  }
};

let currentMaterial = 'ruby';
let currentBevel = 0.20;
let currentBevelSegments = 4;

function createDiceMaterial(diffuseMap, normalMap, matKey = currentMaterial, isFlatShaded = false, iridescenceThicknessMap = null, transmissionMap = null, alphaMap = null, bevel = currentBevel) {
  const matDef = DICE_MATERIALS[matKey] || DICE_MATERIALS.obsidian;
  const isPhysical = (matDef.transmission > 0) || (matDef.iridescence > 0) || (matDef.sheen > 0) || (matDef.clearcoat > 0);
  const MaterialClass = isPhysical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;

  const activeBevel = (typeof bevel === 'number') ? bevel : currentBevel;
  const bevelRatio = Math.max(0, Math.min(1, activeBevel / 0.20));
  const nScale = 1.25 + bevelRatio * 0.35; // 1.25 (sharp) to 1.60 (round)

  const matParams = {
    map: diffuseMap,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(nScale, nScale),
    roughness: matDef.roughness,
    metalness: matDef.metalness,
    flatShading: isFlatShaded,
    dithering: true
  };

  if (matDef.clearcoat > 0) {
    matParams.clearcoat = matDef.clearcoat;
    matParams.clearcoatRoughness = matDef.clearcoatRoughness || 0.1;
  }

  if (matDef.iridescence > 0) {
    matParams.iridescence = matDef.iridescence;
    matParams.iridescenceIOR = matDef.iridescenceIOR || 1.6;
    matParams.iridescenceThicknessRange = matDef.iridescenceThicknessRange || [100, 400];
    if (iridescenceThicknessMap) {
      matParams.iridescenceThicknessMap = iridescenceThicknessMap;
    }
  }

  if (matDef.sheen > 0) {
    matParams.sheen = matDef.sheen;
    matParams.sheenColor = new THREE.Color(matDef.sheenColor || '#ffd6ea');
    matParams.sheenRoughness = matDef.sheenRoughness || 0.2;
  }

  if (matDef.transmission > 0) {
    matParams.transmission = matDef.transmission;
    matParams.thickness = matDef.thickness || 1.3;
    matParams.ior = matDef.ior || 1.50;
    matParams.attenuationColor = new THREE.Color(matDef.attenuationColor || '#ffffff');
    matParams.attenuationDistance = matDef.attenuationDistance || 10.0;
    matParams.transparent = false; // Three.js requires transparent=false for screen-space transmission refraction
    if (transmissionMap) {
      matParams.transmissionMap = transmissionMap; // Keeps engraved numbers 100% solid & opaque!
    }
  } else if (matDef.transparent) {
    matParams.transparent = true;
    matParams.opacity = (matDef.opacity !== undefined) ? matDef.opacity : 0.85;
    matParams.depthWrite = true;
    if (alphaMap) {
      matParams.alphaMap = alphaMap; // Keeps engraved numbers 100% solid & opaque in opacity mode!
    }
  }

  const mat = new MaterialClass(matParams);
  if (alphaMap) {
    mat.opacityMap = alphaMap; // Alias so both opacityMap and alphaMap exist
  }
  return mat;
}

function createDiceTextures(numFaces, cols, rows, faceInfos, isInspector = false, matKey = currentMaterial, bevel = currentBevel) {
  // 1024 for responsive physics tray runtime, 2048 for high-res inspector
  const size = isInspector ? 2048 : 1024;
  const matDef = DICE_MATERIALS[matKey] || DICE_MATERIALS.obsidian;

  // 1. Heightmap Canvas
  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const hCtx = heightCanvas.getContext('2d', { willReadFrequently: true });
  hCtx.fillStyle = '#ffffff';
  hCtx.fillRect(0, 0, size, size);

  // Dedicated Transmission Map Canvas (white = 1.0 crystal transmission, black = 0.0 solid opaque numbers)
  const transCanvas = document.createElement('canvas');
  transCanvas.width = size;
  transCanvas.height = size;
  const tCtx = transCanvas.getContext('2d');
  tCtx.fillStyle = '#ffffff';
  tCtx.fillRect(0, 0, size, size);
  tCtx.textAlign = 'center';
  tCtx.textBaseline = 'middle';

  // Dedicated Opacity / Alpha Map Canvas (white = 1.0 solid opaque numbers, base = transparent body)
  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = size;
  alphaCanvas.height = size;
  const aCtx = alphaCanvas.getContext('2d');
  const baseAlpha = (matDef.opacity !== undefined) ? matDef.opacity : 0.45;
  const baseAlphaByte = Math.floor(baseAlpha * 255);
  aCtx.fillStyle = `rgb(${baseAlphaByte}, ${baseAlphaByte}, ${baseAlphaByte})`;
  aCtx.fillRect(0, 0, size, size);
  aCtx.textAlign = 'center';
  aCtx.textBaseline = 'middle';

  // 2. Diffuse Canvas
  const diffCanvas = isInspector ? document.getElementById('diffuse-canvas') : document.createElement('canvas');
  diffCanvas.width = size;
  diffCanvas.height = size;
  const dCtx = diffCanvas.getContext('2d');

  // Clear and base coat color
  dCtx.clearRect(0, 0, size, size);
  dCtx.fillStyle = matDef.baseColor;
  dCtx.fillRect(0, 0, size, size);

  // Subtle surface fleck noise / mineral grain
  if (matDef.hasFlecks) {
    const noisePoints = Math.floor(size * 18);
    for (let i = 0; i < noisePoints; i++) {
      const gx = Math.random() * size;
      const gy = Math.random() * size;
      const alpha = 0.02 + Math.random() * 0.035;
      dCtx.fillStyle = Math.random() > 0.5 ? `${matDef.fleckColor1}${alpha})` : `${matDef.fleckColor2}${alpha})`;
      dCtx.fillRect(gx, gy, 2, 2);
    }
  }

  // Natural mother-of-pearl layered nacre iridescence
  if (matDef.isPearl) {
    const nacreLayers = 14;
    for (let l = 0; l < nacreLayers; l++) {
      const yStart = (l / nacreLayers) * size * 1.3 - size * 0.15;
      const grad = dCtx.createLinearGradient(0, yStart, size, yStart + size * 0.3);
      grad.addColorStop(0.00, 'rgba(248, 220, 235, 0.98)'); // delicate rose nacre
      grad.addColorStop(0.25, 'rgba(215, 246, 236, 0.90)'); // luminous celadon opal green
      grad.addColorStop(0.50, 'rgba(235, 222, 255, 0.98)'); // soft violet nacre
      grad.addColorStop(0.75, 'rgba(255, 246, 220, 0.92)'); // radiant champagne gold
      grad.addColorStop(1.00, 'rgba(215, 240, 255, 0.96)'); // pale cyan sheen
      dCtx.fillStyle = grad;

      dCtx.beginPath();
      dCtx.moveTo(0, yStart);
      for (let x = 0; x <= size; x += 32) {
        const wave = Math.sin(x * 0.012 + l * 0.9) * 35 + Math.cos(x * 0.006 + l * 1.5) * 20;
        dCtx.lineTo(x, yStart + wave);
      }
      dCtx.lineTo(size, size);
      dCtx.lineTo(0, size);
      dCtx.closePath();
      dCtx.fill();
    }
  }



  const cellW = size / cols;
  const cellH = size / rows;
  const activeBevel = (typeof bevel === 'number') ? bevel : currentBevel;
  const bevelRatio = Math.max(0, Math.min(1, activeBevel / 0.20));

  dCtx.textAlign = 'center';
  dCtx.textBaseline = 'alphabetic';
  hCtx.textAlign = 'center';
  hCtx.textBaseline = 'alphabetic';
  tCtx.textAlign = 'center';
  tCtx.textBaseline = 'alphabetic';
  aCtx.textAlign = 'center';
  aCtx.textBaseline = 'alphabetic';

  for (let i = 0; i < numFaces; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);

    const x = c * cellW;
    const y = (rows - 1 - r) * cellH;
    const cx = x + cellW / 2;
    const cy = y + cellH / 2;

    const text = `${i + 1}`;
    const baseDim = Math.min(cellW, cellH);

    const inrad = faceInfos[i]?.inradiusNorm || 0.7;
    // Inset factor accounts for facet shrinkage under bevel (flat face shrinks by bevel ratio)
    const bevelInsetFactor = Math.max(0.66, 1.0 - activeBevel * 1.35);
    let fontSize = Math.floor(baseDim * inrad * 0.825 * bevelInsetFactor);
    if (text.length === 2) fontSize = Math.floor(fontSize * 0.72);
    else if (text.length >= 3) fontSize = Math.floor(fontSize * 0.54);
    if (numFaces >= 20 && text.length === 1) fontSize = Math.floor(fontSize * 0.88);
    if (numFaces >= 60) fontSize = Math.floor(fontSize * 0.90);
    fontSize = Math.max(8, fontSize);

    const fontStack = `bold ${fontSize}px "Cinzel", "Georgia", "Times New Roman", serif`;

    // Measure optical font metrics for exact mathematical centering
    dCtx.font = fontStack;
    const metrics = dCtx.measureText(text);
    const ascent = (metrics && typeof metrics.actualBoundingBoxAscent === 'number' && metrics.actualBoundingBoxAscent > 0)
      ? metrics.actualBoundingBoxAscent
      : fontSize * 0.70;
    const descent = (metrics && typeof metrics.actualBoundingBoxDescent === 'number')
      ? metrics.actualBoundingBoxDescent
      : 0;

    // Optical vertical centering: align the actual glyph visual center precisely with cy
    const glyphVisualCenterOffset = (ascent - descent) * 0.5;
    const is6or9 = (text === '6' || text === '9');
    const underlineGap = Math.max(3, Math.round(fontSize * 0.08));
    const underlineH = Math.max(2, Math.round(fontSize * 0.07));
    const underlineW = Math.max(8, Math.round(fontSize * 0.38));
    const compositeOffset = is6or9 ? (underlineGap + underlineH) * 0.30 : 0;
    const drawY = glyphVisualCenterOffset - compositeOffset;
    const underlineY = drawY + descent + underlineGap;

    // Heightmap Carved Trench
    // Tie normal map blur radius directly to roundness/bevel setting (sharp dice = razor-crisp 2px, round dice = soft 4-8px)
    const blurRadius = Math.max(2, Math.round(fontSize * (0.016 + bevelRatio * 0.020)));
    hCtx.save();
    hCtx.translate(cx, cy);
    hCtx.font = fontStack;
    hCtx.shadowColor = '#000000';
    hCtx.shadowBlur = blurRadius;
    hCtx.fillStyle = '#000000';
    hCtx.fillText(text, 0, drawY);

    if (is6or9) {
      hCtx.fillRect(-underlineW / 2, underlineY, underlineW, underlineH);
    }
    hCtx.restore();

    // Solid Opaque Number Mask for Transmission Map (black = 0.0 transmission = 100% solid & opaque)
    tCtx.save();
    tCtx.translate(cx, cy);
    tCtx.font = fontStack;
    tCtx.fillStyle = '#000000';
    tCtx.strokeStyle = '#000000';
    tCtx.lineWidth = Math.max(2, fontSize * 0.04);
    tCtx.strokeText(text, 0, drawY);
    tCtx.fillText(text, 0, drawY);
    if (is6or9) {
      tCtx.fillRect(-underlineW / 2, underlineY, underlineW, underlineH);
    }
    tCtx.restore();

    // Solid Opaque Number Mask for Alpha / Opacity Map (white = 1.0 opacity = 100% solid & opaque)
    aCtx.save();
    aCtx.translate(cx, cy);
    aCtx.font = fontStack;
    aCtx.fillStyle = '#ffffff';
    aCtx.strokeStyle = '#ffffff';
    aCtx.lineWidth = Math.max(2, fontSize * 0.04);
    aCtx.strokeText(text, 0, drawY);
    aCtx.fillText(text, 0, drawY);
    if (is6or9) {
      aCtx.fillRect(-underlineW / 2, underlineY, underlineW, underlineH);
    }
    aCtx.restore();

    // Inlaid Enamel / Lacquer Paint in Diffuse
    dCtx.save();
    dCtx.translate(cx, cy);
    dCtx.font = fontStack;

    // Ambient dark groove occlusion
    dCtx.shadowColor = matDef.numOcclusionColor;
    dCtx.shadowBlur = Math.max(3, Math.round(fontSize * 0.06));
    dCtx.shadowOffsetX = 0;
    dCtx.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.015));
    dCtx.fillStyle = matDef.numOcclusionColor;
    dCtx.fillText(text, 0, drawY);

    // Crisp lacquer / enamel fill
    dCtx.shadowColor = 'transparent';
    dCtx.fillStyle = matDef.numFillColor;
    dCtx.fillText(text, 0, drawY);

    if (is6or9) {
      dCtx.fillStyle = matDef.numFillColor;
      dCtx.fillRect(-underlineW / 2, underlineY, underlineW, underlineH);
    }
    dCtx.restore();
  }

  // Ensure pristine noise-free margin for chamfer/bevel UV mapping in extreme bottom-left corner
  // Stamped AFTER face rendering so no blur/shadow from cell (0, 0) can bleed into the bevel patch
  const patchSize = Math.max(12, Math.round(size * 0.012));
  dCtx.clearRect(0, size - patchSize, patchSize, patchSize);
  dCtx.fillStyle = matDef.baseColor;
  dCtx.fillRect(0, size - patchSize, patchSize, patchSize);

  hCtx.fillStyle = '#ffffff';
  hCtx.fillRect(0, size - patchSize, patchSize, patchSize);

  tCtx.fillStyle = '#ffffff';
  tCtx.fillRect(0, size - patchSize, patchSize, patchSize);

  aCtx.fillStyle = '#ffffff';
  aCtx.fillRect(0, size - patchSize, patchSize, patchSize);

  // 3. Fast Sobel Normal Filter with Flat 1D Array Stride
  const normCanvas = isInspector ? document.getElementById('normal-canvas') : document.createElement('canvas');
  normCanvas.width = size;
  normCanvas.height = size;
  const nCtx = normCanvas.getContext('2d');

  const hData = hCtx.getImageData(0, 0, size, size);
  const hPixels = hData.data;
  const nData = nCtx.createImageData(size, size);
  const nPixels = nData.data;

  // Pre-initialize entire normal map buffer with neutral flat normal (0, 0, 1) -> (128, 128, 255, 255)
  // This prevents uninitialized border pixels (px=0, py=0) from decoding to (-1, -1, -1) and sizzling
  for (let i = 0; i < nPixels.length; i += 4) {
    nPixels[i] = 128;
    nPixels[i + 1] = 128;
    nPixels[i + 2] = 255;
    nPixels[i + 3] = 255;
  }

  // Extract 1D luminance array for high-speed cache-friendly lookups
  const lum = new Uint8Array(size * size);
  for (let i = 0, j = 0; i < hPixels.length; i += 4, j++) {
    lum[j] = hPixels[i];
  }

  // Bumped-up Sobel strength for punchy engraved groove normals: 3.2 (sharp) to 4.4 (round)
  const strength = 3.2 + bevelRatio * 1.2;

  for (let py = 1; py < size - 1; py++) {
    const rowOffset = py * size;
    const prevRow = rowOffset - size;
    const nextRow = rowOffset + size;

    for (let px = 1; px < size - 1; px++) {
      const tl = lum[prevRow + px - 1];
      const t = lum[prevRow + px];
      const tr = lum[prevRow + px + 1];
      const l = lum[rowOffset + px - 1];
      const r = lum[rowOffset + px + 1];
      const bl = lum[nextRow + px - 1];
      const b = lum[nextRow + px];
      const br = lum[nextRow + px + 1];

      // Sobel convolution
      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      const nx = (-dx / 255.0) * strength;
      const ny = (dy / 255.0) * strength;
      const nz = 1.0;
      const invLen = 1.0 / Math.sqrt(nx * nx + ny * ny + 1.0);

      const outIdx = (rowOffset + px) * 4;
      nPixels[outIdx] = ((nx * invLen) * 0.5 + 0.5) * 255;
      nPixels[outIdx + 1] = ((ny * invLen) * 0.5 + 0.5) * 255;
      nPixels[outIdx + 2] = ((nz * invLen) * 0.5 + 0.5) * 255;
      nPixels[outIdx + 3] = 255;
    }
  }
  nCtx.putImageData(nData, 0, 0);

  const diffuseMap = new THREE.CanvasTexture(diffCanvas);
  diffuseMap.wrapS = THREE.ClampToEdgeWrapping;
  diffuseMap.wrapT = THREE.ClampToEdgeWrapping;
  if (THREE.SRGBColorSpace) {
    diffuseMap.colorSpace = THREE.SRGBColorSpace;
  } else if (THREE.sRGBEncoding) {
    diffuseMap.encoding = THREE.sRGBEncoding;
  }
  diffuseMap.generateMipmaps = true;
  diffuseMap.needsUpdate = true;

  const normalMap = new THREE.CanvasTexture(normCanvas);
  normalMap.wrapS = THREE.ClampToEdgeWrapping;
  normalMap.wrapT = THREE.ClampToEdgeWrapping;
  if (THREE.NoColorSpace) {
    normalMap.colorSpace = THREE.NoColorSpace;
  } else if (THREE.LinearEncoding) {
    normalMap.encoding = THREE.LinearEncoding;
  }
  normalMap.generateMipmaps = true;
  normalMap.needsUpdate = true;

  let iridescenceThicknessMap = null;
  if (matDef.useIridescenceMap) {
    const thickSize = 512;
    const thickCanvas = document.createElement('canvas');
    thickCanvas.width = thickSize;
    thickCanvas.height = thickSize;
    const tCtx = thickCanvas.getContext('2d');
    const imgData = tCtx.createImageData(thickSize, thickSize);
    const data = imgData.data;

    for (let y = 0; y < thickSize; y++) {
      const ny = y / thickSize;
      for (let x = 0; x < thickSize; x++) {
        const nx = x / thickSize;
        // Harmonic wave interference simulating microscopic aragonite platelet step heights
        const w1 = Math.sin(nx * 14.0 + ny * 9.0);
        const w2 = Math.sin(nx * 7.0 - ny * 16.0 + w1 * 1.4);
        const w3 = Math.cos((nx + ny) * 11.0 + w2 * 0.8);
        const norm = (w1 * 0.45 + w2 * 0.35 + w3 * 0.20) * 0.5 + 0.5;
        const val = Math.max(0, Math.min(255, Math.floor(norm * 255)));

        const idx = (y * thickSize + x) * 4;
        data[idx] = val;
        data[idx + 1] = val; // Green channel sampled by Three.js iridescenceThicknessMap
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
    tCtx.putImageData(imgData, 0, 0);

    iridescenceThicknessMap = new THREE.CanvasTexture(thickCanvas);
    iridescenceThicknessMap.wrapS = THREE.RepeatWrapping;
    iridescenceThicknessMap.wrapT = THREE.RepeatWrapping;
    iridescenceThicknessMap.repeat.set(2, 2);
    iridescenceThicknessMap.generateMipmaps = true;
    iridescenceThicknessMap.needsUpdate = true;
  }

  // Transmission Map (crystal transmission modulated so numbers are 100% solid opaque)
  const transmissionMap = new THREE.CanvasTexture(transCanvas);
  transmissionMap.wrapS = THREE.ClampToEdgeWrapping;
  transmissionMap.wrapT = THREE.ClampToEdgeWrapping;
  transmissionMap.generateMipmaps = true;
  transmissionMap.needsUpdate = true;

  // Opacity / Alpha Map (opacity modulated so numbers are 100% solid opaque)
  const alphaMap = new THREE.CanvasTexture(alphaCanvas);
  alphaMap.wrapS = THREE.ClampToEdgeWrapping;
  alphaMap.wrapT = THREE.ClampToEdgeWrapping;
  alphaMap.generateMipmaps = true;
  alphaMap.needsUpdate = true;

  return { diffuseMap, normalMap, iridescenceThicknessMap, transmissionMap, alphaMap };
}


// =========================================================================
// 4. PHYSICAL ACOUSTIC SYNTHESIZER
// =========================================================================
class DiceAudioSystem {
  constructor() {
    this.ctx = null;
    this.listener = null;
    this.enabled = true;
    this.lastFloorTime = 0;
    this.lastDieTime = 0;
    this.lastWallTime = 0;
  }

  init(audioListener) {
    if (audioListener && audioListener.context) {
      this.listener = audioListener;
      this.ctx = audioListener.context;
    } else if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createPanner(pos, now) {
    if (!this.ctx || !this.ctx.createPanner) return null;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 3.5;
    panner.maxDistance = 40.0;
    panner.rolloffFactor = 1.0;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(pos.x, now);
      panner.positionY.setValueAtTime(pos.y, now);
      panner.positionZ.setValueAtTime(pos.z, now);
    } else {
      panner.setPosition(pos.x, pos.y, pos.z);
    }

    if (this.listener && this.listener.getInput) {
      panner.connect(this.listener.getInput());
    } else {
      panner.connect(this.ctx.destination);
    }
    return panner;
  }

  /**
   * DIE ON GROUND COLLISION (Velvet Felt Floor):
   * Deep, warm sub-bass punch + soft muffled felt tap.
   * Zero white noise / hissing.
   */
  playFloorImpact(pos, intensity = 1.0, mass = 1.0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastFloorTime < 0.035) return;
    this.lastFloorTime = now;

    const gainScale = Math.min(Math.max(intensity, 0.15), 2.5) * 0.45 * Math.sqrt(mass);
    const detuneCents = (Math.random() - 0.5) * 160;

    // 1. Soft damped felt transient (triangle wave 240Hz -> 100Hz in 10ms)
    const tapOsc = this.ctx.createOscillator();
    const tapGain = this.ctx.createGain();
    tapOsc.type = 'triangle';
    tapOsc.frequency.setValueAtTime(240 + Math.random() * 30, now);
    tapOsc.frequency.exponentialRampToValueAtTime(95, now + 0.01);
    tapGain.gain.setValueAtTime(gainScale * 0.35, now);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
    tapOsc.connect(tapGain);

    // 2. Heavy Felt & Tray Sub-Bass Thump (65 Hz -> 36 Hz)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    const thudBaseFreq = 66 + Math.random() * 12;
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(thudBaseFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(36, now + 0.045);
    thudOsc.detune.setValueAtTime(detuneCents * 0.5, now);

    thudGain.gain.setValueAtTime(gainScale * 0.95 * Math.min(mass, 1.5), now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    thudOsc.connect(thudGain);

    // Master Output & 3D Spatial Panner
    const master = this.ctx.createGain();
    tapGain.connect(master);
    thudGain.connect(master);

    const panner = this._createPanner(pos, now);
    if (panner) master.connect(panner);
    else master.connect(this.ctx.destination);

    tapOsc.start(now);
    tapOsc.stop(now + 0.014);
    thudOsc.start(now);
    thudOsc.stop(now + 0.055);
  }

  /**
   * DIE ON DIE COLLISION (Acrylic on Acrylic):
   * Crisp, high-frequency snap and crackle transient.
   * High-pitch resin snap (2800-4800 Hz) + bright body resonance (1380 Hz -> 920 Hz).
   * Replaces the low 220 Hz thud with a clean, snappy clack.
   */
  playDieCollision(pos, intensity = 1.0, combinedMass = 1.0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastDieTime < 0.028) return;
    this.lastDieTime = now;

    const gainScale = Math.min(Math.max(intensity, 0.15), 2.6) * 0.55;
    const detuneCents = (Math.random() - 0.5) * 180;

    // 1. Instantaneous Crisp Snap & Crackle Transient (Dual-frequency impulse: 2800Hz + 4800Hz overtone)
    const snapDuration = 0.0035;
    const snapSamples = Math.floor(this.ctx.sampleRate * snapDuration);
    const snapBuf = this.ctx.createBuffer(1, snapSamples, this.ctx.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    const snapFreq1 = 2800 + Math.random() * 500;
    const snapFreq2 = 4800 + Math.random() * 1000;
    for (let i = 0; i < snapSamples; i++) {
      const t = i / this.ctx.sampleRate;
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / snapSamples));
      const primary = Math.sin(2 * Math.PI * snapFreq1 * t);
      const crackle = 0.65 * Math.sin(2 * Math.PI * snapFreq2 * t);
      snapData[i] = (primary + crackle) * window * Math.exp(-i / (snapSamples * 0.32));
    }
    const snapSource = this.ctx.createBufferSource();
    snapSource.buffer = snapBuf;

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(gainScale * 0.95, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + snapDuration);
    snapSource.connect(snapGain);

    // 2. High-Pitched Resonant Body Clack (Triangle wave 1380Hz -> 920Hz in 14ms)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    const startFreq = 1380 + (Math.random() - 0.5) * 180;
    bodyOsc.frequency.setValueAtTime(startFreq, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.67, now + 0.014);
    bodyOsc.detune.setValueAtTime(detuneCents, now);

    bodyGain.gain.setValueAtTime(gainScale * 0.72, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    bodyOsc.connect(bodyGain);

    // 3. Crisp Mid Impact Ping (680 Hz -> 420 Hz, replaces muddy low 220Hz thud)
    const midOsc = this.ctx.createOscillator();
    const midGain = this.ctx.createGain();
    midOsc.type = 'sine';
    const midFreq = 680 + (Math.random() - 0.5) * 80;
    midOsc.frequency.setValueAtTime(midFreq, now);
    midOsc.frequency.exponentialRampToValueAtTime(420, now + 0.012);
    midOsc.detune.setValueAtTime(detuneCents * 0.7, now);

    midGain.gain.setValueAtTime(gainScale * 0.25, now);
    midGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
    midOsc.connect(midGain);

    // Master Output & 3D Spatial Panner
    const master = this.ctx.createGain();
    snapGain.connect(master);
    bodyGain.connect(master);
    midGain.connect(master);

    const panner = this._createPanner(pos, now);
    if (panner) master.connect(panner);
    else master.connect(this.ctx.destination);

    snapSource.start(now);
    snapSource.stop(now + snapDuration);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.020);
    midOsc.start(now);
    midOsc.stop(now + 0.016);
  }

  /**
   * DIE ON WALL COLLISION (Mahogany Wood Border):
   * Solid wooden rim knock (165 Hz -> 95 Hz) + rim tap.
   */
  playWallImpact(pos, intensity = 1.0, mass = 1.0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastWallTime < 0.035) return;
    this.lastWallTime = now;

    const gainScale = Math.min(Math.max(intensity, 0.15), 2.5) * 0.48 * Math.sqrt(mass);
    const detuneCents = (Math.random() - 0.5) * 200;

    // Wood rim tap (triangle 380 Hz -> 180 Hz in 8ms)
    const tapOsc = this.ctx.createOscillator();
    const tapGain = this.ctx.createGain();
    tapOsc.type = 'triangle';
    tapOsc.frequency.setValueAtTime(380 + Math.random() * 30, now);
    tapOsc.frequency.exponentialRampToValueAtTime(180, now + 0.008);
    tapGain.gain.setValueAtTime(gainScale * 0.45, now);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
    tapOsc.connect(tapGain);

    // Hollow wooden knock (165 Hz -> 95 Hz)
    const woodOsc = this.ctx.createOscillator();
    const woodGain = this.ctx.createGain();
    const woodFreq = 165 + Math.random() * 20;
    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(woodFreq, now);
    woodOsc.frequency.exponentialRampToValueAtTime(95, now + 0.038);
    woodOsc.detune.setValueAtTime(detuneCents * 0.5, now);

    woodGain.gain.setValueAtTime(gainScale * 0.72, now);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042);
    woodOsc.connect(woodGain);

    const master = this.ctx.createGain();
    tapGain.connect(master);
    woodGain.connect(master);

    const panner = this._createPanner(pos, now);
    if (panner) master.connect(panner);
    else master.connect(this.ctx.destination);

    tapOsc.start(now);
    tapOsc.stop(now + 0.012);
    woodOsc.start(now);
    woodOsc.stop(now + 0.046);
  }

  dispose() {
    this.enabled = false;
    if (this.ctx && this.ctx.state !== 'closed' && !this.listener) {
      try {
        this.ctx.close();
      } catch (e) { }
    }
    this.ctx = null;
    this.listener = null;
  }
}

const soundSystem = new DiceAudioSystem();


// =========================================================================
// 5. POLYDICE ENGINE CLASS
// =========================================================================

/**
 * PolyDice Engine - Standalone 3D Polyhedral Physics & Procedural Generation Module
 * 
 * Manages Ammo.js physics simulation, procedural polyhedra geometry construction,
 * canvas texture/normal map baking, PBR materials, audio synthesis, and roll orchestration.
 */
export class PolyDice {
  constructor(arg1, arg2, arg3) {
    let options = {};
    if (arg1 && (arg1.THREE || arg1.Ammo || arg1.scene)) {
      options = arg1;
    } else {
      options = arg3 || {};
      options.THREE = arg1;
      options.Ammo = arg2;
    }

    this.THREE = options.THREE || (typeof window !== 'undefined' ? window.THREE : null);
    this.Ammo = options.Ammo || (typeof window !== 'undefined' ? window.Ammo : null);
    this.ConvexHull = options.ConvexHull || (this.THREE && this.THREE.ConvexHull) || (typeof window !== 'undefined' ? window.ConvexHull : null);
    this.GLTFExporter = options.GLTFExporter || (this.THREE && this.THREE.GLTFExporter) || (typeof window !== 'undefined' ? window.GLTFExporter : null);
    this.scene = options.scene || null;

    if (!this.THREE) {
      throw new Error('[PolyDice] THREE is required in constructor options.');
    }

    // Bind module-scoped references for geometry & mesh builders
    _bindPolyDiceContext(this.THREE, this.ConvexHull);

    // Group holding all active dice and optional tray meshes
    this.group = new this.THREE.Group();
    this.group.name = 'PolyDiceEngineGroup';
    if (this.scene) {
      this.scene.add(this.group);
    }

    // Tray dimensions
    const trayCfg = options.tray || {};
    this.traySize = trayCfg.width || trayCfg.size || 12.0;
    this.trayDepth = trayCfg.depth || this.traySize;
    this.trayWallHeight = trayCfg.wallHeight || 2.4;
    this.trayWallThick = trayCfg.thickness || 0.6;

    // Config defaults
    this.bevel = options.defaultBevel != null ? options.defaultBevel : 0.20;
    this.bevelSegments = options.defaultBevelSegments != null ? options.defaultBevelSegments : 4;
    this.materialKey = options.defaultMaterial || 'ruby';
    this.audioEnabled = options.audio !== false;
    this.onCollision = options.onCollision || null;
    this.fastPhysics = options.fastPhysics !== undefined
      ? Boolean(options.fastPhysics)
      : (options.accuratePhysics ? false : true); // Defaults to fast (unbeveled) physics

    // Dice pool and instances
    this.dicePool = options.initialPool ? [...options.initialPool] : ['d4', 'd6', 'd8', 'd10', 'd10', 'd12', 'd20'];
    this.poolMaterials = options.initialMaterials ? [...options.initialMaterials] : [];
    this.selectedDie = null;
    this.activeDiceInstances = [];
    this.isRollingState = false;
    this.rollStartTime = 0;
    this.lastRollResult = null;
    this.currentRollResolve = null;

    // Asset & Shape Caching
    this.diceAssetCache = new Map();
    this.convexShapeCache = new Map();

    // Event listeners
    this.listeners = new Map();

    // Web Audio Synthesizer
    this.soundSystem = new DiceAudioSystem();
    if (options.audioListener) {
      this.soundSystem.init(options.audioListener);
    }

    // Trajectory playback state for predetermined server rolls
    this.trajectoryPlayback = {
      active: false,
      startTime: 0,
      totalFrames: 0,
      soundEvents: [],
      soundIndex: 0
    };

    // Showcase presentation poses
    this.isShowcase = false;
    this.showcaseCamPos = new this.THREE.Vector3(0, 3.2, 12);
    this.showcaseTargetPos = new this.THREE.Vector3(0, 3.2, 0);

    // Physics World internals
    this.AmmoLib = null;
    this.physicsWorld = null;
    this.tempTrans = null;
    this.tempBtVec = null;
    this.physicsFloorBody = null;
    this.physicsWallBodies = [];

    // Up vector for roll orientation evaluation
    this.UP_VECTOR = new this.THREE.Vector3(0, 1, 0);
  }

  // =========================================================================
  // INITIALIZATION & PHYSICS SETUP
  // =========================================================================

  async init() {
    if (!this.ConvexHull) {
      try {
        const mod = await import('three/addons/math/ConvexHull.js');
        if (mod && mod.ConvexHull) {
          this.ConvexHull = mod.ConvexHull;
          _bindPolyDiceContext(this.THREE, this.ConvexHull);
        }
      } catch (e) {
        // dynamic import fallback not available in environment
      }
    }

    if (typeof this.Ammo === 'function') {
      this.AmmoLib = await this.Ammo();
    } else if (this.Ammo) {
      this.AmmoLib = this.Ammo;
    } else if (typeof window !== 'undefined' && window.Ammo) {
      this.AmmoLib = typeof window.Ammo === 'function' ? await window.Ammo() : window.Ammo;
    }

    if (!this.AmmoLib) {
      console.warn('[PolyDice] Ammo library not loaded yet; physics world initialization deferred.');
      return this;
    }

    this._initPhysicsWorld();
    return this;
  }

  _initPhysicsWorld() {
    const AmmoLib = this.AmmoLib;
    this.tempTrans = new AmmoLib.btTransform();
    this.tempBtVec = new AmmoLib.btVector3(0, 0, 0);

    const collisionConfig = new AmmoLib.btDefaultCollisionConfiguration();
    const dispatcher = new AmmoLib.btCollisionDispatcher(collisionConfig);
    const broadphase = new AmmoLib.btDbvtBroadphase();
    const solver = new AmmoLib.btSequentialImpulseConstraintSolver();

    this.physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfig);
    this.physicsWorld.setGravity(new AmmoLib.btVector3(0, -32, 0));

    this._createPhysicsTrayWalls();
  }

  _createPhysicsTrayWalls() {
    if (!this.physicsWorld || !this.AmmoLib) return;
    const AmmoLib = this.AmmoLib;
    const halfSize = this.traySize / 2;

    // Remove existing walls if any
    if (this.physicsFloorBody) {
      this.physicsWorld.removeRigidBody(this.physicsFloorBody);
      this.physicsFloorBody = null;
    }
    this.physicsWallBodies.forEach(b => this.physicsWorld.removeRigidBody(b));
    this.physicsWallBodies = [];

    // Static Floor Plane at y = 0
    const floorShape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(this.traySize, 1.0, this.trayDepth));
    const floorTrans = new AmmoLib.btTransform();
    floorTrans.setIdentity();
    floorTrans.setOrigin(new AmmoLib.btVector3(0, -1.0, 0));

    const floorMotion = new AmmoLib.btDefaultMotionState(floorTrans);
    const floorRbInfo = new AmmoLib.btRigidBodyConstructionInfo(0, floorMotion, floorShape, new AmmoLib.btVector3(0, 0, 0));
    floorRbInfo.set_m_restitution(0.38);
    floorRbInfo.set_m_friction(0.65);
    this.physicsFloorBody = new AmmoLib.btRigidBody(floorRbInfo);
    this.physicsWorld.addRigidBody(this.physicsFloorBody);

    // 4 Perimeter Static Boundary Walls
    const wallConfigs = [
      { size: [halfSize + 6, 12, 3], pos: [0, 10, -(halfSize + 2.8)] },
      { size: [halfSize + 6, 12, 3], pos: [0, 10, (halfSize + 2.8)] },
      { size: [3, 12, halfSize + 6], pos: [-(halfSize + 2.8), 10, 0] },
      { size: [3, 12, halfSize + 6], pos: [(halfSize + 2.8), 10, 0] }
    ];

    wallConfigs.forEach(cfg => {
      const shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(cfg.size[0], cfg.size[1], cfg.size[2]));
      const trans = new AmmoLib.btTransform();
      trans.setIdentity();
      trans.setOrigin(new AmmoLib.btVector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]));
      const motion = new AmmoLib.btDefaultMotionState(trans);
      const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(0, motion, shape, new AmmoLib.btVector3(0, 0, 0));
      rbInfo.set_m_restitution(0.48);
      rbInfo.set_m_friction(0.38);
      const wallBody = new AmmoLib.btRigidBody(rbInfo);
      this.physicsWorld.addRigidBody(wallBody);
      this.physicsWallBodies.push(wallBody);
    });

    // Ceiling barrier at y = 22 to contain extreme upward ricochets
    const ceilShape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(halfSize + 8, 2, halfSize + 8));
    const ceilTrans = new AmmoLib.btTransform();
    ceilTrans.setIdentity();
    ceilTrans.setOrigin(new AmmoLib.btVector3(0, 22, 0));
    const ceilMotion = new AmmoLib.btDefaultMotionState(ceilTrans);
    const ceilRb = new AmmoLib.btRigidBody(new AmmoLib.btRigidBodyConstructionInfo(0, ceilMotion, ceilShape, new AmmoLib.btVector3(0, 0, 0)));
    this.physicsWorld.addRigidBody(ceilRb);
    this.physicsWallBodies.push(ceilRb);
  }

  setTrayBounds({ width, depth, wallHeight }) {
    if (width != null) this.traySize = width;
    if (depth != null) this.trayDepth = depth;
    if (wallHeight != null) this.trayWallHeight = wallHeight;
    this._createPhysicsTrayWalls();
  }

  // =========================================================================
  // OPTIONAL DEFAULT VISUAL TRAY HELPER
  // =========================================================================

  createDefaultVisualTray() {
    const THREE = this.THREE;
    const trayGroup = new THREE.Group();
    trayGroup.name = 'PolyDiceVisualTray';

    const TRAY_SIZE = this.traySize;
    const TRAY_WALL_H = this.trayWallHeight;
    const TRAY_WALL_THICK = this.trayWallThick;

    // Emerald Casino Velvet Felt Floor
    const feltGeo = new THREE.BoxGeometry(TRAY_SIZE, 0.4, TRAY_SIZE);
    const feltMat = new THREE.MeshStandardMaterial({
      color: '#0a3617', // Deep, luxurious dark casino velvet felt
      roughness: 0.82,
      metalness: 0.01,
      dithering: true
    });
    const feltMesh = new THREE.Mesh(feltGeo, feltMat);
    feltMesh.position.y = -0.2;
    feltMesh.receiveShadow = true;
    trayGroup.add(feltMesh);

    // Warm Polished Walnut Tray Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#341f13', // Warm lustrous rich walnut
      roughness: 0.22,
      metalness: 0.10,
      dithering: true
    });

    const halfSize = TRAY_SIZE / 2;
    const halfThick = TRAY_WALL_THICK / 2;

    const wallN = new THREE.Mesh(new THREE.BoxGeometry(TRAY_SIZE + TRAY_WALL_THICK * 2, TRAY_WALL_H, TRAY_WALL_THICK), wallMat);
    wallN.position.set(0, TRAY_WALL_H / 2 - 0.2, -(halfSize + halfThick));
    wallN.castShadow = true;
    wallN.receiveShadow = true;
    trayGroup.add(wallN);

    const wallS = new THREE.Mesh(new THREE.BoxGeometry(TRAY_SIZE + TRAY_WALL_THICK * 2, TRAY_WALL_H, TRAY_WALL_THICK), wallMat);
    wallS.position.set(0, TRAY_WALL_H / 2 - 0.2, (halfSize + halfThick));
    wallS.castShadow = true;
    wallS.receiveShadow = true;
    trayGroup.add(wallS);

    const wallW = new THREE.Mesh(new THREE.BoxGeometry(TRAY_WALL_THICK, TRAY_WALL_H, TRAY_SIZE), wallMat);
    wallW.position.set(-(halfSize + halfThick), TRAY_WALL_H / 2 - 0.2, 0);
    wallW.castShadow = true;
    wallW.receiveShadow = true;
    trayGroup.add(wallW);

    const wallE = new THREE.Mesh(new THREE.BoxGeometry(TRAY_WALL_THICK, TRAY_WALL_H, TRAY_SIZE), wallMat);
    wallE.position.set((halfSize + halfThick), TRAY_WALL_H / 2 - 0.2, 0);
    wallE.castShadow = true;
    wallE.receiveShadow = true;
    trayGroup.add(wallE);

    // Brass Rim Inlay
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf5d061, roughness: 0.15, metalness: 0.9, dithering: true });
    const rimTop = new THREE.Mesh(new THREE.BoxGeometry(TRAY_SIZE, 0.05, 0.05), rimMat);
    rimTop.position.set(0, TRAY_WALL_H - 0.2, -halfSize);
    trayGroup.add(rimTop);

    this.group.add(trayGroup);
    this.visualTrayMesh = trayGroup;
    return trayGroup;
  }

  // =========================================================================
  // GEOMETRY & ASSET GENERATION
  // =========================================================================

  getDiceAsset(type, options = {}) {
    const bevel = options.bevel != null ? options.bevel : this.bevel;
    const bevelSegments = options.bevelSegments != null ? options.bevelSegments : this.bevelSegments;
    const materialKey = options.material || this.materialKey;

    const cacheKey = `${type}_${bevel}_${bevelSegments}_${materialKey}`;
    if (this.diceAssetCache.has(cacheKey)) {
      return this.diceAssetCache.get(cacheKey);
    }

    let result;
    switch (type) {
      case 'd4': result = buildHedronMesh(PolyhedronPoints.d4(), false, bevel, bevelSegments); break;
      case 'd6': result = buildHedronMesh(PolyhedronPoints.d6(), false, bevel, bevelSegments); break;
      case 'd8': result = buildHedronMesh(PolyhedronPoints.d8(), false, bevel, bevelSegments); break;
      case 'd10': result = buildHedronMesh(PolyhedronPoints.d10(), true, bevel, bevelSegments); break;
      case 'd12': result = buildHedronMesh(PolyhedronPoints.d12(), false, bevel, bevelSegments); break;
      case 'd14': result = buildHedronMesh(PolyhedronPoints.d14(), false, bevel, bevelSegments); break;
      case 'd16': result = buildHedronMesh(PolyhedronPoints.d16(), false, bevel, bevelSegments); break;
      case 'd20': result = buildHedronMesh(PolyhedronPoints.d20(), false, bevel, bevelSegments); break;
      case 'd24': result = buildHedronMesh(PolyhedronPoints.d24(), true, bevel, bevelSegments); break;
      case 'd30': result = buildHedronMesh(PolyhedronPoints.d30(), false, bevel, bevelSegments); break;
      case 'd48': result = buildHedronMesh(PolyhedronPoints.d48(), true, bevel, bevelSegments); break;
      case 'd60': result = buildHedronMesh(PolyhedronPoints.d60(), true, bevel, bevelSegments); break;
      case 'd100': result = buildHedronMesh(PolyhedronPoints.d100(), true, bevel, bevelSegments); break;
      case 'd120': result = buildHedronMesh(PolyhedronPoints.d120(), true, bevel, bevelSegments); break;
      default:
        console.warn(`[PolyDice] Unsupported die type: ${type}, falling back to d6`);
        result = buildHedronMesh(PolyhedronPoints.d6(), false, bevel, bevelSegments);
        break;
    }

    const { geometry, basePoints, numFaces, cols, rows, faceInfos, faceDescriptors } = result;
    const { diffuseMap, normalMap, iridescenceThicknessMap, transmissionMap, alphaMap, diffuseCanvas, normalCanvas } =
      createDiceTextures(numFaces, cols, rows, faceInfos, false, materialKey, bevel);

    const material = createDiceMaterial(
      diffuseMap,
      normalMap,
      materialKey,
      bevelSegments === 1,
      iridescenceThicknessMap,
      transmissionMap,
      alphaMap,
      bevel
    );

    const asset = {
      type,
      geometry,
      basePoints,
      material,
      numFaces,
      faceDescriptors,
      faceInfos,
      cols,
      rows,
      diffuseCanvas,
      normalCanvas
    };

    this.diceAssetCache.set(cacheKey, asset);
    return asset;
  }

  createDieMesh(type, options = {}) {
    const asset = this.getDiceAsset(type, options);
    const mesh = new this.THREE.Mesh(asset.geometry, asset.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = options.name || `Die_${type}`;
    if (options.scale != null && options.scale !== 1.0) {
      mesh.scale.setScalar(options.scale);
    }
    return mesh;
  }

  getDebugCanvases(type, options = {}) {
    const bevel = options.bevel != null ? options.bevel : this.bevel;
    const bevelSegments = options.bevelSegments != null ? options.bevelSegments : this.bevelSegments;
    const materialKey = options.material || this.materialKey;

    let result;
    switch (type) {
      case 'd4': result = buildHedronMesh(PolyhedronPoints.d4(), false, bevel, bevelSegments); break;
      case 'd6': result = buildHedronMesh(PolyhedronPoints.d6(), false, bevel, bevelSegments); break;
      case 'd8': result = buildHedronMesh(PolyhedronPoints.d8(), false, bevel, bevelSegments); break;
      case 'd10': result = buildHedronMesh(PolyhedronPoints.d10(), true, bevel, bevelSegments); break;
      case 'd12': result = buildHedronMesh(PolyhedronPoints.d12(), false, bevel, bevelSegments); break;
      case 'd14': result = buildHedronMesh(PolyhedronPoints.d14(), false, bevel, bevelSegments); break;
      case 'd16': result = buildHedronMesh(PolyhedronPoints.d16(), false, bevel, bevelSegments); break;
      case 'd20': result = buildHedronMesh(PolyhedronPoints.d20(), false, bevel, bevelSegments); break;
      case 'd24': result = buildHedronMesh(PolyhedronPoints.d24(), true, bevel, bevelSegments); break;
      case 'd30': result = buildHedronMesh(PolyhedronPoints.d30(), false, bevel, bevelSegments); break;
      case 'd48': result = buildHedronMesh(PolyhedronPoints.d48(), true, bevel, bevelSegments); break;
      case 'd60': result = buildHedronMesh(PolyhedronPoints.d60(), true, bevel, bevelSegments); break;
      case 'd100': result = buildHedronMesh(PolyhedronPoints.d100(), true, bevel, bevelSegments); break;
      case 'd120': result = buildHedronMesh(PolyhedronPoints.d120(), true, bevel, bevelSegments); break;
      default:
        result = buildHedronMesh(PolyhedronPoints.d6(), false, bevel, bevelSegments);
        break;
    }

    const { numFaces, cols, rows, faceInfos } = result;
    return createDiceTextures(numFaces, cols, rows, faceInfos, true, materialKey, bevel);
  }

  setBevel(bevelRatio, segments = null) {
    this.bevel = bevelRatio;
    if (segments != null) this.bevelSegments = segments;

    // Immediately update geometry across all active dice instances in the tray
    this.activeDiceInstances.forEach(d => {
      const mat = d.materialKey || this.materialKey;
      const asset = this.getDiceAsset(d.type, {
        bevel: this.bevel,
        bevelSegments: this.bevelSegments,
        material: mat
      });
      d.mesh.geometry = asset.geometry;
      d.mesh.material = asset.material;
      if (d.outlineMesh) d.outlineMesh.geometry = asset.geometry;
      d.asset = asset;
    });

    this.emit('bevelChange', { bevel: this.bevel, segments: this.bevelSegments });
  }

  setBevelSegments(segments) {
    this.setBevel(this.bevel, segments);
  }

  setDiceMaterial(materialKey) {
    this.materialKey = materialKey;
    // Clear individual pool overrides so active pool adopts the new global default
    if (this.poolMaterials) this.poolMaterials.length = 0;

    // Immediately update material across all currently active dice instances
    this.activeDiceInstances.forEach(d => {
      d.materialKey = materialKey;
      const asset = this.getDiceAsset(d.type, {
        bevel: this.bevel,
        bevelSegments: this.bevelSegments,
        material: materialKey
      });
      d.mesh.material = asset.material;
      d.asset = asset;
    });

    this.emit('materialChange', materialKey);
  }

  setMaterial(materialKey) {
    this.setDiceMaterial(materialKey);
  }

  setDieMaterial(dieOrId, materialKey) {
    let d = null;
    let idx = -1;
    if (typeof dieOrId === 'object') {
      d = dieOrId;
      idx = this.activeDiceInstances.indexOf(d);
    } else {
      idx = this.activeDiceInstances.findIndex(x => x.id === dieOrId);
      d = idx !== -1 ? this.activeDiceInstances[idx] : null;
    }

    if (idx !== -1) {
      if (!this.poolMaterials) this.poolMaterials = [];
      this.poolMaterials[idx] = materialKey;
    }

    if (!d || !d.mesh) return null;

    d.materialKey = materialKey;
    const asset = this.getDiceAsset(d.type, {
      bevel: this.bevel,
      bevelSegments: this.bevelSegments,
      material: materialKey
    });

    d.mesh.material = asset.material;
    d.asset = asset;
    this.emit('dieMaterialChange', { die: d, materialKey, index: idx });
    return d;
  }

  getDieMaterial(dieOrId) {
    const d = typeof dieOrId === 'object' ? dieOrId : this.activeDiceInstances.find(x => x.id === dieOrId);
    return d ? (d.materialKey || this.materialKey) : this.materialKey;
  }

  selectDie(dieOrId) {
    const d = typeof dieOrId === 'object' ? dieOrId : this.activeDiceInstances.find(x => x.id === dieOrId);
    if (this.selectedDie && this.selectedDie !== d) {
      this._updateDieSelectionVisual(this.selectedDie, false);
    }
    this.selectedDie = d || null;
    if (this.selectedDie) {
      this._updateDieSelectionVisual(this.selectedDie, true);
    }
    this.emit('selectionChange', this.selectedDie);
    return this.selectedDie;
  }

  deselectDie() {
    return this.selectDie(null);
  }

  getSelectedDie() {
    return this.selectedDie;
  }

  _updateDieSelectionVisual(d, isSelected) {
    if (!d || !d.outlineMesh) return;
    if (isSelected) {
      d.outlineMesh.material.color.set(0x61afef); // Bright electric cyan selection halo
      d.outlineMesh.scale.setScalar(1.09);
      d.outlineMesh.visible = true;
    } else {
      if (!this.isShowcase) {
        d.outlineMesh.visible = false;
      } else {
        d.outlineMesh.material.color.set(0xff7a18); // Showcase gold-orange
        d.outlineMesh.scale.setScalar(1.07);
        d.outlineMesh.visible = true;
      }
    }
  }

  _getAmmoConvexShape(type, asset) {
    const geometry = (asset && asset.geometry) ? asset.geometry : asset;
    const basePoints = (asset && asset.basePoints) ? asset.basePoints : null;
    const isFast = this.fastPhysics;
    const cacheKey = isFast ? `${type}_fast` : `${type}_${this.bevel}_${this.bevelSegments}`;

    if (this.convexShapeCache.has(cacheKey)) {
      return this.convexShapeCache.get(cacheKey);
    }

    const shape = new this.AmmoLib.btConvexHullShape();
    const tempVec = new this.AmmoLib.btVector3();

    // Fast mode: use exact unbeveled polyhedral vertices (e.g. 8 for d6, 12 for d20)
    // yielding ~10x-50x faster GJK collision detection
    if (isFast && basePoints && basePoints.length > 0) {
      for (const p of basePoints) {
        tempVec.setValue(p.x, p.y, p.z);
        shape.addPoint(tempVec, true);
      }
    } else if (geometry && geometry.getAttribute) {
      const posAttr = geometry.getAttribute('position');
      const uniqueKeys = new Set();
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key);
          tempVec.setValue(x, y, z);
          shape.addPoint(tempVec, true);
        }
      }
    }

    shape.setMargin(0.02);
    this.convexShapeCache.set(cacheKey, shape);
    return shape;
  }

  setFastPhysics(enabled = true) {
    this.fastPhysics = Boolean(enabled);
    this.emit('physicsAccuracyChange', { fastPhysics: this.fastPhysics });
    return this;
  }

  isFastPhysics() {
    return this.fastPhysics;
  }

  // =========================================================================
  // DICE POOL & SIMULATION ORCHESTRATION
  // =========================================================================

  setDicePool(typesArray, materialsArray = null) {
    if (Array.isArray(typesArray)) {
      this.dicePool = [...typesArray];
      if (Array.isArray(materialsArray)) {
        this.poolMaterials = [...materialsArray];
      }
    }
  }

  randomizePoolMaterials(materialKeys = null) {
    const palette = (Array.isArray(materialKeys) && materialKeys.length > 0)
      ? materialKeys
      : Object.keys(DICE_MATERIALS);

    this.poolMaterials = this.dicePool.map(() => palette[Math.floor(Math.random() * palette.length)]);
    // If active dice instances already exist, apply live
    this.activeDiceInstances.forEach((d, idx) => {
      if (this.poolMaterials[idx]) {
        this.setDieMaterial(d, this.poolMaterials[idx]);
      }
    });
    this.emit('materialsRandomized', this.poolMaterials);
    return [...this.poolMaterials];
  }

  getConfig() {
    const materials = this.dicePool.map((type, idx) => {
      const d = this.activeDiceInstances[idx];
      return (d && d.materialKey) || (this.poolMaterials && this.poolMaterials[idx]) || this.materialKey;
    });
    return {
      pool: [...this.dicePool],
      materials,
      defaultMaterial: this.materialKey,
      bevel: this.bevel,
      bevelSegments: this.bevelSegments,
      fastPhysics: this.fastPhysics,
      audio: this.audioEnabled
    };
  }

  loadConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    if (typeof cfg.bevel === 'number') {
      this.setBevel(cfg.bevel, typeof cfg.bevelSegments === 'number' ? cfg.bevelSegments : this.bevelSegments);
    }
    if (typeof cfg.defaultMaterial === 'string') {
      this.materialKey = cfg.defaultMaterial;
    }
    if (Array.isArray(cfg.pool)) {
      this.setDicePool(cfg.pool, Array.isArray(cfg.materials) ? cfg.materials : null);
    }
    if (typeof cfg.fastPhysics === 'boolean') {
      this.setFastPhysics(cfg.fastPhysics);
    }
    if (typeof cfg.audio === 'boolean') {
      this.setSoundEnabled(cfg.audio);
    }
    this.emit('configLoaded', this.getConfig());
  }

  generateTargetRollString(targets = null) {
    if (this.dicePool.length === 0) return '';
    const counts = {};
    const valuesByType = {};
    this.dicePool.forEach((type, idx) => {
      counts[type] = (counts[type] || 0) + 1;
      const val = targets && targets[idx] !== undefined ? targets[idx] : (this.activeDiceInstances[idx] ? this.activeDiceInstances[idx].result : null);
      if (!valuesByType[type]) valuesByType[type] = [];
      if (val !== null && val !== undefined) valuesByType[type].push(val);
    });

    const parts = Object.keys(counts).map(type => {
      const cnt = counts[type];
      const prefix = cnt > 1 ? `${cnt}${type}` : type;
      const vals = valuesByType[type];
      if (vals && vals.length > 0) {
        return `${prefix}: ${vals.join(', ')}`;
      }
      return prefix;
    });
    return parts.join('; ');
  }

  getDicePool() {
    return [...this.dicePool];
  }

  addDieToPool(type) {
    this.dicePool.push(type);
  }

  removeDieFromPool(index) {
    if (index >= 0 && index < this.dicePool.length) {
      this.dicePool.splice(index, 1);
      if (this.poolMaterials && this.poolMaterials[index] !== undefined) {
        this.poolMaterials.splice(index, 1);
      }
    }
  }

  clearActiveDice() {
    if (this.selectedDie) {
      this.deselectDie();
    }
    if (this.isShowcase) {
      this.exitShowcaseMode();
    }
    this.trajectoryPlayback.active = false;
    this.trajectoryPlayback.soundEvents = [];

    this.activeDiceInstances.forEach(d => {
      if (d.body && this.physicsWorld) {
        this.physicsWorld.removeRigidBody(d.body);
        if (d.body.getMotionState()) this.AmmoLib.destroy(d.body.getMotionState());
        this.AmmoLib.destroy(d.body);
      }
      if (d.outlineMesh) {
        d.outlineMesh.material.dispose();
      }
      if (d.mesh) {
        this.group.remove(d.mesh);
      }
    });
    this.activeDiceInstances.length = 0;
  }

  _createPhysicsDie(type, spawnIndex, totalDice, power = 1.0, targetValue = null) {
    const matKey = (this.poolMaterials && this.poolMaterials[spawnIndex]) || this.materialKey;
    const asset = this.getDiceAsset(type, { material: matKey });
    const mesh = new this.THREE.Mesh(asset.geometry, asset.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    // Staggered arrangement safely contained within tray boundaries
    const totalCol = Math.min(totalDice, 5);
    const col = spawnIndex % totalCol;
    const row = Math.floor(spawnIndex / totalCol);

    const spreadX = (col - (totalCol - 1) / 2) * 1.4 + (Math.random() - 0.5) * 0.3;
    const spawnX = Math.max(-4.2, Math.min(4.2, spreadX));
    const spawnY = Math.min(7.8, 4.4 + (power - 1.0) * 1.6 + row * 0.4 + Math.random() * 0.3);
    const spawnZ = Math.min(4.4, 1.8 + row * 0.55 + Math.random() * 0.3);

    const initialQuat = new this.THREE.Quaternion().setFromEuler(new this.THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ));

    mesh.position.set(spawnX, spawnY, spawnZ);
    mesh.quaternion.copy(initialQuat);

    const DieMass = {
      d4: 0.75, d6: 1.0, d8: 0.9, d10: 1.1, d12: 1.25, d14: 1.3,
      d16: 1.35, d20: 1.45, d24: 1.55, d30: 1.8, d48: 2.1, d60: 2.3,
      d100: 2.6, d120: 2.8
    };
    const mass = DieMass[type] || 1.0;

    const shape = this._getAmmoConvexShape(type, asset);
    const localInertia = new this.AmmoLib.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);

    const trans = new this.AmmoLib.btTransform();
    trans.setIdentity();
    trans.setOrigin(new this.AmmoLib.btVector3(spawnX, spawnY, spawnZ));
    trans.setRotation(new this.AmmoLib.btQuaternion(initialQuat.x, initialQuat.y, initialQuat.z, initialQuat.w));

    const motion = new this.AmmoLib.btDefaultMotionState(trans);
    const rbInfo = new this.AmmoLib.btRigidBodyConstructionInfo(mass, motion, shape, localInertia);
    rbInfo.set_m_restitution(0.42);
    rbInfo.set_m_friction(0.55);
    rbInfo.set_m_rollingFriction(0.08);

    const body = new this.AmmoLib.btRigidBody(rbInfo);
    body.setCcdMotionThreshold(0.4);
    body.setCcdSweptSphereRadius(0.5);

    const baseThrowSpeed = 7.5 + (power - 1.0) * 14.0;
    const fanAngle = -Math.PI / 2 + (spawnX / 5.5) * 0.45 + (Math.random() - 0.5) * 0.3;
    const dieSpeed = baseThrowSpeed + (Math.random() - 0.5) * 3.0;

    const linVelX = Math.cos(fanAngle) * dieSpeed;
    const linVelZ = Math.sin(fanAngle) * dieSpeed;
    const linVelY = (-3.2 - Math.random() * 2.5) * (0.85 + power * 0.55);
    body.setLinearVelocity(new this.AmmoLib.btVector3(linVelX, linVelY, linVelZ));

    const angVel = (16 + Math.random() * 16) * (0.8 + power * 0.6);
    body.setAngularVelocity(new this.AmmoLib.btVector3(
      (Math.random() - 0.5) * angVel,
      (Math.random() - 0.5) * angVel,
      (Math.random() - 0.5) * angVel
    ));

    body.setActivationState(4);
    this.physicsWorld.addRigidBody(body);

    const outlineMat = new this.THREE.MeshBasicMaterial({
      color: 0xff7a18,
      side: this.THREE.BackSide,
      depthWrite: false
    });
    const outlineMesh = new this.THREE.Mesh(asset.geometry, outlineMat);
    outlineMesh.scale.setScalar(1.07);
    outlineMesh.visible = false;
    mesh.add(outlineMesh);

    const dieRecord = {
      id: spawnIndex + 1,
      type,
      materialKey: matKey,
      mass,
      targetValue,
      mesh,
      outlineMesh,
      body,
      asset,
      lastLinVel: new this.THREE.Vector3(linVelX, linVelY, linVelZ),
      settled: false,
      settleFrames: 0,
      result: null,
      trayPos: null,
      trayQuat: null,
      showcasePos: null,
      showcaseQuat: null,
      trajectory: null,
      qOffset: null
    };

    this.activeDiceInstances.push(dieRecord);
    return dieRecord;
  }

  // Headless predetermined simulation & replay preparation
  _runHeadlessSimulationAndPrepareReplay() {
    const soundEvents = [];
    const FIXED_DT = 1 / 60;
    const MAX_STEPS = 240;
    let finalStep = MAX_STEPS;

    this.activeDiceInstances.forEach(d => {
      d.trajectory = [];
      d.lastFloorHitStep = -999;
      d.lastWallHitStep = -999;
      d.lastContactTimes = new Map();
      d.settleFrames = 0;
      d.settled = false;
    });

    for (let step = 0; step < MAX_STEPS; step++) {
      this.physicsWorld.stepSimulation(FIXED_DT, 1, FIXED_DT);
      let allSettled = true;

      for (let i = 0; i < this.activeDiceInstances.length; i++) {
        const d = this.activeDiceInstances[i];
        const ms = d.body.getMotionState();
        if (ms) {
          ms.getWorldTransform(this.tempTrans);
          const p = this.tempTrans.getOrigin();
          const q = this.tempTrans.getRotation();

          d.trajectory.push({
            pos: [p.x(), p.y(), p.z()],
            quat: [q.x(), q.y(), q.z(), q.w()]
          });

          const lv = d.body.getLinearVelocity();
          const av = d.body.getAngularVelocity();
          const speedSq = lv.x() * lv.x() + lv.y() * lv.y() + lv.z() * lv.z();
          const angSpeedSq = av.x() * av.x() + av.y() * av.y() + av.z() * av.z();
          const curVel = new this.THREE.Vector3(lv.x(), lv.y(), lv.z());

          const deltaV = curVel.clone().sub(d.lastLinVel).length();
          const deltaVy = curVel.y - d.lastLinVel.y;
          const isFloorContact = p.y() < 1.05 && (deltaVy > 0.95 || (d.lastLinVel.y < -0.65 && curVel.y > -0.15));
          const isWallContact = (Math.abs(p.x()) > 5.1 || Math.abs(p.z()) > 5.1) && deltaV > 1.1;

          if (step > 4) {
            if (isFloorContact && step - d.lastFloorHitStep > 5) {
              d.lastFloorHitStep = step;
              const impulse = d.mass * Math.max(deltaVy, deltaV * 0.7);
              if (impulse > 0.75) {
                soundEvents.push({
                  step,
                  type: 'floor',
                  pos: [p.x(), p.y(), p.z()],
                  intensity: impulse / 2.4,
                  mass: d.mass
                });
              }
            } else if (isWallContact && step - d.lastWallHitStep > 6) {
              d.lastWallHitStep = step;
              const impulse = d.mass * deltaV;
              if (impulse > 0.75) {
                soundEvents.push({
                  step,
                  type: 'wall',
                  pos: [p.x(), p.y(), p.z()],
                  intensity: impulse / 2.4,
                  mass: d.mass
                });
              }
            }
          }

          d.lastLinVel.copy(curVel);

          if (speedSq < 0.035 && angSpeedSq < 0.07) {
            d.settleFrames++;
            if (d.settleFrames > 18) d.settled = true;
          } else {
            d.settleFrames = 0;
            d.settled = false;
          }

          if (!d.settled) allSettled = false;
        }
      }

      if (step > 4 && this.activeDiceInstances.length > 1) {
        for (let i = 0; i < this.activeDiceInstances.length; i++) {
          const d1 = this.activeDiceInstances[i];
          const p1 = d1.trajectory[d1.trajectory.length - 1].pos;
          for (let j = i + 1; j < this.activeDiceInstances.length; j++) {
            const d2 = this.activeDiceInstances[j];
            const p2 = d2.trajectory[d2.trajectory.length - 1].pos;
            const dx = p1[0] - p2[0], dy = p1[1] - p2[1], dz = p1[2] - p2[2];
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < 1.82 * 1.82) {
              const lastHit = d1.lastContactTimes.get(d2.id) || 0;
              if (step - lastHit > 6) {
                d1.lastContactTimes.set(d2.id, step);
                const relVel = d1.lastLinVel.clone().sub(d2.lastLinVel).length();
                if (relVel > 1.1) {
                  const intensity = Math.min(Math.max((relVel - 0.7) / 2.2, 0.2), 2.2);
                  soundEvents.push({
                    step,
                    type: 'die',
                    pos: [(p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5, (p1[2] + p2[2]) * 0.5],
                    intensity,
                    mass: (d1.mass + d2.mass) * 0.5
                  });
                }
              }
            }
          }
        }
      }

      if (allSettled && step > 45) {
        finalStep = step + 6;
        break;
      }
    }

    this.activeDiceInstances.forEach(d => {
      if (d.targetValue != null && d.trajectory.length > 0) {
        const lastF = d.trajectory[d.trajectory.length - 1];
        const finalQuat = new this.THREE.Quaternion(lastF.quat[0], lastF.quat[1], lastF.quat[2], lastF.quat[3]);
        const descriptors = d.asset.faceDescriptors;
        let actualFace = null;

        if (d.type === 'd4') {
          let minDot = Infinity;
          for (const fd of descriptors) {
            const worldNormal = fd.normal.clone().applyQuaternion(finalQuat);
            const dot = worldNormal.dot(this.UP_VECTOR);
            if (dot < minDot) {
              minDot = dot;
              actualFace = fd;
            }
          }
        } else {
          let maxDot = -Infinity;
          for (const fd of descriptors) {
            const worldNormal = fd.normal.clone().applyQuaternion(finalQuat);
            const dot = worldNormal.dot(this.UP_VECTOR);
            if (dot > maxDot) {
              maxDot = dot;
              actualFace = fd;
            }
          }
        }

        const targetFace = descriptors.find(f => f.value === d.targetValue);
        if (targetFace && actualFace) {
          d.qOffset = new this.THREE.Quaternion().setFromUnitVectors(targetFace.normal, actualFace.normal);
        } else {
          d.qOffset = new this.THREE.Quaternion();
        }
      } else {
        d.qOffset = new this.THREE.Quaternion();
      }
    });

    const totalFramesRecorded = this.activeDiceInstances[0].trajectory.length;
    this.trajectoryPlayback.active = true;
    this.trajectoryPlayback.startTime = performance.now();
    this.trajectoryPlayback.totalFrames = Math.min(finalStep, totalFramesRecorded);
    this.trajectoryPlayback.soundEvents = soundEvents;
    this.trajectoryPlayback.soundIndex = 0;

    this.activeDiceInstances.forEach(d => {
      if (d.trajectory && d.trajectory.length > 0) {
        const f0 = d.trajectory[0];
        d.mesh.position.set(f0.pos[0], f0.pos[1], f0.pos[2]);
        const q0 = new this.THREE.Quaternion(f0.quat[0], f0.quat[1], f0.quat[2], f0.quat[3]);
        if (d.qOffset) q0.multiply(d.qOffset);
        d.mesh.quaternion.copy(q0);
      }
    });
  }

  // =========================================================================
  // ROLLING INTERFACE (PROMISES, EVENTS & INSTANT SNAPSHOTS)
  // =========================================================================

  /**
   * Performs an instant RNG-based (or predetermined) visual roll without running physics simulation.
   * Ideal for 2D web games, card games, UI snapshots, and lightweight rendering.
   * Completely eliminates the Ammo.js dependency and simulation delay!
   *
   * @param {Object} [options]
   * @param {string[]} [options.dice] e.g. ['d6', 'd6', 'd6', 'd6', 'd6']
   * @param {number[]} [options.targets] Optional predetermined target values
   * @param {string[]} [options.materials] Optional material keys for each die
   * @param {THREE.WebGLRenderer} [options.renderer] Optional renderer override
   * @param {THREE.Camera} [options.camera] Optional camera override
   * @param {boolean} [options.snapshot=true] Whether to generate and return a canvas snapshot
   * @returns {Object} { total, dice, breakdown, summary, snapshotCanvas, snapshotDataUrl }
   */
  rollInstant(options = {}) {
    const dice = options.dice || this.dicePool || ['d6', 'd6', 'd6', 'd6', 'd6'];
    const targets = options.targets || null;
    const materials = options.materials || this.poolMaterials || [];
    const renderer = options.renderer || this.renderer;
    const camera = options.camera || this.camera;

    this.clearActiveDice();
    this.isRollingState = false;

    const diceResults = [];
    let total = 0;
    const subtotalsByType = {};

    dice.forEach((type, idx) => {
      const targetVal = (targets && targets[idx] != null) ? targets[idx] : null;
      const matKey = materials[idx] || this.materialKey;
      const asset = this.getDiceAsset(type, { material: matKey });
      const mesh = new this.THREE.Mesh(asset.geometry, asset.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);

      const descriptors = asset.faceDescriptors || [];
      let fd = null;
      if (targetVal != null) {
        fd = descriptors.find(f => f.value === targetVal);
      }
      if (!fd && descriptors.length > 0) {
        fd = descriptors[Math.floor(Math.random() * descriptors.length)];
      }

      const val = fd ? fd.value : 1;

      const dieRecord = {
        id: idx + 1,
        type,
        mesh,
        asset,
        winningFaceDescriptor: fd,
        targetValue: val,
        result: val,
        material: matKey
      };
      this.activeDiceInstances.push(dieRecord);

      total += val;
      if (!subtotalsByType[type]) subtotalsByType[type] = [];
      subtotalsByType[type].push(val);

      diceResults.push({
        id: idx + 1,
        type,
        result: val,
        value: val,
        material: matKey
      });
    });

    const breakdownParts = [];
    for (const [type, vals] of Object.entries(subtotalsByType)) {
      const count = vals.length;
      const subSum = vals.reduce((a, b) => a + b, 0);
      if (count === 1) {
        breakdownParts.push(`${type}: ${vals[0]}`);
      } else {
        breakdownParts.push(`${count}${type}: [${vals.join(', ')}] (${subSum})`);
      }
    }
    const humanString = breakdownParts.join('  •  ');

    const result = {
      timestamp: new Date().toISOString(),
      total,
      diceCount: diceResults.length,
      dice: diceResults,
      breakdown: subtotalsByType,
      summary: humanString
    };

    this.lastRollResult = result;

    let snapshotCanvas = null;
    let snapshotDataUrl = null;

    if (renderer && camera && options.snapshot !== false) {
      snapshotCanvas = this.generateSnapshot(renderer, camera, options);
      if (snapshotCanvas) {
        snapshotDataUrl = snapshotCanvas.toDataURL('image/png');
        result.snapshotCanvas = snapshotCanvas;
        result.snapshotDataUrl = snapshotDataUrl;
      }
    }

    this.emit('rollStart', { pool: [...dice], instant: true, targets });
    this.emit('rollComplete', result);

    if (typeof window !== 'undefined') {
      window.lastRollResult = result;
      window.dispatchEvent(new CustomEvent('diceRollComplete', { detail: result }));
    }

    if (this.currentRollResolve) {
      const resolve = this.currentRollResolve;
      this.currentRollResolve = null;
      resolve(result);
    }

    return result;
  }

  roll(options = {}) {
    if (options.instant || !this.AmmoLib) {
      return Promise.resolve(this.rollInstant(options));
    }

    const power = options.power != null ? options.power : 1.0;
    const targets = options.targets || null;
    const dice = options.dice || null;

    if (dice && Array.isArray(dice) && dice.length > 0) {
      this.dicePool = [...dice];
    }

    if (this.dicePool.length === 0) {
      return Promise.resolve(null);
    }

    if (this.audioEnabled) {
      this.soundSystem.init();
    }

    if (this.isShowcase) {
      this.exitShowcaseMode();
    }

    this.clearActiveDice();
    this.isRollingState = true;
    this.rollStartTime = performance.now();

    const pool = this.dicePool;
    pool.forEach((type, idx) => {
      const targetVal = (targets && targets[idx] != null) ? targets[idx] : null;
      this._createPhysicsDie(type, idx, pool.length, power, targetVal);
    });

    const hasPredetermined = targets && targets.some(t => t != null);
    if (hasPredetermined) {
      this._runHeadlessSimulationAndPrepareReplay();
    }

    this.emit('rollStart', { pool: [...this.dicePool], power, targets });

    return new Promise((resolve) => {
      this.currentRollResolve = resolve;
    });
  }

  rollPredeterminedDice(diceTypes, targetValues, power = 1.0) {
    if (!this.AmmoLib) {
      return Promise.resolve(this.rollInstant({ dice: diceTypes, targets: targetValues }));
    }
    return this.roll({ dice: diceTypes, targets: targetValues, power });
  }

  _evaluateDieResult(dieRecord) {
    const { mesh, asset, type } = dieRecord;
    const descriptors = asset.faceDescriptors;
    if (!descriptors || descriptors.length === 0) return 1;

    if (type === 'd4') {
      let minDot = Infinity;
      let bottomFaceVal = 1;
      let bestFd = descriptors[0];
      descriptors.forEach(fd => {
        const worldNormal = fd.normal.clone().applyQuaternion(mesh.quaternion);
        const dot = worldNormal.dot(this.UP_VECTOR);
        if (dot < minDot) {
          minDot = dot;
          bottomFaceVal = fd.value;
          bestFd = fd;
        }
      });
      dieRecord.winningFaceDescriptor = bestFd;
      return bottomFaceVal;
    }

    let maxDot = -Infinity;
    let topFaceVal = 1;
    let bestFd = descriptors[0];

    descriptors.forEach(fd => {
      const worldNormal = fd.normal.clone().applyQuaternion(mesh.quaternion);
      const dot = worldNormal.dot(this.UP_VECTOR);
      if (dot > maxDot) {
        maxDot = dot;
        topFaceVal = fd.value;
        bestFd = fd;
      }
    });

    dieRecord.winningFaceDescriptor = bestFd;
    return topFaceVal;
  }

  _finishRoll() {
    this.isRollingState = false;

    let total = 0;
    const subtotalsByType = {};
    const diceResults = [];

    this.activeDiceInstances.forEach(d => {
      const val = this._evaluateDieResult(d);
      d.result = val;
      total += val;

      if (!subtotalsByType[d.type]) subtotalsByType[d.type] = [];
      subtotalsByType[d.type].push(val);

      diceResults.push({
        id: d.id,
        type: d.type,
        result: val
      });

      d.trayPos = d.mesh.position.clone();
      d.trayQuat = d.mesh.quaternion.clone();
    });

    const breakdownParts = [];
    for (const [type, vals] of Object.entries(subtotalsByType)) {
      const count = vals.length;
      const subSum = vals.reduce((a, b) => a + b, 0);
      if (count === 1) {
        breakdownParts.push(`${type}: ${vals[0]}`);
      } else {
        breakdownParts.push(`${count}${type}: [${vals.join(', ')}] (${subSum})`);
      }
    }
    const humanString = breakdownParts.join('  •  ');

    const machineObject = {
      timestamp: new Date().toISOString(),
      total,
      diceCount: diceResults.length,
      dice: diceResults,
      breakdown: subtotalsByType,
      summary: humanString
    };

    this.lastRollResult = machineObject;
    this.emit('rollComplete', machineObject);

    if (typeof window !== 'undefined') {
      window.lastRollResult = machineObject;
      window.dispatchEvent(new CustomEvent('diceRollComplete', { detail: machineObject }));
    }

    if (this.currentRollResolve) {
      const resolve = this.currentRollResolve;
      this.currentRollResolve = null;
      resolve(machineObject);
    }
  }

  // =========================================================================
  // ANIMATION / STEPPING LOOP
  // =========================================================================

  update(deltaTime) {
    if (!this.physicsWorld || !this.tempTrans) return;

    if (this.isShowcase) {
      for (let i = 0; i < this.activeDiceInstances.length; i++) {
        const d = this.activeDiceInstances[i];
        if (d.showcasePos && d.showcaseQuat) {
          d.mesh.position.lerp(d.showcasePos, 0.12);
          d.mesh.quaternion.slerp(d.showcaseQuat, 0.12);
        }
      }
    } else if (this.trajectoryPlayback.active) {
      const elapsed = (performance.now() - this.trajectoryPlayback.startTime) / 1000;
      const frameFloat = elapsed * 60;
      const frameIndex = Math.floor(frameFloat);

      while (this.trajectoryPlayback.soundIndex < this.trajectoryPlayback.soundEvents.length) {
        const se = this.trajectoryPlayback.soundEvents[this.trajectoryPlayback.soundIndex];
        if (se.step <= frameIndex) {
          if (this.audioEnabled) {
            if (se.type === 'floor') {
              this.soundSystem.playFloorImpact({ x: se.pos[0], y: se.pos[1], z: se.pos[2] }, se.intensity, se.mass);
            } else if (se.type === 'wall') {
              this.soundSystem.playWallImpact({ x: se.pos[0], y: se.pos[1], z: se.pos[2] }, se.intensity, se.mass);
            } else if (se.type === 'die') {
              this.soundSystem.playDieCollision({ x: se.pos[0], y: se.pos[1], z: se.pos[2] }, se.intensity, se.mass);
            }
          }
          if (this.onCollision) {
            this.onCollision(se);
          }
          this.emit('collision', se);
          this.trajectoryPlayback.soundIndex++;
        } else {
          break;
        }
      }

      if (frameIndex >= this.trajectoryPlayback.totalFrames - 1) {
        this.activeDiceInstances.forEach(d => {
          if (d.trajectory && d.trajectory.length > 0) {
            const lastF = d.trajectory[d.trajectory.length - 1];
            d.mesh.position.set(lastF.pos[0], lastF.pos[1], lastF.pos[2]);
            const baseQ = new this.THREE.Quaternion(lastF.quat[0], lastF.quat[1], lastF.quat[2], lastF.quat[3]);
            if (d.qOffset) baseQ.multiply(d.qOffset);
            d.mesh.quaternion.copy(baseQ);
            d.settled = true;
          }
        });
        this.trajectoryPlayback.active = false;
        this._finishRoll();
      } else {
        const nextIndex = Math.min(frameIndex + 1, this.trajectoryPlayback.totalFrames - 1);
        const alpha = frameFloat - frameIndex;

        this.activeDiceInstances.forEach(d => {
          if (d.trajectory && d.trajectory.length > 0) {
            const f0 = d.trajectory[Math.min(frameIndex, d.trajectory.length - 1)];
            const f1 = d.trajectory[Math.min(nextIndex, d.trajectory.length - 1)];

            d.mesh.position.set(
              f0.pos[0] + (f1.pos[0] - f0.pos[0]) * alpha,
              f0.pos[1] + (f1.pos[1] - f0.pos[1]) * alpha,
              f0.pos[2] + (f1.pos[2] - f0.pos[2]) * alpha
            );

            const q0 = new this.THREE.Quaternion(f0.quat[0], f0.quat[1], f0.quat[2], f0.quat[3]);
            const q1 = new this.THREE.Quaternion(f1.quat[0], f1.quat[1], f1.quat[2], f1.quat[3]);
            q0.slerp(q1, alpha);
            if (d.qOffset) q0.multiply(d.qOffset);
            d.mesh.quaternion.copy(q0);
          }
        });
      }
    } else if (this.isRollingState) {
      this.physicsWorld.stepSimulation(deltaTime, 10, 1 / 60);

      let allSettled = this.activeDiceInstances.length > 0;
      const curTime = performance.now();

      for (let i = 0; i < this.activeDiceInstances.length; i++) {
        const d = this.activeDiceInstances[i];
        const ms = d.body.getMotionState();
        if (ms) {
          ms.getWorldTransform(this.tempTrans);
          const p = this.tempTrans.getOrigin();
          const q = this.tempTrans.getRotation();

          d.mesh.position.set(p.x(), p.y(), p.z());
          d.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
          if (d.qOffset) {
            d.mesh.quaternion.multiply(d.qOffset);
          }

          const lv = d.body.getLinearVelocity();
          const av = d.body.getAngularVelocity();
          const speedSq = lv.x() * lv.x() + lv.y() * lv.y() + lv.z() * lv.z();
          const curVel = new this.THREE.Vector3(lv.x(), lv.y(), lv.z());

          const deltaV = curVel.clone().sub(d.lastLinVel).length();
          const deltaVy = curVel.y - d.lastLinVel.y;

          const isFloorContact = p.y() < 1.05 && (deltaVy > 0.95 || (d.lastLinVel.y < -0.65 && curVel.y > -0.15));
          const isWallContact = (Math.abs(p.x()) > 5.1 || Math.abs(p.z()) > 5.1) && deltaV > 1.1;

          if (curTime - this.rollStartTime > 100) {
            if (isFloorContact) {
              if (!d.lastFloorHit || curTime - d.lastFloorHit > 90) {
                d.lastFloorHit = curTime;
                const impulse = d.mass * Math.max(deltaVy, deltaV * 0.7);
                if (impulse > 0.75) {
                  if (this.audioEnabled) {
                    this.soundSystem.playFloorImpact({ x: p.x(), y: p.y(), z: p.z() }, impulse / 2.4, d.mass);
                  }
                  const hitEvt = { type: 'floor', pos: [p.x(), p.y(), p.z()], intensity: impulse / 2.4, mass: d.mass };
                  if (this.onCollision) this.onCollision(hitEvt);
                  this.emit('collision', hitEvt);
                }
              }
            } else if (isWallContact) {
              if (!d.lastWallHit || curTime - d.lastWallHit > 100) {
                d.lastWallHit = curTime;
                const impulse = d.mass * deltaV;
                if (impulse > 0.75) {
                  if (this.audioEnabled) {
                    this.soundSystem.playWallImpact({ x: p.x(), y: p.y(), z: p.z() }, impulse / 2.4, d.mass);
                  }
                  const hitEvt = { type: 'wall', pos: [p.x(), p.y(), p.z()], intensity: impulse / 2.4, mass: d.mass };
                  if (this.onCollision) this.onCollision(hitEvt);
                  this.emit('collision', hitEvt);
                }
              }
            }
          }

          d.lastLinVel.copy(curVel);

          const angSpeedSq = av.x() * av.x() + av.y() * av.y() + av.z() * av.z();
          if (speedSq < 0.035 && angSpeedSq < 0.07) {
            d.settleFrames++;
            if (d.settleFrames > 18) {
              d.settled = true;
            }
          } else {
            d.settleFrames = 0;
            d.settled = false;
          }

          if (!d.settled) {
            allSettled = false;
          }
        }
      }

      if (curTime - this.rollStartTime > 100 && this.activeDiceInstances.length > 1) {
        for (let i = 0; i < this.activeDiceInstances.length; i++) {
          const d1 = this.activeDiceInstances[i];
          const p1 = d1.mesh.position;
          const v1 = d1.lastLinVel;

          for (let j = i + 1; j < this.activeDiceInstances.length; j++) {
            const d2 = this.activeDiceInstances[j];
            const p2 = d2.mesh.position;
            const dist = p1.distanceTo(p2);

            if (dist < 1.82) {
              if (!d1.lastContactTimes) d1.lastContactTimes = new Map();
              const lastHit = d1.lastContactTimes.get(d2.id) || 0;

              if (curTime - lastHit > 110) {
                const v2 = d2.lastLinVel;
                const relVel = v1.clone().sub(v2).length();
                if (relVel > 1.1) {
                  d1.lastContactTimes.set(d2.id, curTime);

                  const midX = (p1.x + p2.x) * 0.5;
                  const midY = (p1.y + p2.y) * 0.5;
                  const midZ = (p1.z + p2.z) * 0.5;
                  const combinedMass = (d1.mass + d2.mass) * 0.5;
                  const intensity = Math.min(Math.max((relVel - 0.7) / 2.2, 0.2), 2.2);

                  if (this.audioEnabled) {
                    this.soundSystem.playDieCollision({ x: midX, y: midY, z: midZ }, intensity, combinedMass);
                  }
                  const hitEvt = { type: 'die', pos: [midX, midY, midZ], intensity, mass: combinedMass };
                  if (this.onCollision) this.onCollision(hitEvt);
                  this.emit('collision', hitEvt);
                }
              }
            }
          }
        }
      }

      if (this.isRollingState && (allSettled || (curTime - this.rollStartTime > 4500))) {
        this._finishRoll();
      }
    }
  }

  // =========================================================================
  // SHOWCASE & SNAPSHOT
  // =========================================================================

  enterShowcaseMode(camera = null) {
    if (this.activeDiceInstances.length === 0 || this.isRollingState) return;
    this.isShowcase = true;

    const totalDice = this.activeDiceInstances.length;
    let cols, rows;
    if (totalDice <= 5) {
      cols = totalDice;
      rows = 1;
    } else if (totalDice <= 10) {
      cols = Math.ceil(totalDice / 2);
      rows = 2;
    } else {
      cols = Math.ceil(Math.sqrt(totalDice * 1.35));
      rows = Math.ceil(totalDice / cols);
    }

    const colSpacing = 2.45;
    const rowSpacing = 2.45;
    const showcaseBaseY = 3.2;

    const gridWidth = cols * colSpacing;
    const gridHeight = rows * rowSpacing;
    const aspect = camera ? (camera.aspect || 1.6) : 1.6;
    const fov = camera ? camera.fov : 42;
    const halfFovTan = Math.tan((fov * Math.PI) / 360);
    const reqDistX = (gridWidth / 2.0 + 1.2) / (halfFovTan * aspect);
    const reqDistY = (gridHeight / 2.0 + 1.2) / halfFovTan;
    const camDist = Math.max(reqDistX, reqDistY, 7.5);

    this.showcaseCamPos.set(0, showcaseBaseY, camDist);
    this.showcaseTargetPos.set(0, showcaseBaseY, 0);

    for (let i = 0; i < totalDice; i++) {
      const d = this.activeDiceInstances[i];
      if (!d.trayPos) {
        d.trayPos = d.mesh.position.clone();
        d.trayQuat = d.mesh.quaternion.clone();
      }

      const r = Math.floor(i / cols);
      const c = i % cols;
      const diceInThisRow = Math.min(cols, totalDice - r * cols);

      const targetX = (c - (diceInThisRow - 1) / 2) * colSpacing;
      const targetY = showcaseBaseY + ((rows - 1) / 2 - r) * rowSpacing;
      d.showcasePos = new this.THREE.Vector3(targetX, targetY, 0);

      const fd = d.winningFaceDescriptor || (d.asset.faceDescriptors && d.asset.faceDescriptors[0]);
      if (fd && fd.tangent && fd.bitangent && fd.normal) {
        const t_loc = fd.tangent;
        const b_loc = fd.bitangent;
        const n_loc = fd.normal;

        const R_die = new this.THREE.Matrix4().set(
          t_loc.x, t_loc.y, t_loc.z, 0,
          b_loc.x, b_loc.y, b_loc.z, 0,
          n_loc.x, n_loc.y, n_loc.z, 0,
          0, 0, 0, 1
        );

        d.showcaseQuat = new this.THREE.Quaternion().setFromRotationMatrix(R_die);
      } else {
        d.showcaseQuat = d.mesh.quaternion.clone();
      }

      if (d.outlineMesh) {
        d.outlineMesh.visible = true;
      }
    }
  }

  exitShowcaseMode() {
    if (!this.isShowcase) return;
    this.isShowcase = false;

    this.activeDiceInstances.forEach(d => {
      if (d.outlineMesh) {
        d.outlineMesh.visible = false;
      }
      if (d.trayPos && d.trayQuat) {
        d.mesh.position.copy(d.trayPos);
        d.mesh.quaternion.copy(d.trayQuat);

        if (d.body && this.tempTrans) {
          this.tempTrans.setOrigin(new this.AmmoLib.btVector3(d.trayPos.x, d.trayPos.y, d.trayPos.z));
          this.tempTrans.setRotation(new this.AmmoLib.btQuaternion(d.trayQuat.x, d.trayQuat.y, d.trayQuat.z, d.trayQuat.w));
          d.body.setWorldTransform(this.tempTrans);
          const ms = d.body.getMotionState();
          if (ms) ms.setWorldTransform(this.tempTrans);
          d.body.setLinearVelocity(new this.AmmoLib.btVector3(0, 0, 0));
          d.body.setAngularVelocity(new this.AmmoLib.btVector3(0, 0, 0));
        }
      }
    });
  }

  toggleShowcaseMode(camera = null) {
    if (this.isShowcase) {
      this.exitShowcaseMode();
    } else {
      this.enterShowcaseMode(camera);
    }
    return this.isShowcase;
  }

  generateSnapshot(renderer, camera, options = {}) {
    if (this.activeDiceInstances.length === 0) return null;

    if (!this.isShowcase) {
      this.enterShowcaseMode(camera);
    }
    for (let i = 0; i < this.activeDiceInstances.length; i++) {
      const d = this.activeDiceInstances[i];
      if (d.showcasePos && d.showcaseQuat) {
        d.mesh.position.copy(d.showcasePos);
        d.mesh.quaternion.copy(d.showcaseQuat);
      }
    }

    const prevCamPos = camera.position.clone();
    camera.position.copy(this.showcaseCamPos);
    camera.lookAt(this.showcaseTargetPos);

    // 1. Temporarily hide outline meshes so they don't bleed into or refract through dice
    const prevOutlineStates = this.activeDiceInstances.map(d => d.outlineMesh ? d.outlineMesh.visible : false);
    this.activeDiceInstances.forEach(d => {
      if (d.outlineMesh) d.outlineMesh.visible = false;
    });

    // 2. Temporarily hide tray
    let prevTrayVis = true;
    if (this.visualTrayMesh) {
      prevTrayVis = this.visualTrayMesh.visible;
      this.visualTrayMesh.visible = false;
    }

    // 3. Temporarily adjust exposure for rich, calibrated snapshot colors without blown-out specular highlights
    const prevExposure = renderer.toneMappingExposure;
    renderer.toneMappingExposure = (options.exposure !== undefined) ? options.exposure : 1.28;

    // 4. Temporary snapshot studio backlight, ambient, and backdrop so transmissive dice refract rich color
    const targetScene = this.scene || this.group;
    const snapshotAmbient = new this.THREE.AmbientLight(0xffffff, 1.2);

    const snapshotKicker = new this.THREE.DirectionalLight(0xfff5e8, 3.8);
    snapshotKicker.position.set(0, this.showcaseTargetPos.y + 1.2, -4.5);
    snapshotKicker.target.position.copy(this.showcaseTargetPos);

    const snapshotFill = new this.THREE.DirectionalLight(0xd8e8ff, 3.0);
    snapshotFill.position.set(2.5, this.showcaseTargetPos.y + 2.5, 4.0);
    snapshotFill.target.position.copy(this.showcaseTargetPos);

    const backCanvas = document.createElement('canvas');
    backCanvas.width = 256;
    backCanvas.height = 256;
    const bCtx = backCanvas.getContext('2d');
    const bGrad = bCtx.createRadialGradient(128, 128, 15, 128, 128, 128);
    bGrad.addColorStop(0, '#222d3d');
    bGrad.addColorStop(0.55, '#101622');
    bGrad.addColorStop(1, '#06080d');
    bCtx.fillStyle = bGrad;
    bCtx.fillRect(0, 0, 256, 256);
    const backTex = new this.THREE.CanvasTexture(backCanvas);
    if (this.THREE.SRGBColorSpace) {
      backTex.colorSpace = this.THREE.SRGBColorSpace;
    }
    const backGeo = new this.THREE.PlaneGeometry(35, 22);
    const backMat = new this.THREE.MeshBasicMaterial({ map: backTex });
    const backPlane = new this.THREE.Mesh(backGeo, backMat);
    backPlane.position.set(this.showcaseTargetPos.x, this.showcaseTargetPos.y, -3.0);

    targetScene.add(snapshotAmbient);
    targetScene.add(snapshotKicker);
    targetScene.add(snapshotKicker.target);
    targetScene.add(snapshotFill);
    targetScene.add(snapshotFill.target);
    targetScene.add(backPlane);

    renderer.render(targetScene, camera);

    // Clean up temporary snapshot studio objects
    targetScene.remove(snapshotAmbient);
    targetScene.remove(snapshotKicker);
    targetScene.remove(snapshotKicker.target);
    targetScene.remove(snapshotFill);
    targetScene.remove(snapshotFill.target);
    targetScene.remove(backPlane);
    backGeo.dispose();
    backMat.dispose();
    backTex.dispose();

    // Restore exposure, tray visibility, and outline meshes
    renderer.toneMappingExposure = prevExposure;
    if (this.visualTrayMesh) {
      this.visualTrayMesh.visible = prevTrayVis;
    }
    this.activeDiceInstances.forEach((d, idx) => {
      if (d.outlineMesh) d.outlineMesh.visible = prevOutlineStates[idx];
    });
    camera.position.copy(prevCamPos);

    const snapshotCanvas = document.createElement('canvas');
    const w = options.width || 1200;
    const h = options.height || 675;
    snapshotCanvas.width = w;
    snapshotCanvas.height = h;
    const ctx = snapshotCanvas.getContext('2d');

    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.45, 80, w / 2, h * 0.45, w * 0.7);
    bgGrad.addColorStop(0, '#151922');
    bgGrad.addColorStop(0.65, '#0a0d13');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const srcW = renderer.domElement.width;
    const srcH = renderer.domElement.height;

    let minScreenX = Infinity, maxScreenX = -Infinity, minScreenY = Infinity, maxScreenY = -Infinity;
    for (let i = 0; i < this.activeDiceInstances.length; i++) {
      const d = this.activeDiceInstances[i];
      const v = d.mesh.position.clone().project(camera);
      const sx = (v.x * 0.5 + 0.5) * srcW;
      const sy = (-v.y * 0.5 + 0.5) * srcH;
      if (sx < minScreenX) minScreenX = sx;
      if (sx > maxScreenX) maxScreenX = sx;
      if (sy < minScreenY) minScreenY = sy;
      if (sy > maxScreenY) maxScreenY = sy;
    }

    const diePixelRadius = Math.max(srcH * 0.12, 60);
    const padX = diePixelRadius * 1.4;
    const padY = diePixelRadius * 1.4;

    const rawCropX = Math.max(0, minScreenX - padX);
    const rawCropY = Math.max(0, minScreenY - padY);
    const rawCropMaxX = Math.min(srcW, maxScreenX + padX);
    const rawCropMaxY = Math.min(srcH, maxScreenY + padY);

    const cropW = Math.max(rawCropMaxX - rawCropX, 80);
    const cropH = Math.max(rawCropMaxY - rawCropY, 80);
    const cropX = rawCropX;
    const cropY = rawCropY;

    const targetAreaW = w * 0.94;
    const targetAreaH = h * 0.68;
    const fitScale = Math.min(targetAreaW / cropW, targetAreaH / cropH, 1.25);
    const drawW = cropW * fitScale;
    const drawH = cropH * fitScale;
    const drawX = (w - drawW) / 2;
    const drawY = (h * 0.73 - drawH) / 2;

    ctx.drawImage(renderer.domElement, cropX, cropY, cropW, cropH, drawX, drawY, drawW, drawH);

    const footerGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
    footerGrad.addColorStop(0, 'rgba(10, 13, 19, 0)');
    footerGrad.addColorStop(0.35, 'rgba(10, 13, 19, 0.94)');
    footerGrad.addColorStop(1, '#0a0d13');
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    const lineGrad = ctx.createLinearGradient(w * 0.12, 0, w * 0.88, 0);
    lineGrad.addColorStop(0, 'rgba(255, 122, 24, 0)');
    lineGrad.addColorStop(0.5, 'rgba(255, 122, 24, 0.85)');
    lineGrad.addColorStop(1, 'rgba(255, 122, 24, 0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.76);
    ctx.lineTo(w * 0.88, h * 0.76);
    ctx.stroke();

    const total = this.lastRollResult ? this.lastRollResult.total : 0;
    const breakdown = this.lastRollResult ? this.lastRollResult.summary : '';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 40px "Outfit", sans-serif';
    ctx.fillStyle = '#e5c07b';
    ctx.fillText(`TOTAL: ${total}`, w / 2, h * 0.835);

    ctx.font = '500 18px "Inter", sans-serif';
    ctx.fillStyle = '#9da5b4';
    const displayBreakdown = breakdown.length > 75 ? breakdown.slice(0, 72) + '...' : breakdown;
    ctx.fillText(displayBreakdown, w / 2, h * 0.905);

    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText('POLYDICE • PROCEDURAL 3D DICE', w / 2, h * 0.955);

    ctx.strokeStyle = 'rgba(229, 192, 123, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    return snapshotCanvas;
  }

  // =========================================================================
  // UTILITIES & EXPORTS
  // =========================================================================

  parseTargetRollString(input) {
    if (!input) return null;
    if (typeof input === 'object') {
      if (Array.isArray(input)) {
        const dice = [];
        const targets = [];
        for (const item of input) {
          if (item && item.type && item.result != null) {
            dice.push(item.type.toLowerCase());
            targets.push(parseInt(item.result, 10));
          }
        }
        if (dice.length > 0) return { dice, targets };
      } else {
        const dice = [];
        const targets = [];
        for (const [key, val] of Object.entries(input)) {
          const k = key.toLowerCase();
          if (Array.isArray(val)) {
            val.forEach(v => {
              dice.push(k);
              targets.push(parseInt(v, 10));
            });
          } else {
            dice.push(k);
            targets.push(parseInt(val, 10));
          }
        }
        if (dice.length > 0) return { dice, targets };
      }
      return null;
    }

    const str = String(input).trim();
    if (!str) return null;

    if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
      try {
        const parsed = JSON.parse(str);
        return this.parseTargetRollString(parsed);
      } catch (e) { }
    }

    const parts = str.split(/;|\s+(?=\d*d[0-9]+)|,\s*(?=\d*d[0-9]+)/i).map(s => s.trim()).filter(Boolean);
    const dice = [];
    const targets = [];
    let matchedAny = false;
    const singleRegex = /^(?:(\d+)\s*)?(d[0-9]+)(?:\s*[:=]\s*\[?([0-9,\s]+)\]?)?$/i;

    for (const part of parts) {
      const m = singleRegex.exec(part);
      if (m) {
        matchedAny = true;
        const count = m[1] ? parseInt(m[1], 10) : 1;
        const type = m[2].toLowerCase();
        const nums = m[3] ? m[3].split(/[\s,]+/).filter(Boolean).map(n => parseInt(n, 10)) : [];
        for (let i = 0; i < count; i++) {
          dice.push(type);
          const tVal = (i < nums.length) ? nums[i] : (nums.length > 0 ? (nums[0] || null) : null);
          targets.push(tVal);
        }
      }
    }

    if (matchedAny && dice.length > 0) {
      return { dice, targets };
    }

    const rawNumbers = str.split(/[\s,]+/).filter(Boolean).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    if (rawNumbers.length > 0 && this.dicePool.length > 0) {
      const dList = [...this.dicePool];
      const tList = dList.map((type, idx) => (idx < rawNumbers.length ? rawNumbers[idx] : null));
      return { dice: dList, targets: tList };
    }

    return null;
  }

  getFaceCentroids(type) {
    const asset = this.getDiceAsset(type);
    if (!asset || !asset.faceDescriptors) return [];
    // Sort by numerical value so index 0 = face 1, index 1 = face 2, etc.
    const sorted = [...asset.faceDescriptors].sort((a, b) => a.value - b.value);
    return sorted.map(fd => ({
      value: fd.value,
      normal: { x: fd.normal.x, y: fd.normal.y, z: fd.normal.z },
      centroid: { x: fd.center.x, y: fd.center.y, z: fd.center.z }
    }));
  }

  createFaceCentroidPoints(type, options = {}) {
    const centroids = this.getFaceCentroids(type);
    if (centroids.length === 0) return null;

    const positions = new Float32Array(centroids.length * 3);
    for (let i = 0; i < centroids.length; i++) {
      positions[i * 3] = centroids[i].centroid.x;
      positions[i * 3 + 1] = centroids[i].centroid.y;
      positions[i * 3 + 2] = centroids[i].centroid.z;
    }

    const geo = new this.THREE.BufferGeometry();
    geo.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));

    const color = options.color !== undefined ? options.color : 0x00ffcc;
    const size = options.size !== undefined ? options.size : 0.18;
    const mat = new this.THREE.PointsMaterial({
      color,
      size,
      sizeAttenuation: true
    });

    const points = new this.THREE.Points(geo, mat);
    points.name = `${type}_centroids`;
    points.userData = {
      type,
      faceCount: centroids.length,
      centroids: centroids.map(c => ({ value: c.value, centroid: c.centroid, normal: c.normal }))
    };
    return points;
  }

  exportGLTF(options = {}) {
    const Exporter = options.GLTFExporter || this.GLTFExporter;
    if (!Exporter) {
      throw new Error('[PolyDice] GLTFExporter not provided or found.');
    }

    const exportGroup = new this.THREE.Group();
    const emitCentroids = !!options.emitCentroids;

    if (options.mesh) {
      const clone = options.mesh.clone();
      clone.position.set(0, 0, 0);
      clone.rotation.set(0, 0, 0);
      exportGroup.add(clone);

      if (emitCentroids && options.type) {
        const centroidPoints = this.createFaceCentroidPoints(options.type);
        if (centroidPoints) {
          centroidPoints.position.set(0, 0, 0);
          exportGroup.add(centroidPoints);
        }
      }
    } else {
      const types = options.types || (this.dicePool.length > 0 ? this.dicePool : ['d20']);
      const total = types.length;
      const spacing = 2.4;

      types.forEach((type, idx) => {
        const asset = this.getDiceAsset(type);
        const mesh = new this.THREE.Mesh(asset.geometry.clone(), asset.material.clone());
        const x = (idx - (total - 1) / 2) * spacing;
        mesh.position.set(x, 0, 0);
        mesh.name = `${type}_${idx + 1}`;

        // Embed face centroid coordinates in mesh userData for easy headless / JSON parsing
        mesh.userData.faceCentroids = this.getFaceCentroids(type);
        exportGroup.add(mesh);

        if (emitCentroids) {
          const centroidPoints = this.createFaceCentroidPoints(type);
          if (centroidPoints) {
            centroidPoints.position.set(x, 0, 0);
            exportGroup.add(centroidPoints);
          }
        }
      });
    }

    const exporter = new Exporter();
    return new Promise((resolve, reject) => {
      exporter.parse(
        exportGroup,
        (gltf) => {
          const blob = gltf instanceof ArrayBuffer
            ? new Blob([gltf], { type: 'model/gltf-binary' })
            : new Blob([JSON.stringify(gltf, null, 2)], { type: 'text/plain' });
          resolve(blob);
        },
        (error) => reject(error),
        { binary: options.binary !== false }
      );
    });
  }

  setSoundEnabled(enabled) {
    this.audioEnabled = !!enabled;
    this.soundSystem.enabled = this.audioEnabled;
  }

  isSoundEnabled() {
    return this.audioEnabled && this.soundSystem.enabled;
  }

  getLastRollResult() {
    return this.lastRollResult;
  }

  isRolling() {
    return this.isRollingState;
  }

  getActiveDice() {
    return this.activeDiceInstances;
  }

  // Pub/Sub
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }
  }

  dispose() {
    // 1. Remove and destroy active dice bodies and meshes
    this.clearActiveDice();

    // 2. Free Three.js GPU geometries, materials, and textures
    this.diceAssetCache.forEach((asset) => {
      if (asset.geometry) asset.geometry.dispose();
      if (asset.material) {
        if (asset.material.map) asset.material.map.dispose();
        if (asset.material.normalMap) asset.material.normalMap.dispose();
        if (asset.material.transmissionMap) asset.material.transmissionMap.dispose();
        if (asset.material.iridescenceThicknessMap) asset.material.iridescenceThicknessMap.dispose();
        if (asset.material.alphaMap) asset.material.alphaMap.dispose();
        asset.material.dispose();
      }
    });
    this.diceAssetCache.clear();

    // 3. Free visual tray if created
    if (this.visualTrayMesh) {
      this.visualTrayMesh.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        }
      });
      this.group.remove(this.visualTrayMesh);
      this.visualTrayMesh = null;
    }

    // 4. Detach group from the host scene
    if (this.scene && this.group) {
      this.scene.remove(this.group);
    }

    // 5. Free Ammo.js WASM heap allocations
    if (this.AmmoLib) {
      this.convexShapeCache.forEach((shape) => this.AmmoLib.destroy(shape));
      this.convexShapeCache.clear();

      if (this.physicsFloorBody && this.physicsWorld) {
        this.physicsWorld.removeRigidBody(this.physicsFloorBody);
        if (this.physicsFloorBody.getMotionState()) this.AmmoLib.destroy(this.physicsFloorBody.getMotionState());
        if (this.physicsFloorBody.getCollisionShape()) this.AmmoLib.destroy(this.physicsFloorBody.getCollisionShape());
        this.AmmoLib.destroy(this.physicsFloorBody);
        this.physicsFloorBody = null;
      }

      this.physicsWallBodies.forEach((body) => {
        if (this.physicsWorld) this.physicsWorld.removeRigidBody(body);
        if (body.getMotionState()) this.AmmoLib.destroy(body.getMotionState());
        if (body.getCollisionShape()) this.AmmoLib.destroy(body.getCollisionShape());
        this.AmmoLib.destroy(body);
      });
      this.physicsWallBodies = [];

      if (this.tempTrans) { this.AmmoLib.destroy(this.tempTrans); this.tempTrans = null; }
      if (this.tempBtVec) { this.AmmoLib.destroy(this.tempBtVec); this.tempBtVec = null; }
      if (this.physicsWorld) { this.AmmoLib.destroy(this.physicsWorld); this.physicsWorld = null; }
    }

    // 6. Close internal audio context if owned
    if (this.soundSystem) {
      this.soundSystem.dispose();
    }

    // 7. Clear event listeners
    this.listeners.clear();
  }
}

// Module-level bound references so geometry builders can work seamlessly
let THREE = null;
let ConvexHull = null;

function _bindPolyDiceContext(threeInstance, convexHullClass) {
  THREE = threeInstance;
  if (convexHullClass) {
    ConvexHull = convexHullClass;
  } else if (THREE && THREE.ConvexHull) {
    ConvexHull = THREE.ConvexHull;
  }
}

const ALL_DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd14', 'd16', 'd20', 'd24', 'd30', 'd48', 'd60', 'd100', 'd120'];
const ALL_MATERIALS = Object.keys(DICE_MATERIALS);

PolyDice.ALL_DICE_TYPES = ALL_DICE_TYPES;
PolyDice.ALL_MATERIALS = ALL_MATERIALS;

// Expose DICE_MATERIALS, PolyhedronPoints, constants on module
export { DICE_MATERIALS, PolyhedronPoints, DiceAudioSystem, ALL_DICE_TYPES, ALL_MATERIALS };
export default PolyDice;

