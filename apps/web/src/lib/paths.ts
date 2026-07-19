import path from "node:path";

/** Repo root when Next runs from apps/web */
export function projectRoot(): string {
  return path.resolve(process.cwd(), "../..");
}

export function dataPath(...parts: string[]): string {
  return path.join(projectRoot(), "data", ...parts);
}
