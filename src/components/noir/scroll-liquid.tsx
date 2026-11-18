import { useEffect, useRef } from "react";
import liquidPrimary from "../../../1794912712424.jpg";

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 uRes;
uniform float uAspect;
uniform float uHeroP;
uniform float uHeroBottom;
uniform float uPostP;
uniform float uNeckX;
uniform float uMobile;
uniform float uRtl;
uniform float uMasterAlpha;
uniform sampler2D uMatcap;

// C2-continuous polynomial smooth minimum; returns vec2(blendedDist, blendFactor in [0,1])
vec2 sminBlend(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / max(k, 1e-4);
  float m = h * h * h * 0.5;
  float s = m * k * (1.0 / 3.0);
  return (a < b) ? vec2(a - s, h * 0.5) : vec2(b - s, 1.0 - h * 0.5);
}

// Smooth tapered capsule; returns vec2(signedDist, interpolatedRadius)
vec2 sdTaperCapsule(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float l2 = dot(ba, ba);
  float h = l2 > 1e-6 ? clamp(dot(pa, ba) / l2, 0.0, 1.0) : 0.0;
  float r = mix(ra, rb, h);
  return vec2(length(pa - ba * h) - r, r);
}

// Continuous centerline X(v), half-width R(v), and slope dx/dy along v in [0, 1]
vec3 evalSplineAt(float v, float yTop, float yBot, float detach, float postP, float neckX, float mobile, float rtl) {
  float vc = clamp(v, 0.0, 1.0);

  // Gracefully curve from the Hero neck column toward the outer editorial right gutter
  float desktopTarget = rtl > 0.5 ? 0.942 : 0.885;
  float targetLaneX = ((mobile > 0.5 ? 0.785 : desktopTarget) - 0.5) * uAspect;
  float laneX = mix(neckX, targetLaneX, smoothstep(0.0, 0.58, vc) * mix(0.28, 1.0, detach));
  laneX = mix(laneX, targetLaneX, smoothstep(0.38, 1.0, detach) * 0.72);

  float span = max(0.08, yBot - yTop);
  float spanScale = smoothstep(0.10, 0.42, span);
  float amp = mix(0.008, mobile > 0.5 ? 0.058 : (rtl > 0.5 ? 0.052 : 0.074), smoothstep(0.04, 0.54, postP + detach * 0.45)) * spanScale;
  float phase = postP * 2.85;
  float wave = sin(vc * 5.2 - phase - 0.35) * amp
             + cos(vc * 2.6 + phase * 0.5) * (amp * 0.35);

  // Pin upper pour strictly onto neckX while pouring out of the Hero seam
  float pinFactor = mix(smoothstep(0.0, 0.40, vc), smoothstep(0.0, 0.18, vc), detach);
  float cx = laneX + wave * pinFactor;

  // Smooth central finite derivative dx/dy for true perpendicular distance
  float epsV = 0.012;
  float vP = clamp(vc + epsV, 0.0, 1.0);
  float vM = clamp(vc - epsV, 0.0, 1.0);
  float dv = max(0.002, (vP - vM) * span);

  float laneP = mix(neckX, targetLaneX, smoothstep(0.0, 0.58, vP) * mix(0.28, 1.0, detach));
  laneP = mix(laneP, targetLaneX, smoothstep(0.38, 1.0, detach) * 0.72);
  float waveP = sin(vP * 5.2 - phase - 0.35) * amp + cos(vP * 2.6 + phase * 0.5) * (amp * 0.35);
  float cxP = laneP + waveP * mix(smoothstep(0.0, 0.40, vP), smoothstep(0.0, 0.18, vP), detach);

  float laneM = mix(neckX, targetLaneX, smoothstep(0.0, 0.58, vM) * mix(0.28, 1.0, detach));
  laneM = mix(laneM, targetLaneX, smoothstep(0.38, 1.0, detach) * 0.72);
  float waveM = sin(vM * 5.2 - phase - 0.35) * amp + cos(vM * 2.6 + phase * 0.5) * (amp * 0.35);
  float cxM = laneM + waveM * mix(smoothstep(0.0, 0.40, vM), smoothstep(0.0, 0.18, vM), detach);

  float dxdy = (cxP - cxM) / dv;

  // Organic molten ribbon thickness: slender waist, plump curves, C1 tangent-smooth rounded ends
  float baseW = mobile > 0.5 ? 0.021 : 0.025;
  float swell1 = exp(-pow((vc - (0.30 + 0.07 * sin(postP * 2.3))) / 0.14, 2.0)) * (mobile > 0.5 ? 0.011 : 0.014) * spanScale;
  float swell2 = exp(-pow((vc - (0.64 + 0.04 * cos(postP * 2.1))) / 0.14, 2.0)) * (mobile > 0.5 ? 0.013 : 0.017) * spanScale;
  float waist = exp(-pow((vc - (0.48 + 0.06 * postP)) / 0.11, 2.0)) * 0.007 * spanScale;

  float upperNeck = mix(mix(0.76, 1.06, spanScale), 0.38, detach);
  float headBlend = mix(upperNeck, 1.0, smoothstep(0.06, 0.36, vc));
  float bottomTaper = mix(0.38, 1.0, smoothstep(0.94, 0.68, vc));
  float topTaper = mix(0.40, 1.0, smoothstep(0.04, 0.24, vc));
  float halfW = (baseW * headBlend + swell1 + swell2 - waist) * topTaper * bottomTaper;

  return vec3(cx, max(0.006, halfW), dxdy);
}

// Continuous C2 SDF for main liquid ribbon + controlled viscous drips
// Returns vec2(signedDistance, effectiveLocalRadius)
vec2 evalLiquidSDF(vec2 p) {
  float detach = smoothstep(0.75, -0.08, uHeroBottom);
  float neckX = (uNeckX - 0.5) * uAspect;

  // Vertical span [yTop .. yBot] stays tethered to Hero bottom first, then flows smoothly down screen
  float yTop = uHeroBottom > 0.0
    ? clamp(uHeroBottom - 0.04, 0.07, 0.96)
    : mix(0.07, 0.22, smoothstep(0.0, 1.0, uPostP));

  // Leads naturally below the Hero edge as it lifts off viewport bottom
  float pourReach = smoothstep(0.985, 0.38, uHeroBottom);
  float targetBot = mix(uHeroBottom + 0.14, 0.89, clamp(pourReach * 0.78 + smoothstep(0.06, 0.72, uPostP) * 0.35, 0.0, 1.0));
  float yBot = uHeroBottom > 0.0
    ? max(uHeroBottom + 0.06, targetBot)
    : max(yTop + 0.42, targetBot);
  yBot = min(0.93, yBot);

  float span = max(0.08, yBot - yTop);
  float v = (p.y - yTop) / span;
  float vc = clamp(v, 0.0, 1.0);

  vec3 sp = evalSplineAt(vc, yTop, yBot, detach, uPostP, neckX, uMobile, uRtl);
  float cx = sp.x;
  float halfW = sp.y;
  float slope = sp.z;

  // Distance to smooth curved ribbon with rounded fluid cap ends
  float dyClamp = p.y - clamp(p.y, yTop, yBot);
  float dx = (p.x - cx) / sqrt(1.0 + slope * slope * 0.65);
  float dMain = length(vec2(dx, dyClamp)) - halfW;
  float effW = halfW;

  // Subtle organic fluid contour modulation along body
  float contourWave = sin(p.y * 10.5 - uPostP * 3.4 + p.x * 4.2) * 0.0010;
  dMain += contourWave * smoothstep(0.05, 0.4, uHeroP);

  // Controlled Drip 1: viscous strand smoothly pulling off upper-mid belly
  float drip1 = smoothstep(0.18, 0.76, uPostP);
  if (drip1 > 0.002) {
    float v1 = 0.34;
    vec3 s1 = evalSplineAt(v1, yTop, yBot, detach, uPostP, neckX, uMobile, uRtl);
    vec2 a1 = vec2(s1.x - s1.y * 0.18, mix(yTop, yBot, v1));
    vec2 b1 = a1 + vec2(-0.020 * drip1, 0.056 * drip1);
    vec2 c1 = b1 + vec2(-0.004 * drip1, 0.078 * drip1);
    vec2 d1a = sdTaperCapsule(p, a1, b1, min(s1.y * 0.72, 0.015) * drip1, 0.0044 * drip1);
    vec2 d1b = sdTaperCapsule(p, b1, c1, 0.0044 * drip1, 0.0102 * smoothstep(0.0, 0.42, drip1));
    vec2 blend1 = sminBlend(d1a.x, d1b.x, 0.014 * smoothstep(0.0, 0.35, drip1));
    float r1 = mix(d1a.y, d1b.y, smoothstep(0.35, 0.85, blend1.y));
    vec2 m1 = sminBlend(dMain, blend1.x, 0.015 * smoothstep(0.0, 0.35, drip1));
    dMain = m1.x;
    effW = mix(effW, r1, smoothstep(0.45, 0.92, m1.y));
  }

  // Controlled Drip 2: lower belly gravity extension curving smoothly outward + poised teardrop bead
  float drip2 = smoothstep(0.32, 0.88, uPostP);
  if (drip2 > 0.002) {
    float v2 = 0.65;
    vec3 s2 = evalSplineAt(v2, yTop, yBot, detach, uPostP, neckX, uMobile, uRtl);
    vec2 a2 = vec2(s2.x - s2.y * 0.22, mix(yTop, yBot, v2));
    vec2 b2 = a2 + vec2(-0.024 * drip2, 0.052 * drip2);
    vec2 c2 = b2 + vec2(-0.002 * drip2, 0.068 * drip2);
    vec2 d2a = sdTaperCapsule(p, a2, b2, min(s2.y * 0.72, 0.015) * drip2, 0.0044 * drip2);
    vec2 d2b = sdTaperCapsule(p, b2, c2, 0.0044 * drip2, 0.0102 * smoothstep(0.0, 0.44, drip2));
    vec2 blend2 = sminBlend(d2a.x, d2b.x, 0.014 * smoothstep(0.0, 0.35, drip2));
    float r2 = mix(d2a.y, d2b.y, smoothstep(0.35, 0.85, blend2.y));

    float beadVis = smoothstep(0.55, 0.85, drip2) * (1.0 - smoothstep(0.92, 1.0, uPostP));
    if (beadVis > 0.01) {
      vec2 beadPos = c2 + vec2(0.0, 0.024 + 0.012 * beadVis);
      float beadR = 0.0064 * beadVis;
      float dBead = length(p - beadPos) - beadR;
      vec2 bMerge = sminBlend(blend2.x, dBead, 0.005);
      blend2.x = bMerge.x;
      r2 = mix(r2, beadR, bMerge.y);
    }

    vec2 m2 = sminBlend(dMain, blend2.x, 0.015 * smoothstep(0.0, 0.35, drip2));
    dMain = m2.x;
    effW = mix(effW, r2, smoothstep(0.45, 0.92, m2.y));
  }

  return vec2(dMain, max(effW, 0.005));
}

void main() {
  if (uMasterAlpha <= 0.001) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 sUV = vec2(uv.x, 1.0 - uv.y);
  vec2 p = vec2((sUV.x - 0.5) * uAspect, sUV.y);

  // Fast horizontal bounding-box early-out for silky 60fps performance
  float minBandX = ((uMobile > 0.5 ? 0.36 : 0.54) - 0.5) * uAspect;
  if (p.x < minBandX) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 field = evalLiquidSDF(p);
  float d = field.x;
  float w = field.y;

  float aa = 1.5 / max(uRes.y, 1.0);
  float alpha = smoothstep(aa, -aa * 1.4, d);

  // Subtle ambient contact shadow underneath the liquid on dark editorial background
  float shadowZone = smoothstep(0.036, -0.003, d) * (1.0 - alpha) * smoothstep(0.98, 0.25, uHeroBottom);
  if (alpha <= 0.002 && shadowZone <= 0.002) {
    fragColor = vec4(0.0);
    return;
  }

  // Analytic C-infinity SDF central gradient (never clamped at d=0 -> zero edge aliasing or zippering)
  float eps = 2.0 / max(uRes.y, 1.0);
  float dR = evalLiquidSDF(p + vec2(eps, 0.0)).x;
  float dL = evalLiquidSDF(p - vec2(eps, 0.0)).x;
  float dD = evalLiquidSDF(p + vec2(0.0, eps)).x;
  float dU = evalLiquidSDF(p - vec2(0.0, eps)).x;
  vec2 g = vec2(dR - dL, dD - dU) / (2.0 * eps);

  // Smooth normalized radial position: 0 at interior spine -> 1 at outer rim
  float rNorm = clamp(1.0 + d / w, 0.0, 0.96);
  vec2 gDir = g / max(length(g), 1.0);

  // Subtle longitudinal silk undulation strictly inside thick liquid core
  float coreWeight = smoothstep(0.88, 0.22, rNorm) * smoothstep(0.010, 0.024, w);
  float ripple = sin(p.y * 6.8 - uPostP * 2.4 + p.x * 13.0) * 0.07 * coreWeight;
  vec2 nXY = gDir * (sin(rNorm * 1.44) * 0.88) + vec2(ripple, ripple * 0.45);
  float nz = sqrt(max(0.10, 1.0 - min(0.90, dot(nXY, nXY))));
  vec3 N = normalize(vec3(nXY.x, -nXY.y, nz));

  // Sample photographic rose-gold studio MatCap extracted from 1794912712424.jpg
  vec2 mcUV = clamp(N.xy * 0.46 + 0.5, 0.02, 0.98);
  vec3 roseGold = texture(uMatcap, mcUV).rgb;

  // Studio softbox highlights + Fresnel metallic rim
  vec3 L1 = normalize(vec3(-0.52, 0.55, 0.65));
  vec3 L2 = normalize(vec3(0.58, -0.32, 0.75));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H1 = normalize(L1 + V);
  vec3 H2 = normalize(L2 + V);

  float spec1 = pow(max(dot(N, H1), 0.0), 46.0);
  float spec2 = pow(max(dot(N, H2), 0.0), 30.0);
  float fresnel = pow(1.0 - max(N.z, 0.0), 2.8);

  vec3 highlightTint = vec3(1.0, 0.91, 0.87);
  vec3 rimTint = vec3(0.93, 0.74, 0.68);
  vec3 liquidCol = roseGold + highlightTint * (spec1 * 0.44 + spec2 * 0.22) + rimTint * (fresnel * 0.22);

  // Smooth tonal bridge right below the Hero bottom edge while connected to the neck pour
  if (uHeroBottom > 0.0) {
    float seamT = smoothstep(uHeroBottom - 0.02, uHeroBottom + 0.16, sUV.y);
    float lum = dot(liquidCol, vec3(0.299, 0.587, 0.114));
    vec3 champagneNeck = vec3(lum * 1.03, lum * 0.94, lum * 0.84);
    liquidCol = mix(champagneNeck, liquidCol, 0.35 + 0.65 * seamT);
  }

  float finalAlpha = alpha * uMasterAlpha;
  vec3 outRGB = liquidCol * finalAlpha;
  float outA = finalAlpha + shadowZone * 0.24 * uMasterAlpha;

  fragColor = vec4(outRGB, clamp(outA, 0.0, 1.0));
}
`;

function paintStudioRoseGoldMatcap(
  ctx: CanvasRenderingContext2D,
  size: number,
  ramp?: Array<[number, number, number]>,
) {
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const stops: Array<[number, number, number]> =
    ramp && ramp.length >= 5
      ? ramp
      : [
          [26, 15, 15],
          [78, 44, 41],
          [154, 98, 88],
          [214, 159, 148],
          [252, 226, 216],
        ];

  const sampleRamp = (v: number): [number, number, number] => {
    const t = Math.max(0, Math.min(1, v)) * (stops.length - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(stops.length - 1, i0 + 1);
    const f = t - i0;
    const c0 = stops[i0] ?? stops[0]!;
    const c1 = stops[i1] ?? stops[stops.length - 1]!;
    return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
  };

  for (let py = 0; py < size; py++) {
    const ny = 1 - (py / (size - 1)) * 2;
    for (let px = 0; px < size; px++) {
      const nx = (px / (size - 1)) * 2 - 1;
      const r2 = nx * nx + ny * ny;
      const nz = Math.sqrt(Math.max(0.001, 1 - Math.min(0.999, r2)));

      // Crisp studio softboxes + deep dark reflection horizon band for authentic liquid metal contrast
      const bandA = Math.exp(-Math.pow((nx * 0.72 - ny * 0.68 + 0.16) * 3.2, 2));
      const bandB = Math.exp(-Math.pow((nx * 0.55 + ny * 0.82 - 0.54) * 4.0, 2));
      const darkTrough = Math.exp(-Math.pow((nx * 0.65 - ny * 0.76 - 0.3) * 4.5, 2));
      const rim = Math.pow(1 - nz, 2.0);

      const env = Math.max(
        0,
        Math.min(1, 0.22 + bandA * 0.7 + bandB * 0.44 + rim * 0.3 - darkTrough * 0.52),
      );
      const [r, g, b] = sampleRamp(env);
      const idx = (py * size + px) * 4;
      d[idx] = Math.round(r);
      d[idx + 1] = Math.round(g);
      d[idx + 2] = Math.round(b);
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function extractRoseGoldPalette(
  img: HTMLImageElement,
): Array<[number, number, number]> | undefined {
  const sampleSize = 96;
  const c = document.createElement("canvas");
  c.width = sampleSize;
  c.height = sampleSize;
  const ctx = c.getContext("2d");
  if (!ctx) return undefined;
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

  const warmMetals: Array<{ lum: number; rgb: [number, number, number] }> = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const warmth = r - b;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (chroma >= 12 && warmth >= 10) {
      warmMetals.push({ lum, rgb: [r, g, b] });
    }
  }
  if (warmMetals.length < 40) return undefined;
  warmMetals.sort((a, b) => a.lum - b.lum);

  const quantiles = [0.06, 0.24, 0.5, 0.78, 0.96];
  return quantiles.map((q) => {
    const item = warmMetals[Math.min(warmMetals.length - 1, Math.floor(q * warmMetals.length))];
    return item ? item.rgb : [200, 140, 128];
  });
}

function compileShader(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Continuous scroll-driven WebGL2 rose-gold liquid experience.
 * Sits cleanly behind .spatial-journey (z-index: 8 < 10) and pours straight from
 * the Hero neck column down through the editorial sections with organic fluid deformation.
 */
export function ScrollLiquid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const matcapSize = 256;
    const matcapCanvas = document.createElement("canvas");
    matcapCanvas.width = matcapSize;
    matcapCanvas.height = matcapSize;
    const matcapCtx = matcapCanvas.getContext("2d");
    if (matcapCtx) paintStudioRoseGoldMatcap(matcapCtx, matcapSize);

    const matcapTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, matcapTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, matcapCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let cancelled = false;
    const refImg = new Image();
    refImg.decoding = "async";
    refImg.onload = () => {
      if (cancelled || !matcapCtx) return;
      const ramp = extractRoseGoldPalette(refImg);
      if (ramp) {
        paintStudioRoseGoldMatcap(matcapCtx, matcapSize, ramp);
        gl.bindTexture(gl.TEXTURE_2D, matcapTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, matcapCanvas);
        schedule();
      }
    };
    refImg.src = liquidPrimary;

    const uRes = gl.getUniformLocation(program, "uRes");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uHeroP = gl.getUniformLocation(program, "uHeroP");
    const uHeroBottom = gl.getUniformLocation(program, "uHeroBottom");
    const uPostP = gl.getUniformLocation(program, "uPostP");
    const uNeckX = gl.getUniformLocation(program, "uNeckX");
    const uMobile = gl.getUniformLocation(program, "uMobile");
    const uRtl = gl.getUniformLocation(program, "uRtl");
    const uMasterAlpha = gl.getUniformLocation(program, "uMasterAlpha");
    const uMatcap = gl.getUniformLocation(program, "uMatcap");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const measureNeckScreenX = (vw: number, vh: number, stageEl: HTMLElement | null): number => {
      const stageW = stageEl ? stageEl.clientWidth : vw;
      const stageH = stageEl ? stageEl.clientHeight : vh;
      const va = 1344 / 768;
      const sa = stageW / Math.max(1, stageH);
      const isMobile = vw <= 760;
      const ox = isMobile ? 0.68 : 0.7;
      // Aligns horizontally with the bottom chrome neck pour in chrome-melt.mp4
      const neckInVideo = isMobile ? 0.675 : 0.73;
      if (sa < va) {
        const drawW = stageH * va;
        const offsetX = -ox * (drawW - stageW);
        return Math.max(0.25, Math.min(0.92, (offsetX + neckInVideo * drawW) / Math.max(1, vw)));
      }
      return neckInVideo;
    };

    const draw = () => {
      raf = 0;
      if (reducedMotion.matches) {
        canvas.style.opacity = "0";
        return;
      }

      const vw = Math.max(1, window.innerWidth);
      const vh = Math.max(1, window.innerHeight);
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const targetW = Math.round(vw * dpr);
      const targetH = Math.round(vh * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const heroEl = document.querySelector<HTMLElement>(".spatial-journey");
      const stageEl = heroEl?.querySelector<HTMLElement>(".journey-stage") ?? null;
      const heroRect = heroEl?.getBoundingClientRect();
      const stageH = stageEl?.getBoundingClientRect().height ?? vh;
      const heroTotal = heroRect ? Math.max(1, heroRect.height - stageH) : 1;
      const heroP = heroRect ? Math.max(0, Math.min(1, -heroRect.top / heroTotal)) : 1;
      const heroBottomNorm = heroRect ? heroRect.bottom / vh : -1;

      const postStart = heroEl ? Math.max(0, heroEl.offsetTop + heroEl.offsetHeight - vh) : 0;
      const postSpan = Math.max(1, document.documentElement.scrollHeight - vh - postStart);
      const postP = Math.max(0, Math.min(1, (window.scrollY - postStart) / postSpan));

      // Active once Hero unsticks and starts revealing the editorial sections below the neck pour
      const emergeAlpha =
        heroBottomNorm < 0.995 ? Math.max(0, Math.min(1, (1.0 - heroBottomNorm) / 0.04)) : 0;
      const footerFade = Math.max(0, Math.min(1, (0.985 - postP) / 0.1));
      const isMobile = vw <= 760;
      const masterAlpha = emergeAlpha * footerFade * (isMobile ? 0.9 : 0.95);

      if (masterAlpha <= 0.002) {
        canvas.style.opacity = "0";
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }

      canvas.style.opacity = "1";
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, matcapTex);
      gl.uniform1i(uMatcap, 0);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uAspect, vw / vh);
      gl.uniform1f(uHeroP, heroP);
      gl.uniform1f(uHeroBottom, heroBottomNorm);
      gl.uniform1f(uPostP, postP);
      gl.uniform1f(uNeckX, measureNeckScreenX(vw, vh, stageEl));
      gl.uniform1f(uMobile, isMobile ? 1 : 0);
      gl.uniform1f(uRtl, document.documentElement.dir === "rtl" ? 1 : 0);
      gl.uniform1f(uMasterAlpha, masterAlpha);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(draw);
    };
    const onMotionChange = () => schedule();
    const dirObserver = new MutationObserver(() => schedule());
    dirObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    reducedMotion.addEventListener("change", onMotionChange);
    schedule();

    return () => {
      cancelled = true;
      dirObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", onMotionChange);
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      gl.deleteTexture(matcapTex);
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={canvasRef} className="pinko-scroll-liquid" aria-hidden="true" />;
}
