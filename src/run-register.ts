import Queue from "bull";
import { createApp } from "./create-app";
import { getItemsFromMALPage } from "./fetch-mal";
import { getMalManager } from "./importer-mal";

async function main() {
    const queue = new Queue("register");
    const mal = await getMalManager();

    queue.empty();
    queue.clean(0);

    const content = await mal.getRegister();

    content
        .split("\n")
        .filter((c) => c !== "")
        .map((l) => l.split(" "))
        .forEach(([url, lastPage]) => {
            fillQueue(url, Number(lastPage));
        });

    const [baseUrl, lastPage] = process.argv.slice(2);

    if (baseUrl && lastPage) {
        fillQueue(baseUrl, Number(lastPage));
    }

    function fillQueue(baseUrl: string, lastPage: number) {
        const urls: string[] = [baseUrl];

        for (let i = 1; i <= lastPage / 50; i++) {
            urls.push(`${baseUrl}&show=${i * 50}`);
        }

        urls.forEach((url) =>
            queue.add(
                "import-list-page",
                { url },
                {
                    attempts: 3,
                    backoff: 60 * 1000,
                }
            )
        );
    }

    queue.process("import-list-page", async (job, done) => {
        try {
            const item = job.data;

            console.log(`importing: `, item.url);

            const items = await getItemsFromMALPage(item.url);

            await mal.addItems(items, true);

            done();
        } catch (error) {
            console.error(error);
            done(error);
        }
    });

    queue.on("drained", () => {
        console.log("items imported");
        process.exit(0);
    });

    const app = createApp([queue]);

    app.start();
}

main();
