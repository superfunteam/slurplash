/**
 * Slurplash end-to-end tour.
 * Spins up a host, four players and a couple of audience members, plays a
 * full game, and drops screenshots into ./shots. Run with the dev server up:
 *   npm run dev   (in another terminal)
 *   npm run tour
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.OUT_DIR ?? "shots";
fs.mkdirSync(OUT, { recursive: true });

const PLAYERS = [
  { name: "Clark", avatar: "Slurpee" },
  { name: "Dana", avatar: "Taquito" },
  { name: "Priya", avatar: "Glazed Donut" },
  { name: "Marcus", avatar: "Big Bite" },
];
const ANSWERS = [
  "It's screaming because it saw the Q3 numbers",
  "The nacho cheese pump gained sentience",
  "Oh Thank Heaven, It's Not Wawa",
  "Regret, but make it refreshing",
  "A single glazed donut from 2009",
  "Whatever the CFO brings on Fridays",
  "It's hydraulic fluid. Delicious hydraulic fluid.",
  "The taquitos are older than the interns",
];
const BIG_BITE = [
  ["Your phone", "A Slurpee", "The district manager"],
  ["Hopes", "Dreams", "A whole rotisserie chicken"],
  ["Ice", "More ice", "The ice machine"],
  ["Sunglasses", "A gas pump nozzle", "Regret"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  console.log("📸", name);
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const hostCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const host = await hostCtx.newPage();
host.on("pageerror", (e) => console.error("host pageerror:", e.message));
await host.goto(`${BASE}/host`);
await host.waitForURL(/\/host\/\d{4}/, { timeout: 30000 });
const code = host.url().match(/\/host\/(\d{4})/)[1];
console.log("room", code);
await host.waitForSelector("text=Room code");
await host.mouse.click(960, 1000); // unlock audio chip
await sleep(600);
await shot(host, "01-host-lobby-empty");

const phone = { width: 390, height: 844 };
const players = [];
for (const p of PLAYERS) {
  const ctx = await browser.newContext({ viewport: phone, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error(`${p.name} pageerror:`, e.message));
  await page.goto(`${BASE}/play?code=${code}`);
  await page.waitForSelector('input[aria-label="Nickname"]');
  if (p.name === PLAYERS[1].name) {
    await page.getByLabel(p.avatar).click();
    await page.fill('input[aria-label="Nickname"]', p.name);
    await shot(page, "02-phone-join-form");
  } else {
    await page.getByLabel(p.avatar).click();
    await page.fill('input[aria-label="Nickname"]', p.name);
  }
  await page.getByRole("button", { name: /Let.s play/ }).click();
  await page.waitForSelector("text=hot seat", { timeout: 15000 });
  players.push({ ...p, page });
  await sleep(400);
}
await sleep(800);
await shot(host, "03-host-lobby-players");
await shot(players[0].page, "04-phone-lobby-vip");

const audience = [];

// VIP starts the game from their phone
await players[0].page.getByRole("button", { name: /Start the game/ }).click();
await host.waitForSelector("text=Snack Run", { timeout: 15000 });
await sleep(1900);
await shot(host, "05-host-round-intro");

// late joiners become audience
const crowd = [];
for (let i = 0; i < 3; i++) {
  const ctx = await browser.newContext({ viewport: phone, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/play?code=${code}`);
  await page.waitForSelector('input[aria-label="Nickname"]');
  await page.fill('input[aria-label="Nickname"]', `Crowd ${i + 1}`);
  await page.getByRole("button", { name: /Let.s play/ }).click();
  await page.waitForSelector("text=Audience", { timeout: 15000 });
  crowd.push(page);
}

// answering phase
await host.waitForSelector("text=Write something funny", { timeout: 15000 });
await sleep(800);
await shot(host, "06-host-input-phase");
await players[1].page.waitForSelector("textarea");
await players[1].page.fill("textarea", ANSWERS[1]);
await shot(players[1].page, "07-phone-answer-entry");
await players[1].page.fill("textarea", "");

let ai = 0;
for (const p of players) {
  for (let k = 0; k < 2; k++) {
    await p.page.waitForFunction(() => { const t = document.querySelector("textarea"); return t && t.value === ""; }, null, { timeout: 10000 });
    await p.page.fill("textarea", ANSWERS[ai++ % ANSWERS.length]);
    await p.page.getByRole("button", { name: /Lock it in/ }).click();
    await p.page.waitForFunction(() => { const t = document.querySelector("textarea"); return !t || t.value === ""; }, null, { timeout: 10000 });
    await sleep(350);
  }
}
await shot(host, "08-host-input-locked");
await shot(players[0].page, "09-phone-answers-in");

// showdown: matchup 1
await host.waitForSelector("text=VS", { timeout: 15000 });
await sleep(1200);
await shot(host, "10-host-showdown-prompt");
await host.waitForSelector("text=vote now", { timeout: 20000 });
await sleep(1500);
await shot(host, "11-host-showdown-voting");
// audience + eligible players vote for A
const voteFor = async (page, which) => {
  const btns = page.locator("button", { hasText: /Blue Raspberry|Cherry/ });
  const count = await btns.count();
  if (count >= 2) await btns.nth(which).click().catch(() => {});
};
await crowd[0].waitForSelector("text=Which one wins", { timeout: 10000 }).catch(() => {});
await sleep(700);
await shot(crowd[0], "12-phone-vote");
for (const [i, pg] of [...crowd, ...audience].entries()) await voteFor(pg, i % 3 === 0 ? 1 : 0);
for (const p of players) await voteFor(p.page, 0);
for (const pg of crowd) await pg.getByLabel("Slurpee").click().catch(() => {});
await host.waitForSelector("text=Base pot", { timeout: 25000 });
await sleep(2400);
await shot(host, "13-host-showdown-results");
await shot(crowd[1], "14-phone-vote-locked");

// remaining matchups: keep voting until standings
const drive = async (untilText, pickB = false) => {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    if (await host.locator(`text=${untilText}`).count()) return;
    if (await host.locator("text=vote now").count()) {
      for (const [i, pg] of [...crowd, ...audience].entries()) await voteFor(pg, pickB ? i % 2 : 0);
      for (const p of players) await voteFor(p.page, pickB ? 1 : 0);
      await sleep(2500);
    } else {
      await sleep(800);
    }
  }
  throw new Error(`drive: never saw ${untilText}`);
};
await drive("Standings", true);
await sleep(2600);
await shot(host, "15-host-standings");
await shot(players[2].page, "16-phone-standings");

// Round 2
await host.waitForSelector("text=Double points", { timeout: 40000 });
await host.waitForSelector("text=Write something funny", { timeout: 40000 });
ai = 3;
for (const p of players) {
  for (let k = 0; k < 2; k++) {
    await p.page.waitForFunction(() => { const t = document.querySelector("textarea"); return t && t.value === ""; }, null, { timeout: 10000 });
    await p.page.fill("textarea", ANSWERS[ai++ % ANSWERS.length]);
    await p.page.getByRole("button", { name: /Lock it in/ }).click();
    await p.page.waitForFunction(() => { const t = document.querySelector("textarea"); return !t || t.value === ""; }, null, { timeout: 10000 });
    await sleep(350);
  }
}
await host.waitForSelector("text=vote now", { timeout: 20000 });
await sleep(1200);
await shot(host, "17-host-round2-voting");
await drive("Standings", false);

// Round 3
await host.waitForSelector("text=Three answers. Go.", { timeout: 60000 });
await sleep(800);
await shot(host, "18-host-bigbite-input");
for (const [i, p] of players.entries()) {
  const inputs = p.page.locator("input");
  for (let k = 0; k < 3; k++) await inputs.nth(k).fill(BIG_BITE[i][k]);
  if (i === 0) await shot(p.page, "19-phone-bigbite-entry");
  await p.page.getByRole("button", { name: /Send all three/ }).click();
  await sleep(200);
}
await host.waitForSelector("text=Here they come", { timeout: 20000 });
await sleep(6000);
await shot(host, "20-host-bigbite-reveal");
await host.waitForSelector("text=Pick", { timeout: 30000 });
await players[0].page.waitForSelector("text=Pick", { timeout: 20000 });
await sleep(600);
const pickThree = async (page, offset) => {
  const btns = page.locator("button:has(span.display-soft)").filter({ hasNot: page.locator("text=You") });
  const n = await btns.count();
  let picked = 0;
  for (let i = 0; i < n && picked < 3; i++) {
    const b = btns.nth((i + offset) % n);
    if (await b.isEnabled()) {
      await b.click().catch(() => {});
      picked++;
    }
  }
};
for (const [i, p] of players.entries()) await pickThree(p.page, i * 2);
await shot(players[1].page, "21-phone-bigbite-vote");
for (const [i, pg] of [...crowd, ...audience].entries()) await pickThree(pg, i);
await sleep(800);
await shot(host, "22-host-bigbite-voting");
await host.waitForSelector("text=Authors revealed", { timeout: 40000 });
await sleep(3200);
await shot(host, "23-host-bigbite-results");

// Podium
await host.waitForSelector("text=Final results", { timeout: 30000 });
await sleep(4300 * 3 + 1500);
await shot(host, "24-host-podium-winner");
await host.waitForSelector("text=Play again", { timeout: 20000 });
await sleep(1500);
await shot(host, "25-host-podium-stats");
await shot(players[0].page, "26-phone-podium");

await browser.close();
console.log("done");
