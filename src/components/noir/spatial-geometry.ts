import * as THREE from "three";

// A continuous, twisted pigment stroke, shaped into the brand's V.
export function signatureGeometry(segments = 180, across = 10) {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.3, 2.45, -0.4), new THREE.Vector3(-1.65, 1.4, 0.2),
    new THREE.Vector3(-0.85, -0.2, 0.55), new THREE.Vector3(0, -1.8, 0),
    new THREE.Vector3(0.8, -0.3, -0.35), new THREE.Vector3(1.7, 1.2, 0.35),
    new THREE.Vector3(2.3, 2.55, -0.3),
  ], false, "catmullrom", 0.45);
  const vertices: number[] = [], normals: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = path.getPoint(t), tangent = path.getTangent(t);
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize();
    const twist = Math.sin(t * Math.PI * 2.2) * 0.48 + t * 0.72;
    side.applyAxisAngle(tangent, twist);
    const normal = new THREE.Vector3().crossVectors(side, tangent).normalize();
    const width = 0.43 + Math.sin(t * Math.PI) * 0.09;
    for (let j = 0; j <= across; j++) {
      const s = j / across * 2 - 1;
      const v = center.clone().addScaledVector(side, s * width).addScaledVector(normal, (1 - s * s) * 0.11);
      vertices.push(v.x, v.y, v.z); normals.push(normal.x, normal.y, normal.z); uv.push(t, j / across);
      if (i < segments && j < across) {
        const n = i * (across + 1) + j;
        indices.push(n, n + across + 1, n + 1, n + 1, n + across + 1, n + across + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function studioTexture() {
  const data = new Uint8Array(128 * 128 * 4);
  let seed = 17;
  for (let i = 0; i < 128 * 128; i++) {
    seed = (seed * 16807) % 2147483647;
    const value = 110 + seed % 40;
    data[i * 4] = value; data[i * 4 + 1] = value; data[i * 4 + 2] = value; data[i * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, 128, 128);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16); texture.needsUpdate = true;
  return texture;
}

// Fine directional pigment grain, kept linear because it drives surface relief.
export function pigmentTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  let seed = 29;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = seed * 16807 % 2147483647;
      const value = 175 + Math.round(Math.sin(y * 1.8) * 8) + seed % 12;
      const offset = (y * size + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 3);
  texture.needsUpdate = true;
  return texture;
}

export function sceneColor(token: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.Color(0.6, 0.6, 0.6);
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  context.fillRect(0, 0, 1, 1);
  const pixel = context.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB((pixel[0] ?? 100) / 255, (pixel[1] ?? 100) / 255, (pixel[2] ?? 100) / 255, THREE.SRGBColorSpace);
}