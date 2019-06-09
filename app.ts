import { Game, Classic, Torus, KleinBottle, RealProjectivePlane } from './game';
import './app.css';

window.onload = () => {
    const xLines = 19;
    const yLines = 19;
    const topology = new RealProjectivePlane(xLines, yLines);
    const game = new Game(xLines, yLines, topology);

    game.initDisplay();

    Game.makeGlobal(game);
    // Game.autoPlacement(game, 1000);
}
