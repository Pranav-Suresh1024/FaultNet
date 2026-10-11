# FaultNet handoff

Updated: 12 October 2026 (Asia/Kolkata).

## Current state
- Documentation baseline only. No application code, package manifest, dependency lockfile, startup command, or application tests exist.
- The original eight Markdown files have been read. The seven companion specification documents remain unchanged.
- Repository: https://github.com/Pranav-Suresh1024/FaultNet
- Working branch for this setup: `main`.
- The existing remote initialization commit is preserved. Root agent instructions, synchronization guidance, and this handoff accompany the architecture pack.
- This laptop's working folder has been connected to the remote. For transfer completion, verify the latest GitHub branch SHA; the final chat report records the pushed commit.
- Three laptops are involved. Two use the owner's GitHub account; the third uses the friend's GitHub account. Codex accounts may differ.
- Sequential writing is the default. Laptop identities and the friend's GitHub login/access are not yet recorded. At the next session, establish which laptop has writing ownership before making changes.

## User authorization and stable decisions
- Read the local Markdown pack and prepare shared code/context synchronization with appropriate GitHub pushes.
- AI agents perform all application and test coding. The user need not write code or run routine Git commands; agents handle those commands where tools/access permit.
- Approved project scope: Windows-first local network-resilience lab; Node.js backend, plain HTML/CSS/JavaScript frontend, local JSON storage.
- MVP: local dashboard and demo server; baseline, delay, bandwidth restriction, connection interruption, recovery comparison, and JSON/CSV export.
- Controls stay on loopback and faults affect the fixed demo target only. Dashboard/control traffic must remain usable.
- Packet Tracer simulation, Wireshark observations, and real application measurements are separate evidence sources.
- No public deployment, arbitrary targets, production traffic, or real IP packet-loss injection in the MVP. Failed HTTP requests are not evidence of IP packet loss.
- Existing document approval does not authorize application implementation or silently approve proposed contracts.

## Blockers and open decisions
- Application implementation request; measurement definitions/protocol, probe settings, numeric safety limits, and recovery criteria.
- API contracts, JSON schema, ports, Node.js requirement, packages, and visual details.
- Required Packet Tracer scenarios, Wireshark availability/permissions, grading rubric, and exact deadline confirmation.
- PRD's working deadline is 13 October 2026, 11:59 p.m. IST; this remains an unconfirmed interpretation.
- The friend's GitHub account needs write access for direct branch pushes, or a fork-and-PR workflow. Do not share the owner's credentials.
- Other laptop environments and repository access have not been verified.

## Environment and validation evidence
- This Windows laptop: Git 2.54.0.windows.1; Node.js v22.23.1 observed. This is not an approved project runtime requirement.
- Git fetch succeeded against the existing `main` branch. GitHub reports this repository is public.
- Original README described a cloud checkout `/workspace/FaultNet` with Python 3.12 and Node.js 24. Those are historical remote notes, not verified on this laptop or the other two.
- Application checks: Not run; no application or test configuration exists.
- Documentation checks passed: a PowerShell local-link audit of all 11 Markdown files; `git check-ignore -q` checks for six sensitive/generated paths and eight eligible source/context paths; `git diff --check` for whitespace errors.
- Push confirmation belongs in the setup commit's final report; future agents must verify the current remote SHA rather than assume it from this file.

## Next action
1. On another laptop, clone the repository into its own local folder, open that Git root in Codex, and use the resume prompt in README.md.
2. Authenticate using that laptop's own GitHub identity and verify remote access. The owner must grant the friend's account access if it lacks permission; no collaborator invitation has been sent.
3. Confirm the previous writer pushed the expected branch/commit and stopped editing, then establish the new active writer.
4. Before application coding, obtain the implementation request and resolve the affected decisions from the architecture pack.

## Local-only evidence
- None generated in this session.
- Future generated results/captures are excluded from Git by default. If evidence must travel, explicitly review and approve a sanitized version or a separate transfer; record its location and provenance here. GitHub code sync does not back up ignored evidence.

## Future handoff updates
Replace stale state instead of appending a chat transcript. Record what changed, why, relevant files, exact check commands/outcomes, user decisions and their basis, unfinished work, and the next concrete action. Keep failed, skipped, and not-run checks distinct. Never store tokens, private conversations, or credentials here.
