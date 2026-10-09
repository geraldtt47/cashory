import app from "./app";

export type { AppType } from "./app";

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
