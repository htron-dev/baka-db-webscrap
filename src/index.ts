import {
    getItemsFromMALPage,
    getMALItemPageAsObject,
} from "./fetch-mal-items-pages";
import { addItemsToAllLinks } from "./update-json-files";
import { createFile } from "./create-item";

// fetch all animes in a page
async function main() {
    // const items = await getItemsFromMALPage(
    //     "https://myanimelist.net/anime.php?letter=."
    // );

    // await addItems(items);

    await createFile({
        name: ".hack//G.U. Returner",
        link: "https://myanimelist.net/anime/2928/hack__GU_Returner",
    });
}

main()
    .then(() => process.exit())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
