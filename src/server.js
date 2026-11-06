import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";

const httpServer = createServer(app);

httpServer.listen(env.PORT, () => {
  console.log(`ScaleChat server running on http://localhost:${env.PORT}`);
});
