/**
 * Renders the optional prompt printed at the end of `friday init`
 * when the repo already has code. Helps the user fill the TODO
 * sections of steering files without having an agent invent answers.
 *
 * Hard rules baked into the prompt:
 *  - product.md: ASK, never infer from code.
 *  - tech.md / structure.md: observe, but ALWAYS present findings
 *    as "intentional or accidental?" — the current code is not
 *    the desired state by default.
 */
export function renderSteeringBootstrapPrompt(args: {
  detectedLanguage: string | null;
  manifests: string[];
}): string {
  const lang = args.detectedLanguage ?? '<unknown>';
  const manifests =
    args.manifests.length > 0 ? args.manifests.join(', ') : '<none>';

  return `You are helping me draft Friday steering files for an existing codebase.

CONTEXT:
- Working directory: the current repo
- Detected language: ${lang}
- Detected manifests: ${manifests}
- Files to fill: .friday/steering/product.md, tech.md, structure.md
  (some sections are pre-filled and tagged "(detected, ...)";
   the rest are marked <!-- TODO -->)

YOUR TASK:
For each section marked <!-- TODO -->, gather the information needed
to fill it. Follow these rules without exception:

RULES:
1. product.md — ASK, NEVER INFER.
   The codebase does not contain the answers to "who is the user",
   "what problem does this solve", or "what are the non-goals".
   Interview me one section at a time. Do not propose product
   answers from inspecting the code.

2. tech.md and structure.md — OBSERVE, THEN ASK "INTENTIONAL OR ACCIDENTAL?"
   You may inspect the code to propose values, but always frame your
   proposal as a question: "I see X in the code — is this intentional
   or accidental?". The current state of the code is not automatically
   the desired state.

3. Pre-filled entries tagged "(detected, classify as load-bearing or
   replaceable)" need my classification. Walk through each one with me;
   do not classify on my behalf.

4. One section at a time. Do not batch-fill multiple sections.

5. After each section, show your draft and WAIT for my approval
   before editing the file. Never silently overwrite a TODO.

6. Do not invent new sections, do not change headings, do not modify
   the front-matter. Only fill the bodies under existing TODO markers.

OUTPUT:
Start with product.md, section 1 ("What it is").
Ask me, do not guess.
Then move to section 2 only after I approve section 1.
Continue through product.md, then tech.md, then structure.md.

Stop when all TODO markers are resolved or I tell you to pause.`;
}
