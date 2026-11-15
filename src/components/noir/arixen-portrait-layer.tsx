import { useEffect, useMemo, useRef } from "react";
import { UniversalInteractionEngine } from "@/lib/arixen-engine/core/UniversalInteractionEngine";
import type { SubjectConfig } from "@/lib/arixen-engine/types/config";

interface ArixenPortraitLayerProps {
  videoSrc: string;
  posterSrc: string;
  active: boolean;
}

/**
 * PINKO-specific adapter for the ARIXEN Universal Interaction Engine.
 * Pointer/touch X scrubs the portrait film; spring physics adds a restrained
 * camera-like response. It deliberately does not import Mina's comic portrait profile.
 */
export function ArixenPortraitLayer({ videoSrc, posterSrc, active }: ArixenPortraitLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  const config = useMemo<SubjectConfig>(() => ({
    id: "pinko-liquid-portrait",
    name: "PINKO Liquid Beauty Portrait",
    category: "human",
    description: "Luxury portrait film with pointer-driven reveal and subtle spring response.",
    renderer: "video",
    assets: {
      video: {
        src: videoSrc,
        poster: posterSrc,
        loop: false,
        muted: true,
        scrubMode: "pointer-x",
      },
    },
    interactions: {
      pointerTracking: true,
      touchTracking: true,
      hover: true,
      click: false,
      drag: false,
      scroll: false,
      magnet: false,
      proximity: true,
      pointerSensitivity: 0.9,
      pinchZoom: false,
      swipe: true,
      keyboard: true,
    },
    zones: [],
    behaviors: {
      initialState: "rest",
      idleEnabled: false,
      sequences: {},
    },
    physics: {
      enabled: true,
      mode: "spring-2d",
      stiffness: 44,
      damping: 13,
      inertia: 0.45,
      interactionStrength: 0.7,
    },
    performance: {
      maxDpr: 1.5,
      adaptiveQuality: true,
      pauseWhenHidden: true,
      respectReducedMotion: true,
      preloadStrategy: "priority-then-lazy",
      targetFps: 60,
    },
  }), [videoSrc, posterSrc]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !active) return;

    const engine = new UniversalInteractionEngine(config);
    const stopReady = engine.on("ready", () => {
      host.dataset.engineState = "ready";
    });
    const stopDiagnostic = engine.on("diagnostic", (diagnostic) => {
      if (diagnostic.severity === "error") {
        console.warn("[PINKO / ARIXEN]", diagnostic.code, diagnostic.message);
      }
    });

    void engine.mount(host).catch((error: unknown) => {
      host.dataset.engineState = "error";
      console.error("[PINKO / ARIXEN] Portrait engine failed to mount", error);
    });

    return () => {
      stopReady();
      stopDiagnostic();
      engine.dispose();
      host.replaceChildren();
      delete host.dataset.engineState;
    };
  }, [active, config]);

  return (
    <div
      ref={hostRef}
      className="pinko-arixen-portrait-host"
      role="img"
      aria-label="Interactive PINKO beauty portrait. Move the pointer or drag on touch screens to explore the liquid reveal."
    />
  );
}
