# FaultNet

FaultNet is a Windows-first local network-resilience lab using Node.js, plain HTML/CSS/JavaScript, and local JSON records. The first application checkpoint is on `task/faultnet-mvp`; `main` still contains the preceding documentation baseline until reviewed integration.

## Run the application

Use the reference Node.js **22.23.1** recorded in `.node-version`. No external packages or build step are required. From the Git root on the application branch:

```powershell
npm start
```

Open [FaultNet](http://127.0.0.1:3000). Keep the numeric host: `localhost` is rejected by the control boundary. Ports 3000/3001/3002 must be free; the app reports conflicts rather than terminating other programs. Stop with Ctrl+C.

Choose a baseline or baseline/fault/recovery run. Delay, bandwidth restriction, and connection interruption affect only the synthetic 64 KiB demo. View phase summaries, saved compatible runs, and JSON/CSV downloads. Low bandwidth can intentionally exceed the timeout. Measurements are HTTP outcomes/elapsed time, not IP packet loss or RTT.

```powershell
npm test
```

Tests use temporary storage and ephemeral ports. Runtime results go to ignored `results/`; code pushes do not transfer those records or captures. Phase-boundary saving can lose latest observations on a hard crash; failed saves are shown explicitly. Reviewed static/RIPv2/OSPF Packet Tracer projects and live observations are now in [labs/packet-tracer](labs/packet-tracer/README.md) on task/packet-tracer-labs. Wireshark evidence and other-laptop validation remain pending.

The [Windows CI workflow](.github/workflows/checks.yml) runs the same tests on branch pushes and pull requests. The application checkpoint passed from a fresh GitHub checkout; check the current branch's result before integration.

## Packet Tracer and review

- [Three Packet Tracer projects and repeatable procedure](labs/packet-tracer/README.md).
- [Observed baseline, outage, and recovery results](labs/packet-tracer/LIVE-VERIFICATION.md).
- [Codebase review and proposed app improvements](docs/codebase-review.md).

The lab branch is based on task/faultnet-mvp and contains the application checkpoint plus the lab additions. No main merge is implied.

## Shared context

- [AGENTS.md](AGENTS.md): rules every coding agent must follow.
- [HANDOFF.md](HANDOFF.md): current progress, approvals, blockers, validation, and next action.
- [roadmap.md](roadmap.md): full-project task board, dependencies, proposed laptop ownership, quality gates, and task handoff template.
- [Implementation contracts](docs/implementation-contracts.md): approved application choices; separate lab proposals remain open.
- [Implementation ledger](docs/implementation-progress.md): verification and independent review evidence for the current task branch.
- [Architecture pack](FaultNet-Architecture-Pack/AGENTS.md): project guide and seven companion specifications. Approved decisions, proposals, and unresolved details retain their labels.

All application and test coding is performed by AI agents. The user provides requirements, decisions, and account access. Agents handle routine Git work.

The committed files carry project context between accounts. Chat history, personal memories, installed plugins, and account settings are not part of this transfer. Codex reads repository `AGENTS.md` instructions before working: [official documentation](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## Three-laptop workflow

Use a separate Git clone on each laptop and GitHub as the transfer point. Two laptops use the owner's GitHub account; the third uses a friend's account. Each authenticates separately. The friend needs collaborator write access, granted by the owner in repository settings, to push branches directly. Otherwise use a fork and pull request. Codex account identity is separate from GitHub access.

Use one active writer at a time: finish, update the handoff, commit, push, verify, then switch laptops. The next agent pulls the same branch and reads the handoff before editing. If working concurrently is explicitly requested, give each laptop a separate task branch and file ownership, then review and integrate through pull requests. Separate branches do not automatically prevent conflicts in shared files.

For the first checkout on another laptop, ask its agent to run this in a chosen local parent folder:

```powershell
git clone https://github.com/Pranav-Suresh1024/FaultNet.git
cd FaultNet
git fetch origin
git switch --track origin/task/faultnet-mvp
```

Open the resulting `FaultNet` folder as the Codex project root. A different local path is fine. Prefer a folder outside OneDrive or other live file-sync services for new clones. This existing checkout remains in place; no personal files were moved. Do not share or file-sync `.git` or Codex credential/session folders.

Give the new agent this prompt:

> Continue FaultNet from this repository. Read AGENTS.md, HANDOFF.md, roadmap.md, docs/implementation-contracts.md, and the architecture pack. Inspect the current branch, local changes, recent commits, and origin. Fetch and pull with --ff-only if safe. Confirm the previous writer's pushed branch/commit and that this laptop now owns writing before editing. Summarize approved decisions, proposals awaiting review, blockers, and the next task. All code is written by agents. Respect the current implementation pause/resume state and task ownership; update the handoff and commit/push at meaningful milestones and before laptop switches.

## Agent synchronization procedure

At session start, inspect before changing anything:

```powershell
git status --short --branch
git remote -v
git branch --show-current
git log -5 --oneline
git fetch origin
```

Confirm `origin` is the intended repository. On a clean branch with an upstream, run `git pull --ff-only`. Do not pull over unexplained local edits or assume `main` if the previous handoff used a task branch. Preserve local work if the histories diverge; inspect and integrate on a task branch, without force-pushing or discarding either history. Do not switch laptops while a push remains pending.

Before transfer, run the checks configured for the actual change, update HANDOFF.md, and review:

```powershell
git diff --check
git diff
git status --short
```

Stage explicitly reviewed paths, commit with a descriptive message, and push the authorized current branch. For a new task branch, use `git push -u origin BRANCH_NAME` with its actual name. Record incomplete work and failing checks explicitly; checkpoint unfinished application work on a task branch.

After pushing, verify:

```powershell
git rev-parse HEAD
git ls-remote origin refs/heads/BRANCH_NAME
git status --short --branch
```

Replace `BRANCH_NAME` with the actual branch. The local and remote SHA must match, and intended edits must be committed. Report the branch and full SHA to the user; do not write a commit's own SHA into a file inside that commit.

The repository is currently public. Commit only reviewed source, documentation, lockfiles, and safe fixtures. `.gitignore` excludes secrets, Codex data, generated results, and raw captures; it cannot remove a secret already committed. Ignored evidence requires a separate deliberate backup/transfer if needed.

## Cloud development

The original initialization notes described `/workspace/FaultNet` with Git, Python 3.12, Node.js 24, and npm. Recheck the current cloud environment before relying on those versions; local laptop paths and versions differ.

Work in the existing checkout; each cloud task already has an isolated
environment, so an additional Git worktree is unnecessary.

The application branch has package manifests, built-in Node tests, and three local services. There are zero external packages and no build step. Keep the lockfile under version control. Cloud/Node 24 compatibility remains unverified; use the reference runtime and run the actual tests.

## Saving work

Use the synchronization procedure above. This is the original shell example for an existing cloud checkout; verify its path and current branch first:

```sh
cd /workspace/FaultNet
git status --short
git diff
git add <files>
git commit -m "Describe the change"
git push origin main
```

Keep credentials, local environment files, and generated outputs out of Git.
