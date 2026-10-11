# Design System

## Design direction
- Approved: Simple lab dashboard for FaultNet.
- Proposed qualities: Clear, restrained, and evidence-focused.
- Primary environment: Web browser on Windows.
- Design references: None approved. The reference repository is not an approved visual design.
- Mobile support and supported browser versions: Unresolved.

## UI tokens
No specific visual values are approved.

| Token | Value | Usage |
| --- | --- | --- |
| color.background | Unresolved | Main canvas |
| color.text | Unresolved | Primary copy |
| color.primary | Unresolved | Main actions |
| color.error | Unresolved | Errors with text labels |
| font.body | Unresolved | Body copy |
| space.unit | Unresolved | Spacing scale |
| radius.control | Unresolved | Inputs and buttons |

## Layout rules
- Proposed layout: Scenario controls, experiment status, phase comparison, and result/export panels.
- Container widths, gutters, spacing scale, and breakpoints: Unresolved.
- Proposed behavior: Reflow panels without hiding controls or measurements.
- Narrow-screen behavior: Unresolved.
- Always distinguish baseline, faulty, and recovery phases using text labels.

## Components
- Primary action: Start an experiment.
  - Proposed states: Default, hover, visible keyboard focus, disabled, loading, success, and error.
  - Explain why an action is disabled.
- Stop/restore action:
  - Remain available during an active experiment.
  - Distinguish stopping probes from confirmation that faults were cleared.
- Scenario fields:
  - Visible labels, units, helper text, and adjacent validation errors.
  - Numeric ranges remain unresolved.
- Status panel:
  - Identify running, stopping, completed, stopped, failed, or interrupted experiments.
- Comparison panel:
  - Label units, phase, sample counts, unavailable measurements, and incomplete results.
- Export action:
  - Indicate preparation, success, and failure.
- Dialogs and navigation:
  - Exact anatomy unresolved; avoid adding unnecessary screens.

## Accessibility
Proposed requirements:
- All controls are keyboard operable and have visible focus.
- Use semantic HTML, associated labels, and text explanations.
- Do not communicate outcomes using color alone.
- Announce important status changes without continuously interrupting users.
- Respect reduced-motion preferences.
- Check contrast against WCAG AA criteria; no compliance is claimed before verification.

## Screen states
- Empty: Explain that no experiments exist and show the next action. [PRD F-01/F-05](PRD.md#feature-specifications).
- Loading: Identify the pending operation and prevent duplicate submission. F-07.
- Running: Show active phase and stop/restore control. F-02/F-03.
- Stopped: Identify cancellation, available evidence, and fault-clearance status. F-03/F-07.
- Error: Explain the failed operation and a safe recovery action. F-07.
- Populated: Show labeled results and export actions. F-04/F-05.
- Incomplete: Preserve available evidence and identify missing measurements. F-03/F-04.
- Denied request: Explain that the operation was rejected without exposing internal data. F-07.

## Approval
- Design owner: Project owner/user.
- Approved direction: Simple lab dashboard.
- Source of truth: This approved document pack.
- Detailed layout, tokens, and accessibility requirements above remain proposals or unresolved; document approval does not silently approve those choices.
