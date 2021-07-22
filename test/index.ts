import { createFile } from "../src/create-item";
import { getMALItemPageAsObject } from "../src/fetch-mal";

// getMALItemPageAsObject("https://myanimelist.net/anime/2928/hack__GU_Returner")
//     .then(console.log)
//     .catch((err) => {
//         console.error(err);
//         process.exit(1);
//     });

createFile({
    name: "Teste",
    link: "https://myanimelist.net/anime/33419/12-sai__Chicchana_Mune_no_Tokimeki_2nd_Season",
})
    .then(console.log)
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
