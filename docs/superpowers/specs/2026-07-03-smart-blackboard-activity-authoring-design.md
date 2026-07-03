# Smart Blackboard Activity Authoring Design

Date: 2026-07-03

## Summary

Build a phase-one smart blackboard page for classroom activity authoring. The page creates a stable on-site demo flow: a teacher enters source text, optionally removes filler words, clicks one-click parse, reviews the generated activity structure, edits the result, and sees the activity in a blackboard-style preview.

This scope implements option A from the approved design discussion: frontend demo closure with deterministic local parsing. It does not connect to real speech recognition, video editing, or backend persistence.

## Goals

- Replace the current `/blackboard` placeholder route with a usable smart blackboard authoring page.
- Support the three required activity types: 选词填空, 判断对错, and 趣味选择.
- Provide a one-click text parsing flow that fills question stem, options, and correct answer.
- Keep the generated structure fully editable after parsing.
- Show a classroom-ready blackboard preview.
- Show video transcription and video segment deletion as visible but disabled phase-one capabilities.
- Follow `docs/superpowers/specs/2026-07-03-smart-education-ui-guidelines.md` and existing Element Plus management-page patterns.

## Non-Goals

- No real video upload, media decoding, speech-to-text, or timeline editing.
- No automatic deletion of video clips when transcript text is removed.
- No AI API call or remote parsing service.
- No database persistence for activities in this slice.
- No teacher/student runtime delivery flow; the preview is local to the authoring page.

## User Flow

1. Teacher opens `/blackboard`.
2. Text input tab is active by default.
3. Teacher enters classroom source text.
4. Teacher chooses whether to enable 删除语气词.
5. Teacher selects an activity type or keeps the recommended type inferred by parsing.
6. Teacher clicks 一键解析.
7. The parser generates a structured activity with stem, options, correct answer, and parsing notes.
8. Teacher edits the generated stem, options, and correct answer.
9. The preview updates immediately on the blackboard surface.
10. Teacher can switch to 视频转写 tab to show the future transcription placeholder, transcript preview field, 删除语气词 toggle, and disabled 视频片段同步删除 capability.

## Page Architecture

Create a new frontend feature folder:

- `apps/web/src/features/smart-blackboard/blackboardActivity.ts`
- `apps/web/src/features/smart-blackboard/blackboardActivity.test.ts`
- `apps/web/src/features/smart-blackboard/SmartBlackboardView.vue`
- `apps/web/src/features/smart-blackboard/SmartBlackboardView.test.ts`

Update `apps/web/src/router.ts` so `/blackboard` imports `SmartBlackboardView.vue`.

The feature stays frontend-only. Its parser helpers are pure TypeScript functions so they can be tested without mounting Vue. The Vue page owns local editable state and uses Element Plus controls.

## Layout

The page uses a compact three-column desktop layout:

- Left column: source input workspace.
- Center column: structured activity editor.
- Right column: blackboard preview.

At 1366 x 768, the layout must remain readable without horizontal body overflow. On narrower screens, the columns may stack vertically.

### Left Source Panel

Controls:

- `ElTabs` with 文本输入 and 视频转写.
- `ElInput type="textarea"` for source text.
- `ElSwitch` for 删除语气词.
- Primary `ElButton` with icon for 一键解析.
- `ElTag` or disabled status row for 视频片段同步删除：暂未启用.

The video tab shows a stable placeholder:

- A disabled upload-like area or `ElEmpty` explaining that video转写 is in demo placeholder state.
- A transcript textarea seeded with demo transcript text.
- The same 删除语气词 switch.
- Disabled visual state for segment deletion.

### Center Activity Editor

Controls:

- `ElTabs` or segmented radio for activity type: 选词填空, 判断对错, 趣味选择.
- `ElInput type="textarea"` for 题干.
- Option rows using Element Plus inputs, radio markers, and add/remove buttons where appropriate.
- Correct-answer selector:
  - 选词填空: select one option as the answer.
  - 判断对错: select 正确 or 错误.
  - 趣味选择: select one option as the answer.
- Parse notes as compact tags or alert text, not a long tutorial.

All fields remain editable after parsing. Changes update preview immediately.

### Right Blackboard Preview

The preview is a dark blackboard surface, not a decorative illustration.

It shows:

- Activity type tag.
- Question stem.
- Large answer chips.
- Correct answer marker.
- A small footer line with lesson name and demo status.

The preview must handle empty state gracefully by showing a short prompt to parse or edit an activity.

## Data Model

```ts
export type BlackboardActivityType = 'cloze' | 'judgement' | 'choice'

export type BlackboardOption = {
  id: string
  label: string
  text: string
}

export type BlackboardActivityDraft = {
  type: BlackboardActivityType
  sourceText: string
  cleanedText: string
  removeFillers: boolean
  stem: string
  options: BlackboardOption[]
  correctOptionId: string
  judgementAnswer: boolean
  parseNotes: string[]
}
```

Display labels:

- `cloze`: 选词填空
- `judgement`: 判断对错
- `choice`: 趣味选择

## Parser Design

Parser entry point:

```ts
export function parseBlackboardActivity(input: {
  sourceText: string
  requestedType: BlackboardActivityType
  removeFillers: boolean
}): BlackboardActivityDraft
```

Helper responsibilities:

- `normalizeSourceText`: trims whitespace and collapses repeated spaces.
- `removeFillerWords`: removes deterministic filler words such as 嗯, 啊, 呃, 这个, 那个, 然后, 就是, 对吧.
- `extractExplicitAnswer`: detects `答案：`, `正确答案：`, or `参考答案：`.
- `extractLetteredOptions`: detects `A.`, `A、`, `A:`, `B.`, `C.`, and `D.` style options.
- `buildFallbackOptions`: creates stable options when explicit options are missing.

Parsing rules:

- 选词填空:
  - Prefer source text containing blank markers such as `____`, `（）`, `( )`, or `填空`.
  - If explicit options are present, keep them.
  - If no blank marker exists, generate a stem by replacing the explicit answer with `____`.
  - If no explicit answer exists, use the first extracted option as correct answer.

- 判断对错:
  - Use the full statement as the stem.
  - Detect false intent when text includes `错误`, `不正确`, `错`, or `不是`.
  - Detect true intent when text includes `正确`, `对`, `是`, or `判断正确`.
  - Default to true when no signal exists and add a parse note.
  - Options are always 正确 and 错误.

- 趣味选择:
  - Prefer lettered options from the source.
  - If explicit answer matches an option label or option text, mark it correct.
  - If no options exist, generate three demo-safe options from keywords in the source.
  - Default to the first option when no answer signal exists and add a parse note.

The parser must always return an editable draft. It must not throw for empty or ambiguous input; instead it returns an empty/fallback draft with parse notes.

## Validation and Error Handling

The page shows inline validation for:

- Source text is empty when clicking 一键解析.
- Activity stem is empty after editing.
- Choice/cloze activities have fewer than two options.
- Correct answer is missing.

Validation must not block editing. It only disables the presentational "完成制作" demo action if such an action is displayed.

Parsing failures use fallback structure and visible notes, not blocking modals.

## UI and Component Constraints

- Use Element Plus for tabs, buttons, textarea inputs, switches, tags, alerts, empty state, option controls, and form rows.
- Use `@element-plus/icons-vue` for action icons.
- Keep all page CSS scoped to the new Vue file.
- Do not introduce a new CSS framework or decorative background assets.
- Do not create nested cards.
- Do not use a marketing hero section.
- Use the shared shell and existing navigation.

## Testing Strategy

Parser unit tests must cover:

- Filler removal.
- Lettered option extraction.
- Explicit answer matching.
- Cloze stem generation.
- Judgement true/false detection.
- Fallback output for ambiguous input.

Vue component tests must cover:

- The `/blackboard` page renders smart blackboard copy instead of overview copy.
- Clicking 一键解析 populates the editor and preview.
- Switching activity type updates the editor controls.
- Editing the question stem updates the preview.
- Empty source parsing shows an inline validation message.
- The video tab displays 视频片段同步删除：暂未启用.

Router tests must confirm `/blackboard` no longer resolves to the overview placeholder.

Manual browser verification must cover:

- 1366 x 768 desktop view.
- No body or root horizontal overflow.
- Text input parse flow.
- Video placeholder tab.
- Blackboard preview readability.

## Acceptance Criteria

- `/blackboard` opens a dedicated smart blackboard authoring page.
- The page supports 文本输入 and 视频转写 tabs.
- 删除语气词 affects parsed source text deterministically.
- 一键解析 fills editable activity fields for 选词填空, 判断对错, and 趣味选择.
- The preview updates when generated fields are edited.
- The video tab visibly marks 视频片段同步删除：暂未启用.
- The page uses Element Plus controls and follows the smart education UI guidelines.
- `npm run test`, `npm run lint`, and `npm run build` pass.
