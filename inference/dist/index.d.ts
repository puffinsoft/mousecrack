interface Position {
    x: number;
    y: number;
}
interface Step {
    x: number;
    y: number;
    t: number;
}
declare function steps(start: Position, end: Position): Promise<Step[]>;
declare function move(x: number, y: number): Promise<void>;

export { type Position, type Step, move, steps };
