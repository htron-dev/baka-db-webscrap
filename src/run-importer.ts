import Queue from "bull";
import { createApp } from "./create-app";
import { getMalManager } from "./importer-mal";

async function main() {
    const queue = new Queue("imports");
    const mal = await getMalManager();

    queue.empty();
    queue.clean(0);

    queue.process("create-file", async (job, done) => {
        try {
            const item = job.data;

            console.log(`importing: ${item.name}`);

            await mal.importItem(item);

            done();
        } catch (error) {
            console.error(error);
            done(error);
        }
    });

    queue.process("fill-queue", async (job, done) => {
        const allLinks = await mal.getItems();
        const alreadyImported = await mal.getImported();

        const notImported = allLinks
            .filter((item) => !alreadyImported.some((al) => al === item.link))
            .filter((item) => item.name !== "");

        notImported.forEach((item) =>
            queue.add("create-file", item, {
                attempts: 2,
                backoff: 60 * 1000,
                removeOnFail: true,
                removeOnComplete: true,
            })
        );

        console.log(
            `current progress: ${alreadyImported.length}/${allLinks.length}`
        );

        done();
    });

    queue.add("fill-queue", {});

    queue.add(
        "fill-queue",
        {},
        {
            repeat: {
                every: 5 * 60 * 1000,
            },
        }
    );

    const app = createApp([queue]);

    app.start();
}

main();
