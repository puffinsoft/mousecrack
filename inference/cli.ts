#!/usr/bin/env node

import { Command } from 'commander';
import { move, steps } from './index.js';

declare const __VERSION__: string;

const program = new Command();
program.name('mousecrack')
    .description('Synthesize organically varied, human-like mouse movement.')
    .version(__VERSION__);

program.command('move <x> <y>')
    .description('Move your mouse to (x, y).')
    .action(async (x, y) => {
        await move(+x, +y);
        console.log(`Moved to (${x}, ${y}).`)
    });

program.command('steps <fromX> <fromY> <toX> <toY>')
    .description('Generate path with timestamps to go from one point to another.')
    .action(async (fromX, fromY, toX, toY) => {
        const result = await steps({ x: +fromX, y: +fromY }, { x: +toX, y: +toY })
        console.log(result)
    })

await program.parseAsync(process.argv)