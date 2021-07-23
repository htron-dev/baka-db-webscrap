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
    link: "https://myanimelist.net/anime/46471/Tantei_wa_Mou_Shindeiru",
})
    .then(console.log)
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
