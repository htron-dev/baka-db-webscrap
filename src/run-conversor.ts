import Queue from "bull";
import { getMalManager } from "./importer-mal";
import { createApp } from "./create-app";

async function main() {
    const queue = new Queue("markdown-conversor");

    queue.empty();
    queue.clean(0);

    const mal = await getMalManager();
    const imported = await mal.getImported();

    let converted = await mal.getConverted();

    imported
        .filter((url) => !converted.includes(url))
        .forEach((url) =>
            queue.add({
                url,
            })
        );

    queue.process(async (job, done) => {
        const { url } = job.data;

        converted = await mal.getConverted();

        if (converted.includes(url)) {
            return done();
        }

        await mal.convertItem(url);

        console.log(`converted items: ${converted.length}/${imported.length}`);

        setTimeout(done, 5000);
    });

    const app = createApp([queue]);

    app.start();
}

main();
