import Queue from "bull";
import allLinks from "../all-links.json";
import alreadyImported from "../imported.json";
import { createFile } from "./create-item";

const queue = new Queue("imports");

queue.empty();
queue.clean(0);

queue.process("create-file", processCreateFile);

async function processCreateFile(job: Queue.Job, done: Queue.DoneCallback) {
    try {
        const item = job.data;

        job.progress(10);

        await createFile(item);

        job.progress(80);

        done();
    } catch (error) {
        console.error(error);
        done(error);
    }
}

queue.on("completed", () => {
    queue.pause();

    setTimeout(() => {
        queue.resume();
    }, 10000);
});

allLinks
    .filter((item) => !alreadyImported.some((al) => al === item.link))
    .forEach((item) =>
        queue.add("create-file", item, {
            attempts: 3,
            backoff: 60 * 1000,
        })
    );

export default queue;
