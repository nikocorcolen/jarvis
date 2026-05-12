import { t } from '../core/i18n.js';

/**
 * Renders the optional prompt printed at the end of `jarvis init`
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
  lang?: 'en' | 'es';
}): string {
  const langVal = args.lang ?? 'es';
  const detectedLang = args.detectedLanguage ?? '<unknown>';
  const manifests =
    args.manifests.length > 0 ? args.manifests.join(', ') : '<none>';

  if (langVal === 'es') {
    return `Me estás ayudando a redactar archivos de steering de Jarvis para un código existente.

CONTEXTO:
- Directorio de trabajo: el repositorio actual
- Lenguaje detectado: ${detectedLang}
- Manifiestos detectados: ${manifests}
- Archivos a completar: .jarvis/steering/product.md, tech.md, structure.md
  (algunas secciones están pre-rellenadas y etiquetadas "(detected, ...)";
   el resto están marcadas con <!-- TODO -->)

TU TAREA:
Para cada sección marcada con <!-- TODO -->, recopila la información necesaria
para completarla. Sigue estas reglas sin excepción:

REGLAS:
1. product.md — PREGUNTA, NUNCA INFIERAS.
   El código no contiene las respuestas a "quién es el usuario",
   "qué problema resuelve", o "cuáles son los no-objetivos".
   Entrevístame sección por sección. No propongas respuestas de
   producto inspeccionando el código.

2. tech.md y structure.md — OBSERVA, LUEGO PREGUNTA "¿INTENCIONAL O ACCIDENTAL?".
   Puedes inspeccionar el código para proponer valores, pero siempre formula
   tu propuesta como una pregunta: "Veo X en el código — ¿esto es intencional
   o accidental?". El estado actual del código no es automáticamente
   el estado deseado.

3. Las entradas pre-rellenadas etiquetadas "(detected, classify as load-bearing or
   replaceable)" necesitan mi clasificación. Revísalas conmigo una por una;
   no las clasifiques en mi lugar.

4. Una sección a la vez. No rellenes múltiples secciones en lote.

5. Después de cada sección, muestra tu borrador y ESPERA mi aprobación
   antes de editar el archivo. Nunca sobrescribas un TODO en silencio.

6. No inventes nuevas secciones, no cambies los encabezados, no modifiques
   el front-matter. Solo completa el cuerpo bajo los marcadores TODO existentes.

SALIDA:
Empieza con product.md, sección 1 ("What it is").
Pregúntame, no adivines.
Luego pasa a la sección 2 solo después de que apruebe la sección 1.
Continúa a través de product.md, luego tech.md, luego structure.md.

Detente cuando todos los marcadores TODO estén resueltos o yo te pida pausar.`;
  }

  return `You are helping me draft Jarvis steering files for an existing codebase.

CONTEXT:
- Working directory: the current repo
- Detected language: ${detectedLang}
- Detected manifests: ${manifests}
- Files to fill: .jarvis/steering/product.md, tech.md, structure.md
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
