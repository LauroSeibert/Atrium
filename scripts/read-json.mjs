import { readFileSync } from "node:fs";
/** Lê e faz o parse de um JSON (só para scripts Node). */
export const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
