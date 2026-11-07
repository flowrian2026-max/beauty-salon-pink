# NOIR PINK — launch readiness

## Current video update
- [x] Replace the hero with the latest uploaded video, retain slower playback, and verify it renders in Persian on mobile.

## Implemented in the current codebase (needs visual regression check)
- [x] Persian/English language switch with local preference persistence.
- [x] Set document language and text direction to LTR/RTL when language changes.
- [x] Persian translations for core navigation, service copy, booking inquiry flow, gallery, advisor states and local demo admin.
- [x] Vazirmatn is included in the shared font stylesheet alongside the Latin display/body fonts.
- [x] Before/after comparison uses one shared split value and has descriptive labels.
- [x] Spatial hero includes a static campaign-image fallback, reduced-motion handling and a lower-quality rendering path.
- [x] Booking UI distinguishes an inquiry from a confirmed appointment; no real booking is claimed without a configured business contact.
- [x] AI beauty advisor replies in the selected language (English or Persian) and its draft message can be applied to the inquiry form.
- [x] No sideways scrolling on any route; the section hairline that overflowed the viewport is now kept inside the page.

## Remaining launch checks
- [ ] Verify gallery filters and the lightbox (open, close, previous, next, focus) in Persian as well as English.
- [ ] Re-check booking validation, the review/edit step, the email-draft handoff and the local-storage failure message in both languages.
- [ ] Verify the spatial hero on a low-power/mobile device and with reduced motion enabled.
- [ ] Replace placeholder contact details, service prices, durations and concept imagery only with owner-approved real content.
- [ ] Configure a real business contact address so the inquiry can leave the browser; until then everything stays local to the visitor's device.

## Done in this pass (verified)
- [x] Every route visited in English and Persian: home, services, service detail, experience, gallery, booking, contact, about.
- [x] Persian layout checked: right-to-left reading order, Vazirmatn typography, headings/nav/footer/form fields aligned, no clipped or overlapping text.
- [x] Language choice survives refresh and navigation, on desktop and on a phone-sized screen; the mobile menu opens, navigates and closes in Persian.
- [x] Before/after slider keyboard control verified in Persian (labels announce the split in Persian).
- [x] Demo Admin image replacement checked; the public footer no longer links to it and it stays clearly local-only.
- [x] Install/lint/test/build: lint 0 errors (9 fast-refresh warnings in generated UI primitives), 32 tests pass, typecheck clean, production build OK.

## Scope and safety
- The current admin and inquiry storage are a local frontend demo, not shared production infrastructure.
- No real appointment is booked automatically. Email handoff only opens a draft for the visitor to review and send.
- Do not invent contact details, prices, business reviews or real-customer transformation claims.
- The date field keeps the browser's own native format (for example mm/dd/yyyy); only its label is translated.
