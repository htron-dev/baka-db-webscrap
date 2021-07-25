import moment from "moment";
import lodash from "lodash";

import { getMALItemPageAsObject, getItemsFromMALPage } from "./fetch-mal";
import { createImporterJsonManger, ImportItem } from "./manager-json";
import { createImporterMarkdownManger } from "./manager-markdown";

export async function getMalManager() {
    const jsonManager = await createImporterJsonManger("mal");
    const markdownManger = await createImporterMarkdownManger("mal");

    async function importItem(item: ImportItem) {
        const data = await getMALItemPageAsObject(item.link);

        data.name = item.name;

        await jsonManager.createFile(item, data);

        await jsonManager.addImportedItems([item]);

        await jsonManager.addItems(data.related);
    }

    async function importListItems(links: string[]) {
        const allItems: any = [];

        await Promise.all(
            links.map(async (link) => {
                const items = await getItemsFromMALPage(link);

                allItems.push(...items);
            })
        );

        await jsonManager.addItems(allItems, true);
    }

    async function convertItem(url: string) {
        const items = await jsonManager.getItemAndRelativesByUrl(url);

        const formattedItems = items.map((item) => {
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

                data.end_date = end.isValid()
                    ? start.format("YYYY-MM-DD")
                    : null;
            }

            if (item.genres) {
                data.genres = item.genres
                    .split(",")
                    .reduce(
                        (all: string[], g: string) =>
                            all.concat(g.split(/(?<=[a-z])(?=[A-Z])/)),
                        []
                    )
                    .map((g: string) =>
                        g.replace(/^\s+|\s+$/g, "").toLowerCase()
                    )
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

        const oldest = formattedItems.reduce((result, item) => {
            if (!item.start_date) {
                return result;
            }

            if (moment(result.start_date).isAfter(item.start_date)) {
                return item;
            }

            return result;
        });

        await Promise.all(
            formattedItems.map(async (item) => {
                let filename = lodash.kebabCase(item.name);

                const isDuplicatedName = formattedItems.filter(
                    (f) =>
                        lodash.kebabCase(f.name) === lodash.kebabCase(item.name)
                );

                if (isDuplicatedName.length > 1) {
                    filename += `-${item.type}`;
                }

                await markdownManger.createMarkdown(
                    oldest.name,
                    filename,
                    item
                );
            })
        );

        await markdownManger.addConverted(formattedItems.map((i) => i.url));
    }

    return {
        ...jsonManager,
        ...markdownManger,
        importListItems,
        importItem,
        convertItem,
    };
}
