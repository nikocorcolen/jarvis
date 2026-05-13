export type TranslationKey =
  | 'init.createdDir'
  | 'init.alreadyExists'
  | 'init.noCodeDetected'
  | 'init.prefilledTech'
  | 'init.prefilledStructure'
  | 'spec.created'
  | 'spec.approvedRequirements'
  | 'spec.approvedDesign'
  | 'spec.approvedTasks'
  | 'spec.readyForImplementation'
  | 'spec.outOfOrder'
  | 'spec.notFound'
  | 'spec.phaseMissing'
  | 'spec.alreadyApproved'
  | 'status.summary'
  | 'status.nextSteps'
  | 'status.noSpecs'
  | 'status.action.requirements'
  | 'status.action.design'
  | 'status.action.tasks'
  | 'context.noSpecs'
  | 'context.multipleSpecs'
  | 'context.notFound'
  | 'context.steeringMissing'
  | 'prompt.preface.agent'
  | 'prompt.preface.init'
  | 'prompt.po.context'
  | 'prompt.po.task'
  | 'prompt.po.rules'
  | 'prompt.po.output'
  | 'prompt.arch.context'
  | 'prompt.arch.task'
  | 'prompt.arch.rules'
  | 'prompt.arch.output'
  | 'prompt.tech.context'
  | 'prompt.tech.task'
  | 'prompt.tech.rules'
  | 'prompt.tech.steering'
  | 'prompt.tech.output';

const en: Record<TranslationKey, string> = {
  'init.createdDir': '✓ Created {path}',
  'init.alreadyExists': '{path} already exists. Delete it manually to start fresh.',
  'init.noCodeDetected': 'No code detected. Open {path} and fill the TODO sections by hand.',
  'init.prefilledTech': 'Pre-filled tech.md with {count} dependencies.',
  'init.prefilledStructure': 'Pre-filled structure.md with {count} top-level folders.',
  'spec.created': "✓ Created spec '{name}'",
  'spec.approvedRequirements': "✓ Approved requirements for spec '{name}'.",
  'spec.approvedDesign': "✓ Approved design for spec '{name}'.",
  'spec.approvedTasks': "✓ Approved tasks for spec '{name}'.",
  'spec.readyForImplementation': "Spec '{name}' is ready for implementation.",
  'spec.outOfOrder': "Cannot approve {phase}. Missing dependency: '{dep}'.",
  'spec.notFound': "Spec '{name}' not found.",
  'spec.phaseMissing': "Phase file '{phase}' is missing.",
  'spec.alreadyApproved': "Phase '{phase}' is already approved.",
  'status.summary': '[{count} specs]',
  'status.nextSteps': 'Next steps:',
  'status.noSpecs': 'No specs found. Run `jarvis spec new <name>` to create one.',
  'status.action.requirements': 'edit requirements.md, then run: jarvis spec approve {name} requirements',
  'status.action.design': 'edit design.md, then run: jarvis spec approve {name} design',
  'status.action.tasks': 'edit tasks.md, then run: jarvis spec approve {name} tasks',
  'context.noSpecs': 'No specs found. Run `jarvis spec new <name>` to create one.',
  'context.multipleSpecs': 'Multiple specs found. Specify which one:\njarvis context <name>\nAvailable: {available}',
  'context.notFound': "Spec '{name}' not found.\nAvailable: {available}",
  'context.steeringMissing': 'steering file missing: {path}. Run `jarvis init` may be incomplete.',
  'prompt.preface.agent': 'Read this Jarvis context dump before taking any action.\nDo not modify files or run commands yet.\nFirst, summarize the relevant context in exactly three bullet points, then wait for further instructions.',
  'prompt.preface.init': 'Optional: copy this prompt to your AI agent for help drafting the steering files.',
  'prompt.po.context': 'CONTEXT TO READ FIRST:',
  'prompt.po.task': 'YOUR TASK:\nFill requirements.md for the feature: "{name}".',
  'prompt.po.rules': 'RULES:\n1. Do NOT propose technology, libraries, endpoints, or implementation\n   details. Those belong in design.md, not here.\n2. Group acceptance criteria UNDER each user story. Use EARS format:\n   "WHEN <trigger> THE SYSTEM SHALL <response>"\n3. Use these identifiers for traceability:\n   - US-001, US-002, ...   for user stories\n   - FR-001, FR-002, ...   for cross-cutting functional requirements\n                           (only when they don\'t fit inside a single US)\n   - NFR-001, NFR-002, ... for non-functional requirements\n4. Cover happy path, error cases, and edge cases inside each user\n   story. Cross-cutting concerns (performance, security, accessibility)\n   go under "Non-functional requirements".\n5. Be explicit about "Out of scope" — listing what this spec does NOT\n   cover prevents later scope creep.\n6. If the feature description is ambiguous, ASK clarifying questions\n   BEFORE writing. Do not assume.',
  'prompt.po.output': 'OUTPUT:\nEdit the existing requirements.md respecting its section structure.\nKeep status as "draft" in the front-matter; the user runs\n`jarvis spec approve requirements` to advance.\n\nINTERACTION:\n1. If you need more information, ask the NECESSARY clarifying questions.\n2. If you have enough clarity, provide the requirements draft.\n3. You can iterate: ask questions first, then draft, or draft and ask for confirmation on specific points.',
  'prompt.arch.context': 'CONTEXT TO READ FIRST:',
  'prompt.arch.task': 'YOUR TASK:\nFill design.md based on the approved requirements for "{name}".',
  'prompt.arch.rules': 'RULES:\n1. Every component, contract, and decision must trace to one or more\n   identifiers from requirements.md. Use the format:\n       "Addresses: US-001 (criteria 1, 3), FR-002, NFR-001"\n   When a user story is fully covered, citing US-XXX is enough.\n   When only part is covered, cite the criterion: "US-001 (criterion 2)".\n2. Cover, in order: architecture overview, components, data model,\n   contracts (APIs / events / signatures), error handling, security\n   considerations, and key technical decisions with rationale.\n3. Respect tech.md constraints. If a requirement cannot be met within\n   them, FLAG IT explicitly in a "Risks & mitigations" entry instead\n   of silently violating the constraint.\n4. Do NOT write implementation code. Pseudocode, type signatures, and\n   short interface sketches are fine; full functions are not.\n5. For each significant decision, briefly note:\n   - The decision\n   - The alternative considered\n   - Why the alternative was rejected\n6. Map error scenarios to the EARS criteria in requirements.md that\n   describe them (typically the "WHEN <invalid> ..." lines).',
  'prompt.arch.output': 'OUTPUT:\nEdit the existing design.md respecting its section structure.\nKeep status as "draft" in the front-matter; the user runs\n`jarvis spec approve design` to advance.\n\nINTERACTION STRATEGY (Plan Mode):\n1. ANALYZE: Review the approved requirements and tech constraints.\n2. PROPOSE: Start by sharing your technical strategy, architecture patterns, and any trade-offs you identified.\n3. VALIDATE: Ask for the user\'s feedback on your proposal BEFORE writing the file.\n4. EXECUTE: Once the strategy is aligned, edit design.md with the full technical specification.',
  'prompt.tech.context': 'CONTEXT TO READ FIRST:',
  'prompt.tech.task': 'YOUR TASK:\nGenerate an ordered, actionable task list to implement the design.',
  'prompt.tech.rules': 'RULES:\n1. Each task must be:\n   - Completable in ≤ 1 day of focused work.\n   - Independently verifiable (clear, testable "done" criterion).\n   - Linked to one or more US-XXX / FR-XXX / NFR-XXX it satisfies.\n2. Order tasks by dependency. A task cannot depend on a later task.\n3. Include tasks for: setup, implementation, tests, docs, and\n   migration when applicable. Tests are tasks, NOT afterthoughts.\n4. Use this format per task:\n\n   - [ ] **T-001**: <verb-first description>\n         Files: <paths likely touched>\n         Done when: <verifiable criterion>\n         Addresses: US-001 (criterion 2), FR-001\n\n5. Do NOT write the code. This is a plan, not an implementation.',
  'prompt.tech.steering': 'STEERING IMPACT CHECK:\nAfter the task list, review whether this feature introduces anything\nthat should update steering files. Steering changes are RARE and only\njustified for cross-cutting changes that future features will share.\n\nExamples that justify a steering update:\n- New external service or infrastructure (Redis, queue, storage).\n- New folder convention or architectural layer.\n- New library that becomes a project-wide standard.\n- Change to auth model, error handling pattern, or data conventions.\n\nExamples that do NOT justify a steering update:\n- Feature-specific tables, endpoints, or business rules.\n- One-off integrations used only by this feature.\n- UI components specific to this feature.\n\nOUTPUT for the steering check:\nAdd a section "## Steering Impact" with one of:\n  a) "None. This feature is self-contained."\n  b) A bulleted list of proposed steering changes, each with:\n     - File: <steering/product.md | tech.md | structure.md>\n     - Change: <what to add or modify>\n     - Rationale: <why this is cross-cutting, not feature-specific>\n\nDO NOT modify steering files directly. The user reviews and applies\nchanges manually after approving the spec.',
  'prompt.tech.output': 'OUTPUT:\nEdit the existing tasks.md respecting its section structure.\nKeep status as "draft" in the front-matter; the user runs\n`jarvis spec approve tasks` to mark this spec ready for\nimplementation.\n\nINSTRUCTIONS:\n1. Draft the task list immediately following the design and traceability rules.\n2. Once written, summarize your implementation strategy and ask the user if they agree with the proposed order or if they have specific preferences.',
};

const es: Record<TranslationKey, string> = {
  'init.createdDir': '✓ Creado {path}',
  'init.alreadyExists': '{path} ya existe. Bórralo manualmente para empezar de nuevo.',
  'init.noCodeDetected': 'No se detectó código. Abre {path} y completa las secciones TODO manualmente.',
  'init.prefilledTech': 'tech.md pre-rellenado con {count} dependencias.',
  'init.prefilledStructure': 'structure.md pre-rellenado con {count} carpetas principales.',
  'spec.created': "✓ Spec '{name}' creado",
  'spec.approvedRequirements': "✓ Requerimientos aprobados para el spec '{name}'.",
  'spec.approvedDesign': "✓ Diseño aprobado para el spec '{name}'.",
  'spec.approvedTasks': "✓ Tareas aprobadas para el spec '{name}'.",
  'spec.readyForImplementation': "El spec '{name}' está listo para su implementación.",
  'spec.outOfOrder': "No se puede aprobar {phase}. Falta dependencia: '{dep}'.",
  'spec.notFound': "Spec '{name}' no encontrado.",
  'spec.phaseMissing': "Falta el archivo de la fase '{phase}'.",
  'spec.alreadyApproved': "La fase '{phase}' ya está aprobada.",
  'status.summary': '[{count} specs]',
  'status.nextSteps': 'Siguientes pasos:',
  'status.noSpecs': 'No se encontraron specs. Ejecuta `jarvis spec new <name>` para crear uno.',
  'status.action.requirements': 'edita requirements.md, luego ejecuta: jarvis spec approve {name} requirements',
  'status.action.design': 'edita design.md, luego ejecuta: jarvis spec approve {name} design',
  'status.action.tasks': 'edita tasks.md, luego ejecuta: jarvis spec approve {name} tasks',
  'context.noSpecs': 'No se encontraron specs. Ejecuta `jarvis spec new <name>` para crear uno.',
  'context.multipleSpecs': 'Se encontraron múltiples specs. Especifica cuál:\njarvis context <name>\nDisponibles: {available}',
  'context.notFound': "Spec '{name}' no encontrado.\nDisponibles: {available}",
  'context.steeringMissing': 'Falta archivo de steering: {path}. Ejecutar `jarvis init` podría estar incompleto.',
  'prompt.preface.agent': 'Lee este volcado de contexto de Jarvis antes de realizar cualquier acción.\nNo modifiques archivos ni ejecutes comandos todavía.\nPrimero, resume el contexto relevante en exactamente tres puntos clave, luego espera más instrucciones.',
  'prompt.preface.init': 'Opcional: copia este prompt a tu agente de IA para que te ayude a redactar los archivos de steering.',
  'prompt.po.context': 'CONTEXTO PARA LEER PRIMERO:',
  'prompt.po.task': 'TU TAREA:\nCompleta requirements.md para la feature: "{name}".',
  'prompt.po.rules': 'REGLAS:\n1. NO propongas tecnología, librerías, endpoints o detalles de\n   implementación. Esos pertenecen a design.md, no aquí.\n2. Agrupa los criterios de aceptación DEBAJO de cada historia de usuario. Usa el formato EARS:\n   "CUANDO <disparador> EL SISTEMA DEBE <respuesta>"\n3. Usa estos identificadores para trazabilidad:\n   - US-001, US-002, ...   para historias de usuario\n   - FR-001, FR-002, ...   para requisitos funcionales transversales\n                           (solo cuando no encajen en un solo US)\n   - NFR-001, NFR-002, ... para requisitos no funcionales\n4. Cubre el camino feliz, casos de error y casos límite dentro de cada historia\n   de usuario. Preocupaciones transversales (rendimiento, seguridad, accesibilidad)\n   van bajo "Requisitos no funcionales".\n5. Sé explícito sobre lo "Fuera de alcance" — listar lo que este spec NO\n   cubre previene la corrupción del alcance futuro.\n6. Si la descripción de la característica es ambigua, HAZ preguntas aclaratorias\n   ANTES de escribir. No asumas.',
  'prompt.po.output': 'SALIDA:\nEdita el archivo requirements.md existente respetando la estructura de sus secciones.\nMantén el status como "draft" en el front-matter; el usuario ejecutará\n`jarvis spec approve requirements` para avanzar.\n\nINTERACCIÓN:\n1. Si necesitas más información, haz las preguntas aclaratorias NECESARIAS.\n2. Si tienes suficiente claridad, propón el borrador de requisitos.\n3. Puedes iterar: preguntar primero y luego redactar, o redactar y pedir confirmación sobre puntos específicos.',
  'prompt.arch.context': 'CONTEXTO PARA LEER PRIMERO:',
  'prompt.arch.task': 'TU TAREA:\nCompleta design.md basado en los requerimientos aprobados para "{name}".',
  'prompt.arch.rules': 'REGLAS:\n1. Cada componente, contrato y decisión debe rastrearse a uno o más\n   identificadores de requirements.md. Usa el formato:\n       "Addresses: US-001 (criteria 1, 3), FR-002, NFR-001"\n   Cuando una historia de usuario está completamente cubierta, citar US-XXX es suficiente.\n   Cuando solo una parte está cubierta, cita el criterio: "US-001 (criterion 2)".\n2. Cubre, en orden: resumen de arquitectura, componentes, modelo de datos,\n   contratos (APIs / eventos / firmas), manejo de errores, consideraciones\n   de seguridad y decisiones técnicas clave con justificación.\n3. Respeta las restricciones de tech.md. Si un requerimiento no puede ser\n   cumplido dentro de ellas, MÁRCALO explícitamente en una entrada de "Riesgos y mitigaciones" en lugar\n   de violar la restricción en silencio.\n4. NO escribas código de implementación. Pseudocódigo, firmas de tipos e\n   interfaces cortas están bien; funciones completas no.\n5. Para cada decisión significativa, anota brevemente:\n   - La decisión\n   - La alternativa considerada\n   - Por qué la alternativa fue rechazada\n6. Mapea los escenarios de error a los criterios EARS en requirements.md que\n   los describen (típicamente las líneas "CUANDO <invalido> ...").',
  'prompt.arch.output': 'SALIDA:\nEdita el archivo design.md existente respetando la estructura de sus secciones.\nMantén el status como "draft" en el front-matter; el usuario ejecutará\n`jarvis spec approve design` para avanzar.\n\nESTRATEGIA DE INTERACCIÓN (Plan Mode):\n1. ANALIZAR: Revisa los requerimientos aprobados y las restricciones técnicas.\n2. PROPONER: Empieza compartiendo tu estrategia técnica, patrones de arquitectura y cualquier compromiso (trade-off) que identifiques.\n3. VALIDAR: Pide feedback al usuario sobre tu propuesta ANTES de escribir el archivo.\n4. EJECUTAR: Una vez alineada la estrategia, edita design.md con la especificación técnica completa.',
  'prompt.tech.context': 'CONTEXTO PARA LEER PRIMERO:',
  'prompt.tech.task': 'TU TAREA:\nGenera una lista de tareas ordenada y procesable para implementar el diseño.',
  'prompt.tech.rules': 'REGLAS:\n1. Cada tarea debe ser:\n   - Completable en ≤ 1 día de trabajo enfocado.\n   - Independientemente verificable (criterio de "hecho" claro y comprobable).\n   - Vinculada a uno o más US-XXX / FR-XXX / NFR-XXX que satisface.\n2. Ordena las tareas por dependencia. Una tarea no puede depender de una tarea posterior.\n3. Incluye tareas para: configuración, implementación, pruebas, documentación, y\n   migración cuando sea aplicable. Las pruebas son tareas, NO reflexiones posteriores.\n4. Usa este formato por tarea:\n\n   - [ ] **T-001**: <descripción empezando con verbo>\n         Files: <rutas probablemente tocadas>\n         Done when: <criterio verificable>\n         Addresses: US-001 (criterion 2), FR-001\n\n5. NO escribas el código. Esto es un plan, no una implementación.',
  'prompt.tech.steering': 'REVISIÓN DE IMPACTO EN STEERING:\nDespués de la lista de tareas, revisa si esta característica introduce algo\nque deba actualizar los archivos de steering. Los cambios de steering son RAROS y solo\nse justifican para cambios transversales que características futuras compartirán.\n\nEjemplos que justifican una actualización de steering:\n- Nuevo servicio externo o infraestructura (Redis, cola, almacenamiento).\n- Nueva convención de carpetas o capa arquitectónica.\n- Nueva librería que se convierte en un estándar para todo el proyecto.\n- Cambio en el modelo de auth, patrón de manejo de errores, o convenciones de datos.\n\nEjemplos que NO justifican una actualización de steering:\n- Tablas, endpoints o reglas de negocio específicas de la característica.\n- Integraciones únicas usadas solo por esta característica.\n- Componentes de UI específicos de esta característica.\n\nSALIDA para la revisión de steering:\nAgrega una sección "## Steering Impact" con una de las siguientes:\n  a) "None. This feature is self-contained."\n  b) Una lista con viñetas de cambios de steering propuestos, cada uno con:\n     - File: <steering/product.md | tech.md | structure.md>\n     - Change: <qué agregar o modificar>\n     - Rationale: <por qué esto es transversal, no específico de la característica>\n\nNO modifiques los archivos de steering directamente. El usuario revisa y aplica\nlos cambios manualmente después de aprobar el spec.',
  'prompt.tech.output': 'SALIDA:\nEdita el archivo tasks.md existente respetando la estructura de sus secciones.\nMantén el status como "draft" en el front-matter; el usuario ejecutará\n`jarvis spec approve tasks` para marcar este spec listo para\nimplementación.\n\nINSTRUCCIONES:\n1. Redacta la lista de tareas inmediatamente siguiendo el diseño y las reglas de trazabilidad.\n2. Una vez escrito, resume tu estrategia de implementación y pregunta al usuario si está de acuerdo con el orden propuesto o si tiene preferencias específicas.',
};

const dictionaries = { en, es };

export function t(
  lang: 'en' | 'es',
  key: TranslationKey,
  args?: Record<string, string | number>,
): string {
  const dict = dictionaries[lang] || dictionaries.en;
  let text = dict[key] || dictionaries.en[key] || key;

  if (args) {
    for (const [k, v] of Object.entries(args)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}
