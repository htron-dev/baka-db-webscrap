import express from "express";
import { Queue } from "bull";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";

export function createApp(queues: Queue[]) {
    const serverAdapter = new ExpressAdapter();

    createBullBoard({
        queues: queues.map((q) => new BullAdapter(q)),
        serverAdapter,
    });

    const app = express();

    const port = process.env.PORT || 3333;

    app.get("/", (req, res) =>
        res.json({
            message: "home page",
            queuesLink: `http://localhost:${port}/queues`,
        })
    );

    serverAdapter.setBasePath("/queues");

    app.use("/queues", serverAdapter.getRouter());

    function start() {
        app.listen(port, () =>
            console.log(`server ready: http://localhost:${port}`)
        );
    }

    return {
        start,
    };
}
