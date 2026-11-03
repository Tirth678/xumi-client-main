import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT ?? 3001);
const server = app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));

// Drain in-flight requests on deploy/restart instead of dropping them.
const shutdown = (signal: string) => {
  console.log(`${signal} received; shutting down gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
