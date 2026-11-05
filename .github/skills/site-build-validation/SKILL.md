---
name: site-build-validation
description: "Run targeted checks and validate moelholm.github.io site builds and pull-request previews. Use when: testing or building the Jekyll site, investigating a failed preview, or verifying a pushed site change."
argument-hint: "Specify the changed area or pull request to validate"
---

# Site Build and PR Validation

Use this skill when validating changes to the site or its pull-request preview.

## Validation workflow

1. Inspect the changed files and choose the smallest relevant checks first (for example, `node --check` for JavaScript and `git diff --check` for whitespace).
2. The canonical PR build is defined in `.github/workflows/pr-preview.yml`. It uses Ruby 3.1 and runs:
   ```bash
   cd site
   bundle install
   bundle exec jekyll build --drafts --future
   ```
   The workflow then deploys a Netlify preview and updates the PR comment with its URL.
3. If a local Ruby version is incompatible with the locked gems, do not change `Gemfile.lock` just to make local validation pass. Prefer the PR action when the change is pushed. If immediate local build validation is useful, use an ephemeral Ruby 3.1 container, check `docker info` first, and mount the repository without changing dependency manifests.
4. When a user has asked to publish changes to an existing PR, push the requested branch update and wait for its PR preview check. Use `gh pr checks <number> --watch`; if no checks are reported yet, inspect `gh run list --branch <branch>` and retry after the workflow appears.
5. Report build or deployment success only after the relevant command or PR check has completed successfully. If a check fails or remains pending, state that plainly and include the failing or pending check.

## Git operations

For routine autonomous cloud tasks (such as blog-post additions) and explicitly requested PR creation or updates, commit and push the requested work to the task branch unless the user says otherwise. During interactive feature development with the user, leave commits and pushes under their control unless explicitly asked. Use a focused commit and preserve the repository's required commit trailers.
