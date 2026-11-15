import type { InteractionCapabilities, InteractionZoneDef, MagnetConfig } from '../types/config';
import type { NormalizedPointer, TouchGesturePayload } from '../types/events';
import { ClickInteraction } from '../interactions/ClickInteraction';
import { DragInteraction } from '../interactions/DragInteraction';
import { HoverInteraction } from '../interactions/HoverInteraction';
import { MagnetInteraction } from '../interactions/MagnetInteraction';
import { PointerInteraction } from '../interactions/PointerInteraction';
import { ProximityInteraction } from '../interactions/ProximityInteraction';
import { ScrollInteraction } from '../interactions/ScrollInteraction';
import { TouchInteraction } from '../interactions/TouchInteraction';

export interface InteractionCoordinatorCallbacks {
  toSurfaceUv: (clientX: number, clientY: number) => [number, number];
  canStartDrag: (u: number, v: number) => boolean;
  hitTestZone: (u: number, v: number) => InteractionZoneDef | null;
  onPointerMove: (pointer: NormalizedPointer, proximity: number) => void;
  onPointerLeave: () => void;
  onZoneEnter: (zone: InteractionZoneDef) => void;
  onZoneLeave: (zone: InteractionZoneDef) => void;
  onExternalHoverChange: (entering: boolean) => void;
  onDragStart: (u: number, v: number) => void;
  onDragMove: (u: number, v: number) => void;
  onDragEnd: (info: { startU: number; startV: number; endU: number; endV: number; heldMs: number }) => void;
  onTap: (u: number, v: number) => void;
  onTouchGesture: (gesture: TouchGesturePayload) => void;
  onScrollActivity: () => void;
}

export class InteractionController {
  public readonly pointer: PointerInteraction;
  public readonly touch: TouchInteraction;
  public readonly hover: HoverInteraction;
  public readonly click: ClickInteraction;
  public readonly drag: DragInteraction;
  public readonly scroll: ScrollInteraction;
  public readonly magnet: MagnetInteraction | null;
  public readonly proximity: ProximityInteraction;

  constructor(
    container: HTMLElement,
    magnetTarget: HTMLElement | null,
    capabilities: InteractionCapabilities,
    magnetConfig: MagnetConfig | undefined,
    private callbacks: InteractionCoordinatorCallbacks
  ) {
    this.proximity = new ProximityInteraction(container, {
      enabled: capabilities.proximity,
    });

    this.hover = new HoverInteraction(
      {
        onZoneEnter: callbacks.onZoneEnter,
        onZoneLeave: callbacks.onZoneLeave,
        onExternalHoverChange: callbacks.onExternalHoverChange,
      },
      {
        enabled: capabilities.hover,
        externalSelectors: capabilities.externalHoverSelectors,
      }
    );

    this.pointer = new PointerInteraction(
      {
        toSurfaceUv: callbacks.toSurfaceUv,
        onMove: (ptr) => {
          const prox = this.proximity.updateFromClientPoint(ptr.clientX, ptr.clientY);
          const zone = callbacks.hitTestZone(ptr.u, ptr.v);
          this.hover.updateZone(zone, performance.now());
          callbacks.onPointerMove(ptr, prox);
        },
        onLeave: () => {
          this.hover.clear();
          callbacks.onPointerLeave();
        },
      },
      {
        enabled: capabilities.pointerTracking,
        sensitivity: capabilities.pointerSensitivity ?? 1,
        shakeThreshold: capabilities.shakeThreshold ?? 1.5,
      }
    );

    this.click = new ClickInteraction(
      container,
      {
        toSurfaceUv: callbacks.toSurfaceUv,
        onClick: (u, v) => {
          callbacks.onTap(u, v);
        },
      },
      {
        enabled: capabilities.click,
        attachDomClick: false,
      }
    );

    this.drag = new DragInteraction(
      container,
      {
        toSurfaceUv: callbacks.toSurfaceUv,
        canStartDrag: (u, v) => callbacks.canStartDrag(u, v),
        onDragStart: (u, v) => callbacks.onDragStart(u, v),
        onDragMove: (u, v) => callbacks.onDragMove(u, v),
        onDragEnd: (info) => {
          callbacks.onDragEnd(info);
        },
      },
      {
        enabled: capabilities.drag || capabilities.click,
      }
    );

    this.touch = new TouchInteraction(
      container,
      {
        toSurfaceUv: callbacks.toSurfaceUv,
        onGesture: (gesture) => {
          callbacks.onTouchGesture(gesture);
        },
      },
      {
        enabled: capabilities.touchTracking,
      }
    );

    this.scroll = new ScrollInteraction(
      {
        onScrollActivity: () => callbacks.onScrollActivity(),
      },
      {
        enabled: capabilities.scroll,
      }
    );

    this.magnet = magnetTarget
      ? new MagnetInteraction(magnetTarget, {
          enabled: Boolean(capabilities.magnet && (magnetConfig?.enabled ?? true)),
          strength: magnetConfig?.strength ?? 6,
          padding: magnetConfig?.padding ?? 45,
          axis: magnetConfig?.axis ?? 'both',
          rotationStrength: magnetConfig?.rotationStrength ?? 0,
          touchEquivalent: magnetConfig?.touchEquivalent ?? true,
        })
      : null;
  }

  updateCapabilities(partial: Partial<InteractionCapabilities>): void {
    if (partial.pointerTracking !== undefined) this.pointer.setEnabled(partial.pointerTracking);
    if (partial.pointerSensitivity !== undefined) this.pointer.setSensitivity(partial.pointerSensitivity);
    if (partial.touchTracking !== undefined) this.touch.setEnabled(partial.touchTracking);
    if (partial.hover !== undefined) this.hover.setEnabled(partial.hover);
    if (partial.click !== undefined) this.click.setEnabled(partial.click);
    if (partial.drag !== undefined || partial.click !== undefined) {
      const dragEnabled = partial.drag ?? this.drag.isEnabled();
      const clickEnabled = partial.click ?? this.click.isEnabled();
      this.drag.setEnabled(dragEnabled || clickEnabled);
    }
    if (partial.scroll !== undefined) this.scroll.setEnabled(partial.scroll);
    if (partial.proximity !== undefined) this.proximity.setEnabled(partial.proximity);
    if (partial.magnet !== undefined && this.magnet) this.magnet.setEnabled(partial.magnet);
  }

  dispose(): void {
    this.pointer.dispose();
    this.touch.dispose();
    this.hover.dispose();
    this.click.dispose();
    this.drag.dispose();
    this.scroll.dispose();
    this.magnet?.dispose();
    this.proximity.dispose();
  }
}
