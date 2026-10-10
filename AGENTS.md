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
- Keep the NOIR PINK prototype frontend-only with a shared validated local demo provider; the requested prototype must not imply shared storage, security or external delivery.
- Public content sections use separate TanStack leaf routes and shared site chrome; each section needs independently shareable metadata.
- Keep brand styles in global semantic tokens and reuse design-system controls; editable appearance must propagate consistently.
- Use generated editorial photos and lightweight CSS/pointer depth rather than a 3D renderer; campaign realism and mobile performance take priority without a supplied model.
