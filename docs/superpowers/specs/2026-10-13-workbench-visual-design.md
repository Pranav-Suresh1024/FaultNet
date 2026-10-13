# Workbench visual redesign

The user explicitly requested Figma/design-taste-frontend concept first, then frontend-only implementation. This supersedes the prior appearance-rollback planning pause for the experiment workbench only. Stay on task/faultnet-mvp; do not alter the live cockpit or teammate lab branch.

## Design and source

[Editable Figma concept](https://www.figma.com/design/ssgBMbLH8CUmZGmzGNE9nE?node-id=4-264), desktop frame 4:264 and mobile frame 4:442. Uses native editable text, auto-layout, color variables and Simple Design System button/input/select instances. Its reference metrics are from prior local delay record 03593550…; production must render its current selected record rather than hardcode these values.

Requested design-taste-frontend direction: product-performs, seed 1835574394, green-black/bone palette. Adapt the website-oriented skill to an operational dashboard: prioritize actual interactive evidence, omit marketing hero/photographs, large scroll transitions and site-only inspector rules. Concept: the baseline/fault/recovery measurement sequence organizes the workbench. Keep the runtime's system UI font stack (Figma uses Inter as its system-sans reference); no external fonts/assets/dependencies or CSP changes.

## Implementation decisions

- Root palette: ink #172923, ground #f1f3ed, surface white, muted #59695f, pine #176b56, lime #d7eda8. Dark median-chart stage uses light text, coral faulty bar and lime recovery; other charts/tables stay on light surfaces with existing measured SVG/labels.
- Keep dark sidebar, white/ground topbar, larger workbench title, genuine status/state, first availability card ink/lime, remaining metric cards white. Add a static labelled comparison-workflow rail; explicitly explain baseline-only skips fault/recovery. It is instructional, not fabricated live progress.
- Preserve every existing DOM ID, control label, range/required/disabled state, option value, event handler, API call, export filename and stored-measurement derivation. Group chart heading/run information/median chart/recovery in a dark stage. Keep the phase table, exports, advanced charts/probes, settings/reuse, history/comparison and error states available.
- Desktop: 216px navigation, up to 1600px workspace, 32px content padding, evidence plus 352px settings column. Below 1100px, controls precede evidence; below 760px, navigation reflows, metrics become two columns and controls stack. Below 440px workflow rail stacks; charts/tables retain labelled keyboard-scroll regions and avoid document overflow.
- Visible keyboard focus and labelled skip link; 44px controls/buttons, readable contrast, numeric tabular figures, motion only brief button feedback with reduced-motion override. No decorative imagery, false graphs, new controls or backend behavior.

## Acceptance

Frontend structural integrity, all existing tests, empty/populated/error/stopped/running controls, saved-run/preset/phase/compare/export behavior, focus/reflow at 1440/768/390px and narrow chart scrolling. Check src/, manifests and live assets match pre-change commit. Inspect rendered screenshots when allowed; disclose browser blocks rather than infer visual success from tests. Update shared design/context, commit/push and verify remote SHA/CI.
