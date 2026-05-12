import matter from 'gray-matter';
import yaml from 'js-yaml';

/**
 * gray-matter defaults to js-yaml's DEFAULT_SCHEMA, which coerces
 * ISO-date strings into JS Date objects and re-serialises them as
 * full ISO timestamps on round-trip. It also caches `matter()` results
 * by input string, so two callers parsing identical content share the
 * same `data` object — and a mutation by one poisons the other.
 *
 * Both flags below are required:
 *  - `engines.yaml` with JSON_SCHEMA disables the timestamp resolver,
 *    so YYYY-MM-DD stays a plain string (satisfies decision 8.4 and
 *    NFR-003).
 *  - `cache: false` forces a fresh parse per call, preventing
 *    cross-test state leakage when fixtures use identical content.
 */
const YAML_ENGINE = {
  parse: (str: string): object => {
    // js-yaml.load returns `unknown`; coerce empty front-matter to {}
    // so gray-matter's `engines.yaml.parse` contract (returns object)
    // is satisfied.
    const parsed = yaml.load(str, { schema: yaml.JSON_SCHEMA });
    return (parsed ?? {}) as object;
  },
  stringify: (obj: object): string =>
    yaml.dump(obj, { schema: yaml.JSON_SCHEMA }),
};

const MATTER_OPTIONS = {
  engines: { yaml: YAML_ENGINE },
  cache: false,
} as const;

/**
 * Parses a markdown string with YAML front-matter.
 * Returns `data` (front-matter as object) and `content` (body).
 *
 * Pure: no I/O. The caller reads the file and passes the string in.
 */
export function parseFrontMatter<T = Record<string, unknown>>(
  source: string,
): { data: T; content: string } {
  const result = matter(source, MATTER_OPTIONS);
  return { data: result.data as T, content: result.content };
}

/**
 * Re-serialises `data` + `content` back into a markdown string with
 * front-matter. Used when updating status fields without rewriting the body.
 */
export function stringifyFrontMatter(
  data: Record<string, unknown>,
  content: string,
): string {
  return matter.stringify(content, data, MATTER_OPTIONS);
}
