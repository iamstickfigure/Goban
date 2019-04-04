// https://www.giacomodebidda.com/how-to-import-d3-plugins-with-webpack/
import * as d3 from 'd3';
import './app.css';

type SVGSelection = d3.Selection<SVGSVGElement, {}, HTMLElement, any>;
type Selection = d3.Selection<SVGGElement, {}, HTMLElement, any>;

const STONE_CLASSES = [
    "",
    "black",
    "white"
];

enum Stone {
    None = 0,
    Black,
    White
}

class Intersection {
    xPos: number;
    yPos: number;
    stone: Stone;
    constructor(x, y, stone = Stone.None) {
        this.xPos = x;
        this.yPos = y;
        this.stone = stone;
    }
}

class Board {
    private intersections: Intersection[][];
    private boardElement: Selection;
    private stoneRadius: number;
    private width: number;
    private height: number;
    private xLines: number = 19;
    private yLines: number = 19;
    private turn: Stone = Stone.Black;

    constructor(boardElement: Selection, width: number, height: number) {
        const {
            xLines,
            yLines
        } = this;

        this.boardElement = boardElement;
        this.width = width;
        this.height = height;
        this.stoneRadius = Math.min(width / xLines, height / yLines) / 2;

        this.intersections = new Array(xLines);
        for(let x = 0; x < xLines; x++) {
            this.intersections[x] = new Array(yLines);

            for(let y = 0; y < yLines; y++) {
                this.intersections[x][y] = new Intersection(x, y);
                this.intersections[x][y].stone = Math.random() > .5 ? Stone.Black : Stone.None;
            }
        }
    }

    public nextTurn() {
        if(this.turn === Stone.Black) {
            this.turn = Stone.White;
        }
        else {
            this.turn = Stone.Black;
        }
    }

    public setTurn(turn: Stone) {
        this.turn = turn;
    }

    public draw() {
        this.drawGrid();
        this.drawStones();
    }

    private drawGrid() {
        const {
            boardElement,
            intersections,
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
                    .attr('y1', d => 0)
                    .attr('x2', d => this.getBoardX(d[0].xPos))
                    .attr('y2', d => height);

        lines.append('g').attr('class', 'y-lines')
            .selectAll('line')
            .data(intersections[0])
                .enter()
                .append('line')
                    .attr('x1', d => 0)
                    .attr('y1', d => this.getBoardY(d.yPos))
                    .attr('x2', d => width)
                    .attr('y2', d => this.getBoardY(d.yPos));
    }

    private drawStones() {
        const self = this;
        const {
            boardElement,
            intersections,
            stoneRadius
        } = this;

        const stones = boardElement.append('g').attr('class', 'stones');

        const columns = stones.selectAll('g.column')
            .data(intersections)
                .enter()
                .append('g')
                    .attr('class', 'column');

        columns.selectAll('.stone')
            .data(col => col)
                .enter()
                .filter(d => d.stone != Stone.None)
                .append('circle')
                    .attr('class', d => `stone ${STONE_CLASSES[d.stone]}`)
                    .attr('cx', d => this.getBoardX(d.xPos))
                    .attr('cy', d => this.getBoardX(d.yPos))
                    .attr('r', stoneRadius);

        const intSelect = columns.selectAll('.intersection')
            .data(col => col)
                .enter()
                .append('g')
                    .attr('class', 'intersection');

        intSelect.append('rect')
            .attr('class', 'intersection-area')
            .attr('x', d => this.getBoardX(d.xPos) - stoneRadius)
            .attr('y', d => this.getBoardX(d.yPos) - stoneRadius)
            .attr('width', stoneRadius*2)
            .attr('height', stoneRadius*2);

        intSelect.on('mouseover', function(d) {
            d3.select(this)
                .append('circle')
                .attr('class', `highlight stone ${STONE_CLASSES[self.turn]}`)
                .attr('cx', self.getBoardX(d.xPos))
                .attr('cy', self.getBoardX(d.yPos))
                .attr('r', stoneRadius);
        }).on('mouseout', function() {
            d3.select(this)
                .select('circle.highlight')
                .remove();
        }).on('click', function(d) {
            intersections[d.xPos][d.yPos] = new Intersection(d.xPos, d.yPos, self.turn);
            self.nextTurn();
        });
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

class App {
    private board: Board;
    private svg: SVGSelection;
    private width: number = 500;
    private height: number = 500;

    constructor() {
        const {
            width,
            height
        } = this;

        const svg = d3.select('#goban').append('svg');
        const boardElement = svg.append('g').attr('class', 'board');

        this.board = new Board(boardElement, width, height);

        svg.attr('width', width)
            .attr('height', height);

        this.svg = svg;

        this.board.draw();
    }
}

window.onload = () => {
    new App();
}