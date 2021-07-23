import Queue from "bull";
import path from "path";
import { createFile } from "./create-item";
import { getJson, ImportItem } from "./update-json-files";

const queue = new Queue("imports");

queue.empty();
queue.clean(0);

queue.process("create-file", processCreateFile);

async function processCreateFile(job: Queue.Job, done: Queue.DoneCallback) {
    try {
        const item = job.data;

        await createFile(item);

        done();
    } catch (error) {
        console.error(error);
        done(error);
    }
}

queue.process("fill-queue", processFillQueue);

async function processFillQueue(job: Queue.Job, done: Queue.DoneCallback) {
    try {
        const allLinksPath = path.resolve(__dirname, "..", "all-links.json");
        const alreadyImportedPath = path.resolve(
            __dirname,
            "..",
            "imported.json"
        );

        const allLinks = await getJson<ImportItem[]>(allLinksPath);
        const alreadyImported = await getJson<string[]>(alreadyImportedPath);

        const notImported = allLinks
            .filter((item) => !alreadyImported.some((al) => al === item.link))
            .filter((item) => item.name !== "");

        notImported.forEach((item) =>
            queue.add("create-file", item, {
                attempts: 3,
                backoff: 30 * 60 * 1000,
            })
        );

        console.log("add items to queue: ", notImported.length);

        done();
    } catch (error) {
        console.error(error);
        done(error);
    }
}
queue.add("fill-queue", {});

queue.add(
    "fill-queue",
    {},
    {
        repeat: {
            every: 60 * 1000,
        },
    }
);

queue.on("completed", () => {
    queue.pause();

    setTimeout(() => {
        queue.resume();
    }, 10000);
});

export default queue;
