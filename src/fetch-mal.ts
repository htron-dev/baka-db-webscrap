import puppeteer from "puppeteer";

// fetch all animes in a page
export async function getItemsFromMALPage(link: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(link);

    const animes = await page.$$eval("table tr", (items) =>
        items.map((item) => {
            const nameElement = item.querySelector("strong");
            const linkElement = item.querySelector("a");
            return {
                name: nameElement ? nameElement.innerHTML : "",
                link: linkElement ? linkElement.href : "",
            };
        })
    );

    await browser.close();

    return animes.filter((a) => a.name !== "");
}
export async function getMALItemPageAsObject(link: string) {
    const browser = await puppeteer.launch();

    try {
        const page = await browser.newPage();

        const item = await convertPageToAnime(page, link);

        await browser.close();

        return item;
    } catch (error) {
        await browser.close();
        throw new Error(error);
    }
}

async function convertPageToAnime(page: puppeteer.Page, link: string) {
    const anime: any = {};

    await page.goto(link, {
        timeout: 60 * 1000,
    });

    anime["related"] = await page.$$eval(
        ".anime_detail_related_anime a",
        (all) => {
            return all.map((el) => ({
                name: el.textContent,
                link: `https://myanimelist.net${el.getAttribute("href")}`,
            }));
        }
    );

    anime["sinopse"] = await page.$eval("body", (body) => {
        const el = body.querySelector("[itemprop=description]");
        return el ? el.textContent : "";
    });

    anime["opening_song"] = await page.$eval("body", (el) => {
        const name = el.querySelector(".theme-songs.opnening .theme-song");
        return name ? name.textContent : null;
    });

    anime["ending_song"] = await page.$eval("body", (el) => {
        const name = el.querySelector(".theme-songs.ending .theme-song");
        return name ? name.textContent : null;
    });

    anime["characters"] = await page.$eval("body", (body) => {
        const el = body.querySelector(".detail-characters-list");

        if (!el) {
            return [];
        }
        return Array.from(el.querySelectorAll("tr"))
            .map((tr) => {
                const character = tr.querySelector("h3");
                const actor = tr.querySelector(".va-t a");
                return {
                    name: character ? character.textContent : character,
                    voice_actor: actor ? actor.textContent : actor,
                };
            })
            .filter((i) => !!i.name);
    });

    anime["staff"] = await page.$eval("body", (body) => {
        const all = body.querySelectorAll(".detail-characters-list");

        const el = all[1];

        if (!el) {
            return [];
        }

        return Array.from(el.querySelectorAll("tr"))
            .map((tr) => {
                const person = tr.querySelector("a:not(.fw-n)");
                const role = tr.querySelector("small");
                return {
                    name: person ? person.textContent : person,
                    role: role ? role.textContent : role,
                };
            })
            .filter((i) => !!i.name);
    });

    const elements: any[] = await page.$eval("table td div", (sidebar) => {
        const results: any = [];

        const externalLinks = sidebar.querySelectorAll(".pb16 a");

        results.push({
            tagName: "DIV",
            content: {
                links: Array.from(externalLinks).map((el) => ({
                    link: el.getAttribute("href"),
                    text: el.textContent,
                })),
            },
        });

        Array.from(sidebar.children).forEach((child) => {
            results.push({
                tagName: child.tagName,
                content: child.textContent || "",
            });
        });

        return results.filter((el: any) => el.tagName !== "BR");
    });

    const textProperties = [
        "japanese",
        "type",
        "episodes",
        "aired",
        "producers",
        "studios",
        "genres",
        "duration",
        "rating",
        "links",
        "synonyms",
        "volumes",
        "chapters",
        "published",
        "authors",
        "serialization",
        "status",
    ];

    elements.forEach((el) => {
        if (typeof el.content === "object") {
            Object.assign(anime, el.content);
            return;
        }

        const [name, value] = el.content
            .replace(/^\s+|\s+$/g, "")
            .replace(/\n/g, "")
            .split(/:(.+)/);

        if (!name || !value) {
            return;
        }

        const key = name.toLowerCase();

        if (textProperties.includes(key)) {
            anime[key] = value.replace(/^\s+|\s+$/g, "").replace(/\n/g, "");
        }
    });

    return anime;
}
