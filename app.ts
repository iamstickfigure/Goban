// https://www.giacomodebidda.com/how-to-import-d3-plugins-with-webpack/
import * as d3 from 'd3';

type SVGSelection = d3.Selection<SVGSVGElement, {}, HTMLElement, any>;

class App {
    private svg: SVGSelection;
    private width: number = 100;
    private height: number = 100;

    constructor() {
        const {
            width,
            height
        } = this;

        const svg = d3.select('#goban').append('svg');

        svg.attr('width', width)
            .attr('height', height);

        this.svg = svg;
    }
}

window.onload = () => {
    new App();
}