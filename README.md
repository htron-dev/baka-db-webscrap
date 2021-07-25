# Baka-db-web-scrap

Project to find my-anime list content and import they as json files

## Requirements

-   Nodejs version 14
-   Chromium for puppeteer
-   Redis for the queues

## Usage

-   Install the dependence's

```
npm install
```

-   Run the command register with a url and the last page of a letter to add the items, Ex:

```
npm run register -- https://myanimelist.net/anime.php?letter=B 2450
```

Or you can also add a list of pages in the file `mal-links.register.txt`, Ex:

```txt
https://myanimelist.net/anime.php?letter=A 900
https://myanimelist.net/anime.php?letter=B 800
```

-   Register the items of the page with the command:

```
npm run register
```

-   And finally start the import with the command:

```
npm run importer
```

-   (extra) There is also a markdown conversor too:

```
npm run conversor
```
