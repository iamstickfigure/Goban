// https://www.giacomodebidda.com/how-to-import-d3-plugins-with-webpack/
import * as d3 from 'd3';
import './app.css';

type SVGSelection = d3.Selection<SVGSVGElement, {}, HTMLElement, any>;

class App {
    private svg: SVGSelection;
    private width: number = 500;
    private height: number = 500;
    private xLines: number = 19;
    private yLines: number = 19;
    private intersections: Intersection[][];

    constructor() {
        const {
            width,
            height,
            xLines,
            yLines
        } = this;

        this.intersections = new Array(xLines);
        for(let x = 0; x < xLines; x++) {
            this.intersections[x] = new Array(yLines);

            for(let y = 0; y < yLines; y++) {
                this.intersections[x][y] = new Intersection(x, y);
            }
        }

        const svg = d3.select('#goban').append('svg');

        svg.attr('width', width)
            .attr('height', height);

        this.svg = svg;

        this.drawGrid();
    }

    drawGrid() {
        const {
            svg,
            intersections,
            width,
            height
        } = this;

        const lines = svg.append('g').attr('class', 'lines');

        lines.append('g').attr('class', 'x-lines')
            .selectAll('line')
            .data(intersections)
                .enter()
                .append('line')
                    .attr('x1', (d, i) => this.getBoardX(i))
                    .attr('y1', (d, i) => 0)
                    .attr('x2', (d, i) => this.getBoardX(i))
                    .attr('y2', (d, i) => height);

        lines.append('g').attr('class', 'y-lines')
            .selectAll('line')
            .data(intersections[0])
                .enter()
                .append('line')
                    .attr('x1', (d, i) => 0)
                    .attr('y1', (d, i) => this.getBoardY(i))
                    .attr('x2', (d, i) => width)
                    .attr('y2', (d, i) => this.getBoardY(i));
    }

    getBoardX(x) {
        return (x + .5) * (this.width / this.xLines);
    }

    getBoardY(y) {
        return (y + .5) * (this.height / this.yLines);
    }
}

enum Stone {
    None = 0,
    Black,
    White
}

class Intersection {
    xPos: number;
    yPos: number;
    stone: Stone;
    constructor(x, y) {
        this.xPos = x;
        this.yPos = y;
        this.stone = Stone.None;
    }
}

window.onload = () => {
    new App();
}