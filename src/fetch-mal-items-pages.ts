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
    const page = await browser.newPage();
    const anime: any = {};

    await page.goto(link);

    const relatedProjectLinks = await page.$$eval(
        ".anime_detail_related_anime a",
        (all) => {
            return all.map((el) => ({
                name: el.textContent,
                link: `https://myanimelist.net${el.getAttribute("href")}`,
            }));
        }
    );

    const elements: any[] = await page.$$eval("table td div", (el) => {
        const sidebar = el[0];

        const externalLinks = sidebar.querySelectorAll(".pb16 a");

        const results: any = [];

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

    anime["related"] = relatedProjectLinks;

    await browser.close();

    return anime;
}
