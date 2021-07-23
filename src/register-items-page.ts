import fs from "fs";
import { promisify } from "util";
import path from "path";

import { getItemsFromMALPage } from "./fetch-mal";
import { addItemsToAllLinks } from "./update-json-files";

// fetch all animes in a page
async function main() {
    const malLinksFile = await promisify(fs.readFile)(
        path.resolve(__dirname, "..", "mal-links.txt"),
        "utf-8"
    );

    const malLinks = malLinksFile.split("\n");

    const allItems: any = [];

    await Promise.all(
        malLinks.map(async (link) => {
            const items = await getItemsFromMALPage(link);

            allItems.push(...items);
        })
    );

    await addItemsToAllLinks(allItems);

    await promisify(fs.writeFile)(
        path.resolve(__dirname, "..", "mal-links.txt"),
        ""
    );
}

main()
    .then(() => process.exit())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
