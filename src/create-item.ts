import fs from "fs";
import { promisify } from "util";
import path from "path";
import lodash from "lodash";
import moment from "moment";

import {
    addItemsToAllLinks,
    addItemsToAlreadyImportedLinks,
    ImportItem,
} from "./update-json-files";
import { getMALItemPageAsObject } from "./fetch-mal";

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

    const information = [
        "type",
        "episodes",
        "japanese",
        "aired",
        "opening_song",
        "ending_song",
        "duration",
        "rating",
    ];

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
            markdownLines.push(
                `-   **${lodash.kebabCase(key)}:** ${data[key]}`
            );
        }
    });

    markdownLines.push("", `## Alternative names`, "");

    if (data.synonyms) {
        data.synonyms.split(",").forEach((name: string) => {
            markdownLines.push(`-   ${name.replace(/^\s+|\s+$/g, "")}`);
        });

        markdownLines.push("");
    }

    markdownLines.push(`## Producers`, "");

    if (data.producers) {
        data.producers.split(",").forEach((producer: string) => {
            markdownLines.push(`-   ${producer.replace(/^\s+|\s+$/g, "")}`);
        });

        markdownLines.push("");
    }

    markdownLines.push(`## Studios`, "");

    if (data.studios) {
        data.studios.split(",").forEach((studio: string) => {
            markdownLines.push(`-   ${studio.replace(/^\s+|\s+$/g, "")}`);
        });

        markdownLines.push("");
    }

    markdownLines.push(`## Genres`, "");

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

        markdownLines.push("");
    }

    markdownLines.push(`## Links`, "");

    markdownLines.push(`-   [My anime list](${item.link})`);

    if (data.links) {
        data.links.forEach((link: any) => {
            markdownLines.push(`-   [${link.text}](${link.link})`);
        });
    }

    markdownLines.push("");

    markdownLines.push(`## Sinopse`, "");

    if (data.sinopse) {
        markdownLines.push(data.sinopse);

        markdownLines.push("");
    }

    markdownLines.push(`## Voice actors`, "");

    if (data.characters) {
        data.characters.forEach((char: any) => {
            markdownLines.push(`-   **${char.name}:** ${char.voice_actor}`);
        });

        markdownLines.push("");
    }

    markdownLines.push(`## Staff`, "");

    if (data.staff) {
        data.staff.forEach((person: any) => {
            markdownLines.push(`-   **${person.name}:** ${person.role}`);
        });

        markdownLines.push("");
    }

    await promisify(fs.writeFile)(filename, markdownLines.join(" \n"));

    await addItemsToAlreadyImportedLinks([item]);

    await addItemsToAllLinks(data.related);
}
