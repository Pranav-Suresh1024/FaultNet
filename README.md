# FaultNet

This repository is the starting point for FaultNet development.

## Cloud development

The checkout is at `/workspace/FaultNet`. Git, Python 3.12, Node.js 24,
and npm are available in the cloud environment.

Work in the existing checkout; each cloud task already has an isolated
environment, so an additional Git worktree is unnecessary.

There are currently no application dependencies, services, builds, or tests.
Add the appropriate manifests, lockfiles, setup commands, and tests when the
application stack is chosen. Keep dependency lockfiles under version control.

## Saving work

Review changes before committing and pushing:

```sh
cd /workspace/FaultNet
git status --short
git diff
git add <files>
git commit -m "Describe the change"
git push origin main
```

Keep credentials, local environment files, and generated outputs out of Git.
