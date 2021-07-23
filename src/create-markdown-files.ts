import fs from "fs";
import { promisify } from "util";
import path from "path";

import lodash from "lodash";
import moment from "moment";

import { getJson, ImportItem } from "./update-json-files";
import { getMarkdownText } from "./get-markdown-text";

const getPath = (...args: string[]) =>
    path.resolve(__dirname, "..", "dist", ...args);

async function getRelatedFiles(related: ImportItem[]) {
    return new Promise(async (resolve) => {
        const items = related.slice();

        const results = [];

        const alreadyAdded: string[] = [];

        while (items.length) {
            const item = items[0];
            const filename = `${getPath(lodash.kebabCase(item.link))}.json`;
            const exist = await promisify(fs.exists)(filename);

            if (exist && !alreadyAdded.includes(filename)) {
                const file = (await import(getPath(filename))).default;
                file.url = item.link;

                const fileRelated = lodash.get(file, "related", []).slice();

                items.push(...fileRelated);

                alreadyAdded.push(filename);

                results.push(file);
            }

            items.splice(0, 1);
        }

        resolve(results);
    });
}

export async function createProjectFiles(url: string) {
    const filename = getPath(lodash.kebabCase(url));

    const alreadyCreatedFilesPath = path.resolve(
        __dirname,
        "..",
        "files-created.json"
    );

    const alreadyCreated: string[] = await getJson(alreadyCreatedFilesPath);

    if (alreadyCreated.includes(url)) {
        return;
    }

    const file = (await import(filename)).default;

    file.url = url;

    const related = await getRelatedFiles(file.related);

    const allFiles = [file].concat(related).map((item) => {
        const data: any = {
            name: item.name,
            type: lodash.kebabCase(item.type),
            url: item.url,
            chapters: item.chapters,
            volumes: item.volumes,
            episodes: item.episodes,
            original_name: item.japanese,
            opening_song: item.opening_song,
            ending_song: item.ending_song,
            rating: item.rating,
            characters: item.characters,
            staff: item.staff,
            voice_actors: item.characters,
            sinopse: item.sinopse.replace(
                "[Written by MAL Rewrite]",
                "[Source My Anime List]"
            ),
            links: [
                {
                    text: "My Anime list",
                    link: item.url,
                },
            ],
        };

        if (data.type === "tv") {
            data.type = "tv-serie";
        }

        const date = item.published || item.aired;

        if (date) {
            const start = moment(date.split("to")[0], "MMM DD,YYYY");
            const end = moment(date.split("to")[1], "MMM DD,YYYY");

            data.start_date = start.isValid()
                ? start.format("YYYY-MM-DD")
                : null;

            data.end_date = end.isValid() ? start.format("YYYY-MM-DD") : null;
        }

        if (item.genres) {
            data.genres = item.genres
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
                );
        }

        if (item.studios) {
            data.studios = item.studios
                .split(",")
                .map((s: string) => s.replace(/^\s+|\s+$/g, ""))
                .filter((s: string) => s !== "None found")
                .filter((s: string) => s !== "add some");
        }

        if (item.producers) {
            data.producers = item.producers
                .split(",")
                .map((s: string) => s.replace(/^\s+|\s+$/g, ""))
                .filter((s: string) => s !== "None found")
                .filter((s: string) => s !== "add some");
        }

        if (item.authors) {
            data.authors = item.authors
                .split(",")
                .map((s: string) => s.replace(/^\s+|\s+$/g, ""))
                .filter((s: string) => s !== "None found")
                .filter((s: string) => s !== "add some");
        }

        if (item.links) {
            data.links.push(...item.links);
        }

        return data;
    });

    const oldest = allFiles.reduce((result, item) => {
        if (!item.start_date) {
            return result;
        }

        if (moment(result.start_date).isAfter(item.start_date)) {
            return item;
        }

        return result;
    });

    const foldername = path.resolve(
        __dirname,
        "..",
        "files",
        lodash.kebabCase(oldest.name)
    );

    await promisify(fs.mkdir)(foldername, { recursive: true });

    await Promise.all(
        allFiles.map(async (file) => {
            let filename = path.resolve(
                foldername,
                lodash.kebabCase(file.name)
            );

            const sameName = allFiles.filter(
                (f) => lodash.kebabCase(f.name) === lodash.kebabCase(file.name)
            );

            if (sameName.length > 1) {
                filename += `-${file.type}`;
            }

            filename += ".md";

            await promisify(fs.writeFile)(filename, getMarkdownText(file));
        })
    );

    const created = allFiles.map((f) => f.url);

    console.log("created files: ", created.length);

    await promisify(fs.writeFile)(
        alreadyCreatedFilesPath,
        JSON.stringify(alreadyCreated.concat(created), null, 4)
    );
}
