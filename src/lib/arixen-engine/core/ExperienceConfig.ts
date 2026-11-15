import type { ConfigValidationResult, SubjectConfig } from '../types/config';

const BUILTIN_RENDERERS = new Set([
  'image',
  'frame-sequence',
  'sprite-sheet',
  'layered-image',
  'webgl-mesh',
  'three-d',
  'video',
]);

export class ExperienceConfig {
  static validate(config: SubjectConfig, customRenderers?: Set<string>): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config || typeof config !== 'object') {
      return { valid: false, errors: ['SubjectConfig must be a non-null object.'], warnings };
    }

    if (!config.id || typeof config.id !== 'string' || !config.id.trim()) {
      errors.push('SubjectConfig requires a non-empty string "id".');
    }
    if (!config.name || typeof config.name !== 'string' || !config.name.trim()) {
      errors.push('SubjectConfig requires a non-empty string "name".');
    }
    if (!config.renderer || typeof config.renderer !== 'string') {
      errors.push('SubjectConfig requires a "renderer" adapter type.');
    } else if (!BUILTIN_RENDERERS.has(config.renderer) && !customRenderers?.has(config.renderer)) {
      errors.push(`Unknown renderer adapter "${config.renderer}". Register a custom renderer or use a built-in type.`);
    }

    if (!config.assets || typeof config.assets !== 'object') {
      errors.push('SubjectConfig requires an "assets" manifest object.');
    } else {
      switch (config.renderer) {
        case 'image':
          if (!config.assets.staticImage?.src) {
            errors.push('Renderer "image" requires assets.staticImage.src.');
          }
          break;
        case 'frame-sequence':
        case 'webgl-mesh':
          if (!config.assets.frames || Object.keys(config.assets.frames).length === 0) {
            errors.push(`Renderer "${config.renderer}" requires at least one frame in assets.frames.`);
          }
          if (
            config.behaviors?.initialState &&
            config.assets.frames &&
            !config.assets.frames[config.behaviors.initialState] &&
            !config.assets.fallbackFrame
          ) {
            warnings.push(
              `Initial state "${config.behaviors.initialState}" has no direct asset key; ensure fallbackFrame is provided.`
            );
          }
          break;
        case 'sprite-sheet':
          if (!config.assets.spriteSheet?.src) {
            errors.push('Renderer "sprite-sheet" requires assets.spriteSheet.src.');
          } else if (
            config.assets.spriteSheet.rows <= 0 ||
            config.assets.spriteSheet.cols <= 0 ||
            config.assets.spriteSheet.frameCount <= 0
          ) {
            errors.push('SpriteSheet rows, cols, and frameCount must be positive numbers.');
          }
          break;
        case 'layered-image':
          if (!config.assets.layers || config.assets.layers.length === 0) {
            errors.push('Renderer "layered-image" requires at least one layer in assets.layers.');
          }
          break;
        case 'three-d':
          if (!config.assets.threeD?.modelUrl && !config.assets.threeD?.proceduralPreset) {
            errors.push(
              'Renderer "three-d" requires assets.threeD.modelUrl or assets.threeD.proceduralPreset.'
            );
          }
          if (config.assets.threeD?.cameraPresets) {
            for (const cp of config.assets.threeD.cameraPresets) {
              if (!cp.id || cp.position.length !== 3 || cp.target.length !== 3) {
                errors.push(`Camera preset "${cp.id || 'unnamed'}" requires 3-element position and target vectors.`);
              }
            }
          }
          break;
        case 'video':
          if (!config.assets.video?.src && !config.assets.video?.syntheticFallbackPreset) {
            errors.push('Renderer "video" requires assets.video.src or syntheticFallbackPreset.');
          }
          break;
      }
    }

    // Validate directional gaze frames exist if enabled
    if (config.behaviors?.directionalGaze?.enabled) {
      const frames = config.assets?.frames || {};
      const missingFrames = Object.values(config.behaviors.directionalGaze.frameMap).filter(
        (key) => !frames[key]
      );
      if (missingFrames.length > 0) {
        warnings.push(
          `Directional gaze references missing frame keys: ${Array.from(new Set(missingFrames)).join(', ')}`
        );
      }
    }

    // Validate interaction zones (duplicate IDs, bounds, broken sequence references)
    if (Array.isArray(config.zones)) {
      const seenIds = new Set<string>();
      for (const zone of config.zones) {
        if (!zone.id) {
          errors.push('Every interaction zone requires a non-empty "id".');
          continue;
        }
        if (seenIds.has(zone.id)) {
          errors.push(`Duplicate interaction zone id "${zone.id}".`);
        }
        seenIds.add(zone.id);

        if (zone.bounds) {
          if (zone.bounds.x < 0 || zone.bounds.x > 1 || zone.bounds.y < 0 || zone.bounds.y > 1) {
            warnings.push(`Zone "${zone.id}" center (${zone.bounds.x}, ${zone.bounds.y}) is outside normalized [0..1].`);
          }
        }
        if (
          zone.clickAction?.type === 'trigger-behavior' &&
          config.behaviors?.sequences &&
          !config.behaviors.sequences[zone.clickAction.target]
        ) {
          warnings.push(
            `Zone "${zone.id}" clickAction references missing behavior sequence "${zone.clickAction.target}".`
          );
        }
      }
    }

    // Validate physics bounds & compatibility
    if (config.physics) {
      if (
        config.physics.gridResolution !== undefined &&
        (config.physics.gridResolution < 8 || config.physics.gridResolution > 128)
      ) {
        errors.push('Physics gridResolution must be between 8 and 128.');
      }
      if (
        config.physics.fixedStepHz !== undefined &&
        (config.physics.fixedStepHz < 30 || config.physics.fixedStepHz > 480)
      ) {
        errors.push('Physics fixedStepHz must be between 30 and 480 Hz.');
      }
      if (
        config.physics.enabled &&
        config.physics.mode === 'soft-body-mesh' &&
        config.renderer !== 'webgl-mesh'
      ) {
        warnings.push(
          `Physics mode "soft-body-mesh" is optimized for "webgl-mesh" renderer; "${config.renderer}" will use spring kinematics instead.`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static normalize(config: SubjectConfig): SubjectConfig {
    return {
      ...config,
      interactions: {
        pointerSensitivity: 1,
        hoverDelayMs: 80,
        shakeThreshold: 1.5,
        pinchZoom: true,
        keyboard: true,
        ...config.interactions,
      },
      physics: {
        fixedStepHz: 240,
        gridResolution: 72,
        overscan: 1.7,
        wobbleHz: 2.3,
        dampingRatio: 0.14,
        dragRadius: 0.22,
        dragLimit: 0.24,
        stiffness: 70,
        damping: 8,
        inertia: 1,
        interactionStrength: 1,
        preventMeshFold: true,
        alphaHitTestThreshold: 40,
        ...config.physics,
      },
      performance: {
        maxDpr: 2,
        adaptiveQuality: true,
        pauseWhenHidden: true,
        respectReducedMotion: true,
        preloadStrategy: 'priority-then-lazy',
        targetFps: 60,
        ...config.performance,
      },
      magnet: {
        enabled: false,
        strength: 4,
        padding: 40,
        axis: 'both',
        rotationStrength: 0,
        touchEquivalent: true,
        ...config.magnet,
      },
    };
  }
}
