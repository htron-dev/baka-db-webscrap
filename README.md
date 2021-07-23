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

-   Create a file called `mal-links.register.txt` and add url of the list of mal pages, Ex:

```
https://myanimelist.net/anime.php?letter=A
https://myanimelist.net/anime.php?letter=A&show=50
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
