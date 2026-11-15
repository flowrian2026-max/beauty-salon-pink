# PINKO ARIXEN Interaction Proof of Concept

This folder vendors the reusable ARIXEN Universal Interaction Engine runtime from:
https://github.com/flowrian2026-max/Mina

Source baseline: `ee70ce4fb0e6395268e689832579b8eb903130ca`.

This PINKO proof of concept intentionally uses only the engine's video renderer and shared interaction/runtime systems. It does not import Mina's comic portrait profile, facial expressions, assets, or visual identity.

## PINKO adaptation

- Horizontal pointer movement scrubs the existing `chrome-melt.mp4` portrait sequence.
- Touch dragging provides the same horizontal control on touch devices.
- A restrained spring response adds subtle camera-like tilt.
- The existing page scroll remains responsible only for editorial chapter progression.
- Video seeks are quantized to the source's 24fps grid and throttled while decoding.
- Reduced-motion users receive the static poster instead of an interactive video.

This is a focused integration build, not the complete set of ARIXEN renderers. Other renderers remain in the Mina engine source and can be vendored when a future PINKO experience requires them.
