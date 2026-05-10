import matter from 'gray-matter';

/**
 * Parses a markdown string with YAML front-matter.
 * Returns `data` (front-matter as object) and `content` (body).
 *
 * Pure: no I/O. The caller reads the file and passes the string in.
 */
export function parseFrontMatter<T = Record<string, unknown>>(
  source: string,
): { data: T; content: string } {
  const result = matter(source);
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
  return matter.stringify(content, data);
}
