import { defineConfig } from "tsup";
import { createRequire } from "module";
const { version } = createRequire(import.meta.url)("./package.json");

export default defineConfig({
    entry: ["index.ts", "cli.ts"],
    outDir: "dist",
    publicDir: "public",
    format: ["esm"],
    target: "es2022",
    platform: "node",
    clean: true,
    dts: true,
    define: { __VERSION__: JSON.stringify(version) },
});