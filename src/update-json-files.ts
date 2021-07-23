import fs from "fs";
import { promisify } from "util";
import path from "path";

export interface ImportItem {
    link: string;
    name: string;
}
export async function getJson<T = {}>(filename: string): Promise<T> {
    const content = await promisify(fs.readFile)(filename, "utf-8");

    return JSON.parse(content);
}

// fetch all animes in a page
export async function addItemsToAllLinks(items: ImportItem[]) {
    const allLinksPath = path.resolve(__dirname, "..", "all-links.json");

    const allLinks = await getJson<ImportItem[]>(allLinksPath);

    const notImported = items.filter(
        (i) => !allLinks.some((al) => al.link === i.link)
    );

    await promisify(fs.writeFile)(
        allLinksPath,
        JSON.stringify(allLinks.concat(notImported), null, 4)
    );

    console.log(
        "items added to import list: ",
        `${notImported.length}/${items.length}`
    );
}

export async function addItemsToAlreadyImportedLinks(items: ImportItem[]) {
    const allLinksPath = path.resolve(__dirname, "..", "all-links.json");

    const importedLinksPath = path.resolve(__dirname, "..", "imported.json");

    const allLinks = await getJson<ImportItem[]>(allLinksPath);

    const importedLinks = await getJson<string[]>(importedLinksPath);

    const notIncluded = items
        .filter((i) => !importedLinks.includes(i.link))
        .map((i) => i.link);

    await promisify(fs.writeFile)(
        importedLinksPath,
        JSON.stringify(importedLinks.concat(notIncluded), null, 4)
    );

    console.log(
        "items already imported: ",
        `${importedLinks.concat(notIncluded).length}/${allLinks.length}`
    );
}
