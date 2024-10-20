import puppeteer from "puppeteer";
import fs from "fs/promises";

const USER_UNIQUE_ID = "4722012226";
const DELAY = 100;

const browser = await puppeteer.launch({ headless: true, slowMo: DELAY });
const page = await browser.newPage();
let rewards = [];
try {
  await page.goto("https://8ballpool.com/en/shop");
  const loginButton = await page.waitForSelector(
    `button[data-testid="btn-login-modal"]`
  );
  if (loginButton) {
    await loginButton.click();
    await page.type('input[data-testid="input-unique-id"]', USER_UNIQUE_ID, {
      delay: DELAY,
    });
    const goButton = await page.waitForSelector(
      'button[data-testid="btn-user-go"]'
    );
    await goButton.click();
  }
  const productCards = await page.$$(".product-list-item");
  for (const card of productCards) {
    const priceButton = await card.$("button");
    const price = await priceButton.evaluate((el) => el.textContent.trim());
    console.log(price);
    if (price === "FREE") {
      await priceButton.click();
      const nameElement = await card.$("h3");
      const name = await nameElement.evaluate((el) => el.textContent.trim());
      const quantityElement = await card.$("div > .text-gold");
      const quantity = await quantityElement.evaluate((el) =>
        el.textContent.trim()
      );
      rewards.push(`(${name})(${quantity})`);
    }
  }
} catch (error) {
  console.log(error);
} finally {
  await browser.close();
}
if (rewards.length !== 0) {
  const today = new Date();
  let todaysRewards = `| ${today.toLocaleDateString()} | `;
  for (let i = 0; i < length(rewards); i++) {
    if (i === rewards.length) {
      todaysRewards = todaysRewards + " |";
    } else {
      todaysRewards = todaysRewards + "; ";
    }
  }
  let rewardsMD = await fs.readFile("REWARDS.md", "utf8");
  rewardsMD += todaysRewards;
  await fs.writeFile("REWARDS.md", rewardsMD);
}
