import * as puppeteer from 'puppeteer';
import { Board } from './game';

test('stoneRadius', () => {
    const board = new Board(null, 38, 38, 19, 19, null);

    expect(board.stoneRadius).toBe(1);
});

test('placing stones correctly', async () => {
    const browser = await puppeteer.launch({
        // headless: false,
        // slowMo: 80,
        // args: ['--window-size=1920,1080'],
        // ignoreDefaultArgs: ['--disable-extensions']
    });
    
    const page = await browser.newPage();
    await page.goto('localhost:8080');

    await page.click('#int-0-0');
    await page.click('#int-1-1');
    await page.click('#int-1-0');

    const intersections = await page.$$('.intersection-area');
    const black = await page.$$('.stone.black');
    const white = await page.$$('.stone.white');
    const empty = await page.$$('.stone.empty');

    expect(intersections).toHaveLength(19*19);
    expect(black).toHaveLength(2);
    expect(white).toHaveLength(1);
    expect(empty).toHaveLength(19 * 19 - 3);
}, 10000);