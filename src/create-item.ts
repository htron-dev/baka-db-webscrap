import fs from "fs";
import { promisify } from "util";
import path from "path";
import lodash from "lodash";
import { v4 as uuid } from "uuid";

import {
    addItemsToAllLinks,
    addItemsToAlreadyImportedLinks,
    ImportItem,
} from "./update-json-files";
import { getMALItemPageAsObject } from "./fetch-mal";

export async function createFile(item: ImportItem) {
    const data = await getMALItemPageAsObject(item.link);

    data.name = item.name;

    let filename = path.resolve(
        __dirname,
        "..",
        "dist",
        lodash.kebabCase(item.link)
    );

    await promisify(fs.mkdir)(path.dirname(filename), { recursive: true });

    await promisify(fs.writeFile)(
        `${filename}.json`,
        JSON.stringify(data, null, 4)
    );

    await addItemsToAlreadyImportedLinks([item]);

    await addItemsToAllLinks(data.related);
}
