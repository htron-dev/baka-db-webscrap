import fs from "fs";
import { promisify } from "util";
import path from "path";
import lodash from "lodash";
import moment from "moment";

import {
    addItemsToAlreadyImportedLinks,
    ImportItem,
} from "./update-json-files";
import { getMALItemPageAsObject } from "./fetch-mal-items-pages";

export async function createFile(item: ImportItem) {
    const data = await getMALItemPageAsObject(item.link);

    const filename = path.resolve(
        __dirname,
        "..",
        "dist",
        `en-US_${lodash.kebabCase(item.name)}.md`
    );

    const markdownLines = [`# ${item.name}`, ""];

    markdownLines.push(`## Information`, "");

    const information = ["type", "episodes", "japanese", "aired"];

    information.forEach((key) => {
        if (data[key] && key === "japanese") {
            markdownLines.push(`-   **original-name:** ${data[key]}`);
            return;
        }

        if (data[key] && key === "aired") {
            const [start, end] = data[key].split("to");
            markdownLines.push(
                `-   **start-date:** ${moment(start, "MMM DD,YYYY").format(
                    "YYYY-MM-DD"
                )}`
            );

            if (end) {
                markdownLines.push(
                    `-   **end-date:** ${moment(end, "MMM DD,YYYY").format(
                        "YYYY-MM-DD"
                    )}`
                );
            }

            return;
        }

        if (data[key]) {
            markdownLines.push(`-   **${key}:** ${data[key]}`);
        }
    });

    markdownLines.push("", `## Alternative names`, "");

    markdownLines.push(`## Studios`, "");

    if (data.studios) {
        data.studios.split(",").forEach((studio: string) => {
            markdownLines.push(`-   ${studio.replace(/^\s+|\s+$/g, "")}`);
        });
    }

    markdownLines.push("", `## Genres`, "");

    if (data.studios) {
        data.studios.split(",").forEach((studio: string) => {
            markdownLines.push(`-   ${studio.replace(/^\s+|\s+$/g, "")}`);
        });
    }

    if (data.genres) {
        data.genres
            .split(",")
            .reduce(
                (all: string[], g: string) =>
                    all.concat(g.split(/(?<=[a-z])(?=[A-Z])/)),
                []
            )
            .map((g: string) => g.replace(/^\s+|\s+$/g, "").toLowerCase())
            .filter(
                (g: string, index: number, array: string[]) =>
                    array.indexOf(g) === index
            )
            .forEach((genre: string) => {
                markdownLines.push(`-   ${genre}`);
            });
    }

    markdownLines.push("", `## Links`, "");

    markdownLines.push(`-   [My anime list](${item.link})`);

    if (data.links) {
        data.links.forEach((link: any) => {
            markdownLines.push(`-   [${link.text}](${link.link})`);
        });
    }

    await promisify(fs.writeFile)(filename, markdownLines.join(" \n"));

    await addItemsToAlreadyImportedLinks([item]);
}
