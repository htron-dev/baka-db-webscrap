async function main() {}

main()
    .then(() => process.exit())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
