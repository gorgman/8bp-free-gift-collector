import puppeteer from "puppeteer";

import { logger } from "./logger.js";
import { makeRewardData } from "./utils.js";

/**
 *
 * @param {string} userUniqueID
 * @returns {string[]}
 *
 */
export const collectRewards = async (userUniqueID) => {
  const pageUrl = "https://8ballpool.com/en/shop";
  const delay = 100;
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: delay,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"
  );

  logger("info", `🌐 Navigating to ${pageUrl}`);
  await page.goto(pageUrl, { waitUntil: "networkidle2" });
  const loginButton = await page.waitForSelector(
    'button[data-testid="btn-login-modal"]',
    { visible: true }
  );
  if (loginButton) {
    await loginButton.click();
    await page.type('input[data-testid="input-unique-id"]', userUniqueID, {
      delay,
    });
    const goButton = await page.waitForSelector(
      'button[data-testid="btn-user-go"]'
    );
    await goButton.click();
    logger("success", "✅ User logged in.");
  } else {
    throw new Error("Unable to login.");
  }

  let rewards = [];
  const products = await page.$$(".product-list-item");
  logger("info", `💡 ${products.length} products found.`);
  for (const [index, product] of products.entries()) {
    const priceButton = await product.$("button");
    const price = await priceButton.evaluate((el) => el.textContent.trim());
    const imageElement = await product.$("img");
    const imageSrc = await imageElement.evaluate((i) => i.getAttribute("src"));
    const nameElement = await product.$("h3");
    const name = await nameElement.evaluate((el) => el.textContent.trim());
    const quantityElement = await product.$(".amount-text");
    let quantity = "";
    if (quantityElement)
      quantity = await quantityElement.evaluate((el) => el.textContent.trim());
    logger(
      "info",
      `[${index + 1}/${
        products.length
      }] Price:${price}; Name:${name}; Quantity:${quantity};`
    );
    if (price === "FREE" || price === "Claimed") {
      await priceButton.click();
      rewards.push(makeRewardData(imageSrc, name, quantity));
      logger("success", `🎉 Claimed: [${index + 1}/${products.length}]\n`);
    }
  }
  await browser.close();
  logger("info", "❎ Browser closed.");
  if (rewards.length === 0) {
    throw new Error("No rewards found");
  }
  return rewards;
};
