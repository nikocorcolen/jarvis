# Session resume notes — spec-lifecycle, Bloque A

## Status snapshot

Bloque A is **fully green**. T-001 through T-007 are implemented; the
two-test failure documented below was tracked to its root cause and fixed
on 2026-05-11. T-008 (`spec status [--json]`) is the next task.

```
Tests: 51 pass / 0 fail / 0 skipped
Build: clean
CLI:   init, spec new, spec approve all work end-to-end
```

## Bug — RESOLVED 2026-05-11

**Root cause (one paragraph for the historical record):**
Two compounding issues inside `core/frontmatter.ts`, both rooted in
`gray-matter` defaults. First, `gray-matter` caches `matter()` results
keyed by the input string. When two tests created specs with identical
parameters (same name, same fixed `today()` date), the on-disk file
contents were byte-identical strings, so the second test's
`parseFrontMatter` call returned the SAME cached `data` object the first
test had mutated to `status: 'approved'`. This produced the "approved
state leaking into a fresh spec" symptom even though the `mkdtemp`
directories were unique — the leakage was in-memory, not on disk.
Second, `gray-matter` runs YAML through js-yaml's `DEFAULT_SCHEMA`,
which decodes ISO-date strings into JS `Date` objects and re-serialises
them as full ISO timestamps on round-trip, breaking the byte-for-byte
preservation test (and silently corrupting any `--json` output of
NFR-003). The fix configures `matter()` with `cache: false` and a custom
YAML engine using `JSON_SCHEMA` (disables the timestamp resolver while
keeping booleans/ints/nulls). Both flags are required: `cache: false`
alone fixes the leakage but leaves the date artifact; `JSON_SCHEMA`
alone fixes dates but leaves the cache poisoning.

**Files touched in the fix:**
- `src/core/frontmatter.ts` — added `js-yaml` import, `YAML_ENGINE`,
  `MATTER_OPTIONS` with `cache: false`; threaded `MATTER_OPTIONS` into
  both `matter(...)` and `matter.stringify(...)` calls. Public contract
  (signatures of `parseFrontMatter`/`stringifyFrontMatter`) unchanged.
- `package.json` — promoted `js-yaml@^3.13.1` from transitive (under
  gray-matter) to explicit dep; added `@types/js-yaml@^3.12.0` devDep.

**Hypotheses that turned out to be wrong** (kept for posterity so future
debugging doesn't retread):
- "We're accidentally writing back to `templates/` instead of the spec
  directory." — Disproved: post-test inspection showed
  `templates/spec/*.md` byte-intact, original mtimes, placeholders still
  present.
- "`findTemplatesDir()` resolves to different paths from `dist/` vs
  `dist-tests/`." — Disproved: both contexts resolve to the same
  `jarvis-cli/templates` absolute path.
- "`/tmp` symlinks behave oddly." — Irrelevant; templates aren't in
  `/tmp` and the issue reproduced with `--test-concurrency=1`.
- "`parseFrontMatter` returns a shared mutable object directly." — Half
  right: it does, but the *sharing* mechanism is gray-matter's cache,
  not anything in our own code.

## Historical notes (pre-fix)

The original symptom report and the hypotheses listed in the next two
sections are what the previous session left behind. Kept for context.

## What was implemented

### T-001 — `isValidSpecName` (FR-002)
File: `src/core/spec-store.ts`
Tests: `tests/spec-store-name.test.ts` — **7/7 pass**.

### T-002 — `readSpecState` / `listSpecs`
File: `src/core/spec-store.ts`
Tests: `tests/spec-store-read.test.ts` — **3/4 pass**.
- ✅ returns null for missing spec
- ❌ "reflects exists/status/updated for each phase file present" —
  passes in isolation, fails in the full suite (see Bug below).
- ✅ returns status: null for malformed front-matter without throwing
- ✅ treats unknown status values as null
- ✅ listSpecs (3 cases) all pass

### T-003 — `createSpec`
File: `src/core/spec-store.ts`
Tests: `tests/spec-store-create.test.ts` — **3/4 pass**.
- ❌ "creates the three files with placeholders substituted" —
  fails on the date field assertion. Same root cause as the bug below.
- ✅ rejects invalid name
- ✅ refuses on duplicate
- ✅ does not leave partial spec on FR-002 violation

### T-004 — `approvePhase`
File: `src/core/spec-store.ts`
Tests: `tests/spec-store-approve.test.ts` — **4/6 pass**.
- ✅ approves requirements first time and refreshes updated
- ❌ "returns out-of-order with the missing dependency" — see Bug.
- ✅ returns already-approved on second approval
- ✅ returns spec-not-found
- ✅ returns phase-file-missing
- ❌ "preserves the body byte-for-byte" — see Bug.

### T-005 — Three lifecycle prompts
Files: `src/prompts/{requirements,design,tasks}.ts`
Tests: `tests/lifecycle-prompts.test.ts` — **4/5 pass**.
- ❌ "encodes the product-owner rules" — fails on a regex that does
  not allow whitespace. Already fixed in the test file (changed
  `BEFORE writing` to `\s+BEFORE writing`); should be passing on next run.
- All other assertions pass.

## The bug (to debug next session)

### Symptom
When running the full test file `tests/spec-store-approve.test.ts`,
some tests see **state from previous tests leaking into freshly-created
specs**. Example from debug output:

- Test 1 creates spec in `/tmp/jarvis-approve-Jw2wn2/.jarvis`,
  approves `requirements`. Expected.
- Test 2 creates a fresh spec in `/tmp/jarvis-approve-i7gAb4/.jarvis`
  (a different mkdtemp path). On its very first `approvePhase` call,
  `state.requirements.status` is **already** `'approved'`, not `'draft'`.

The test directories are unique (verified via debug logs that printed
the full path). The templates on disk say `status: draft`. Yet the
parsed state says `approved`.

### What we already ruled out
- ✅ Each test does its own `mkdtemp` → paths confirmed unique in logs.
- ✅ Templates on disk are correct (`status: draft`).
- ✅ `createSpec` logic in isolation produces a correct draft spec
  (verified with a standalone debug script — see Repro below).
- ✅ The bug reproduces with `--test-concurrency=1`, so it is NOT a
  parallel test contention issue.
- ✅ Source `spec-store.ts` is being recompiled correctly into
  `dist-tests/src/core/spec-store.js`.

### Working hypothesis (to test next)
The most consistent explanation: `gray-matter`'s `stringifyFrontMatter`,
when called in `approvePhase` to write back the file, is doing
**something that affects subsequent `loadTemplate` reads** — possibly
mutating the cached template module or triggering a filesystem-level
side effect on the templates directory.

Other candidates worth checking:
1. **`gray-matter` is mutating its input `data` object** between calls.
   Our `parseFrontMatter` returns `result.data` directly; if
   `stringifyFrontMatter` then mutates that same object, it could
   pollute later reads of the same file.
2. **The `loadTemplate` cache** (we don't have one explicitly, but
   Node's ESM loader caches module-level constants like
   `TEMPLATES_DIR`). If somewhere a Date round-trip is rewriting the
   shipped template file by mistake, subsequent `createSpec` calls
   read the corrupted version.
3. **Symlinks or hard-links from `mkdtemp`**: on some Linux configs
   `/tmp` may behave oddly. Worth confirming each `mkdtemp` is a real
   independent inode.

### Repro / debug commands

The debug script that PASSED in isolation (proving `createSpec` +
`approvePhase` work correctly):

```bash
# Save as debug.mjs in the repo root, then run with `node debug.mjs`
import { createSpec, approvePhase, readSpecState } from './dist/core/spec-store.js';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = await mkdtemp(join(tmpdir(), 'debug-'));
const jarvisDir = join(root, '.jarvis');
await mkdir(jarvisDir);
await createSpec({ jarvisDir, name: 'x', today: () => '2026-05-10' });
const initial = await readSpecState(jarvisDir, 'x');
console.log('initial:', JSON.stringify(initial.requirements));
const r = await approvePhase({ jarvisDir, name: 'x', phase: 'design', today: () => '2026-05-11' });
console.log('approve design:', r);  // → out-of-order, correct
await rm(root, { recursive: true, force: true });
```

To reproduce the FAILING case (test suite):

```bash
npm install
npm test 2>&1 | tail -10   # 49 pass, 2 fail
```

To enable a verbose dump in `approvePhase` (the debug logs are gone
from the source; reinstate temporarily):

```typescript
// In approvePhase, just after readSpecState:
if (process.env['JARVIS_DEBUG']) {
  console.error(`[DEBUG] dir=${jarvisDir} phase=${phase} state=${JSON.stringify(state)}`);
}
```

Then: `JARVIS_DEBUG=1 node --test --test-concurrency=1 dist-tests/tests/spec-store-approve.test.js 2>&1 | grep DEBUG`

### Next steps when resuming

1. **Add temporary logging inside `createSpec`** to dump the exact bytes
   written to disk for each phase file. If they say `approved`, the
   bug is in `renderSpecFile`. If they say `draft`, the bug is later.

2. **Inspect the `templates/` directory after a failing run.** If any
   shipped template ends up with `status: approved` on disk, we are
   accidentally writing back to the templates instead of the spec.
   The path resolution in `loadTemplate` (`findTemplatesDir`) is the
   prime suspect: it walks up from `import.meta.url` looking for
   `templates/`. In `dist-tests/src/core/`, walking up could resolve
   to a different `templates/` than expected.

3. **Verify `parseFrontMatter` does not return a shared mutable object.**
   Quick test: parse the same file twice, mutate `data.status` on the
   first parse, parse again, see if the second parse sees the mutation.

4. **Switch the spec-store frontmatter handling away from `gray-matter`'s
   default YAML date coercion.** Pass `{ engines: { yaml: { schema: 'failsafe' } } }`
   so dates stay as strings end-to-end. This may fix the date-related
   assertions (`createSpec` test 1) and rule out one variable.

## Files of interest

- `src/core/spec-store.ts` — main suspect for the lifecycle bug
- `src/core/templates.ts` — `findTemplatesDir` walks up looking for
  `templates/`; possibly resolves to the wrong directory under
  `dist-tests/`
- `src/core/frontmatter.ts` — thin wrapper over `gray-matter`
- `tests/spec-store-approve.test.ts` line 42 (out-of-order test)
- `tests/spec-store-approve.test.ts` line 139 (preserves-body test)
- `tests/spec-store-create.test.ts` line 19 (date-field test)

## What is solid and ready to ship as-is

- All `init` functionality (`bootstrap-init` spec, 100% complete).
- The three lifecycle prompts (`renderRequirementsPrompt`,
  `renderDesignPrompt`, `renderTasksPrompt`).
- `isValidSpecName`, `createSpec`, `approvePhase`, `readSpecState`,
  `listSpecs`.
- `jarvis spec new` (T-006) and `jarvis spec approve` (T-007).
- The `spec-store` API surface and tagged-union design.

## Next up

- T-008: `jarvis spec status [--json]`.
- T-009: end-to-end tests for the three commands.
- T-010: perf test for NFR-001.
- T-011: README update.
