# friday-cli

Spec-driven development CLI. Bootstraps `.friday/`, manages specs through a Requirements → Design → Tasks workflow, and validates traceability between them.

> **Status (v0.1.0)**: `init` is implemented end-to-end. Five other commands are scaffolded as stubs and tracked in `.friday/specs/` of this repo (dogfooding).

## Quick start

```bash
# Install (once published)
npm install -g friday-cli

# Or run from a clone
npm install
npm run build
node dist/cli/index.js --help

# Initialize a project
cd my-project
friday init
```

`friday init` creates `.friday/` with three steering files (`product.md`, `tech.md`, `structure.md`) and a `config.json`. If your project already has code, it pre-fills what it can detect from `package.json`, `pyproject.toml`, `go.mod`, or `Cargo.toml`, and prints a copy-paste prompt to help an AI agent draft the rest with you.

Example on a Node project:

```
$ friday init
✓ Created /path/to/repo/.friday
  ├── steering/  (product.md, tech.md, structure.md)
  ├── specs/     (empty)
  └── config.json

Detected: TypeScript/JavaScript (package.json)
Pre-filled tech.md with 3 dependencies.
Pre-filled structure.md with 4 top-level folders.

Optional: copy this prompt to your AI agent for help drafting the steering files.

────────────────────────────────────────────────────────────
You are helping me draft Friday steering files for an existing codebase.
...
────────────────────────────────────────────────────────────
```

If `.friday/` already exists, `init` refuses without touching anything. Delete it manually if you want to start fresh.

## Commands

| Command | Status | Implementation spec |
|---|---|---|
| `friday init` | ✅ implemented | `bootstrap-init` |
| `friday spec new <name>` | stub | `spec-lifecycle` |
| `friday spec approve <spec> <phase>` | stub | `spec-lifecycle` |
| `friday spec status` | stub | `spec-lifecycle` |
| `friday spec validate [name]` | stub | `traceability-validation` |
| `friday context [spec]` | stub | `context-dump` |

## How it works

Friday is **AI-agent-agnostic**. It does not call any LLM. Instead, every command that needs an agent prints a carefully-written prompt to stdout that you paste into your tool of choice (Claude, Cursor, Copilot, etc.). The agent fills the markdown; the CLI manages structure, traceability and state.

The flow per feature:

```
friday spec new <name>            → creates spec/ + prints requirements prompt
[paste prompt in agent, iterate]
friday spec approve requirements  → prints design prompt
[paste prompt in agent, iterate]
friday spec approve design        → prints tasks prompt
[paste prompt in agent, iterate]
friday spec approve tasks         → spec ready to implement
```

## Project layout

```
src/
├── cli/
│   ├── index.ts            entry point, registers commands
│   └── commands/           one file per command (orchestration only)
├── core/                   pure logic, no I/O
│   ├── types.ts
│   ├── friday-dir.ts
│   ├── frontmatter.ts
│   ├── traceability.ts
│   ├── detect-stack.ts
│   ├── init-prefill.ts
│   └── templates.ts
├── io/                     filesystem and stdout/stderr boundaries
│   ├── fs.ts
│   └── output.ts
└── prompts/                pure functions: data → prompt string
templates/
├── spec/                   requirements.md, design.md, tasks.md
└── steering/               product.md, tech.md, structure.md
.friday/                    Friday's own specs (dogfooding)
└── specs/
    └── bootstrap-init/     fully written spec for the init command
```

### Output convention

- **stdout**: the command's product (prompts to copy, dumps, lists). Pipeable.
- **stderr**: progress, success/error indicators, human-facing notes.

This is why piping works:

```bash
friday init | pbcopy        # copies the bootstrap prompt to clipboard
friday spec validate || exit 1   # CI uses exit code, ignores formatting
```

## Develop

```bash
npm install
npm run build         # tsc, output to dist/
npm run dev           # tsc --watch
npm test              # compile tests + run with node:test
```

Node 20+ required. ESM-only. Four runtime dependencies (`commander`, `gray-matter`, `kleur`, `prompts`).

## Dogfooding

`.friday/specs/bootstrap-init/` contains the full `requirements.md`, `design.md` and `tasks.md` for the `init` command itself. It serves as the canonical example of the format and as proof that the workflow works on a real feature.

## License

MIT.
