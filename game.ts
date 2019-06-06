// https://www.giacomodebidda.com/how-to-import-d3-plugins-with-webpack/
import * as d3 from 'd3';
import { transpose } from 'd3';

export type SVGSelection = d3.Selection<SVGSVGElement, {}, HTMLElement, any>;
export type Selection = d3.Selection<SVGGElement, {}, HTMLElement, any>;

export const STONE_CLASSES = [
    "empty",
    "black",
    "white"
];

export enum Stone {
    Unknown = -1,
    None = 0,
    Black,
    White
}

export class Intersection implements Hashable {
    xPos: number;
    yPos: number;
    stone: Stone;
    constructor(x: number, y: number, s: Stone = Stone.None) {
        this.xPos = x;
        this.yPos = y;
        this.stone = s;
    }
    
    public hashKey(): string {
        return `(${this.xPos},${this.yPos})`;
    }
}

export class Board {
    private boardElement: Selection;
    public stoneRadius: number;
    private width: number;
    private height: number;
    private xLines: number = 19;
    private yLines: number = 19;
    private turn: Stone = Stone.Black;
    private territoryMode: boolean = false;
    private makeMove: Function;
    private claimTerritory: Function;

    constructor(boardElement: Selection, width: number, height: number, xLines: number, yLines: number, makeMove: Function, claimTerritory: Function) {
        this.xLines = xLines;
        this.yLines = yLines;
        this.boardElement = boardElement;
        this.width = width;
        this.height = height;
        this.stoneRadius = Math.min(width / xLines, height / yLines) / 2;
        this.makeMove = makeMove;
        this.claimTerritory = claimTerritory;
    }

    public setTurn(turn: Stone) {
        this.turn = turn;
    }

    public draw(intersections: Intersection[][]) {
        this.drawGrid(intersections);
        this.drawHandicapPoints();

        this.boardElement.append('g').attr('class', 'intersections');
        this.boardElement.append('g').attr('class', 'territories');
        this.boardElement.append('g').attr('class', 'overlay');

        this.drawStones(intersections);
    }

    private drawHandicapPoints() {
        if(this.xLines == 19 && this.yLines == 19) {
            const points = [
                [3, 3],
                [9, 3],
                [15, 3],
                [3, 9],
                [9, 9],
                [15, 9],
                [3, 15],
                [9, 15],
                [15, 15],
            ];

            const dots = this.boardElement.append('g').attr('class', 'dots');

            dots.selectAll('circle.dot')
                .data(points)
                    .enter()
                    .append('circle')
                        .attr('class', 'dot')
                        .attr('cx', d => this.getBoardX(d[0]))
                        .attr('cy', d => this.getBoardY(d[1]))
                        .attr('r', this.stoneRadius / 6);
        }
    }

    private drawGrid(intersections: Intersection[][]) {
        const {
            boardElement,
            width,
            height
        } = this;

        const lines = boardElement.append('g').attr('class', 'lines');

        lines.append('g').attr('class', 'x-lines')
            .selectAll('line')
            .data(intersections)
                .enter()
                .append('line')
                    .attr('x1', d => this.getBoardX(d[0].xPos))
                    .attr('y1', 0)
                    .attr('x2', d => this.getBoardX(d[0].xPos))
                    .attr('y2', height);

        lines.append('g').attr('class', 'y-lines')
            .selectAll('line')
            .data(intersections[0])
                .enter()
                .append('line')
                    .attr('x1', 0)
                    .attr('y1', d => this.getBoardY(d.yPos))
                    .attr('x2', width)
                    .attr('y2', d => this.getBoardY(d.yPos));
    }

    public drawStones(intersections: Intersection[][]) {
        const self = this;
        const {
            boardElement,
            stoneRadius
        } = this;

        const allIntersections = intersections.reduce((all, col) => all.concat(col));

        const ints:any = boardElement.select('.intersections')
            .selectAll('.intersection')
            .data(allIntersections);
            
        ints.enter()
            .append('circle')
            .merge(ints)
                .attr('class', d => `intersection stone ${STONE_CLASSES[d.stone]}`)
                .attr('cx', d => this.getBoardX(d.xPos))
                .attr('cy', d => this.getBoardY(d.yPos))
                .attr('r', stoneRadius);

        const overlay = boardElement.select('g.overlay');

        const overlayInts = overlay.selectAll('.overlay-int')
            .data(allIntersections)
            .enter()
            .append('g')
                .attr('class', 'overlay-int');
        
        overlayInts.append('rect')
            .attr('class', 'intersection-area')
            .attr('data-xPos', d => d.xPos)
            .attr('data-yPos', d => d.yPos)
            .attr('x', d => this.getBoardX(d.xPos) - stoneRadius)
            .attr('y', d => this.getBoardY(d.yPos) - stoneRadius)
            .attr('width', stoneRadius*2)
            .attr('height', stoneRadius*2);

        overlayInts.on('mouseover', function(d) {
            if(self.territoryMode && d.stone != Stone.None) {
                const otherPlayer = d.stone == Stone.Black ? Stone.White : Stone.Black;

                d3.select(this)
                    .append('circle')
                    .attr('class', `highlight stone ${STONE_CLASSES[otherPlayer]}`)
                    .attr('cx', self.getBoardX(d.xPos))
                    .attr('cy', self.getBoardY(d.yPos))
                    .attr('r', stoneRadius/2);
            }
            else if(!self.territoryMode && d.stone == Stone.None) {
                d3.select(this)
                    .append('circle')
                    .attr('class', `highlight stone ${STONE_CLASSES[self.turn]}`)
                    .attr('cx', self.getBoardX(d.xPos))
                    .attr('cy', self.getBoardY(d.yPos))
                    .attr('r', stoneRadius);
            }
        }).on('mouseout', function() {
            d3.select(this)
                .select('circle.highlight')
                .remove();
        }).on('click', function(d) {
            if(self.territoryMode && d.stone != Stone.None) {
                self.claimTerritory(d.xPos, d.yPos);
            }
            else if(!self.territoryMode && d.stone == Stone.None) {
                self.makeMove(d.xPos, d.yPos);
            }
        });
    }

    public drawTerritories(territories: Territory[]) {
        const {
            boardElement,
            stoneRadius
        } = this;

        // const allIntersections = intersections.reduce((all, col) => all.concat(col));

        const terries:any = boardElement.select('.territories')
            .selectAll('.territory')
            .data(territories);
            
        const terry:any = terries.enter()
            .append('g')
            .merge(terries)
                .attr('class', d => `territory ${STONE_CLASSES[d.owner]}`);

        terries.exit().remove();

        const terryPoints = terry.selectAll('circle.territory-marker')
            .data(d => d.region);

        terryPoints.enter()
            .append('circle')
            .merge(terryPoints)
                .attr('class', `territory-marker`)
                .attr('cx', d => this.getBoardX(d.xPos))
                .attr('cy', d => this.getBoardY(d.yPos))
                .attr('r', stoneRadius/2);

        terryPoints.exit().remove();
    }

    public printStones(intersections: Intersection[][]) {
        const {
            xLines,
            yLines
        } = this;

        let board = "";

        for(let y = 0; y < yLines; y++) {
            for(let x = 0; x < xLines; x++) {
                if(intersections[x][y].stone == Stone.Black) {
                    board += "⚫";
                }
                else if(intersections[x][y].stone == Stone.White) {
                    board += "⚪";
                }
                else {
                    board += "🞡";
                }
            }

            board += "\n";
        }

        console.log(board);
    }

    // private drawStone() {
        
    // }

    private getBoardX(x) {
        return (x + .5) * (this.width / this.xLines);
    }

    private getBoardY(y) {
        return (y + .5) * (this.height / this.yLines);
    }
}

export class Game {
    public board: Board;
    public intersections: Intersection[][];
    private gameState: GameState = null;
    private topology: Topology;
    private svg: SVGSelection;
    private width: number = 500;
    private height: number = 500;
    private xLines: number = 19;
    private yLines: number = 19;
    private turn: Stone = Stone.Black;
    private blackScore: number = 0;
    private whiteScore: number = 0;
    private claimedTerritories: Territory[] = [];
    private claimedTerritoryLookup: HashSet = new HashSet();

    constructor(xLines: number = 19, yLines: number = 19, topology: Topology = null) {
        this.xLines = xLines;
        this.yLines = yLines;
        this.topology = topology || new Classic(xLines, yLines);
        
        this.intersections = Game.initIntersections(xLines, yLines);

        this.gameState = this.newGameState();
    }

    static initIntersections(xLines: number = 19, yLines: number = 19): Intersection[][] {
        let ints = new Array(xLines);
        for(let x = 0; x < xLines; x++) {
            ints[x] = new Array(yLines);

            for(let y = 0; y < yLines; y++) {
                ints[x][y] = new Intersection(x, y);
            }
        }

        return ints;
    }

    static makeGlobal(game: Game) {
        window["game"] = game;
    }

    // Can be used to place stones randomly for performance testing
    static autoPlacement(game: Game, amount: number) {
        let running = false;
        let numPlaced = 0;
        let maxTime = 0;

        Game.makeGlobal(game);

        const int = setInterval(() => {
            if(!running) {
                running = true;

                const x = ~~(Math.random() * game.xLines);
                const y = ~~(Math.random() * game.yLines);

                const now = performance.now();
                const placed = game.makeMove(x, y);
                const elapsed = performance.now() - now;

                if(numPlaced % 50 != 0) {
                    maxTime = Math.max(maxTime, elapsed);
                }
                else {
                    // Reset every 50 moves
                    maxTime = elapsed;
                }

                if(placed) {
                    console.log(`makeMove(${x},${y})\t| ${elapsed.toFixed(0)} ms\t| ${maxTime.toFixed(0)} ms\t| Move ${game.gameState.moveNum}`);
                }

                numPlaced++;

                running = false;
            }
            
            if(numPlaced > amount) {
                clearInterval(int);
            }
        }, 100);
    }

    public copyIntersections(): Intersection[][] {
        const {
            xLines,
            yLines,
            intersections
        } = this;

        let ints = new Array(xLines);
        for(let x = 0; x < xLines; x++) {
            ints[x] = new Array(yLines);

            for(let y = 0; y < yLines; y++) {
                ints[x][y] = new Intersection(x, y);
                ints[x][y].stone = intersections[x][y].stone
            }
        }

        return ints;
    }

    public initDisplay() {
        const {
            width,
            height,
            xLines,
            yLines,
            intersections,
            makeMove,
            claimTerritory
        } = this;

        const svg = d3.select('#goban').append('svg');
        const boardElement = svg.append('g').attr('class', 'board');

        this.board = new Board(boardElement, width, height, xLines, yLines, makeMove.bind(this), claimTerritory.bind(this));

        svg.attr('width', width)
            .attr('height', height);

        this.svg = svg;
        this.board.draw(intersections);
    }

    private setTurn(turn: Stone) {
        this.turn = turn;
        this.board.setTurn(turn);
    }

    private makeMove(xPos: number, yPos: number): boolean {
        const self = this;
        let legalMove = true;

        if(self.intersections[xPos][yPos].stone != Stone.None) {
            return false;
        }
        
        // Place stone temporarily
        // intersections[xPos][yPos] = new Intersection(xPos, yPos);
        self.intersections[xPos][yPos].stone = self.turn;

        const capturedNeighbors = self.getCapturedNeighbors(xPos, yPos);
        
        // If this move will capture stones, it is a legal move
        if(capturedNeighbors.length > 0) {
            legalMove = true;
        }
        else {
            const captured = self.getCapturedGroup(self.intersections[xPos][yPos]);

            // If the placed stone would be captured on placement, it is an illegal move
            legalMove = captured.length == 0;
        }

        if(legalMove) {
            // Move is legal so far, so continue on.
            let numCaptured = 0;

            for(let captured of capturedNeighbors) {
                for(let stone of captured) {
                    self.intersections[stone.xPos][stone.yPos].stone = Stone.None;
                    numCaptured++;
                }
            }

            // In case of Ko, reset the board state
            if(this.checkForKo()) {
                self.loadGameState(self.gameState);

                return false;
            }

            if(capturedNeighbors.length > 0) {
                if(self.turn == Stone.Black) {
                    self.blackScore += numCaptured;
                }
                else {
                    self.whiteScore += numCaptured;
                }
            }

            this.nextTurn();
            return true;
        }
        else {
            // Move is illegal. Remove the stone
            self.intersections[xPos][yPos].stone = Stone.None;

            return false;
        }
    }

    private nextTurn() {
        if(this.turn === Stone.Black) {
            this.setTurn(Stone.White);
        }
        else {
            this.setTurn(Stone.Black);
        }

        this.gameState = this.newGameState();
        
        // console.log(`prevGameState\n${this.gameState.prevGameState.toString()}`);
        // console.log(`gameState\n${this.gameState.toString()}`);

        this.updateBoard();
    }

    private newGameState() {
        return new GameState(this.copyIntersections(), this.turn, this.blackScore, this.whiteScore, this.gameState);
    }

    private updateBoard() {
        const {
            board,
            intersections
        } = this;

        board.drawStones(intersections);
        // board.printStones();
    }

    private updateBoardTerritories() {
        const territories = this.getAllTerritories();

        this.board.drawTerritories(territories);
    }

    private loadGameState(state: GameState) {
        const {
            xLines,
            yLines,
            intersections
        } = this;

        this.setTurn(state.turn);

        for(let x = 0; x < xLines; x++) {
            for(let y = 0; y < yLines; y++) {
                intersections[x][y].stone = state.intersections[x][y].stone
            }
        }

        this.gameState = state;
    }

    private checkForKo(): boolean {
        const {
            xLines,
            yLines,
            intersections,
            gameState: {
                prevGameState
            }
        } = this;

        if(prevGameState == null) {
            return false;
        }

        for(let x = 0; x < xLines; x++) {
            for(let y = 0; y < yLines; y++) {
                if(intersections[x][y].stone != prevGameState.intersections[x][y].stone) {
                    return false;
                }
            }
        }

        return true;
    }

    private getCapturedNeighbors(xPos, yPos): Intersection[][] {
        const self = this;
        const otherPlayer = self.getOtherPlayer();
        const intersection = self.getIntersection(xPos, yPos)
        const neighbors = self.getAdjacentNeighbors(intersection);
        let capturedGroups: Intersection[][] = [];

        for(let neighbor of neighbors) {
            if(neighbor && neighbor.stone == otherPlayer) {
                const captured = self.getCapturedGroup(neighbor);

                if(captured.length > 0) {
                    capturedGroups.push(captured);
                }
            }
        }

        return capturedGroups;
    }

    private getCapturedGroup(intersection: Intersection, visited: Intersection[] = []): Intersection[] {
        const self = this;
        const newNeighbors = self.getAdjacentNeighbors(intersection).filter(int => visited.indexOf(int) == -1);

        // It's important here that "visited" is directly modified, so other branches of execution will see the changes
        Array.prototype.push.apply(visited, [intersection, ...newNeighbors]);

        let captured = true;
        let group = [intersection];
        for(let neighbor of newNeighbors) {
            if(neighbor == null) {
                captured = true;
            }
            else if(neighbor.stone == Stone.None) {
                captured = false;
            }
            else if(neighbor.stone == intersection.stone) {
                const subGroup = self.getCapturedGroup(neighbor, visited);
                captured = captured && subGroup.length > 0;

                if(captured) {
                    group = [...group, ...subGroup];
                }
            }

            if(!captured) {
                return [];
            }
        }

        return group;
    }

    private claimTerritory(xPos: number, yPos: number, update: boolean = true): boolean {
        const self = this;
        const intersection = self.intersections[xPos][yPos];

        if(intersection.stone == Stone.None || self.claimedTerritoryLookup.includes(intersection)) {
            return false;
        }

        const owner = self.getOtherPlayer(self.intersections[xPos][yPos].stone);
        const territory = self.getTerritory(intersection, owner);

        self.claimedTerritories.push(territory);

        for(let int of territory.region) {
            self.claimedTerritoryLookup.insert(int);
        }

        if(update) {
            self.updateBoardTerritories();
        }

        return true;
    }

    private getAllTerritories(): Territory[] {
        const {
            claimedTerritories,
            claimedTerritoryLookup
        } = this;

        const apparentTerritories = this.getAllApparentTerritories(claimedTerritoryLookup);

        return [...claimedTerritories, ...apparentTerritories];
    }

    private getAllApparentTerritories(exclude: HashSet = new HashSet()): Territory[] {
        const {
            xLines,
            yLines
        } = this;

        let visited = new HashSet();
        let territories: Territory[] = [];

        for(let x = 0; x < xLines; x++) {
            for(let y = 0; y < yLines; y++) {
                const int = this.getIntersection(x, y);

                if(int.stone == Stone.None && !visited.includes(int) && !exclude.includes(int)) {
                    const territory = this.getApparentTerritory(int, visited, true);

                    if(territory.owner != Stone.Unknown) {
                        territories.push(territory);
                    }
                }
            }
        }

        return territories;
    }

    private getApparentTerritory(intersection: Intersection, visited: HashSet = null, greedy: boolean = false, mode: Pointer<Stone> = null): Territory {
        if(intersection.stone != Stone.None) {
            return new Territory(Stone.None, []);
        }

        if(visited == null) {
            visited = new HashSet();
        }

        if(mode == null) {
            mode = {
                value: Stone.None
            };
        }

        const self = this;
        const newNeighbors = self.getAdjacentNeighbors(intersection).filter(int => !visited.includes(int));

        // It's important here that "visited" and "mode" are directly modified, so other branches of execution will see the changes
        [intersection, ...newNeighbors].forEach(int => {
            if(int != null && int.stone == Stone.None) {
                visited.insert(int);
            }
        });

        let territory = new Territory(Stone.None, [intersection]);
        for(let neighbor of newNeighbors) {
            if(neighbor == null) {
                // End of local region
                continue;
            }

            if(mode.value == Stone.None) {
                // Assign the mode if one hasn't been found
                mode.value = neighbor.stone;
            }
            
            if(neighbor.stone == Stone.None) {
                // Continue checking for more empty space
                const subTerritory = self.getApparentTerritory(neighbor, visited, greedy, mode);

                if(subTerritory.owner != Stone.Unknown) {
                    territory = territory.merge(subTerritory)
                }
            }
            else if(neighbor.stone == mode.value) {
                // End of local region
                continue;
            }
            else if(neighbor.stone != mode.value) {
                // Neighbor stone doesn't match current mode, so there's no apparent territory here
                mode.value = Stone.Unknown;
            }

            if(!greedy && mode.value == Stone.Unknown) {
                // If greedy is true, set the mode to unknown, but don't stop filling the rest of the region
                // If greedy is false, break early if the mode becomes unknown
                break;
            }
        }

        if(mode.value == Stone.Unknown) {
            return new Territory(Stone.Unknown, []);
        }

        return new Territory(mode.value, territory.region);
    }

    private getTerritory(intersection: Intersection, mode: Stone, visited: HashSet = null, greedy: boolean = false): Territory {
        if(intersection.stone == mode) {
            return new Territory(Stone.None, []);
        }

        if(visited == null) {
            visited = new HashSet();
        }

        const self = this;
        const newNeighbors = self.getAdjacentNeighbors(intersection).filter(int => !visited.includes(int));

        // It's important here that "visited" is directly modified, so other branches of execution will see the changes
        [intersection, ...newNeighbors].forEach(int => {
            if(int != null && int.stone != mode) {
                visited.insert(int);
            }
        });

        let territory = new Territory(mode, [intersection]);
        for(let neighbor of newNeighbors) {
            if(neighbor == null) {
                // End of local region
                continue;
            }

            if(neighbor.stone != mode) {
                // Continue checking for more territory
                const subTerritory = self.getTerritory(neighbor, mode, visited, greedy);

                territory = territory.merge(subTerritory);
            }
            else if(neighbor.stone == mode) {
                // End of local region
                continue;
            }
        }

        return territory;
    }

    private getOtherPlayer(turn?: Stone) {
        if(turn == undefined) {
            turn = this.turn;
        }

        if(turn == Stone.Black) {
            return Stone.White;
        } 
        else {
            return Stone.Black;
        }
    }

    private getAdjacentNeighbors(intersection: Intersection) {
        const {
            xPos,
            yPos
        } = intersection;

        return [
            this.getIntersection(xPos, yPos-1),
            this.getIntersection(xPos, yPos+1),
            this.getIntersection(xPos-1, yPos),
            this.getIntersection(xPos+1, yPos)
        ];
    }

    private getIntersection(xPos: number, yPos: number) {
        return this.topology.getIntersection(this.intersections, xPos, yPos);
    }
}

class GameState {
    intersections: Intersection[][];
    turn: Stone;
    moveNum: number = 0;
    prevGameState: GameState;
    blackScore: number = 0;
    whiteScore: number = 0;

    constructor(ints: Intersection[][], t: Stone, bScore: number = 0, wScore: number = 0, prev: GameState = null) {
        this.turn = t;
        this.prevGameState = prev;
        this.intersections = ints;
        this.blackScore = bScore;
        this.whiteScore = wScore;

        if(prev == null) {
            this.moveNum = 0;
        }
        else {
            this.moveNum = prev.moveNum + 1;
        }
    }

    public newGameState(intersections: Intersection[][], turn: Stone, bScore: number = 0, wScore: number = 0): GameState {
        return new GameState(intersections, turn, bScore, wScore, this);
    }

    public toString(): string {
        const transposed = transpose<Intersection>(this.intersections);
        
        return transposed.map(col => {
            return col.map(i => {
                if(i.stone == Stone.Black) {
                    return 'b';
                }
                else if(i.stone == Stone.White) {
                    return 'w';
                }
                else {
                    return '-'
                }
            }).join(' ');
        }).join('\n');
    }

    public getState(moveNum: number) {
        let state:GameState = this;

        while(state.moveNum > moveNum) {
            state = state.prevGameState;
        }

        return state;
    }
}

export class Territory {
    region: Intersection[];
    owner: Stone;
    score: number = 0;

    constructor(owner: Stone, region?: Intersection[]) {
        this.owner = owner;

        if(region !== undefined) {
            this.region = region;
            this.score = region.reduce((total, int) => total + (int.stone == Stone.None ? 1 : 2), 0);
        }
    }

    public merge(territory: Territory): Territory {
        let merged = new Territory(Stone.None);

        if(this.owner == Stone.None) {
            merged.owner = territory.owner;
        }
        else if(territory.owner == Stone.None) {
            merged.owner = this.owner;
        }
        else if(this.owner != territory.owner) {
            merged.owner = Stone.Unknown;
        }
        else {
            merged.owner = this.owner;
        }

        merged.region = [...this.region, ...territory.region];
        merged.score = this.score + territory.score;

        return merged;
    }
}

export abstract class Topology {
    protected xLines: number;
    protected yLines: number;

    constructor(xLines: number, yLines: number) {
        this.xLines = xLines;
        this.yLines = yLines;
    }

    public abstract getIntersection(intersections: Intersection[][], xPos: number, yPos: number): Intersection;

    public static mod(n: number, m: number): number {
        // http://mathjs.org/docs/reference/functions/mod.html
        return n - m * Math.floor(n/m);
    }

    public static shouldFlip(n: number, m: number): boolean {
        return Topology.mod(Math.floor(n/m), 2) == 1;
    }

    public static flip(n: number, m: number): number {
        return m - n - 1;
    }
}

export class Classic extends Topology {
    public getIntersection(intersections: Intersection[][], xPos: number, yPos: number): Intersection {
        if(0 <= xPos && xPos < this.xLines && 0 <= yPos && yPos < this.yLines) {
            return intersections[xPos][yPos];
        }
        else {
            return null;
        }
    }
}

export class Torus extends Topology {
    public getIntersection(intersections: Intersection[][], xPos: number, yPos: number): Intersection {
        const {
            xLines,
            yLines
        } = this;

        const xMod = Topology.mod(xPos, xLines);
        const yMod = Topology.mod(yPos, yLines);

        return intersections[xMod][yMod];
    }
}

export class KleinBottle extends Topology {
    public getIntersection(intersections: Intersection[][], xPos: number, yPos: number): Intersection {
        const {
            xLines,
            yLines
        } = this;

        const xMod = Topology.mod(xPos, xLines);
        const yMod = Topology.mod(yPos, yLines);

        const xFlip = Topology.shouldFlip(xPos, xLines);
        const yFlipped = xFlip ? Topology.flip(yMod, yLines) : yMod;

        return intersections[xMod][yFlipped];
    }
}

export class RealProjectivePlane extends Topology {
    public getIntersection(intersections: Intersection[][], xPos: number, yPos: number): Intersection {
        const {
            xLines,
            yLines
        } = this;

        const xMod = Topology.mod(xPos, xLines);
        const yMod = Topology.mod(yPos, yLines);

        const xFlip = Topology.shouldFlip(xPos, xLines);
        const yFlipped = xFlip ? Topology.flip(yMod, yLines) : yMod;

        const yFlip = Topology.shouldFlip(yPos, yLines);
        const xFlipped = yFlip ? Topology.flip(xMod, xLines) : xMod;

        return intersections[xFlipped][yFlipped];
    }
}

export class Cylinder extends Topology {
    public getIntersection(intersections: Intersection[][], xPos: number, yPos: number): Intersection {
        if(0 <= yPos && yPos < this.yLines) {
            const {
                xLines,
            } = this;

            const xMod = Topology.mod(xPos, xLines);

            return intersections[xMod][yPos];
        }
        else {
            return null;
        }
    }
}

export class MobiusStrip extends Topology {
    public getIntersection(intersections: Intersection[][], xPos: number, yPos: number): Intersection {
        if(0 <= yPos && yPos < this.yLines) {
            const {
                xLines,
                yLines
            } = this;

            const xMod = Topology.mod(xPos, xLines);

            const xFlip = Topology.shouldFlip(xPos, xLines);
            const yFlipped = xFlip ? Topology.flip(yPos, yLines) : yPos;

            return intersections[xMod][yFlipped];
        }
        else {
            return null;
        }
    }
}

class HashSet {
    // Not exactly a hash set, but it does the job
    private hashSet: {[key: string]: true} = {};

    public includes(item: Hashable): boolean {
        return item && this.hashSet[item.hashKey()] == true;
    }

    public insert(item: Hashable) {
        if(item) {
            this.hashSet[item.hashKey()] = true;
        }
    }
}

interface Hashable {
    hashKey: () => string;
}

interface Pointer<T> {
    value: T;
}