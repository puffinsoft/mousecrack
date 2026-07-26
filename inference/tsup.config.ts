import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["index.ts", "cli.ts"],
    outDir: "dist",
    publicDir: "public",
    format: ["esm"],
    target: "es2022",
    platform: "node",
    bundle: false,
    clean: true,
    dts: false,
});