import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["index.ts", "server.ts"],
    outDir: "dist",
    format: ["esm"],
    target: "es2022",
    platform: "node",
    bundle: false,
    clean: true,
    dts: false,
});