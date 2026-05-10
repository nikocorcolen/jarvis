---
type: steering
scope: product
updated: 2026-05-10
---

# Product

## 1. What it is

Friday is a command-line tool that brings spec-driven development to
any AI coding agent. It scaffolds a `.friday/` directory with steering
files and per-feature specs (requirements → design → tasks), and at
each step emits a carefully written prompt the user pastes into the
agent of their choice. Friday itself never calls an LLM.

## 2. Who it's for

Primary persona: a developer who already uses an AI coding agent
(Claude Code, Cursor, Copilot, Aider, or similar) and feels the pain
of repetitive context, lost decisions between sessions, and code that
arrives without a verifiable plan.

Secondary persona: a tech lead introducing spec-driven workflow to a
small team and wanting a tool that enforces the discipline without
locking the team into a specific IDE or vendor.

## 3. Problem it solves

AI agents lose context between sessions, generate code without a plan
that humans can review, and have no shared format to "hand off the
brain" of a project. Today the workaround is long markdown files in
README or notion, copy-pasted at the start of every session — fragile,
inconsistent, and not enforceable.

Friday makes that workflow first-class: the spec files become the
contract between human and agent, versioned in git, validated for
traceability, and consumable by any agent.

## 4. Core value proposition

- **Tool-agnostic.** No API keys, no vendor lock-in. Works with any
  agent that can edit markdown.
- **Local-first.** Everything is files in your repo. No account, no
  cloud, no telemetry.
- **Disciplined by default.** Phase ordering, traceability, and the
  steering/spec asymmetry are enforced by the tool, not by goodwill.
- **Zero-config first run.** `npx friday init` gives you a working
  `.friday/` in seconds.

## 5. Non-goals

- Not a hosted service. Not a SaaS. Not an account.
- Not an IDE replacement or extension. The user keeps their editor.
- Not a code generator. Friday produces specs and prompts; the agent
  the user already pays for produces code.
- Not a project-management tool. No issues, no kanban, no assignees.
- Not a documentation site builder. Specs live in markdown; rendering
  is the user's choice.
- Not a replacement for human review. Steering is human-written;
  agents only propose changes.

## 6. Success signals

- Users adopt the workflow on their second project unprompted.
- Specs are referenced in PR descriptions and code review comments.
- `friday spec validate` runs in CI on at least some adopting projects.
- The tool stays small: under 5 commands and under 5 runtime
  dependencies even after a year of use.