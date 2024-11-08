import puppeteer from "puppeteer";
import fs from "fs/promises";

const USER_UNIQUE_ID = "4722012226";
const DELAY = 100;

(async () => {
  const browser = await puppeteer.launch({ headless: true, slowMo: DELAY });
  const page = await browser.newPage();
  let rewards = [];

  try {
    console.log("Navigating to 8 Ball Pool shop...");
    await page.goto("https://8ballpool.com/en/shop");

    const loginButton = await page.waitForSelector(
      `button[data-testid="btn-login-modal"]`
    );
    if (loginButton) {
      console.log("Logging in user...");
      await loginButton.click();
      await page.type('input[data-testid="input-unique-id"]', USER_UNIQUE_ID, {
        delay: DELAY,
      });

      const goButton = await page.waitForSelector(
        'button[data-testid="btn-user-go"]'
      );
      await goButton.click();
    } else {
      console.log("Login button not found");
    }

    const productCards = await page.$$(".product-list-item");
    for (const card of productCards) {
      const priceButton = await card.$("button");
      const price = await priceButton.evaluate((el) => el.textContent.trim());

      if (price === "FREE") {
        await priceButton.click();
        const nameElement = await card.$("h3");
        const name = await nameElement.evaluate((el) => el.textContent.trim());
        const quantityElement = await card.$("div > .text-gold");
        const quantity = await quantityElement.evaluate((el) =>
          el.textContent.trim()
        );
        console.log("Claimed:", name);
        rewards.push(`(${name})(${quantity})`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }

  // Adding gifts to README
  if (rewards.length !== 0) {
    const today = new Date();
    const todaysRewards = `| ${today.toLocaleDateString()} | ${rewards.join(
      "; "
    )} |\n`;
    try {
      let rewardsMD = await fs.readFile("README.md", "utf8");
      rewardsMD += todaysRewards;
      await fs.writeFile("README.md", rewardsMD);
    } catch (error) {
      console.error("Error writing to README.md");
    }
  } else {
    console.log("No free gifts found");
  }
})();
