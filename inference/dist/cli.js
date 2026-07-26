#!/usr/bin/env node
import {
  move,
  steps
} from "./chunk-JCXEEKL5.js";

// cli.ts
import { Command } from "commander";
var program = new Command();
program.name("mousecrack").description("Synthesize organically varied, human-like mouse movement.").version("0.1.0");
program.command("move <x> <y>").description("Move your mouse to (x, y).").action(async (x, y) => {
  await move(+x, +y);
  console.log(`Moved to (${x}, ${y}).`);
});
program.command("steps <fromX> <fromY> <toX> <toY>").description("Generate path with timestamps to go from one point to another.").action(async (fromX, fromY, toX, toY) => {
  const result = await steps({ x: +fromX, y: +fromY }, { x: +toX, y: +toY });
  console.log(result);
});
await program.parseAsync(process.argv);
