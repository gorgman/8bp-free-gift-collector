import { exit } from "process";

import { logger } from "./logger.js";
import { collectRewards } from "./collect-rewards.js";
import { updateReadme } from "./update-readme.js";

const USER_UNIQUE_ID = "4722012226";

async function main() {
  const rewards = await collectRewards(USER_UNIQUE_ID);
  await updateReadme(rewards);
  logger("success", "🤖 Script complete.");
  exit();
}
main();
