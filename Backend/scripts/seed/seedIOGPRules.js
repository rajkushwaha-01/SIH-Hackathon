import { connectDB, disconnectDB } from "../../src/config/db.js";
import { LifeSavingRulesService } from "../../src/services/lifeSavingRules/LifeSavingRulesService.js";
import { logger } from "../../src/utils/logger.js";

const run = async () => {
  try {
    logger.info("Connecting to MongoDB for seeding IOGP Life-Saving Rules...");
    await connectDB();
    const result = await LifeSavingRulesService.seedRules();
    logger.info(`IOGP Life-Saving Rules Seeding Complete: ${JSON.stringify(result)}`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error("Failed to seed IOGP Life-Saving Rules:", error);
    process.exit(1);
  }
};

// If executed directly from CLI
if (process.argv[1]?.endsWith("seedIOGPRules.js")) {
  run();
}

export default run;
