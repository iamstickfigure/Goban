import { Game } from './game';
import './app.css';

window.onload = () => {
    const game = new Game();
    game.initDisplay();

    Game.makeGlobal(game);
    // Game.autoPlacement(game, 1000);
}
