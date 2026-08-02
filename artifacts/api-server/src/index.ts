import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  logger.warn(
    { rawPort },
    "Invalid PORT value, falling back to default port 3000",
  );
}

app.listen(Number.isNaN(port) || port <= 0 ? 3000 : port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: Number.isNaN(port) || port <= 0 ? 3000 : port }, "Server listening");
});
