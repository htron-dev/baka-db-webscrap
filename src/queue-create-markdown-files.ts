import express from "express";
import Queue from "bull";
import path from "path";

import imported from "../imported.json";
import importedCreated from "../files-created.json";

import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { createProjectFiles } from "./create-markdown-files";
import { getJson } from "./update-json-files";

const queue = new Queue("create-markdown-files");

queue.empty();
queue.clean(0);

queue.process(async (job, done) => {
    try {
        const item = job.data;

        const alreadyCreatedFilesPath = path.resolve(
            __dirname,
            "..",
            "files-created.json"
        );

        const alreadyCreated: string[] = await getJson(alreadyCreatedFilesPath);

        if (alreadyCreated.includes(item.url)) {
            return done();
        }

        await createProjectFiles(item.url);

        console.log(
            `current progress : ${alreadyCreated.length}/${imported.length} `
        );

        setTimeout(done, 5000);
    } catch (error) {
        console.error(error);
        done(error);
    }
});

imported
    .filter((url) => !importedCreated.includes(url))
    .forEach((url) =>
        queue.add({
            url,
        })
    );

const serverAdapter = new ExpressAdapter();

createBullBoard({
    queues: [new BullAdapter(queue)],
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
