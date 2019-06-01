import * as puppeteer from 'puppeteer';
import { Board, Game, Stone, Intersection, Territory } from './game';

test('stoneRadius', () => {
    const board = new Board(null, 38, 38, 19, 19, null, null);

    expect(board.stoneRadius).toBe(1);
});

test('Intersection: stone', () => {
    const int = new Intersection(0, 0, Stone.Black);

    expect(int.xPos).toBe(0);
    expect(int.yPos).toBe(0);
    expect(int.stone).toBe(Stone.Black);
});

test('Intersection: empty', () => {
    const int = new Intersection(0, 0);

    expect(int.xPos).toBe(0);
    expect(int.yPos).toBe(0);
    expect(int.stone).toBe(Stone.None);
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

test('getCapturedGroup: circle', () => {
    const game = new Game();

    /*
       b  b  b
    b  w  w  w  b
    b  w  b  w  b
    b  w  w  w  b
       b  b  b
    */

    game.intersections[1][1].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;
    game.intersections[1][2].stone = Stone.White;
    game.intersections[3][2].stone = Stone.White;
    game.intersections[1][3].stone = Stone.White;
    game.intersections[2][3].stone = Stone.White;
    game.intersections[3][3].stone = Stone.White;

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
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

    expect(captured).toHaveLength(8);
    expect(captured).toContain(game.intersections[1][1]);
    expect(captured).toContain(game.intersections[2][1]);
    expect(captured).toContain(game.intersections[3][1]);
    expect(captured).toContain(game.intersections[1][2]);
    expect(captured).toContain(game.intersections[3][2]);
    expect(captured).toContain(game.intersections[1][3]);
    expect(captured).toContain(game.intersections[2][3]);
    expect(captured).toContain(game.intersections[3][3]);
});

test('getCapturedGroup: area', () => {
    const game = new Game();

    /*
       b  b  b
    b  w  w  w  b
    b  w  w  w  b
    b  w  w  w  b
       b  b  b
    */

    game.intersections[1][1].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;
    game.intersections[1][2].stone = Stone.White;
    game.intersections[3][2].stone = Stone.White;
    game.intersections[1][3].stone = Stone.White;
    game.intersections[2][3].stone = Stone.White;
    game.intersections[3][3].stone = Stone.White;
    game.intersections[2][2].stone = Stone.White;

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    const captured = game['getCapturedGroup'](game.intersections[1][1]);

    expect(captured).toHaveLength(9);
    expect(captured).toContain(game.intersections[1][1]);
    expect(captured).toContain(game.intersections[2][1]);
    expect(captured).toContain(game.intersections[3][1]);
    expect(captured).toContain(game.intersections[1][2]);
    expect(captured).toContain(game.intersections[3][2]);
    expect(captured).toContain(game.intersections[1][3]);
    expect(captured).toContain(game.intersections[2][3]);
    expect(captured).toContain(game.intersections[3][3]);
    expect(captured).toContain(game.intersections[2][2]);
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

test('makeMove: game states are tracked', () => {
    const game = new Game(3, 3);
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    const placed1 = game["makeMove"](0, 0);
    const placed2 = game["makeMove"](1, 0);
    const placed3 = game["makeMove"](2, 0);

    const gameState3 = game["gameState"];
    const gameState2 = gameState3.prevGameState;
    const gameState1 = gameState2.prevGameState;
    const gameState0 = gameState1.prevGameState;

    const expectedState0 = Game.initIntersections(3, 3);
    const expectedState1 = Game.initIntersections(3, 3);
    const expectedState2 = Game.initIntersections(3, 3);
    const expectedState3 = Game.initIntersections(3, 3);

    expectedState1[0][0].stone = Stone.Black;

    expectedState2[0][0].stone = Stone.Black;
    expectedState2[1][0].stone = Stone.White;

    expectedState3[0][0].stone = Stone.Black;
    expectedState3[1][0].stone = Stone.White;
    expectedState3[2][0].stone = Stone.Black;

    expect(placed1).toBe(true);
    expect(placed2).toBe(true);
    expect(placed3).toBe(true);

    expect(gameState3.moveNum).toBe(3);
    expect(gameState2.moveNum).toBe(2);
    expect(gameState1.moveNum).toBe(1);
    expect(gameState0.moveNum).toBe(0);

    expect(gameState3.intersections).toEqual(expectedState3);
    expect(gameState2.intersections).toEqual(expectedState2);
    expect(gameState1.intersections).toEqual(expectedState1);
    expect(gameState0.intersections).toEqual(expectedState0);
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

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.Black);
    
    const placed = game["makeMove"](2, 1);

    expect(placed).toBe(true);
    expect(game["blackScore"]).toBe(1);
    expect(game["whiteScore"]).toBe(0);
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

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.White);

    const placed = game["makeMove"](2, 1);

    expect(placed).toBe(true);
    expect(game["blackScore"]).toBe(0);
    expect(game["whiteScore"]).toBe(1);
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

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.Black);

    const placed = game["makeMove"](1, 1);

    expect(placed).toBe(true);
    expect(game["blackScore"]).toBe(1);
    expect(game["whiteScore"]).toBe(0);
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

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.Black);

    const placed = game["makeMove"](1, 0);

    expect(placed).toBe(true);
    expect(game["blackScore"]).toBe(1);
    expect(game["whiteScore"]).toBe(0);
    expect(game.intersections[0][0].stone).toEqual(Stone.None);
});

test('makeMove: multi-capture', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
          b
       b  w  b
    b  w  B  w  b
       b  w  b
          b
    */

    game.intersections[1][2].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;
    game.intersections[2][3].stone = Stone.White;
    game.intersections[3][2].stone = Stone.White;

    game.intersections[0][2].stone = Stone.Black;
    game.intersections[1][1].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[3][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[3][3].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[1][3].stone = Stone.Black;

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.Black);
    
    const placed = game["makeMove"](2, 2);

    expect(placed).toBe(true);
    expect(game["blackScore"]).toBe(4);
    expect(game["whiteScore"]).toBe(0);
    expect(game.intersections[1][2].stone).toEqual(Stone.None);
    expect(game.intersections[2][1].stone).toEqual(Stone.None);
    expect(game.intersections[2][3].stone).toEqual(Stone.None);
    expect(game.intersections[3][2].stone).toEqual(Stone.None);
});

test('makeMove: Cannot place immediately captured stone', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
       b
    b  W  b
       b
    */

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][1].stone = Stone.Black;

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.White);
    const placed = game["makeMove"](1, 1);

    expect(placed).toBe(false);
    expect(game["blackScore"]).toBe(0);
    expect(game["whiteScore"]).toBe(0);
    expect(game.intersections[1][1].stone).toEqual(Stone.None);
});

test('makeMove: Can place stone if it will capture stones', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
       b  w
    b  w  B  w
       b  w
    */

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;

    game.intersections[2][0].stone = Stone.White;
    game.intersections[1][1].stone = Stone.White;
    game.intersections[2][2].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.Black);
    const placed = game["makeMove"](2, 1);

    expect(placed).toBe(true);
    expect(game["blackScore"]).toBe(1);
    expect(game["whiteScore"]).toBe(0);
    expect(game.intersections[2][1].stone).toEqual(Stone.Black);
    expect(game.intersections[1][1].stone).toEqual(Stone.None);
});

test('makeMove: Cannot place stone if it repeats the previous board state (Ko)', () => {
    const game = new Game();
    const mockBoard:any = {
        setTurn: () => {},
        drawStones: () => {}
    };
    game.board = mockBoard;

    /*
       b  w
    b  w  B  w
       b  w
    */
    /*
       b  w
    b  W  b  w
       b  w
    */

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;

    game.intersections[2][0].stone = Stone.White;
    game.intersections[1][1].stone = Stone.White;
    game.intersections[2][2].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;

    // These test stones count as part of a completed turn (So they need to be in the gameState)
    game["gameState"].intersections = game.copyIntersections();

    game["setTurn"](Stone.Black);
    const placed1 = game["makeMove"](2, 1);
    
    const placed2 = game["makeMove"](1, 1);

    expect(placed1).toBe(true);
    expect(placed2).toBe(false);
    expect(game["blackScore"]).toBe(1);
    expect(game["whiteScore"]).toBe(0);
    expect(game.intersections[2][1].stone).toEqual(Stone.Black);
    expect(game.intersections[1][1].stone).toEqual(Stone.None);
});

test('Territory: new territory', () => {
    const territory = new Territory(Stone.Black, [
        new Intersection(0, 0),
        new Intersection(0, 1, Stone.White)
    ]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(2);
    expect(territory.score).toBe(3);
});

test('Territory: merge', () => {
    const territory1 = new Territory(Stone.Black, [
        new Intersection(0, 0),
        new Intersection(0, 1, Stone.White)
    ]);
    const territory2 = new Territory(Stone.Black, [
        new Intersection(0, 2, Stone.White),
        new Intersection(0, 3, Stone.White),
        new Intersection(0, 4)
    ]);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Black);
    expect(merged.region).toHaveLength(5);
    expect(merged.score).toBe(8);
});

test('Territory: merge (same owner)', () => {
    const territory1 = new Territory(Stone.Black, []);
    const territory2 = new Territory(Stone.Black, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Black);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (orig is none)', () => {
    const territory1 = new Territory(Stone.None, []);
    const territory2 = new Territory(Stone.Black, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Black);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (new is none)', () => {
    const territory1 = new Territory(Stone.Black, []);
    const territory2 = new Territory(Stone.None, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Black);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (both are none)', () => {
    const territory1 = new Territory(Stone.None, []);
    const territory2 = new Territory(Stone.None, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.None);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (owners are different)', () => {
    const territory1 = new Territory(Stone.Black, []);
    const territory2 = new Territory(Stone.White, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Unknown);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (orig is unknown)', () => {
    const territory1 = new Territory(Stone.Unknown, []);
    const territory2 = new Territory(Stone.Black, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Unknown);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (new is unknown)', () => {
    const territory1 = new Territory(Stone.Black, []);
    const territory2 = new Territory(Stone.Unknown, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Unknown);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (both are unknown)', () => {
    const territory1 = new Territory(Stone.Unknown, []);
    const territory2 = new Territory(Stone.Unknown, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Unknown);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (none and unknown)', () => {
    const territory1 = new Territory(Stone.None, []);
    const territory2 = new Territory(Stone.Unknown, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Unknown);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('Territory: merge (unknown and none)', () => {
    const territory1 = new Territory(Stone.Unknown, []);
    const territory2 = new Territory(Stone.None, []);

    const merged = territory1.merge(territory2);

    expect(merged.owner).toBe(Stone.Unknown);
    expect(merged.region).toHaveLength(0);
    expect(merged.score).toBe(0);
});

test('getApparentTerritory: black enclosed', () => {
    const game = new Game();

    /*
       b
    b  +  b
       b
    */

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][1].stone = Stone.Black;

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.score).toEqual(1);
});

test('getApparentTerritory: white enclosed', () => {
    const game = new Game();

    /*
       w
    w  +  w
       w
    */

    game.intersections[1][0].stone = Stone.White;
    game.intersections[0][1].stone = Stone.White;
    game.intersections[1][2].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.White);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.score).toEqual(1);
});

test('getApparentTerritory: edge', () => {
    const game = new Game();

    /*
    b
    +  B
    b
    */

    game.intersections[0][0].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[1][1].stone = Stone.Black;

    const territory = game['getApparentTerritory'](game.intersections[0][1]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[0][1]);
    expect(territory.score).toEqual(1);
});

test('getApparentTerritory: corner', () => {
    const game = new Game();

    /*
    +  B
    b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;

    const territory = game['getApparentTerritory'](game.intersections[0][0]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[0][0]);
    expect(territory.score).toEqual(1);
});

test('getApparentTerritory: multiple enclosed', () => {
    const game = new Game();

    /*
       b  b  b
    b  +  -  -  B
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][2].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(3);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.score).toEqual(3);
});

test('getApparentTerritory: no apparent territory', () => {
    const game = new Game();

    /*
       b  b  b
    b  +  -  w  B
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][2].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;

    game.intersections[3][1].stone = Stone.White;

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.Unknown);
    expect(territory.region).toHaveLength(0);
    expect(territory.score).toEqual(0);
});

test('getApparentTerritory: odd shape', () => {
    const game = new Game();

    /*
       b  b  b
    b  +  -  -  b
       b  b  -  b
    b  -  -  -  b
       b  b  b
    */

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

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(7);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.region).toContain(game.intersections[3][2]);
    expect(territory.region).toContain(game.intersections[1][3]);
    expect(territory.region).toContain(game.intersections[2][3]);
    expect(territory.region).toContain(game.intersections[3][3]);
    expect(territory.score).toEqual(7);
});

test('getApparentTerritory: odd shape (no apparent territory)', () => {
    const game = new Game();

    /*
       b  b  b
    b  +  -  -  b
       b  b  -  b
    b  w  -  -  b
       b  b  b
    */

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

    game.intersections[1][3].stone = Stone.White;

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.Unknown);
    expect(territory.region).toHaveLength(0);
    expect(territory.score).toEqual(0);
});

test('getApparentTerritory: circle', () => {
    const game = new Game();

    /*
       b  b  b
    b  +  -  -  b
    b  -  b  -  b
    b  -  -  -  b
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(8);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.region).toContain(game.intersections[1][2]);
    expect(territory.region).toContain(game.intersections[3][2]);
    expect(territory.region).toContain(game.intersections[1][3]);
    expect(territory.region).toContain(game.intersections[2][3]);
    expect(territory.region).toContain(game.intersections[3][3]);
    expect(territory.score).toEqual(8);
});

test('getApparentTerritory: area', () => {
    const game = new Game();

    /*
       b  b  b
    b  +  -  -  b
    b  -  -  -  b
    b  -  -  -  b
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    const territory = game['getApparentTerritory'](game.intersections[1][1]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(9);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.region).toContain(game.intersections[1][2]);
    expect(territory.region).toContain(game.intersections[3][2]);
    expect(territory.region).toContain(game.intersections[1][3]);
    expect(territory.region).toContain(game.intersections[2][3]);
    expect(territory.region).toContain(game.intersections[3][3]);
    expect(territory.region).toContain(game.intersections[2][2]);
    expect(territory.score).toEqual(9);
});

test('getApparentTerritory: not captured', () => {
    const game = new Game(3, 3);

    /*
    +  -  -
    -  -  b
    -  -  -
    */

    game.intersections[2][1].stone = Stone.Black;

    const territory = game['getApparentTerritory'](game.intersections[0][0]);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(8);
    expect(territory.region).toContain(game.intersections[0][0]);
    expect(territory.region).toContain(game.intersections[1][0]);
    expect(territory.region).toContain(game.intersections[2][0]);
    expect(territory.region).toContain(game.intersections[0][1]);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[0][2]);
    expect(territory.region).toContain(game.intersections[1][2]);
    expect(territory.region).toContain(game.intersections[2][2]);
    expect(territory.score).toEqual(8);
});

test('getAllApparentTerritories: area', () => {
    const game = new Game();

    /*
    -  b  b  b        w  w  w   
    b  -  -  -  b  w  -  -  -  w
    b  -  -  -  b  w  -  -  -  w
    b  -  -  -  b  w  -  -  -  w
       b  b  b        w  w  w   
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    game.intersections[5][1].stone = Stone.White;
    game.intersections[5][2].stone = Stone.White;
    game.intersections[5][3].stone = Stone.White;
    game.intersections[6][0].stone = Stone.White;
    game.intersections[6][4].stone = Stone.White;
    game.intersections[7][0].stone = Stone.White;
    game.intersections[7][4].stone = Stone.White;
    game.intersections[8][0].stone = Stone.White;
    game.intersections[8][4].stone = Stone.White;
    game.intersections[9][1].stone = Stone.White;
    game.intersections[9][2].stone = Stone.White;
    game.intersections[9][3].stone = Stone.White;

    const territories = game['getAllApparentTerritories']();

    // game["gameState"].intersections = game.copyIntersections();
    // console.log(game["gameState"].toString());

    // for(let t of territories) {
    //     console.log(`${t.owner} | ${t.region[0].hashKey()} | ${t.region.length}`);
    // }

    expect(territories).toHaveLength(3);

    const territory1 = territories[0];
    const territory2 = territories[1];
    const territory3 = territories[2];

    expect(territory1.owner).toBe(Stone.Black);
    expect(territory1.region).toHaveLength(1);
    expect(territory1.region).toContain(game.intersections[0][0]);
    expect(territory1.score).toEqual(1);

    expect(territory2.owner).toBe(Stone.Black);
    expect(territory2.region).toHaveLength(9);
    expect(territory2.region).toContain(game.intersections[1][1]);
    expect(territory2.region).toContain(game.intersections[2][1]);
    expect(territory2.region).toContain(game.intersections[3][1]);
    expect(territory2.region).toContain(game.intersections[1][2]);
    expect(territory2.region).toContain(game.intersections[3][2]);
    expect(territory2.region).toContain(game.intersections[1][3]);
    expect(territory2.region).toContain(game.intersections[2][3]);
    expect(territory2.region).toContain(game.intersections[3][3]);
    expect(territory2.region).toContain(game.intersections[2][2]);
    expect(territory2.score).toEqual(9);

    expect(territory3.owner).toBe(Stone.White);
    expect(territory3.region).toHaveLength(9);
    expect(territory3.region).toContain(game.intersections[6][1]);
    expect(territory3.region).toContain(game.intersections[6][2]);
    expect(territory3.region).toContain(game.intersections[6][3]);
    expect(territory3.region).toContain(game.intersections[7][1]);
    expect(territory3.region).toContain(game.intersections[7][2]);
    expect(territory3.region).toContain(game.intersections[7][3]);
    expect(territory3.region).toContain(game.intersections[8][1]);
    expect(territory3.region).toContain(game.intersections[8][2]);
    expect(territory3.region).toContain(game.intersections[8][3]);
    expect(territory3.score).toEqual(9);
});

test('getTerritory: black encloses white', () => {
    const game = new Game();

    /*
       b
    b  W  b
       b
    */

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][1].stone = Stone.Black;

    game.intersections[1][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.score).toEqual(2);
});

test('getTerritory: white encloses black', () => {
    const game = new Game();

    /*
       w
    w  B  w
       w
    */

    game.intersections[1][0].stone = Stone.White;
    game.intersections[0][1].stone = Stone.White;
    game.intersections[1][2].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;

    game.intersections[1][1].stone = Stone.Black;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.White);

    expect(territory.owner).toBe(Stone.White);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.score).toEqual(2);
});

test('getTerritory: black enclosed empty', () => {
    const game = new Game();

    /*
       b
    b  +  b
       b
    */

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][1].stone = Stone.Black;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.score).toEqual(1);
});

test('getTerritory: white enclosed empty', () => {
    const game = new Game();

    /*
       w
    w  +  w
       w
    */

    game.intersections[1][0].stone = Stone.White;
    game.intersections[0][1].stone = Stone.White;
    game.intersections[1][2].stone = Stone.White;
    game.intersections[2][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.White);

    expect(territory.owner).toBe(Stone.White);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.score).toEqual(1);
});

test('getTerritory: edge', () => {
    const game = new Game();

    /*
    b
    W  b
    b
    */

    game.intersections[0][0].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[1][1].stone = Stone.Black;

    game.intersections[0][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[0][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[0][1]);
    expect(territory.score).toEqual(2);
});

test('getTerritory: corner', () => {
    const game = new Game();

    /*
    W  b
    b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;

    game.intersections[0][0].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[0][0], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(1);
    expect(territory.region).toContain(game.intersections[0][0]);
    expect(territory.score).toEqual(2);
});

test('getTerritory: multiple enclosed', () => {
    const game = new Game();

    /*
       b  b  b
    b  W  -  -  b
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][2].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;

    game.intersections[1][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(3);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.score).toEqual(4);
});

test('getTerritory: multiple enclosed (extra stone)', () => {
    const game = new Game();

    /*
       b  b  b
    b  W  -  w  b
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][2].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][2].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;

    game.intersections[1][1].stone = Stone.White;
    game.intersections[3][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(3);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.score).toEqual(5);
});

test('getTerritory: odd shape', () => {
    const game = new Game();

    /*
       b  b  b
    b  W  -  -  b
       b  b  -  b
    b  -  -  -  b
       b  b  b
    */

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

    game.intersections[1][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(7);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.region).toContain(game.intersections[3][2]);
    expect(territory.region).toContain(game.intersections[1][3]);
    expect(territory.region).toContain(game.intersections[2][3]);
    expect(territory.region).toContain(game.intersections[3][3]);
    expect(territory.score).toEqual(8);
});

test('getTerritory: odd shape (extra stone)', () => {
    const game = new Game();

    /*
       b  b  b
    b  W  -  -  b
       b  b  -  b
    b  w  -  -  b
       b  b  b
    */

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

    game.intersections[1][1].stone = Stone.White;
    game.intersections[1][3].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(7);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.region).toContain(game.intersections[3][2]);
    expect(territory.region).toContain(game.intersections[1][3]);
    expect(territory.region).toContain(game.intersections[2][3]);
    expect(territory.region).toContain(game.intersections[3][3]);
    expect(territory.score).toEqual(9);
});

test('getTerritory: circle', () => {
    const game = new Game();

    /*
       b  b  b
    b  W  -  -  b
    b  -  b  -  b
    b  -  -  -  b
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][2].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    game.intersections[1][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(8);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.region).toContain(game.intersections[1][2]);
    expect(territory.region).toContain(game.intersections[3][2]);
    expect(territory.region).toContain(game.intersections[1][3]);
    expect(territory.region).toContain(game.intersections[2][3]);
    expect(territory.region).toContain(game.intersections[3][3]);
    expect(territory.score).toEqual(9);
});

test('getTerritory: area', () => {
    const game = new Game();

    /*
       b  b  b
    b  W  -  -  b
    b  -  -  -  b
    b  -  -  -  b
       b  b  b
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    game.intersections[1][1].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[1][1], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(9);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[2][1]);
    expect(territory.region).toContain(game.intersections[3][1]);
    expect(territory.region).toContain(game.intersections[1][2]);
    expect(territory.region).toContain(game.intersections[3][2]);
    expect(territory.region).toContain(game.intersections[1][3]);
    expect(territory.region).toContain(game.intersections[2][3]);
    expect(territory.region).toContain(game.intersections[3][3]);
    expect(territory.region).toContain(game.intersections[2][2]);
    expect(territory.score).toEqual(10);
});

test('getTerritory: most of board', () => {
    const game = new Game(3, 3);

    /*
    W  b   
    -  -  b
    -  -  w
    */

    game.intersections[1][0].stone = Stone.Black;
    game.intersections[2][1].stone = Stone.Black;

    game.intersections[0][0].stone = Stone.White;
    game.intersections[2][2].stone = Stone.White;

    const territory = game['getTerritory'](game.intersections[0][0], Stone.Black);

    expect(territory.owner).toBe(Stone.Black);
    expect(territory.region).toHaveLength(6);
    expect(territory.region).toContain(game.intersections[0][0]);
    expect(territory.region).toContain(game.intersections[0][1]);
    expect(territory.region).toContain(game.intersections[1][1]);
    expect(territory.region).toContain(game.intersections[0][2]);
    expect(territory.region).toContain(game.intersections[1][2]);
    expect(territory.region).toContain(game.intersections[2][2]);
    expect(territory.score).toEqual(8);
});

test('claimTerritory: added to claimed array and claimed hash set', () => {
    const game = new Game();

    /*
       b  b  b        w  w  w   
    b  -  -  -  b  w  -  -  -  w
    b  -  w  -  b  w  -  b  -  w
    b  -  -  -  b  w  -  -  -  w
       b  b  b        w  w  w   
    */

   game.intersections[0][1].stone = Stone.Black;
   game.intersections[0][2].stone = Stone.Black;
   game.intersections[0][3].stone = Stone.Black;
   game.intersections[1][0].stone = Stone.Black;
   game.intersections[1][4].stone = Stone.Black;
   game.intersections[2][0].stone = Stone.Black;
   game.intersections[2][4].stone = Stone.Black;
   game.intersections[3][0].stone = Stone.Black;
   game.intersections[3][4].stone = Stone.Black;
   game.intersections[4][1].stone = Stone.Black;
   game.intersections[4][2].stone = Stone.Black;
   game.intersections[4][3].stone = Stone.Black;

   game.intersections[5][1].stone = Stone.White;
   game.intersections[5][2].stone = Stone.White;
   game.intersections[5][3].stone = Stone.White;
   game.intersections[6][0].stone = Stone.White;
   game.intersections[6][4].stone = Stone.White;
   game.intersections[7][0].stone = Stone.White;
   game.intersections[7][4].stone = Stone.White;
   game.intersections[8][0].stone = Stone.White;
   game.intersections[8][4].stone = Stone.White;
   game.intersections[9][1].stone = Stone.White;
   game.intersections[9][2].stone = Stone.White;
   game.intersections[9][3].stone = Stone.White;

   game.intersections[2][2].stone = Stone.White;

   game.intersections[7][2].stone = Stone.Black;

   const claimed1 = game['claimTerritory'](2, 2, false);
   const claimed2 = game['claimTerritory'](7, 2, false);

   const claimedTerritories = game["claimedTerritories"];
   const claimedTerritoryLookup = game["claimedTerritoryLookup"];

   expect(claimed1).toBe(true);
   expect(claimed2).toBe(true);
   expect(claimedTerritories).toHaveLength(2);
   expect(claimedTerritories[0].owner).toBe(Stone.Black);
   expect(claimedTerritories[0].region).toHaveLength(9);
   expect(claimedTerritories[0].score).toBe(10);
   expect(claimedTerritories[1].owner).toBe(Stone.White);
   expect(claimedTerritories[1].region).toHaveLength(9);
   expect(claimedTerritories[1].score).toBe(10);
   expect(Object.keys(claimedTerritoryLookup["hashSet"])).toHaveLength(18);

   expect(claimedTerritoryLookup.includes(game.intersections[1][1])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[1][2])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[1][3])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[2][1])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[2][2])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[2][3])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[3][1])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[3][2])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[3][3])).toBe(true);
   
   expect(claimedTerritoryLookup.includes(game.intersections[6][1])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[6][2])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[6][3])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[7][1])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[7][2])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[7][3])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[8][1])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[8][2])).toBe(true);
   expect(claimedTerritoryLookup.includes(game.intersections[8][3])).toBe(true);
});

test('getAllTerritories: areas', () => {
    const game = new Game();

    /*
    _____________________________________________________________
    |  -  b  b  b        w  w  w  -  w  w  w        b  b  b  -  |
    |  b  -  -  -  b  w  -  -  -  w  -  -  -  w  b  -  -  -  b  |
    |  b  -  -  -  b  w  -  -  -  w  -  b  -  w  b  -  w  -  b  |
    |  b  -  -  -  b  w  -  -  -  w  -  -  -  w  b  -  -  -  b  |
    |     b  b  b        w  w  w     w  w  w        b  b  b     |
    */

    game.intersections[0][1].stone = Stone.Black;
    game.intersections[0][2].stone = Stone.Black;
    game.intersections[0][3].stone = Stone.Black;
    game.intersections[1][0].stone = Stone.Black;
    game.intersections[1][4].stone = Stone.Black;
    game.intersections[2][0].stone = Stone.Black;
    game.intersections[2][4].stone = Stone.Black;
    game.intersections[3][0].stone = Stone.Black;
    game.intersections[3][4].stone = Stone.Black;
    game.intersections[4][1].stone = Stone.Black;
    game.intersections[4][2].stone = Stone.Black;
    game.intersections[4][3].stone = Stone.Black;

    game.intersections[5][1].stone = Stone.White;
    game.intersections[5][2].stone = Stone.White;
    game.intersections[5][3].stone = Stone.White;
    game.intersections[6][0].stone = Stone.White;
    game.intersections[6][4].stone = Stone.White;
    game.intersections[7][0].stone = Stone.White;
    game.intersections[7][4].stone = Stone.White;
    game.intersections[8][0].stone = Stone.White;
    game.intersections[8][4].stone = Stone.White;
    game.intersections[9][1].stone = Stone.White;
    game.intersections[9][2].stone = Stone.White;
    game.intersections[9][3].stone = Stone.White;

    game.intersections[10][0].stone = Stone.White;
    game.intersections[10][4].stone = Stone.White;
    game.intersections[11][0].stone = Stone.White;
    game.intersections[11][4].stone = Stone.White;
    game.intersections[12][0].stone = Stone.White;
    game.intersections[12][4].stone = Stone.White;
    game.intersections[13][1].stone = Stone.White;
    game.intersections[13][2].stone = Stone.White;
    game.intersections[13][3].stone = Stone.White;
    
    game.intersections[14][1].stone = Stone.Black;
    game.intersections[14][2].stone = Stone.Black;
    game.intersections[14][3].stone = Stone.Black;
    game.intersections[15][0].stone = Stone.Black;
    game.intersections[15][4].stone = Stone.Black;
    game.intersections[16][0].stone = Stone.Black;
    game.intersections[16][4].stone = Stone.Black;
    game.intersections[17][0].stone = Stone.Black;
    game.intersections[17][4].stone = Stone.Black;
    game.intersections[18][1].stone = Stone.Black;
    game.intersections[18][2].stone = Stone.Black;
    game.intersections[18][3].stone = Stone.Black;

    game.intersections[11][2].stone = Stone.Black;

    game.intersections[16][2].stone = Stone.White;

    // game["gameState"].intersections = game.copyIntersections();
    // console.log(game["gameState"].toString());

    const claimed1 = game['claimTerritory'](11, 2, false);
    const claimed2 = game['claimTerritory'](16, 2, false);
    const territories = game['getAllTerritories']();

    // for(let t of territories) {
    //     console.log(`${t.owner} | ${t.region[0].hashKey()} | ${t.region.length}`);
    // }

    expect(claimed1).toBe(true);
    expect(claimed2).toBe(true);
    expect(territories).toHaveLength(7);

    const territory1 = territories[0];
    const territory2 = territories[1];
    const territory3 = territories[2];
    const territory4 = territories[3];
    const territory5 = territories[4];
    const territory6 = territories[5];
    const territory7 = territories[6];

    expect(territory1.owner).toBe(Stone.White);
    expect(territory1.region).toHaveLength(9);
    expect(territory1.score).toEqual(10);

    expect(territory2.owner).toBe(Stone.Black);
    expect(territory2.region).toHaveLength(9);
    expect(territory2.score).toEqual(10);

    expect(territory3.owner).toBe(Stone.Black);
    expect(territory3.region).toHaveLength(1);
    expect(territory3.score).toEqual(1);

    expect(territory4.owner).toBe(Stone.Black);
    expect(territory4.region).toHaveLength(9);
    expect(territory4.score).toEqual(9);

    expect(territory5.owner).toBe(Stone.White);
    expect(territory5.region).toHaveLength(9);
    expect(territory5.score).toEqual(9);

    expect(territory6.owner).toBe(Stone.White);
    expect(territory6.region).toHaveLength(1);
    expect(territory6.score).toEqual(1);

    expect(territory7.owner).toBe(Stone.Black);
    expect(territory7.region).toHaveLength(1);
    expect(territory7.score).toEqual(1);
});