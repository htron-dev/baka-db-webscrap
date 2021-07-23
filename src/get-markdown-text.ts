import lodash from "lodash";

export interface ItemMarkdown {
    [prop: string]: any;
    name: string;
    url: string;
    type: string;
    start_date?: string;
    end_date?: string;
    genres?: string[];
    authors?: string[];
    studios?: string[];
    producers?: string[];
    links?: {
        text: string;
        link: string;
    }[];
    staff?: {
        name: string;
        role: string;
    }[];
    voice_actors?: {
        name: string;
        voice_actor: string;
    }[];
}

export function getMarkdownText(item: ItemMarkdown) {
    const content = [`# ${item.name}`, ""];

    const informationKeys = [
        "type",

        "episodes",
        "volumes",
        "chapters",

        "original_name",

        "start_date",
        "end_date",

        "opening_song",
        "ending_song",

        "rating",
    ];

    informationKeys
        .filter((key) => !!item[key])
        .filter((key) => item[key] !== "Unknown")
        .forEach((key) => {
            content.push(`-   **${lodash.kebabCase(key)}**: ${item[key]}`);
        });

    // break line
    content.push("");

    if (item.genres && !lodash.isEmpty(item.genres)) {
        content.push("## Genres", "");

        item.genres.forEach((genre) => content.push(`-   ${genre}`));

        // break line
        content.push("");
    }

    if (item.authors && !lodash.isEmpty(item.authors)) {
        content.push("## Authors", "");

        item.authors.forEach((a) => content.push(`-   ${a}`));

        // break line
        content.push("");
    }

    if (item.sinopse) {
        content.push("## Sinopse", "");

        content.push(item.sinopse);

        // break line
        content.push("");
    }

    if (item.studios && !lodash.isEmpty(item.studios)) {
        content.push("## Studios", "");

        item.studios.forEach((studio) => content.push(`-   ${studio}`));

        // break line
        content.push("");
    }

    if (item.producers && !lodash.isEmpty(item.producers)) {
        content.push("## Producers", "");

        item.producers.forEach((p) => content.push(`-   ${p}`));

        // break line
        content.push("");
    }

    if (item.staff && !lodash.isEmpty(item.staff)) {
        content.push("## Staff", "");

        content.push(`| Name | Role |`);
        content.push(`| ---- | ---- |`);

        item.staff
            .filter((i) => !!i.name && !!i.role)
            .forEach(({ name, role }) => content.push(`| ${name} | ${role} |`));

        // break line
        content.push("");
    }

    if (item.voice_actors && !lodash.isEmpty(item.voice_actors)) {
        content.push("## Voice actors", "");

        content.push(`| Character | Voice actors |`);
        content.push(`| ---- | ---- |`);

        item.voice_actors
            .filter((i) => !!i.name && !!i.voice_actor)
            .forEach(({ name, voice_actor }) =>
                content.push(`| ${name} | ${voice_actor} |`)
            );

        // break line
        content.push("");
    }

    if (item.links && !lodash.isEmpty(item.links)) {
        content.push("## Links", "");

        item.links.forEach(({ link, text }) =>
            content.push(`-   [${text || link}](${link})`)
        );

        // break line
        content.push("");
    }

    return content.join("\n");
}
