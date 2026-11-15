import type { RendererAdapter, RendererContext, RendererRenderInput } from './BaseRenderer';

/**
 * PINKO-specific ARIXEN renderer: a video texture mapped to the same
 * 72x72 soft-body mesh used by the Mina-derived portrait engine.
 */
export class VideoMeshRenderer implements RendererAdapter {
  public readonly type = 'pinko-video-mesh' as const;

  private ctx!: RendererContext;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private restBuffer: WebGLBuffer | null = null;
  private dynamicBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private indexCount = 0;
  private resizeObserver: ResizeObserver | null = null;
  private ready = false;
  private scrubProgress = 0.08;
  private lastSeekAt = 0;
  private lastTextureTime = -1;
  private loadedHandler: (() => void) | null = null;
  private errorHandler: (() => void) | null = null;
  private contextLostHandler: ((event: Event) => void) | null = null;
  private contextRestoredHandler: (() => void) | null = null;
  private uniforms: {
    overS: WebGLUniformLocation | null;
    lean: WebGLUniformLocation | null;
    frame: WebGLUniformLocation | null;
    sourceAspect: WebGLUniformLocation | null;
    viewportAspect: WebGLUniformLocation | null;
  } = { overS: null, lean: null, frame: null, sourceAspect: null, viewportAspect: null };

  async mount(ctx: RendererContext): Promise<void> {
    this.ctx = ctx;
    const cfg = ctx.config.assets.video;
    if (!cfg?.src) {
      ctx.diagnostics?.error('VideoMeshRenderer', 'VIDEO_SOURCE_MISSING', 'A video source is required.');
      ctx.onFirstAssetReady?.();
      return;
    }

    const video = document.createElement('video');
    video.src = ctx.assets.resolveUrl(cfg.src);
    if (cfg.poster) video.poster = ctx.assets.resolveUrl(cfg.poster);
    video.loop = cfg.loop ?? false;
    video.muted = cfg.muted ?? true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:72% 38%;pointer-events:none;';
    this.video = video;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'pinko-arixen-mesh-canvas';
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:none;pointer-events:none;';
    this.canvas = canvas;

    ctx.container.appendChild(video);
    ctx.container.appendChild(canvas);

    this.initWebGL(canvas);

    this.loadedHandler = () => {
      if (this.ready || !this.video) return;
      this.ready = true;
      this.lastTextureTime = -1;
      if (this.gl) {
        this.video.style.visibility = 'hidden';
        canvas.style.display = 'block';
      }
      ctx.onFirstAssetReady?.();
    };
    this.errorHandler = () => {
      ctx.diagnostics?.warn(
        'VideoMeshRenderer',
        'VIDEO_LOAD_FALLBACK',
        'The portrait video could not be decoded. The poster remains visible as a fallback.'
      );
      if (this.video) this.video.style.visibility = 'visible';
      if (!this.ready) {
        this.ready = true;
        ctx.onFirstAssetReady?.();
      }
    };
    video.addEventListener('loadeddata', this.loadedHandler);
    video.addEventListener('error', this.errorHandler);

    this.contextLostHandler = (event) => {
      event.preventDefault();
      this.gl = null;
      if (this.video) this.video.style.visibility = 'visible';
      canvas.style.display = 'none';
      ctx.diagnostics?.warn('VideoMeshRenderer', 'WEBGL_CONTEXT_LOST', 'Using the video fallback until WebGL is restored.');
    };
    this.contextRestoredHandler = () => {
      this.releaseGpuResources();
      this.initWebGL(canvas);
      if (this.gl && this.ready) {
        if (this.video) this.video.style.visibility = 'hidden';
        canvas.style.display = 'block';
      }
    };
    canvas.addEventListener('webglcontextlost', this.contextLostHandler);
    canvas.addEventListener('webglcontextrestored', this.contextRestoredHandler);

    const syncViewport = () => {
      if (!this.canvas) return;
      const dpr = ctx.performance.getEffectiveDpr();
      const bounds = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      this.canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
    };
    syncViewport();
    this.resizeObserver = new ResizeObserver(syncViewport);
    this.resizeObserver.observe(canvas);
    video.load();
  }

  private initWebGL(canvas: HTMLCanvasElement): void {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      this.gl = null;
      this.ctx.diagnostics?.warn('VideoMeshRenderer', 'WEBGL_UNAVAILABLE', 'Using pointer-scrubbed video without mesh deformation.');
      return;
    }

    try {
      const vertexSource = `
        attribute vec2 a;
        attribute vec2 d;
        attribute float s;
        varying vec2 vUv;
        varying float vShade;
        uniform vec2 lean;
        uniform float overS;
        void main() {
          vUv = a;
          vShade = s;
          vec2 p = a + d + lean;
          gl_Position = vec4(vec2(p.x - 0.5, 0.5 - p.y) * 2.0 / overS, 0.0, 1.0);
        }
      `;
      const fragmentSource = `
        precision highp float;
        varying vec2 vUv;
        varying float vShade;
        uniform sampler2D frame;
        uniform float sourceAspect;
        uniform float viewportAspect;
        void main() {
          vec2 uv = vUv;
          if (sourceAspect > viewportAspect) {
            uv.x = (uv.x - 0.5) * (viewportAspect / sourceAspect) + 0.5;
          } else {
            uv.y = (uv.y - 0.5) * (sourceAspect / viewportAspect) + 0.5;
          }
          vec4 color = texture2D(frame, uv);
          gl_FragColor = vec4(color.rgb * vShade, color.a);
        }
      `;

      const compile = (type: number, source: string): WebGLShader => {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Unable to allocate WebGL shader.');
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
          gl.deleteShader(shader);
          throw new Error(message);
        }
        return shader;
      };

      const vertex = compile(gl.VERTEX_SHADER, vertexSource);
      const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate WebGL program.');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message = gl.getProgramInfoLog(program) || 'Unknown program link error.';
        gl.deleteProgram(program);
        throw new Error(message);
      }
      this.program = program;
      this.gl = gl;
      gl.useProgram(program);

      this.uniforms = {
        overS: gl.getUniformLocation(program, 'overS'),
        lean: gl.getUniformLocation(program, 'lean'),
        frame: gl.getUniformLocation(program, 'frame'),
        sourceAspect: gl.getUniformLocation(program, 'sourceAspect'),
        viewportAspect: gl.getUniformLocation(program, 'viewportAspect'),
      };
      gl.uniform1f(this.uniforms.overS, this.ctx.physics.OVER);
      gl.uniform1i(this.uniforms.frame, 0);

      const n = this.ctx.physics.N;
      const m = this.ctx.physics.M;
      const indices = new Uint16Array(n * n * 6);
      for (let y = 0, k = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const a = y * m + x;
          const b = a + 1;
          const c = a + m;
          const d = c + 1;
          indices[k++] = a;
          indices[k++] = c;
          indices[k++] = b;
          indices[k++] = b;
          indices[k++] = c;
          indices[k++] = d;
        }
      }
      this.indexCount = indices.length;

      this.restBuffer = gl.createBuffer();
      this.dynamicBuffer = gl.createBuffer();
      this.indexBuffer = gl.createBuffer();
      this.texture = gl.createTexture();
      if (!this.restBuffer || !this.dynamicBuffer || !this.indexBuffer || !this.texture) {
        throw new Error('Unable to allocate WebGL mesh resources.');
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this.restBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.ctx.physics.rest, gl.STATIC_DRAW);
      const a = gl.getAttribLocation(program, 'a');
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.ctx.physics.dyn, gl.DYNAMIC_DRAW);
      const d = gl.getAttribLocation(program, 'd');
      const s = gl.getAttribLocation(program, 's');
      gl.enableVertexAttribArray(d);
      gl.vertexAttribPointer(d, 2, gl.FLOAT, false, 12, 0);
      gl.enableVertexAttribArray(s);
      gl.vertexAttribPointer(s, 1, gl.FLOAT, false, 12, 8);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } catch (error) {
      this.gl = null;
      this.ctx.diagnostics?.warn(
        'VideoMeshRenderer',
        'WEBGL_INIT_FALLBACK',
        error instanceof Error ? error.message : 'WebGL initialization failed.'
      );
    }
  }

  render(input: RendererRenderInput): void {
    const video = this.video;
    if (!video || !this.ready) return;

    const cfg = this.ctx.config.assets.video;
    const { now, dt, pointer, pressed, reducedMotion } = input;

    let targetProgress = this.scrubProgress;
    if (cfg?.scrubMode === 'pointer-x' && !reducedMotion) {
      targetProgress = Math.max(0, Math.min(1, pointer.u));
    } else if (cfg?.scrubMode === 'pointer-y' && !reducedMotion) {
      targetProgress = Math.max(0, Math.min(1, pointer.v));
    }
    this.scrubProgress += (targetProgress - this.scrubProgress) * (1 - Math.exp(-dt * 12));

    if (video.duration > 0 && cfg?.scrubMode !== 'playback' && !reducedMotion && !video.seeking) {
      const duration = Math.max(0, video.duration - 0.04);
      const desired = Math.min(duration, Math.max(0, this.scrubProgress * video.duration));
      const frameTime = Math.min(duration, Math.round(desired * 24) / 24);
      if (Math.abs(video.currentTime - frameTime) > 1 / 48 && now - this.lastSeekAt >= 42) {
        try {
          video.currentTime = frameTime;
          this.lastSeekAt = now;
        } catch {
          // Ignore transient browser seek errors during rapid pointer movement.
        }
      }
    }

    const tilt = this.ctx.physics.stepSpringTilt(
      dt,
      reducedMotion ? 0 : (pointer.v - 0.5) * 2.4,
      reducedMotion ? 0 : (pointer.u - 0.5) * 3.2
    );
    const fallbackTransform = `scale(1.035) rotateY(${tilt.x.toFixed(2)}deg) rotateX(${tilt.y.toFixed(2)}deg)`;
    video.style.transform = fallbackTransform;

    const gl = this.gl;
    if (!gl || !this.program || !this.dynamicBuffer || !this.texture || video.readyState < 2 || video.seeking) {
      return;
    }

    if (Math.abs(video.currentTime - this.lastTextureTime) > 0.0005) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        this.lastTextureTime = video.currentTime;
      } catch {
        return;
      }
    }

    const mesh = this.ctx.physics.stepSoftBodyMesh(dt);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh);

    const leanX = pressed ? 0 : (pointer.u - 0.5) * 0.006;
    const leanY = pressed ? 0 : (pointer.v - 0.5) * 0.005;
    const lean = this.ctx.physics.stepSpringLean(dt, leanX, leanY);

    gl.uniform2f(this.uniforms.lean, lean.x, lean.y);
    gl.uniform1f(this.uniforms.sourceAspect, video.videoWidth / Math.max(1, video.videoHeight));
    gl.uniform1f(
      this.uniforms.viewportAspect,
      this.canvas && this.canvas.height > 0 ? this.canvas.width / this.canvas.height : 1
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  toSurfaceUv(clientX: number, clientY: number): [number, number] {
    const canvasRect = this.canvas?.getBoundingClientRect();
    const rect = canvasRect && canvasRect.width > 0 && canvasRect.height > 0
      ? canvasRect
      : this.ctx.container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return [0.5, 0.5];
    return [(clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height];
  }

  reset(): void {
    this.scrubProgress = 0.08;
    this.lastSeekAt = 0;
    if (this.video) {
      try {
        this.video.currentTime = 0;
      } catch {
        // Video metadata may not be ready yet.
      }
    }
  }

  private releaseGpuResources(): void {
    if (!this.gl) return;
    if (this.texture) this.gl.deleteTexture(this.texture);
    if (this.restBuffer) this.gl.deleteBuffer(this.restBuffer);
    if (this.dynamicBuffer) this.gl.deleteBuffer(this.dynamicBuffer);
    if (this.indexBuffer) this.gl.deleteBuffer(this.indexBuffer);
    if (this.program) this.gl.deleteProgram(this.program);
    this.texture = null;
    this.restBuffer = null;
    this.dynamicBuffer = null;
    this.indexBuffer = null;
    this.program = null;
  }

  dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.video) {
      if (this.loadedHandler) this.video.removeEventListener('loadeddata', this.loadedHandler);
      if (this.errorHandler) this.video.removeEventListener('error', this.errorHandler);
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
      this.video.remove();
      this.video = null;
    }
    if (this.canvas) {
      if (this.contextLostHandler) this.canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
      if (this.contextRestoredHandler) this.canvas.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
      this.canvas.remove();
      this.canvas = null;
    }
    this.releaseGpuResources();
    this.gl = null;
    this.ready = false;
  }
}
