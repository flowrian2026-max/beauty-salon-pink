# NOIR PINK — launch readiness

## Implemented in the current codebase (needs visual regression check)
- [x] Persian/English language switch with local preference persistence.
- [x] Set document language and text direction to LTR/RTL when language changes.
- [x] Persian translations for core navigation, service copy, booking inquiry flow, gallery, advisor states and local demo admin.
- [x] Vazirmatn is included in the shared font stylesheet alongside the Latin display/body fonts.
- [x] Before/after comparison uses one shared split value and has descriptive labels.
- [x] Spatial hero includes a static campaign-image fallback, reduced-motion handling and a lower-quality rendering path.
- [x] Booking UI distinguishes an inquiry from a confirmed appointment; no real booking is claimed without a configured business contact.

## Remaining launch checks
- [ ] Visit every route in English and Persian: home, services, experience, gallery, about, contact, booking and demo admin.
- [ ] Fix any missing Persian strings and check punctuation, numerals, mixed-direction email/phone fields and RTL alignment.
- [ ] Verify language choice survives refresh and navigation on mobile.
- [ ] Test before/after drag with mouse, touch and keyboard; verify labels stay readable at narrow widths.
- [ ] Test gallery filters, lightbox close/previous/next and keyboard focus.
- [ ] Test booking validation, review/edit flow, email-draft handoff and local-storage failure messaging.
- [ ] Verify the spatial hero on a low-power/mobile device and with reduced motion enabled.
- [ ] Check service/gallery edits and image replacement in demo admin; clearly retain the warning that it is public, local-only and not secure.
- [ ] Replace placeholder contact details, service prices, durations and concept imagery only with owner-approved real content.
- [ ] Run install, lint, test and production build in the project environment before calling the demo launch-ready.

## Scope and safety
- The current admin and inquiry storage are a local frontend demo, not shared production infrastructure.
- No real appointment is booked automatically. Email handoff only opens a draft for the visitor to review and send.
- Do not invent contact details, prices, business reviews or real-customer transformation claims.
