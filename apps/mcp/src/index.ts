import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./logger.js";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

process.on("uncaughtException", (err) => {
  logger.fatal(err, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection");
  process.exit(1);
});

createApp({ port }).catch((err) => {
  logger.fatal(err, "Failed to start server");
  process.exit(1);
});
