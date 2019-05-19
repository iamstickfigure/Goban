// https://www.giacomodebidda.com/how-to-import-d3-plugins-with-webpack/
import * as d3 from 'd3';

export type SVGSelection = d3.Selection<SVGSVGElement, {}, HTMLElement, any>;
export type Selection = d3.Selection<SVGGElement, {}, HTMLElement, any>;

export const STONE_CLASSES = [
    "empty",
    "black",
    "white"
];

export enum Stone {
    None = 0,
    Black,
    White
}

export class Intersection {
    xPos: number;
    yPos: number;
    stone: Stone;
    constructor(x, y) {
        this.xPos = x;
        this.yPos = y;
        this.stone = Stone.None;
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
    private makeMove: Function;

    constructor(boardElement: Selection, width: number, height: number, xLines: number, yLines: number, makeMove: Function) {
        this.xLines = xLines;
        this.yLines = yLines;
        this.boardElement = boardElement;
        this.width = width;
        this.height = height;
        this.stoneRadius = Math.min(width / xLines, height / yLines) / 2;
        this.makeMove = makeMove;
    }

    public setTurn(turn: Stone) {
        this.turn = turn;
    }

    public draw(intersections: Intersection[][]) {
        this.drawGrid(intersections);
        this.boardElement.append('g').attr('class', 'intersections');
        this.boardElement.append('g').attr('class', 'overlay');
        this.drawStones(intersections);
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
            d3.select(this)
                .append('circle')
                .attr('class', `highlight stone ${STONE_CLASSES[self.turn]}`)
                .attr('cx', self.getBoardX(d.xPos))
                .attr('cy', self.getBoardY(d.yPos))
                .attr('r', stoneRadius);
        }).on('mouseout', function() {
            d3.select(this)
                .select('circle.highlight')
                .remove();
        }).on('click', function(d) {
            self.makeMove(d.xPos, d.yPos);
        });
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
    private svg: SVGSelection;
    private width: number = 500;
    private height: number = 500;
    private xLines: number = 19;
    private yLines: number = 19;
    private turn: Stone = Stone.Black;

    constructor() {
        const {
            xLines,
            yLines
        } = this;
        
        this.intersections = new Array(xLines);
        for(let x = 0; x < xLines; x++) {
            this.intersections[x] = new Array(yLines);

            for(let y = 0; y < yLines; y++) {
                this.intersections[x][y] = new Intersection(x, y);
                // this.intersections[x][y].stone = Math.random() > .5 ? Stone.Black : Stone.None;
            }
        }
    }

    public initDisplay() {
        const {
            width,
            height,
            xLines,
            yLines,
            intersections,
            makeMove
        } = this;

        const svg = d3.select('#goban').append('svg');
        const boardElement = svg.append('g').attr('class', 'board');

        this.board = new Board(boardElement, width, height, xLines, yLines, makeMove.bind(this));

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
            // Move is legal, so continue on.
            for(let captured of capturedNeighbors) {
                for(let stone of captured) {
                    self.intersections[stone.xPos][stone.yPos].stone = Stone.None;
                }
            }

            self.nextTurn();
            self.updateBoard();

            return true;
        }
        else {
            // Move is illegal. Remove the stone
            self.intersections[xPos][yPos].stone = Stone.None;

            return false;
        }
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

    private getOtherPlayer() {
        if(this.turn == Stone.Black) {
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
        if(0 <= xPos && xPos < this.xLines && 0 <= yPos && yPos < this.yLines) {
            return this.intersections[xPos][yPos];
        }
        else {
            return null;
        }
    }

    private nextTurn() {
        if(this.turn === Stone.Black) {
            this.setTurn(Stone.White);
        }
        else {
            this.setTurn(Stone.Black);
        }
    }

    private updateBoard() {
        const {
            board,
            intersections
        } = this;

        board.drawStones(intersections);
        // board.printStones();
    }
}
