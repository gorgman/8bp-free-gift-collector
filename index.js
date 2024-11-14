import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

const logMessage = (type, message) => {
  const colors = {
    success: "\x1b[32m",
    error: "\x1b[31m",
    info: "\x1b[36m",
    reset: "\x1b[0m",
  };
  const color = colors[type] || colors.info;
  console.log(`${color}%s${colors.reset}`, message, "\n");
};

const makeRewardData = (imageSrc, name, quantity) => {
  return `<img src="${imageSrc}" height="25" alt="${name}"/> ${name} X ${quantity}`;
};

const URL = "https://8ballpool.com/en/shop";
const USER_UNIQUE_ID = "4722012226";
const DELAY = 100;

const collectRewards = async () => {
  const browser = await puppeteer.launch({ headless: true, slowMo: DELAY });
  const page = await browser.newPage();
  logMessage("info", `🌐 Navigating to ${URL}`);
  await page.goto(URL);
  const loginButton = await page.waitForSelector(
    'button[data-testid="btn-login-modal"]'
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
    logMessage("success", "✅ User logged in.");
  } else {
    throw new Error("Unable to login.");
  }
  let rewards = [];
  const products = await page.$$(".product-list-item");
  logMessage("info", `💡 ${products.length} products found.`);
  for (const product of products) {
    const priceButton = await product.$("button");
    const price = await priceButton.evaluate((el) => el.textContent.trim());
    if (price === "FREE") {
      await priceButton.click();
      const imageElement = await product.$("img");
      const imageSrc = await imageElement.evaluate((i) =>
        i.getAttribute("src")
      );
      const nameElement = await product.$("h3");
      const name = await nameElement.evaluate((el) => el.textContent.trim());
      const quantityElement = await product.$(".amount-text");
      const quantity = await quantityElement.evaluate((el) =>
        el.textContent.trim()
      );
      rewards.push(makeRewardData(imageSrc, name, quantity));
      logMessage("success", `🎉 Claimed: ${name}`);
    }
  }
  await browser.close();
  logMessage("info", "❎ Browser closed.");
  if (rewards.length === 0) {
    throw new Error("No rewards found");
  }
  return rewards;
};

const updateReadme = async (rewards) => {
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
    logMessage("info", `🗄️ Archived ${monthYear}`);
    prevReadmeContent = await fs.readFile("README.example.md", "utf8");
  } else {
    prevReadmeContent = await fs.readFile("README.md", "utf8");
  }
  prevReadmeContent += todaysRewards;
  await fs.writeFile("README.md", prevReadmeContent);
  logMessage("success", `📝 Updated README`);
};

const rewards = await collectRewards();
await updateReadme(rewards);
logMessage("success", "🤖 Script complete.");
