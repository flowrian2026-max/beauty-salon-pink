<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep the NOIR PINK prototype frontend-only with a shared validated local demo provider, except the AI advisor server function (keeps the AI key server-side); the requested prototype must not imply shared storage, security or external delivery.
- Public content sections use separate TanStack leaf routes and shared site chrome; each section needs independently shareable metadata.
- Keep brand styles in global semantic tokens and reuse design-system controls; editable appearance must propagate consistently.
- Use generated editorial photos and lightweight CSS/pointer depth rather than a 3D renderer; campaign realism and mobile performance take priority without a supplied model.
- Use a nail-only masked image edit for default comparison imagery and migrate only the legacy default pair; this keeps the scene aligned without overwriting user replacements.
- Use pointer capture for comparison dragging and retain a native range for keyboard input; mouse, touch and assistive controls share one split value.
- Use a validated central contact configuration for email-draft inquiry handoffs; opening a draft must never be reported as external delivery, and missing configuration keeps the explicitly local demo available.
- Migrate only known legacy sample prices and durations to inquiry-based empty values; preserve business-supplied local edits.
