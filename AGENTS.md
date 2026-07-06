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

## Before pushing

CI runs Prettier in strict `--check` mode, so any unformatted line fails the
build. Run these locally before committing/pushing — all must pass:

```bash
npm run format         # auto-fix formatting (or format:check to only verify)
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
```
