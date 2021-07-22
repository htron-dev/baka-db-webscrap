import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";

import createFileQueue from "./queue-create-file";

const serverAdapter = new ExpressAdapter();

createBullBoard({
    queues: [new BullAdapter(createFileQueue)],
    serverAdapter,
});

const app = express();

app.get("/", (req, res) =>
    res.json({
        hello: "word",
        queuesLink: "http://localhost:${3333}/queues",
    })
);

serverAdapter.setBasePath("/queues");

app.use("/queues", serverAdapter.getRouter());

app.listen(3333, () => console.log(`server ready: http://localhost:${3333}`));
