// https://www.giacomodebidda.com/how-to-import-d3-plugins-with-webpack/
import * as d3 from 'd3';
import * as $ from 'jquery';
import { transpose } from 'd3';

export type SVGSelection = d3.Selection<d3.BaseType, {}, HTMLElement, any>;
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

export class MainInterface {
    private game: Game;
    private xLines: number = 19;
    private yLines: number = 19;

    constructor() {
        document.getElementById('classic-button').addEventListener('click', () => {
            this.startClassicGame();
        });
        document.getElementById('torus-button').addEventListener('click', () => {
            this.startTorusGame();
        });
        document.getElementById('klein-button').addEventListener('click', () => {
            this.startKleinBottleGame();
        });
        document.getElementById('rpp-button').addEventListener('click', () => {
            this.startRealProjectivePlaneGame();
        });
        document.getElementById('cylinder-button').addEventListener('click', () => {
            this.startCylinderGame();
        });
        document.getElementById('mobius-button').addEventListener('click', () => {
            this.startMobiusStripGame();
        });
    }

    private startGame(topology: Topology) {
        const {
            xLines,
            yLines
        } = this;

        this.hideStartMenu();

        this.game = new Game(xLines, yLines, topology);
        this.game.initDisplay();
        
        Game.makeGlobal(this.game);
        // Game.autoPlacement(game, 1000);
    }

    private hideStartMenu() {
        document.getElementById('start-menu').classList.add('hidden');
    }

    public startClassicGame() {
        this.startGame(new Classic(this.xLines, this.yLines));
    }

    public startTorusGame() {
        this.startGame(new Torus(this.xLines, this.yLines));
    }

    public startKleinBottleGame() {
        this.startGame(new KleinBottle(this.xLines, this.yLines));
    }

    public startRealProjectivePlaneGame() {
        this.startGame(new RealProjectivePlane(this.xLines, this.yLines));
    }

    public startCylinderGame() {
        this.startGame(new Cylinder(this.xLines, this.yLines));
    }

    public startMobiusStripGame() {
        this.startGame(new MobiusStrip(this.xLines, this.yLines));
    }
}

export class Board {
    private svg: SVGSelection;
    private boardElement: Selection;
    public stoneRadius: number;
    private width: number;
    private height: number;
    private xLines: number = 19;
    private yLines: number = 19;
    private turn: Stone = Stone.Black;
    private territoryMode: boolean = false;
    private highlightedInt: DataBinding<Intersection>;
    private boardLayout: BoardLayout;
    private makeMove: Function;
    private claimTerritory: Function;

    constructor(svg: SVGSelection, width: number, height: number, xLines: number, yLines: number, makeMove: Function, claimTerritory: Function, highlighedInt: DataBinding<Intersection> = null, boardLayout: BoardLayout = null) {

        this.xLines = xLines;
        this.yLines = yLines;
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.stoneRadius = Math.min(width / xLines, height / yLines) / 2;
        this.boardLayout = boardLayout || new BoardLayout();
        this.highlightedInt = highlighedInt || new DataBinding();

        this.makeMove = makeMove;
        this.claimTerritory = claimTerritory;
    }

    public setTurn(turn: Stone) {
        this.turn = turn;
    }

    public draw(intersections: Intersection[][]) {
        const {
            svg,
            boardLayout,
            width,
            height
        } = this;

        this.boardElement = svg.append('g').attr('class', 'board');

        const x = boardLayout.boardX * width;
        const y = boardLayout.boardY * height;

        this.boardElement.attr('transform', `translate(${x} ${y})`);

        this.drawBackgroundImage();
        this.drawGrid(intersections);
        this.drawHandicapPoints();

        this.boardElement.append('g').attr('class', 'intersections');
        this.boardElement.append('g').attr('class', 'territories');
        this.boardElement.append('g').attr('class', 'overlay');

        this.drawStones(intersections);
    }

    private drawBackgroundImage() {
        this.boardElement.append('g')
            .attr('class', 'background')
            .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', this.width)
                .attr('height', this.height)
                .attr('fill', 'url(#wood)');
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
            xLines,
            yLines
        } = this;

        const lines = boardElement.append('g').attr('class', 'lines');

        const minX = this.getBoardX(0);
        const maxX = this.getBoardX(xLines - 1);
        const minY = this.getBoardY(0);
        const maxY = this.getBoardY(yLines - 1);

        lines.append('g').attr('class', 'x-lines')
            .selectAll('line')
            .data(intersections)
                .enter()
                .append('line')
                    .attr('x1', d => this.getBoardX(d[0].xPos))
                    .attr('y1', minY)
                    .attr('x2', d => this.getBoardX(d[0].xPos))
                    .attr('y2', maxY);

        lines.append('g').attr('class', 'y-lines')
            .selectAll('line')
            .data(intersections[0])
                .enter()
                .append('line')
                    .attr('x1', minX)
                    .attr('y1', d => this.getBoardY(d.yPos))
                    .attr('x2', maxX)
                    .attr('y2', d => this.getBoardY(d.yPos));
    }

    public drawStones(intersections: Intersection[][]) {
        const self = this;
        const {
            boardElement,
            stoneRadius,
            highlightedInt
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
            d3.event.stopPropagation();

            if(self.territoryMode && d.stone != Stone.None) {
                const otherPlayer = d.stone == Stone.Black ? Stone.White : Stone.Black;

                d3.select(this)
                    .append('circle')
                    .attr('class', `territory highlight stone ${STONE_CLASSES[otherPlayer]}`)
                    .attr('cx', self.getBoardX(d.xPos))
                    .attr('cy', self.getBoardY(d.yPos))
                    .attr('r', stoneRadius/2);
            }
            else if(!self.territoryMode && d.stone == Stone.None) {
                highlightedInt.setValue(intersections[d.xPos][d.yPos]);
            }
        }).on('mouseout', function() {
            d3.select(this)
                .select('circle.highlight.territory')
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

    public drawHighlight() {
        const self = this;
        const {
            stoneRadius,
            boardElement,
            highlightedInt
        } = this;

        const data = highlightedInt.value ? [highlightedInt.value] : []; 

        const overlay = boardElement.select('g.overlay');
        const highlight:any = overlay.selectAll('circle.highlight')
            .data(data)

        highlight.enter()
            .append('circle')
            .attr('class', `highlight stone ${STONE_CLASSES[self.turn]}`)
            .merge(highlight)
                .attr('cx', d => self.getBoardX(d.xPos))
                .attr('cy', d => self.getBoardY(d.yPos))
                .attr('r', stoneRadius);

        highlight.exit()
            .remove();
        
        // Add this to exit() to see how many times it's being called
        // .attr('r', d => {
        //     console.log('exit');
        //     return stoneRadius;
        // })
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
        const xFlipped = this.boardLayout.hFlip ? Topology.flip(x, this.xLines) : x;

        return (xFlipped + .5) * (this.width / this.xLines);
    }

    private getBoardY(y) {
        const yFlipped = this.boardLayout.vFlip ? Topology.flip(y, this.yLines) : y;

        return (yFlipped + .5) * (this.height / this.yLines);
    }
}

export class Game {
    public boards: Board[] = [];
    private highlighedInt: DataBinding<Intersection> = new DataBinding();
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
            xLines,
            yLines,
            intersections,
            makeMove,
            claimTerritory,
            topology
        } = this;

        const screenWidth = $(window).width();
        const screenHeight = $(window).height();

        // Support landscape with square boards only for now
        const svgHeight = screenHeight - 80; //Math.min(screenWidth, screenHeight);
        const svgWidth = screenWidth - 80; //Math.min(screenWidth, screenHeight);

        let boardDimension = svgHeight;
        const svg = d3.select('#goban svg');

        if(topology instanceof Torus || topology instanceof KleinBottle || topology instanceof RealProjectivePlane) {
            svg.attr('width', svgHeight)
                .attr('height', svgHeight);
            
            boardDimension = svgHeight / 3;
        }
        else if(topology instanceof Cylinder || topology instanceof MobiusStrip) {
            svg.attr('width', svgWidth)
                .attr('height', svgWidth / 3);

            boardDimension = svgWidth / 3;
        }
        else {
            // topology instanceof Classic
            svg.attr('width', svgHeight)
                .attr('height', svgHeight);
        }

        const width = boardDimension;
        const height = boardDimension;

        this.highlighedInt = new DataBinding(null, val => {
            for(let board of this.boards) {
                board.drawHighlight();
            }
        });

        d3.select('body').on('mouseover', () => {
            // d3.event.stopPropagation() on child mouseover events

            this.highlighedInt.setValue(null);
        });

        this.boards = topology.layouts.map(layout => new Board(svg, width, height, xLines, yLines, makeMove.bind(this), claimTerritory.bind(this), this.highlighedInt, layout));

        const woodPattern = svg.select('defs #wood');
        woodPattern.attr('width', width);
        woodPattern.attr('height', height);
        woodPattern.select('image')
            .attr('width', width)
            .attr('height', height);

        this.svg = svg;

        for(let board of this.boards) {
            board.draw(intersections);
        }
    }

    private setTurn(turn: Stone) {
        this.turn = turn;

        for(let board of this.boards) {
            board.setTurn(turn);
        }
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

        this.updateBoards();
    }

    private newGameState() {
        return new GameState(this.copyIntersections(), this.turn, this.blackScore, this.whiteScore, this.gameState);
    }

    private updateBoards() {
        const {
            boards,
            intersections
        } = this;

        for(let board of boards) {
            board.drawStones(intersections);
        }
        // board.printStones();
    }

    private updateBoardTerritories() {
        const territories = this.getAllTerritories();

        for(let board of this.boards) {
            board.drawTerritories(territories);
        }
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

        // For the bizzare cases where a single stone counts as 2 of the neighbors of a captured stone (Currently only in the Real Projective Plane)
        let allCapturedStones: HashSet = new HashSet();
        const doesOverlap = captured => {
            for(let int of captured) {
                if(allCapturedStones.includes(int)) {
                    return true;
                }
                else {
                    allCapturedStones.insert(int);
                }
            }

            return false;
        };

        for(let neighbor of neighbors) {
            if(neighbor && neighbor.stone == otherPlayer) {
                const captured = self.getCapturedGroup(neighbor);

                if(captured.length > 0 && !doesOverlap(captured)) {
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
    public abstract layouts: BoardLayout[];
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
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, false)        
    ];

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
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, false),
        new BoardLayout(1, 0, false, false),
        new BoardLayout(2, 0, false, false),
        new BoardLayout(0, 1, false, false),
        new BoardLayout(1, 1, false, false),
        new BoardLayout(2, 1, false, false),
        new BoardLayout(0, 2, false, false),
        new BoardLayout(1, 2, false, false),
        new BoardLayout(2, 2, false, false),
    ];
    
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
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, true),
        new BoardLayout(1, 0, false, false),
        new BoardLayout(2, 0, false, true),
        new BoardLayout(0, 1, false, true),
        new BoardLayout(1, 1, false, false),
        new BoardLayout(2, 1, false, true),
        new BoardLayout(0, 2, false, true),
        new BoardLayout(1, 2, false, false),
        new BoardLayout(2, 2, false, true),
    ];

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
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, true, true),
        new BoardLayout(1, 0, true, false),
        new BoardLayout(2, 0, true, true),
        new BoardLayout(0, 1, false, true),
        new BoardLayout(1, 1, false, false),
        new BoardLayout(2, 1, false, true),
        new BoardLayout(0, 2, true, true),
        new BoardLayout(1, 2, true, false),
        new BoardLayout(2, 2, true, true),
    ];

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
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, false),
        new BoardLayout(1, 0, false, false),
        new BoardLayout(2, 0, false, false),
    ];

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
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, true),
        new BoardLayout(1, 0, false, false),
        new BoardLayout(2, 0, false, true),
    ];

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

class DataBinding<T> {
    value: T;
    onChange: Function;

    constructor(val: T = null, onChange: Function = null) {
        this.value = val;
        this.onChange = onChange;
    }

    setValue(val: T) {
        this.value = val;

        if(this.onChange) {
            this.onChange(val);
        }
    }
}

class BoardLayout {
    boardX: number;
    boardY: number;
    hFlip: boolean;
    vFlip: boolean;

    constructor(boardX: number = 0, boardY: number = 0, hFlip: boolean = false, vFlip: boolean = false) {
        this.boardX = boardX;
        this.boardY = boardY;
        this.hFlip = hFlip;
        this.vFlip = vFlip;
    }
}