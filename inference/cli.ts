#!/usr/bin/env node

import { Command } from 'commander';
import { ModelType, move, steps } from './index.js';

declare const __VERSION__: string;

const modelMap: Record<string, ModelType> = {
    "standard": ModelType.STANDARD,
    "lite": ModelType.LITE
}

const program = new Command();
program.name('mousecrack')
    .description('Synthesize organically varied, human-like mouse movement.')
    .version(__VERSION__);

program.command('move <x> <y> [model]')
    .description('Move your mouse to (x, y).')
    .action(async (x, y, model) => {
        await move(+x, +y, modelMap[model]);
        console.log(`Moved to (${x}, ${y}).`)
    });

program.command('steps <fromX> <fromY> <toX> <toY> [model]')
    .description('Generate path with timestamps to go from one point to another.')
    .action(async (fromX, fromY, toX, toY, model) => {
        const result = await steps({ x: +fromX, y: +fromY }, { x: +toX, y: +toY }, modelMap[model])
        console.log(result)
    })

await program.parseAsync(process.argv)