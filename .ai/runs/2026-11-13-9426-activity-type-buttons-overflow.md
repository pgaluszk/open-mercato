# Keep the deal activity composer's type buttons from overlapping at phone width

Goal: fix #9426. In Polish at 390 px, the five activity-type buttons in the deal activity composer are narrower than their icon and label, so their content overlaps the neighbouring buttons. The problem was found in the QA run on #7690 and is pre-existing.
Scope: `packages/core/src/modules/customers/components/detail/ActivityTypeSelector.tsx` layout classes only, plus one Playwright regression spec. No API, schema, i18n or contract change. #7690 is not touched.

Non-goals: other deal page rows, other composer controls, calendar/date localisation, migrating the selector to `SegmentedControl`.

## Implementation Plan

1. Replace the fixed `grid-cols-5` with a wrapping flex row. Each button keeps at least its content width (`min-w-fit`) and shares free space equally (`flex-1`), so desktop stays one row and narrow screens wrap.
2. Add `TC-CRM-9426` (Playwright, 390×844, Polish). It creates its fixtures through the API, asserts that each button has `scrollWidth <= clientWidth` and that no two buttons overlap, and cleans up in `finally`.
3. Run the DS review, the scoped validation (typecheck, lint, unit tests for core) and the new spec in a managed ephemeral environment. Then open the PR and run the review pass.

## Risks

Low risk. The layout is local to one component. On the last wrapped line, buttons grow to fill the row, so they can be wider than buttons on the first line. This is an intentional trade-off for readable labels.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Fix and regression test

- [ ] 1.1 Let the activity-type row wrap with content-width buttons
- [ ] 1.2 Add TC-CRM-9426 Playwright regression

### Phase 2: Verification and publication

- [ ] 2.1 DS review, scoped validation and integration run
- [ ] 2.2 Open PR, labels, review pass
