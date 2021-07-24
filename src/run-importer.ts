import Queue from "bull";
import { createApp } from "./create-app";
import { getMalManager } from "./importer-mal";

async function main() {
    const queue = new Queue("imports");
    const mal = await getMalManager();

    queue.empty();
    queue.clean(0);

    let allLinks = await mal.getItems();
    let alreadyImported = await mal.getImported();

    const notImported = allLinks
        .filter((item) => !alreadyImported.some((al) => al === item.link))
        .filter((item) => item.name !== "");

    notImported.forEach((item) =>
        queue.add("create-file", item, {
            attempts: 2,
            backoff: 60 * 1000,
            removeOnComplete: true,
        })
    );

    queue.process("create-file", async (job, done) => {
        try {
            const item = job.data;

            await mal.importItem(item);

            alreadyImported = await mal.getImported();

            console.log(
                `imported: ${item.name} | progress: ${alreadyImported.length}/${allLinks.length}`
            );

            done();
        } catch (error) {
            console.error(error);
            done(error);
        }
    });

    const app = createApp([queue]);

    app.start();
}

main();
