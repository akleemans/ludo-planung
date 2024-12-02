import * as _ from 'lodash';
import {CellState} from './cell-state';
import {ScheduleParameters} from "./schedule-parameters";

export type Grid = (boolean | undefined)[][];
export type UpdateFunction = (score: number, schedule: CellState[][]) => void;

export class ScheduleService {
    private static readonly DUTIES_PER_DAY = 2;
    private static readonly DEBUG = false;

    private static people: string[] = [];
    private static peopleCount: number = 0;
    private static dateCount: number = 0;
    private static dates: string[] = [];
    private static availabilities: Grid = [];
    private static minDutiesPerPerson: number[] = [];
    private static maxDutiesPerPerson: number[] = [];

    private static lowestScore: number = Number.MAX_VALUE;
    private static sendUpdate: UpdateFunction;

    /*
    Main solving method. Here the search, constraint propagation and checking for (better) solutions will be done.
     */
    public static schedule(data: ScheduleParameters, sendUpdate: UpdateFunction): void {
        this.sendUpdate = sendUpdate;
        this.dates = data.dates;
        this.people = data.people;
        this.peopleCount = data.availabilities.length;
        this.dateCount = data.availabilities[0].length;
        this.availabilities = data.availabilities;
        this.minDutiesPerPerson = data.minDutiesPerPerson;
        this.maxDutiesPerPerson = data.maxDutiesPerPerson;

        console.log('peopleCount:', this.peopleCount, 'dateCount', this.dateCount);
        for (let i = 0; i < data.people.length; i++) {
            console.log(data.people[i], ': minDuties:', this.minDutiesPerPerson[i], 'maxDuties', this.maxDutiesPerPerson[i])
        }

        const initialGrid: Grid = this.availabilities.map(p => p.map(d => d === true ? undefined : false));

        // Add current state to stack:
        // 1. Current grid
        // 2. The last guess, for example (13, 9): "Try person 13, date 9". null if not yet guessed.
        const stack: [Grid, [number, number, boolean] | null][] = [[initialGrid, null]];

        // Work on stack with Depth-First-Search (DFS)
        let iterations = 0;
        let minStack = 0;
        while (stack.length > 0) {
            if (stack.length < minStack) {
                minStack = stack.length;
            }

            iterations += 1;

            // 1. Pop state and calculate next guess
            const item = stack.pop();
            const currentGrid = item![0];
            const lastGuess = item![1];
            const possibleGuesses = this.calculateGuesses(currentGrid);

            if (iterations % 10000 === 0) {
                console.log('>> Iteration', iterations, 'minStack:', minStack, 'current stack size:', stack.length, 'stack:', stack.map(i => i[1]?.toString()));
                minStack = 10000;
            }

            let nextGuess;
            if (lastGuess === null) {
                nextGuess = possibleGuesses[0];
            } else {
                const lastGuessIdx = _.findIndex(possibleGuesses, g => g[0] === lastGuess[0] && g[1] === lastGuess[1] && g[2] == lastGuess[2]);
                if (lastGuessIdx + 1 === possibleGuesses.length) {
                    // console.log('No more guesses possible, go up. possibleGuesses::', JSON.stringify(possibleGuesses));
                    continue;
                }
                nextGuess = possibleGuesses[lastGuessIdx + 1];
            }

            // 2. Do the guess & add to stack
            // console.log('Add current guess to stack:', [currentGrid, nextGuess]);
            stack.push([_.cloneDeep(currentGrid), nextGuess]);
            currentGrid[nextGuess[0]][nextGuess[1]] = nextGuess[2];
            this.propagate(currentGrid);

            // 3. Decide how to proceed
            if (this.isValid(currentGrid)) {
                if (this.isFilled(currentGrid)) {
                    // const diff = Math.abs((new Date()).getMilliseconds() - startTime.getMilliseconds()) / 1000.0;
                    // console.log('Solved succesfully in', diff, 's (', iterations, 'iterations):', currentGrid);
                    // console.log('Solved succesfully in', iterations, 'iterations):', currentGrid);
                    const currentScore = this.getGridScore(currentGrid)
                    if (this.lowestScore > currentScore) {
                        this.lowestScore = currentScore;
                        this.sendUpdate(currentScore, ScheduleService.placePeople(currentGrid));
                    }
                } else {
                    // console.log('Grid valid but not solved, going to next layer.');
                    stack.push([_.cloneDeep(currentGrid), null]);
                }
            }
        }

        console.log('Finished loop, no solution found :(')
        this.sendUpdate(-1, []);
    }

    private static debugLog(...args: any[]) {
        if (this.DEBUG) {
            console.log(args);
        }
    }

    /*
    Calculates the single next cell to continue guessing.
     */
    private static calculateGuesses(grid: Grid): [number, number, boolean][] {
        // Calculate [p, d, score] per cell
        const guesses: [number, number, number][] = [];
        for (let p = 0; p < this.peopleCount; p++) {
            for (let d = 0; d < this.dateCount; d++) {
                // If not yet filled, we can guess
                if (grid[p][d] === undefined) {
                    const score = this.getCellScore(grid, p, d);
                    guesses.push([p, d, score]);
                }
            }
        }
        // console.log('Calculated guesses:', JSON.stringify(guesses), 'grid:', JSON.stringify(grid));

        // Sort guesses by score and only return coordinates
        const sortedGuesses: [number, number, boolean][] = [];
        guesses.sort((c1, c2) => c2[2] - c1[2])
            .map(c => [c[0], c[1]]).forEach(guess => {
            // Only add one cell
            if (sortedGuesses.length === 0) {
                sortedGuesses.push([guess[0], guess[1], true]);
                sortedGuesses.push([guess[0], guess[1], false]);
            }
        });
        return sortedGuesses;
    }

    /*
    Heuristics function to find next cell to try.
    The higher the score, the more likely it will be tried next.
    Factors:
    - Horizontally: Cell in respect to that person
    - Vertically: Cell in respect to that date
     */
    public static getCellScore(grid: Grid, p: number, d: number): number {
        // 1. Calculate person-index
        // const stillPossible = _.sum(grid[p].map(d => d !== undefined ? 1 : 0));
        const alreadyPlanned = _.sum(grid[p].map(d => d === true ? 1 : 0));

        // TODO tested with 2-5, not sure what yields the best results
        const personBusyFactor = 2;
        let personBusyPercentage = alreadyPlanned / this.minDutiesPerPerson[p];
        personBusyPercentage = Math.min(personBusyPercentage, 1);

        // 2. Calculate date-index. Fewer dates available = higher score in the end
        let dateScore = 0;
        for (let person of grid) {
            dateScore += (person[d] !== false ? 1 : 0);
        }

        return (1 - personBusyPercentage) * personBusyFactor - dateScore;
    }

    /*
    Propagate-step of the constraint search. This "does" all logically subsequent steps when a move is done.
     */
    private static propagate(grid: Grid): Grid {
        // 1. Complete days with 2 duties - set rest to false
        for (let d = 0; d < grid[0].length; d++) {
            let dateCount = _.sum(grid.map(p => p[d] === true ? 1 : 0));
            if (dateCount === ScheduleService.DUTIES_PER_DAY) {
                grid.forEach(p => {
                    if (p[d] !== true) {
                        p[d] = false;
                    }
                });
            }
        }

        // 2. Complete with 2 POSSIBLE duties - they all must be true
        for (let d = 0; d < grid[0].length; d++) {
            let possibleDateCount = _.sum(grid.map(p => p[d] !== false ? 1 : 0));
            if (possibleDateCount === ScheduleService.DUTIES_PER_DAY) {
                grid.forEach(p => {
                    if (p[d] === undefined) {
                        p[d] = true;
                    }
                });
            }
        }

        // 3. Remove adjacent dates
        for (let p = 0; p < this.peopleCount; p++) {
            for (let d = 0; d < this.dateCount; d++) {
                if (grid[p][d] === true) {
                    if (d >= 1) {
                        grid[p][d - 1] = false;
                    }
                    if (d >= 2) {
                        grid[p][d - 2] = false;
                    }
                    if (d < this.dateCount - 1) {
                        grid[p][d + 1] = false;
                    }
                    if (d < this.dateCount - 2) {
                        grid[p][d + 2] = false;
                    }
                    // TODO this uses a hard-coded approximation
                    if (this.minDutiesPerPerson[p] < 12) {
                        if (d >= 3) {
                            grid[p][d - 3] = false;
                        }
                        if (d < this.dateCount - 3) {
                            grid[p][d + 3] = false;
                        }
                    }
                }
            }
        }

        // 4. "Complete" players with maximum number of matches
        for (let p = 0; p < this.peopleCount; p++) {
            //for (let person of grid) {
            const person = grid[p];
            let matches = _.sum(person.map(d => d === true ? 1 : 0));
            if (matches >= this.maxDutiesPerPerson[p]) {
                for (let d = 0; d < this.dateCount; d++) {
                    if (person[d] === undefined) {
                        person[d] = false;
                    }
                }
            }
        }

        // 5. Complete players with only minimum amount of matches possible
        for (let p = 0; p < this.peopleCount; p++) {
            let possibleMatches = _.sum(grid[p].map(d => d !== false ? 1 : 0));
            if (possibleMatches === this.minDutiesPerPerson[p]) {
                for (let d = 0; d < this.dateCount; d++) {
                    if (grid[p][d] === undefined) {
                        grid[p][d] = true;
                    }
                }
            }
        }

        return grid;
    }

    /*
    Checks if two dates are too near
     */
    private static isNear(d0: number, d1: number): boolean {
        return Math.abs(d0 - d1) <= 1;
        // return this.isNearStr(this.dates[d0], this.dates[d1]);
    }

    /*
    Checks if a grid is still valid. This also is used for checking if the grid is solved (if it is also filled).
     */
    private static isValid(grid: Grid): boolean {
        // 1. <= 2 people per date
        for (let d = 0; d < this.dateCount; d++) {
            let dateCount = _.sum(grid.map(p => p[d] === true ? 1 : 0));
            if (dateCount > ScheduleService.DUTIES_PER_DAY) {
                this.debugLog('Invalid: Too many duties for day', this.dates[d]);
                return false;
            }
        }

        // 2. 2 open (possible) fields per date
        for (let d = 0; d < this.dateCount; d++) {
            let possibleDateCount = _.sum(grid.map(p => p[d] !== false ? 1 : 0));
            if (possibleDateCount < this.DUTIES_PER_DAY) {
                this.debugLog('Invalid: Date does not have 2 duties available anymore (only ', possibleDateCount, '):', this.dates[d]);
                return false;
            }
        }

        // 3. No adjacent dates
        for (let p = 0; p < this.peopleCount; p++) {
            for (let d = 0; d < this.dateCount; d++) {
                if (grid[p][d] === true) {
                    if ((d > 0 && grid[p][d - 1] === true && this.isNear(d, d - 1))
                        || (d < this.dateCount - 1 && grid[p][d + 1] === true && this.isNear(d, d + 1))) {
                        this.debugLog('Invalid: Adjacent duties for ', this.people[p], 'on day', this.dates[d]);
                        return false;
                    }
                }
            }
        }

        // 4. No person has more than maximum amount of duties
        for (let p = 0; p < this.peopleCount; p++) {
            let matches = _.sum(grid[p].map(d => d === true ? 1 : 0));
            if (matches > this.maxDutiesPerPerson[p]) {
                this.debugLog('Invalid: Too many duties for', this.people[p]);
                return false;
            }
        }

        // 5. Person can not have enough duties
        for (let p = 0; p < this.peopleCount; p++) {
            let possibleMatches = _.sum(grid[p].map(d => d !== false ? 1 : 0));
            if (possibleMatches < this.minDutiesPerPerson[p]) {
                this.debugLog('Invalid: Not enough duties for', this.people[p]);
                return false;
            }
        }

        return true;
    }

    /*
    Checks if the grid is completely filled.
    This means every cell has the value 'true' or 'false', and no cell has 'undefined' anymore.
     */
    public static isFilled(grid: Grid): boolean {
        return grid.every(p => p.every(d => d !== undefined));
    }

    /*
    Calculates the score of a solution using the "soft" constraints.
    It will return higher scores for worse solutions. 0 would be an ideal score.
     */
    protected static getGridScore(grid: Grid): number {
        // TODO this could be improved to include a factor to reflect the "perfect" amount of duties per
        // person, for example "1-2x a month" -> 9 would be a perfect amount of duties (for 6 months time),
        // 8 and 10 a bit less, and so on

        // 1. Not too many outliers - removed for now
        /*
        const minMatches = Math.floor(this.dateCount * ScheduleService.DUTIES_PER_DAY / this.peopleCount);
        const maxMatches = minMatches + 1;
        const matchCountOutliers = _.sum(grid.map(p => {
          const score = _.sum(p.map(d => d ? 1 : 0));
          return (score === minMatches || score === maxMatches) ? 1 : 0;
        }));*/

        // 2. Evenly distributed duties
        const distributionModifier = 1 / 4;
        const distributionScore = _.sum(grid.map(p => {
            let data: number[] = [];
            for (let i = 0; i < p.length; i++) {
                if (p[i]) {
                    data.push(i);
                }
            }
            return this.getDistributionScore(data, this.dateCount);
        })) * distributionModifier;

        // const score = dutiesWithinAWeek + distributionScore;
        const score = distributionScore;
        /*
        if (score < this.lowestScore) {
            console.log('Solution score:', dutiesWithinAWeek, '/', distributionScore);
        }*/

        return score;
    }

    /*
    Checks if two dates are in the same month.
     */
    public static inSameMonth(d0: string, d1: string): boolean {
        return d0.split('.')[1] === d1.split('.')[1];
    }

    /*
    Calculate how well the matches are distributed for every single player.
    This basically checks again uniform distribution and counts the deviation from it.
     */
    public static getDistributionScore(data: number[], maxValue: number): number {
        const distance = maxValue / (data.length - 1);
        let error = 0;
        for (let i = 0; i < data.length - 1; i++) {
            error += Math.abs(Math.abs(data[i] - data[i + 1]) - distance);
        }
        return error / (data.length - 1);
    }

    private static placePeople(grid: Grid): CellState[][] {
        const finalGrid: CellState[][] = grid.map(p => p.map(_ => CellState.Unplanned));
        for (let d = 0; d < this.dateCount; d++) {
            for (let p = 0; p < this.peopleCount; p++) {
                if (grid[p][d]) {
                    finalGrid[p][d] = CellState.Planned;
                }
            }
        }
        return finalGrid;
    }
}
