import * as puppeteer from 'puppeteer';
import { Board, Game, Stone } from './game';

test('stoneRadius', () => {
    const board = new Board(null, 38, 38, 19, 19, null);

    expect(board.stoneRadius).toBe(1);
});

// test('placing stones correctly', async () => {
//     const browser = await puppeteer.launch({
//         // headless: false,
//         // slowMo: 80,
//         // args: ['--window-size=1920,1080'],
//         // ignoreDefaultArgs: ['--disable-extensions']
//     });
    
//     const page = await browser.newPage();
//     await page.goto('localhost:8080');

//     await page.click('#int-0-0');
//     await page.click('#int-1-1');
//     await page.click('#int-1-0');

//     const intersections = await page.$$('.intersection-area');
//     const black = await page.$$('.stone.black');
//     const white = await page.$$('.stone.white');
//     const empty = await page.$$('.stone.empty');

//     expect(intersections).toHaveLength(19*19);
//     expect(black).toHaveLength(2);
//     expect(white).toHaveLength(1);
//     expect(empty).toHaveLength(19 * 19 - 3);
// }, 10000);

test('getCapturedGroup: black is captured atari', () => {
    const game = new Game();

    /*
       w
    w  b  W
       w
    */

    game.intersections[1][1].stone = Stone.Black;

    game.intersections[1][0].stone = Stone.White;
    game.intersections[0][1].stone = Stone.White;
    game.intersections[1][2].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;

    const captured = game['getCapturedGroup'](game.intersections[1][1]);

    expect(captured).toHaveLength(1);
    expect(captured).toContain(game.intersections[1][1]);
});

test('getCapturedGroup: white is captured atari', () => {
    const game = new Game();

    /*
       b
    b  w  B
       b
    */

    game.intersections[1][1].stone = Stone.White;

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][1].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[1][1]);

    expect(captured).toHaveLength(1);
    expect(captured).toContain(game.intersections[1][1]);
});

test('getCapturedGroup: edge', () => {
    const game = new Game();

    /*
    b
    w  B
    b
    */

    game.intersections[0][1].stone = Stone.White;

    game.intersections[0][0].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[1][1].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[0][1]);

    expect(captured).toHaveLength(1);
    expect(captured).toContain(game.intersections[0][1]);
});

test('getCapturedGroup: corner', () => {
    const game = new Game();

    /*
    w  B
    b
    */

    game.intersections[0][0].stone = Stone.White;

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[0][0]);

    expect(captured).toHaveLength(1);
    expect(captured).toContain(game.intersections[0][0]);
});

test('getCapturedGroup: multiple captured stones', () => {
    const game = new Game();

    /*
       b  b  b
    b  w  w  w  B
       b  b  b
    */

    game.intersections[1][1].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][2].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[1][1]);

    expect(captured).toHaveLength(3);
    expect(captured).toContain(game.intersections[1][1]);
    expect(captured).toContain(game.intersections[2][1]);
    expect(captured).toContain(game.intersections[3][1]);
});

test('getCapturedGroup: odd shape', () => {
    const game = new Game();

    /*
       b  b  b
    b  w  w  w  b
       b  b  w  b
    b  w  w  w  b
       b  b  b
    */

    game.intersections[1][1].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;
    game.intersections[3][2].stone = Stone.White;
    game.intersections[1][3].stone = Stone.White;
    game.intersections[2][3].stone = Stone.White;
    game.intersections[3][3].stone = Stone.White;

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[1][1]);

    expect(captured).toHaveLength(7);
    expect(captured).toContain(game.intersections[1][1]);
    expect(captured).toContain(game.intersections[2][1]);
    expect(captured).toContain(game.intersections[3][1]);
    expect(captured).toContain(game.intersections[3][2]);
    expect(captured).toContain(game.intersections[1][3]);
    expect(captured).toContain(game.intersections[2][3]);
    expect(captured).toContain(game.intersections[3][3]);
});

test('getCapturedGroup: not captured', () => {
    const game = new Game();

    /*
       b
    b  w
       b
    */

    game.intersections[1][1].stone = Stone.White;

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[1][1]);

    expect(captured).toHaveLength(0);
});

test('getCapturedGroup: not captured (long)', () => {
    const game = new Game();

    /*
       b  b  b
    b  w  w  w
       b  b  b
    */

    game.intersections[1][1].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][2].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[1][1]);

    expect(captured).toHaveLength(0);
});

test('makeMove: black can capture atari', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
       b
    b  w  B
       b
    */

    game.intersections[1][1].stone = Stone.White;

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;

    game.setTurn(Stone.Black);
    game.makeMove(2, 1);

    expect(game.intersections[1][1].stone).toEqual(Stone.None);
});

test('makeMove: white can capture atari', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
       w
    w  b  W
       w
    */

    game.intersections[1][1].stone = Stone.Black;

    game.intersections[1][0].stone = Stone.White;
    game.intersections[0][1].stone = Stone.White;
    game.intersections[1][2].stone = Stone.White;

    game.setTurn(Stone.White);
    game.makeMove(2, 1);

    expect(game.intersections[1][1].stone).toEqual(Stone.None);
});

test('makeMove: can capture on edge', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
    b
    w  B
    b
    */

    game.intersections[0][1].stone = Stone.White;

    game.intersections[0][0].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;

    game.setTurn(Stone.Black);
    game.makeMove(1, 1);

    expect(game.intersections[0][1].stone).toEqual(Stone.None);
});

test('makeMove: can capture on corner', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
    w  B
    b
    */

    game.intersections[0][0].stone = Stone.White;

    game.intersections[0][1].stone = Stone.Black;

    game.setTurn(Stone.Black);
    game.makeMove(1, 0);

    expect(game.intersections[0][0].stone).toEqual(Stone.None);
});