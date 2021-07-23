import fs from "fs";
import path from "path";
import { promisify } from "util";

import lodash, { add } from "lodash";

export interface ImportItem {
    link: string;
    name: string;
}

export async function getJSON<T = []>(filename: string): Promise<T> {
    const content = await promisify(fs.readFile)(filename, "utf-8");

    return JSON.parse(content);
}

export async function updateJSON(filename: string, content: any[]) {
    await promisify(fs.writeFile)(filename, JSON.stringify(content, null, 4));
}

export async function createImporterJsonManger(name: string) {
    const basePath = path.resolve(__dirname, "..");

    const allPath = path.resolve(basePath, `${name}-links.json`);
    const importedPath = path.resolve(basePath, `${name}-links.imported.json`);

    const registerPath = path.resolve(basePath, `${name}-links.register.txt`);

    const registerExist = await promisify(fs.exists)(registerPath);
    const allExist = await promisify(fs.exists)(allPath);
    const importedExist = await promisify(fs.exists)(importedPath);

    if (!registerExist) {
        await promisify(fs.writeFile)(registerPath, "");
    }

    if (!allExist) {
        await updateJSON(allPath, []);
    }

    if (!importedExist) {
        await updateJSON(importedPath, []);
    }

    async function getRegister() {
        return await promisify(fs.readFile)(registerPath, "utf-8");
    }

    async function clearRegister() {
        return await promisify(fs.writeFile)(registerPath, "");
    }

    function getItems() {
        return getJSON<ImportItem[]>(allPath);
    }

    function getImported() {
        return getJSON<string[]>(importedPath);
    }

    async function addItems(items: ImportItem[], showAddedLength = false) {
        const allLinks = await getItems();

        const notImported = items.filter(
            (i) => !allLinks.some((al) => al.link === i.link)
        );

        await updateJSON(allPath, allLinks.concat(notImported));

        if (showAddedLength) {
            console.log("items registered: ", notImported.length);
        }
    }

    async function addImportedItems(
        items: ImportItem[],
        showAddedLength = false
    ) {
        const allLinks = await getItems();

        const importedLinks = await getImported();

        const notIncluded = items
            .filter((i) => !importedLinks.includes(i.link))
            .map((i) => i.link);

        await updateJSON(importedPath, importedLinks.concat(notIncluded));

        if (showAddedLength) {
            console.log(
                "items imported: ",
                `${importedLinks.concat(notIncluded).length}/${allLinks.length}`
            );
        }
    }

    async function createFile(item: ImportItem, content: any) {
        let filename = path.resolve(
            __dirname,
            "..",
            "imported",
            lodash.kebabCase(item.link)
        );

        await promisify(fs.mkdir)(path.dirname(filename), { recursive: true });

        await promisify(fs.writeFile)(
            `${filename}.json`,
            JSON.stringify(content, null, 4)
        );
    }

    async function getItemAndRelativesByUrl<T = any>(
        url: string
    ): Promise<T[]> {
        return new Promise(async (resolve, reject) => {
            const results = [];
            const relatives = [url];
            const added: string[] = [];

            while (relatives.length) {
                const current = relatives[0];

                if (!added.includes(current)) {
                    const filePath = path.resolve(
                        basePath,
                        "imported",
                        `${lodash.kebabCase(current)}.json`
                    );

                    const exist = await promisify(fs.exists)(filePath);

                    if (exist) {
                        const item = await getJSON<any>(filePath);

                        const related: string[] = lodash
                            .get(item, "related", [])
                            .map((i: ImportItem) => i.link)
                            .filter((i: string) => !added.includes(i));

                        relatives.push(...related);

                        added.push(current);

                        results.push({
                            ...item,
                            url: current,
                        });
                    }
                }

                relatives.splice(0, 1);
            }

            resolve(results);
        });
    }

    return {
        getRegister,
        getItems,
        getImported,

        addItems,
        addImportedItems,

        createFile,
        clearRegister,

        getItemAndRelativesByUrl,
    };
}
