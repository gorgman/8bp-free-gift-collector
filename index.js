import puppeteer from "puppeteer";
import fs from "fs/promises";
import "path";

const URL = "https://8ballpool.com/en/shop";
const USER_UNIQUE_ID = "4722012226";
const DELAY = 100;

const LOGIN = {
  BUTTON: 'button[data-testid="btn-login-modal"]',
  INPUT: 'input[data-testid="input-unique-id"]',
  GO: 'button[data-testid="btn-user-go"]',
};

const makeRewardData = (imageSrc, name, quantity) => {
  return `<img src="${imageSrc}" height="25" alt="${name}"/> ${name} X ${quantity}`;
};

(async () => {
  const browser = await puppeteer.launch({ headless: true, slowMo: DELAY });
  const page = await browser.newPage();
  let rewards = [];

  console.log("Navigating to 8 Ball Pool shop...");
  await page.goto(URL);
  const loginButton = await page.waitForSelector(LOGIN.BUTTON);
  if (loginButton) {
    console.log("Logging in user...");
    await loginButton.click();
    await page.type(LOGIN.INPUT, USER_UNIQUE_ID, { delay: DELAY });
    const goButton = await page.waitForSelector(LOGIN.GO);
    await goButton.click();
  } else {
    console.log("Login button not found");
  }

  const productCards = await page.$$(".product-list-item");
  console.log(`${productCards.length} products found.`);
  for (const card of productCards) {
    const priceButton = await card.$("button");
    const price = await priceButton.evaluate((el) => el.textContent.trim());
    if (price === "FREE") {
      await priceButton.click();
      const imageElement = await card.$("img");
      const imageSrc = await imageElement.evaluate((i) =>
        i.getAttribute("src")
      );
      const nameElement = await card.$("h3");
      const name = await nameElement.evaluate((el) => el.textContent.trim());
      const quantityElement = await card.$(".amount-text");
      const quantity = await quantityElement.evaluate((el) =>
        el.textContent.trim()
      );
      console.log(`Claimed: ${name} ${quantity} ${imageSrc}`);
      rewards.push(makeRewardData(imageSrc, name, quantity));
    }
  }
  await browser.close();
  console.log("Browser closed.");

  if (rewards.length !== 0) {
    const today = new Date();
    const todaysRewards = `| ${today.toLocaleDateString()} | ${rewards.join(
      "; "
    )} |\n`;
    let prevReadmeContent;
    if (today.getDate() === 1) {
      const monthYear = `${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}-${today.getFullYear()}`;
      const archiveFileName = path.join("archive", `${monthYear}.md`);
      await fs.mkdir("archive", { recursive: true });
      const currentReadme = await fs.readFile("README.md", "utf8");
      await fs.writeFile(archiveFileName, currentReadme);
      console.log(`Archived ${archiveFileName}`);
      prevReadmeContent = await fs.readFile("README.example.md", "utf8");
    } else {
      prevReadmeContent = await fs.readFile("README.md", "utf8");
    }
    prevReadmeContent += todaysRewards;
    await fs.writeFile("README.md", prevReadmeContent);
  } else {
    console.log("No free gifts found");
  }
})();
