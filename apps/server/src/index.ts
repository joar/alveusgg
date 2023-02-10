import type { Express, Request, Response } from "express";
import express from "express";
import * as dotenv from "dotenv";

import { prisma } from "./db/client";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get("/", async (req: Request, res: Response) => {
  const lastUpdate = await prisma.channelUpdateEvent.findFirst();

  res.send("Server is running! Last Update: " + lastUpdate?.title);
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
