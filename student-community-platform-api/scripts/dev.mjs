// Arranca `wrangler dev` cargando en el entorno las variables WRANGLER_*
// que estén en .dev.vars (que NO se sube al repo). Así la cadena local de
// Hyperdrive —con contraseña— vive solo en .dev.vars y no en wrangler.toml.
//
// Uso: npm run dev  (equivale a `wrangler dev`, acepta flags extra)
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const devVars = fileURLToPath(new URL("../.dev.vars", import.meta.url));

try {
  for (const linea of readFileSync(devVars, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*(WRANGLER_[A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let valor = m[2].trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    process.env[m[1]] = valor;
  }
} catch (e) {
  console.warn(`[dev] no se pudo leer .dev.vars (${e.code ?? e.message}); sigo sin él`);
}

const hijo = spawn("wrangler", ["dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
});
hijo.on("exit", (code) => process.exit(code ?? 0));
