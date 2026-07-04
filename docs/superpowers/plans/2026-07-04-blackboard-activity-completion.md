# Blackboard Activity Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a demonstrable completion loop for smart blackboard classroom activities: parse text, edit activity, complete production, and show a saved activity record that can be reopened.

**Architecture:** Keep the first pass frontend-only to avoid expanding backend scope before the demo. Add pure helpers in `blackboardActivity.ts` for cloning and completing drafts, then wire `SmartBlackboardView.vue` to maintain an in-memory completed activity list and update the Playwright rehearsal gate.

**Tech Stack:** Vue 3, Element Plus, Vitest, Playwright, TypeScript.

---

### Task 1: Completion Helper

**Files:**
- Modify: `apps/web/src/features/smart-blackboard/blackboardActivity.ts`
- Modify: `apps/web/src/features/smart-blackboard/blackboardActivity.test.ts`

- [x] Add tests for creating a completed activity record from a valid draft, including a cloned draft, readable title, correct answer text, source label, status, and validation rejection for invalid drafts.
- [x] Implement `cloneBlackboardActivityDraft`, `createCompletedBlackboardActivity`, and `buildBlackboardActivityTitle`.
- [x] Run `npm --workspace apps/web run test -- blackboardActivity`.

### Task 2: Completion UI

**Files:**
- Modify: `apps/web/src/features/smart-blackboard/SmartBlackboardView.vue`
- Modify: `apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts`

- [x] Add a failing view test: clicking `blackboard-complete-button` saves the current activity, shows a success message area, renders an activity record table/list, and can reopen the saved activity.
- [x] Implement state, completion handler, record list, and reopen action using Element Plus components.
- [x] Run `npm --workspace apps/web run test -- SmartBlackboardView blackboardActivity`.

### Task 3: Rehearsal Gate

**Files:**
- Modify: `apps/web/e2e/demo-rehearsal.spec.ts`

- [x] Extend the blackboard route gate to click completion and assert a saved activity record.
- [x] Run `npm run demo:rehearsal`.

### Task 4: Final Verification

- [x] Run `npm run lint`.
- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [x] Run `npm run demo:rehearsal`.
- [x] Request code review and fix any important issues.
- [ ] Commit with `feat: add blackboard activity completion loop`.
