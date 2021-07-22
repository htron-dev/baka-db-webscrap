import fs from "fs";
import { promisify } from "util";
import path from "path";

import alreadyImported from "../imported.json";
import allLinks from "../all-links.json";

export interface ImportItem {
    link: string;
    name: string;
}

// fetch all animes in a page
export async function addItemsToAllLinks(items: ImportItem[]) {
    const allLinksPath = path.resolve(__dirname, "..", "all-links.json");

    const notImported = items
        .filter((i) => !alreadyImported.includes(i.link))
        .filter((i) => !allLinks.some((al) => al.link === i.link));

    await promisify(fs.writeFile)(
        allLinksPath,
        JSON.stringify(allLinks.concat(notImported), null, 4)
    );

    console.log("items added to import list: ", notImported.length);
}

export async function addItemsToAlreadyImportedLinks(items: ImportItem[]) {
    const filePath = path.resolve(__dirname, "..", "imported.json");

    const notIncluded = items
        .filter((i) => !alreadyImported.includes(i.link))
        .map((i) => i.link);

    await promisify(fs.writeFile)(
        filePath,
        JSON.stringify(alreadyImported.concat(notIncluded), null, 4)
    );

    console.log("items added to already imported: ", notIncluded.length);
}
