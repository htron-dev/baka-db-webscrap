import { getItemsFromMALPage } from "./fetch-mal";
import { getMalManager } from "./importer-mal";

async function main() {
    const manager = await getMalManager();

    const content = await manager.getRegister();

    const malLinks = content.split("\n");

    const allItems: any = [];

    await Promise.all(
        malLinks.map(async (link) => {
            const items = await getItemsFromMALPage(link);

            allItems.push(...items);
        })
    );

    await manager.addItems(allItems, true);

    await manager.clearRegister();
}

main()
    .then(() => process.exit())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
