// https://www.giacomodebidda.com/how-to-import-d3-plugins-with-webpack/
import * as d3 from 'd3';
import * as $ from 'jquery';
import { transpose } from 'd3';
import * as FileSaver from 'file-saver';

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

    public copy(): Intersection {
        return new Intersection(this.xPos, this.yPos, this.stone);
    }
}

export class MainInterface {
    private game: Game;
    private xLines: number = 19;
    private yLines: number = 19;
    public static elements: {[key: string]: HTMLElement} = {};

    constructor() {
        const elements = this.setupElements();

        elements.navbarBrand.addEventListener('click', () => location.reload());

        elements.loadButton.addEventListener('click', () => {
            elements.sgfInput.click();
        });
        elements.sgfInput.addEventListener('change', e => {
            const input = e.target as HTMLInputElement;
            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = () => {
                this.loadAndStartGame(file.name, reader.result as string);
            };

            reader.readAsText(file);
        });
        elements.classicButton.addEventListener('click', () => {
            this.startClassicGame();
        });
        elements.torusButton.addEventListener('click', () => {
            this.startTorusGame();
        });
        elements.kleinButton.addEventListener('click', () => {
            this.startKleinBottleGame();
        });
        elements.rppButton.addEventListener('click', () => {
            this.startRealProjectivePlaneGame();
        });
        elements.cylinderButton.addEventListener('click', () => {
            this.startCylinderGame();
        });
        elements.mobiusButton.addEventListener('click', () => {
            this.startMobiusStripGame();
        });
    }

    private setupElements() {
        const navbarBrand: any = document.getElementsByClassName('navbar-brand')[0];

        MainInterface.elements = {
            navbarBrand: navbarBrand,
            loadButton: document.getElementById('load-btn'),
            classicButton: document.getElementById('classic-button'),
            torusButton: document.getElementById('torus-button'),
            kleinButton: document.getElementById('klein-button'),
            rppButton: document.getElementById('rpp-button'),
            cylinderButton: document.getElementById('cylinder-button'),
            mobiusButton: document.getElementById('mobius-button'),
            sgfInput: document.getElementById('sgf-input')
        };

        return MainInterface.elements;
    }

    private startGame(topology: Topology, game: Game = null) {
        const {
            xLines,
            yLines
        } = this;

        document.getElementsByTagName('body')[0].classList.add('in-game');

        if(game) {
            this.game = game;
        }
        else {
            this.game = new Game(xLines, yLines, topology);
        }

        this.game.initDisplay();
        
        Game.makeGlobal(this.game);
        // Game.autoPlacement(game, 1000);
    }

    private loadAndStartGame(filename: string, sgf: string) {
        const game: Game = Game.loadSGF(filename, sgf);

        this.startGame(null, game);
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

    public enterTerritoryMode() {
        this.territoryMode = true;
    }

    public exitTerritoryMode() {
        this.territoryMode = false;

        this.drawTerritories([]);
    }

    public setTurn(turn: Stone) {
        this.turn = turn;
    }

    public init(gameState: GameState) {
        const {
            svg,
            boardLayout,
            width,
            height
        } = this;

        const x = boardLayout.boardX * width;
        const y = boardLayout.boardY * height;

        if(boardLayout.main) {
            this.boardElement = svg.select('g.main-boards').append('g')
                .attr('class', 'board main');
        }
        else {
            this.boardElement = svg.select('g.mirror-boards').append('g')
                .attr('class', 'board');
        }

        this.boardElement.attr('transform', `translate(${x} ${y})`);

        this.drawBackgroundImage();
        this.drawGrid(gameState.intersections);
        this.drawHandicapPoints();

        this.boardElement.append('g').attr('class', 'intersections');
        this.boardElement.append('g').attr('class', 'territories');
        this.boardElement.append('g').attr('class', 'overlay');

        this.draw(gameState);
    }

    public draw(gameState: GameState) {
        if(!gameState) {
            return;
        }

        this.drawStones(gameState.intersections);
        this.drawAnnotation(gameState.move);
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

    private drawStones(intersections: Intersection[][]) {
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
            else if(!self.territoryMode && d.stone != Stone.None) {
                highlightedInt.setValue(null);
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

    public drawAnnotation(int: Intersection) {
        const self = this;
        const {
            stoneRadius,
            boardElement,
        } = this;

        const data = int ? [int] : []; 

        const overlay = boardElement.select('g.overlay');
        const annotate:any = overlay.selectAll('circle.annotate')
            .data(data);

        annotate.enter()
            .append('circle')
            .merge(annotate)
                .attr('class', d => `annotate circle ${STONE_CLASSES[d.stone]}`)
                .attr('cx', d => self.getBoardX(d.xPos))
                .attr('cy', d => self.getBoardY(d.yPos))
                .attr('r', stoneRadius / 2);

        annotate.exit()
            .remove();
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
            .data(data);

        highlight.enter()
            .append('circle')
            .merge(highlight)
                .attr('class', `highlight stone ${STONE_CLASSES[self.turn]}`)
                .attr('cx', d => self.getBoardX(d.xPos))
                .attr('cy', d => self.getBoardY(d.yPos))
                .attr('r', stoneRadius);

        highlight.exit()
            .remove();
        
        // Add this to exit() to see how many times it's being called
        // .attr('r', d => {
        //     console.log('exit');
        //     return stoneRadius;
        // });
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
    private lastMove: Intersection = null;
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
    private claimedTerritoryLookup: HashSet<Intersection> = new HashSet();

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

    public toggleNavigationWarning(enable: boolean) {
        if(enable) {
            window.onbeforeunload = function() {
                return "Are you sure you want to navigate away before saving?";
            };
        }
        else {
            window.onbeforeunload = null;
        }
    }

    public static loadSGF(filename: string, sgf: string): Game {
        // Might want to make SGF writing/parsing it's own class at some point, but it's fine for now.
        let game: Game = null;
        let topology: Topology = null;
        let size: number = null;
        let moveNum = 0;
        let variationStack: number[] = [];

        const charToPos = (char: string) => char.charCodeAt(0) - 97;

        const runMove = (turn: Stone, val: string) => {
            if(game) {
                game.setTurn(turn, true);

                if(val == '') {
                    game.pass(true)
                }
                else {
                    game.makeMove(charToPos(val[0]), charToPos(val[1]), true);
                }
    
                moveNum = game.gameState.moveNum;
            }
        }

        const applyProp = (prop: string, val: string) => {
            switch(prop) {
                case 'GN':
                    if(val != "1") {
                        throw new Error(`${prop}[${val}] not supported`)
                    }
                    break;
                case 'FF':
                    if(val != "4") {
                        throw new Error(`${prop}[${val}] not supported`)
                    }
                    break;
                case 'SZ':
                    size = +val;
                    topology = Topology.createFromFilename(filename, size, size);
                    game = new Game(size, size, topology);
                    break;
                case 'B':
                    runMove(Stone.Black, val);
                    break;
                case 'W':
                    runMove(Stone.White, val);
                    break;
                case 'CA': // UTF-8
                case 'AP': // Goban
                default:
            }
        }

        const runNode = (node: string) => {
            for(let i = 1, next = 1; i < node.length; i = next + 1) {
                next = node.indexOf('[', i);

                if(next == -1) {
                    return;
                }

                const propName = node.substring(i, next).trim();

                i = next + 1;
                next = node.indexOf(']', i);
                const propVal = node.substring(i, next).trim();

                applyProp(propName, propVal);
            }
        }

        for(let i = 0, next = 0; i < sgf.length && i != -1; i = next) {
            if(sgf[i] == '(') {
                variationStack.push(moveNum);

                if(game) {
                    game.loadGameState(game.gameState.getState(moveNum), true);
                }
            }
            else if(sgf[i] == ')') {
                moveNum = variationStack.pop();
            }
            else if(sgf[i] == ';') {
                next = sgf.slice(i + 1).search(/[;)(]/);
                next = next == -1 ? -1 : next + i + 1;

                runNode(sgf.substring(i, next).trim());
            }
            // Ignore everything else (like whitespace)

            if(next <= i) {
                next = i + 1;
            }
        }

        return game;
    }

    public saveSGF() {
        const {
            topology
        } = this;

        const sgfExtension = topology.getSgfExtension();
        const sgfBlob = new Blob([this.getSGF()], { type: "text/plain;charset=utf-8" });
        const date = new Date();
        const dateString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}`;
        const fileName = sgfExtension == null ? `goban-${dateString}.sgf` : `goban-${dateString}.${sgfExtension}.sgf`

        FileSaver.saveAs(sgfBlob, fileName);
        this.toggleNavigationWarning(false);
    }

    public getSGF(): string {
        let sgfNodes = [
            ";GM[1]FF[4]CA[UTF-8]AP[Goban]SZ[19]"
        ];

        for(let state = this.gameState.getState(1); state != null; state = state.nextGameState) {
            const turn = state.turn != Stone.Black ? "B" : "W";
            const move = state.move;

            if(move) {
                const xChar = String.fromCharCode(97 + move.xPos);
                const yChar = String.fromCharCode(97 + move.yPos);

                sgfNodes.push(`;${turn}[${xChar}${yChar}]`);
            }
            else {
                sgfNodes.push(`;${turn}[]`);
            }
        }

        return `(${sgfNodes.join('')})`;
    }

    public initDisplay() {
        const {
            xLines,
            yLines,
            gameState,
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
        this.svg = svg;

        svg.append('g').attr('class', 'mirror-boards');
        svg.append('g').attr('class', 'main-boards');

        if(topology instanceof Torus || topology instanceof KleinBottle || topology instanceof RealProjectivePlane) {
            svg.attr('width', svgHeight)
                .attr('height', svgHeight);

            svg.classed('nine-boards', true);
            
            boardDimension = svgHeight / 3;
        }
        else if(topology instanceof Cylinder || topology instanceof MobiusStrip) {
            svg.attr('width', svgWidth)
                .attr('height', svgWidth / 3);

            svg.classed('three-boards', true);

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

        const tiledButton = document.getElementById('tiled-btn');

        document.getElementById('topology-title').innerText = topology.title;
        document.getElementById('pass-btn').addEventListener('click', () => this.pass());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        document.getElementById('save-btn').addEventListener('click', () => this.saveSGF());
        tiledButton.addEventListener('click', () => {
            this.focusMainBoard(tiledButton.classList.contains('active'));
        });

        for(let board of this.boards) {
            board.init(gameState);
        }
    }

    public focusMainBoard(activate: boolean = true) {
        const {
            svg,
            topology,
            boards
        } = this;

        const mainBoard = svg.select('g.board.main');

        if(activate) {
            if(topology.layouts.length == 9) {
                mainBoard.classed('scaled', true);
            }
        }
        else {
            mainBoard.classed('scaled', false);
        }

        // TODO: Deactivate board updating for performance?
        // for(const board of boards) {
        //     if(activate) {
                
        //     }
        //     else {

        //     }
        // }
    }

    private pass(headless: boolean = false) {
        if(this.gameState.prevGameState && this.gameState.prevGameState.isPass && !headless) {
            this.endGame();
        }
        else {
            this.gameState.isPass = true;
            this.nextTurn(headless);
        }
    }

    private undo() {
        this.loadGameState(this.gameState.prevGameState);

        for(let board of this.boards) {
            board.exitTerritoryMode();
        }

        this.updateBoards();
    }

    private redo() {
        this.loadGameState(this.gameState.nextGameState);
        this.updateBoards();
    }

    private endGame() {
        this.displayActivePlayer(Stone.None);
        this.updateBoardTerritories();

        for(let board of this.boards) {
            board.enterTerritoryMode();
        }
    }

    private setTurn(turn: Stone, headless: boolean = false) {
        this.turn = turn;

        if(!headless) {
            this.displayActivePlayer(turn);

            for(let board of this.boards) {
                board.setTurn(turn);
            }
        }
    }

    private displayActivePlayer(turn: Stone) {
        document.getElementById('player-black').classList.remove('active');
        document.getElementById('player-white').classList.remove('active');

        if(turn == Stone.Black) {
            document.getElementById('player-black').classList.add('active');
        }
        else if(turn == Stone.White) {
            document.getElementById('player-white').classList.add('active');
        }
    }

    private makeMove(xPos: number, yPos: number, headless: boolean = false): boolean {
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

            this.lastMove = self.getIntersection(xPos, yPos);
            this.highlighedInt.setValue(null);
            this.nextTurn(headless);

            return true;
        }
        else {
            // Move is illegal. Remove the stone
            self.intersections[xPos][yPos].stone = Stone.None;

            return false;
        }
    }

    private nextTurn(headless: boolean = false) {
        if(this.turn === Stone.Black) {
            this.setTurn(Stone.White, headless);
        }
        else {
            this.setTurn(Stone.Black, headless);
        }

        this.gameState = this.newGameState();
        this.gameState.move = this.lastMove.copy();
        
        // console.log(`prevGameState\n${this.gameState.prevGameState.toString()}`);
        // console.log(`gameState\n${this.gameState.toString()}`);

        if(!headless) {
            this.updateBoards();
            this.toggleNavigationWarning(true);
        }
    }

    private newGameState() {
        return new GameState(this.copyIntersections(), this.turn, this.blackScore, this.whiteScore, this.gameState);
    }

    private updateBoards() {
        const {
            boards,
            gameState,
            blackScore,
            whiteScore
        } = this;

        for(let board of boards) {
            board.draw(gameState);
        }
        // board.printStones();

        document.getElementById('black-score').innerHTML = `${blackScore}`;
        document.getElementById('white-score').innerHTML = `${whiteScore}`;
    }

    private updateBoardTerritories() {
        const {
            boards,
            blackScore,
            whiteScore
        } = this;

        const territories = this.getAllTerritories();

        for(let board of boards) {
            board.drawTerritories(territories);
        }

        let blackTerritory = 0;
        let whiteTerritory = 0;

        for(let territory of territories) {
            if(territory.owner == Stone.Black) {
                blackTerritory += territory.score;
            }
            else if(territory.owner == Stone.White) {
                whiteTerritory += territory.score;
            }
        }

        document.getElementById('black-score').innerHTML = `${blackScore} + ${blackTerritory} = ${blackScore + blackTerritory}`;
        document.getElementById('white-score').innerHTML = `${whiteScore} + ${whiteTerritory} = ${whiteScore + whiteTerritory}`;
    }

    private loadGameState(state: GameState, headless: boolean = false) {
        if(state) {
            const {
                xLines,
                yLines,
                intersections
            } = this;

            this.setTurn(state.turn, headless);

            for(let x = 0; x < xLines; x++) {
                for(let y = 0; y < yLines; y++) {
                    intersections[x][y].stone = state.intersections[x][y].stone
                }
            }

            this.blackScore = state.blackScore;
            this.whiteScore = state.whiteScore;
            this.claimedTerritories = [];
            this.claimedTerritoryLookup = new HashSet();
            this.gameState = state;
        }
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
        let allCapturedStones: HashSet<Intersection> = new HashSet();
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

    private getCapturedGroup(intersection: Intersection, visited: HashSet<Intersection> = null): Intersection[] {
        if(visited == null) {
            visited = new HashSet<Intersection>();
        }

        const self = this;
        const newNeighbors = self.getAdjacentNeighbors(intersection).filter(int => !visited.includes(int));

        // It's important here that "visited" is directly modified, so other branches of execution will see the changes
        [intersection, ...newNeighbors].forEach(int => visited.insert(int));

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

    private getAllApparentTerritories(exclude: HashSet<Intersection> = new HashSet()): Territory[] {
        const {
            xLines,
            yLines
        } = this;

        let visited = new HashSet<Intersection>();
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

    private getApparentTerritory(intersection: Intersection, visited: HashSet<Intersection> = null, greedy: boolean = false, mode: Pointer<Stone> = null): Territory {
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

    private getTerritory(intersection: Intersection, mode: Stone, visited: HashSet<Intersection> = null, greedy: boolean = false): Territory {
        if(intersection.stone == mode) {
            return new Territory(Stone.None, []);
        }

        if(visited == null) {
            visited = new HashSet();
        }

        const self = this;
        const newNeighbors = self.getAdjacentNeighbors(intersection).filter(int => !visited.includes(int));

        // It's important here that "visited" is directly modified, so other branches of execution will see the changes
        [intersection, ...newNeighbors].forEach(int => visited.insert(int));

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

    private getOtherPlayer(turn?: Stone): Stone {
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

    private getAdjacentNeighbors(intersection: Intersection): Intersection[] {
        const {
            xPos,
            yPos
        } = intersection;

        // Get rid of duplicates in weird cases like the Real Projective Plane where points can overlap
        let neighbors = new HashSet<Intersection>(
            this.getIntersection(xPos, yPos-1),
            this.getIntersection(xPos, yPos+1),
            this.getIntersection(xPos-1, yPos),
            this.getIntersection(xPos+1, yPos)
        );

        return neighbors.values();
    }

    private getIntersection(xPos: number, yPos: number): Intersection {
        return this.topology.getIntersection(this.intersections, xPos, yPos);
    }
}

class GameState {
    intersections: Intersection[][];
    turn: Stone;
    moveNum: number = 0;
    prevGameState: GameState;
    nextGameState: GameState;
    blackScore: number = 0;
    whiteScore: number = 0;
    isPass: boolean = false;
    move: Intersection = null;

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
            prev.nextGameState = this;
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
    public static sgfExtension: string = null;
    public abstract title: string;
    public abstract layouts: BoardLayout[];
    protected xLines: number;
    protected yLines: number;

    constructor(xLines: number, yLines: number) {
        this.xLines = xLines;
        this.yLines = yLines;
    }

    public getSgfExtension() {
        return (<typeof Topology>this.constructor).sgfExtension; 
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

    public static createFromFilename(filename: string, xLines: number = 19, yLines: number = 19) {
        const right = filename.toLowerCase().lastIndexOf('.sgf');
        const left = filename.lastIndexOf('.', right - 1);
        const ext = left > -1 ? filename.substring(left + 1, right) : null;

        switch(ext) {
            case Torus.sgfExtension:
                return new Torus(xLines, yLines);
            case KleinBottle.sgfExtension:
                return new KleinBottle(xLines, yLines);
            case RealProjectivePlane.sgfExtension:
                return new RealProjectivePlane(xLines, yLines);
            case Cylinder.sgfExtension:
                return new Cylinder(xLines, yLines);
            case MobiusStrip.sgfExtension:
                return new MobiusStrip(xLines, yLines);
            default:
                return new Classic(xLines, yLines);
        }
    }
}

export class Classic extends Topology {
    static sgfExtension: string = null;
    title: string = 'Classic';
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, false, true)        
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
    static sgfExtension: string = 'torus';
    title: string = 'Torus';
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, false),
        new BoardLayout(1, 0, false, false),
        new BoardLayout(2, 0, false, false),
        new BoardLayout(0, 1, false, false),
        new BoardLayout(1, 1, false, false, true),
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
    static sgfExtension: string = 'klein';
    title: string = 'Klein Bottle';
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, true),
        new BoardLayout(1, 0, false, false),
        new BoardLayout(2, 0, false, true),
        new BoardLayout(0, 1, false, true),
        new BoardLayout(1, 1, false, false, true),
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
    static sgfExtension: string = 'rpp';
    title: string = 'Real Projective Plane';
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, true, true),
        new BoardLayout(1, 0, true, false),
        new BoardLayout(2, 0, true, true),
        new BoardLayout(0, 1, false, true),
        new BoardLayout(1, 1, false, false, true),
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
    static sgfExtension: string = 'cyl';
    title: string = 'Cylinder';
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, false),
        new BoardLayout(1, 0, false, false, true),
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
    static sgfExtension: string = 'mobius';
    title: string = 'Mobius Strip';
    layouts: BoardLayout[] = [
        new BoardLayout(0, 0, false, true),
        new BoardLayout(1, 0, false, false, true),
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

export class HashSet<T extends Hashable> {
    private hashSet: {[key: string]: T} = {};

    constructor(...items: T[]) {
        for(const item of items) {
            this.insert(item);
        }
    }

    public includes(item: T): boolean {
        return item && this.hashSet[item.hashKey()] == item;
    }

    public insert(item: T) {
        if(item) {
            this.hashSet[item.hashKey()] = item;
        }
    }

    public values(): T[] {
        return Object.keys(this.hashSet).map(key => this.hashSet[key]);
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
    main: boolean;

    constructor(boardX: number = 0, boardY: number = 0, hFlip: boolean = false, vFlip: boolean = false, main: boolean = false) {
        this.boardX = boardX;
        this.boardY = boardY;
        this.hFlip = hFlip;
        this.vFlip = vFlip;
        this.main = main;
    }
}