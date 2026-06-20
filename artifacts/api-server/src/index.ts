import { createServer } from "http";
import app from "./app";
import { initSocket } from "./lib/socket";
import { logger } from "./lib/logger";
import { store } from "./lib/store";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
initSocket(httpServer);

store.seed()
  .then(() => logger.info("Seed data verified"))
  .catch((err) => logger.error({ err }, "Seed failed"));

httpServer.listen(port, () => {
  logger.info({ port }, "Swift Tow API Server listening");
});
