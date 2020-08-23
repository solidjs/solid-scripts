const {
    stdin,
    stdout
} = require("process")

const readline = require("readline").createInterface({
    input: stdin,
    output: stdout
});
const chalk = require("react-dev-utils/chalk");
const fsx = require("fs-extra");

function eject() {
    console.log("Ejecting....")
    //gets the solid-scripts folders root
    const scriptsRootDir = require.resolve("./eject.js").replace(/scripts(\/|\\)eject\.js/gi, "");
    console.log(scriptsRootDir);

    fsx.copy(scriptsRootDir + "config/", "./config");

    //try catch prevents the program from erroring out if the folder already exists
    try {fsx.mkdirSync("./scripts")} catch (_) {};
    const scriptsDir = scriptsRootDir + "scripts/";
    fsx.readdir(scriptsDir, (err, files) => {
        if (err !== null) {
            console.log(err);
            return;
        }

        files = files.filter(val => val !== "init.js" || val !== "eject.js");

        files.forEach(file => {
            fsx.copyFile(scriptsDir + file, "./scripts/" + file, err => {
                if (err != null) {
                    console.log(err);
                    return;
                }
            })
        })
    })

    //load the solidscripts package.json
    var solidScriptsPkg = fsx.readJSONSync(scriptsRootDir + "/package.json");

    //modify package.json
    fsx.readJSON("./package.json")
    .then(pkg => {
        pkg.scripts = {
            start: "node ./scripts/start.js",
            build: "node ./scripts/build.js",
            test: "node ./scripts/test.js"
        }

        delete pkg.devDependencies["solid-scripts"];

        pkg.devDependencies = {
            ...pkg.devDependencies,
            ...solidScriptsPkg.dependencies    
        }

        pkg.resolutions = solidScriptsPkg.resolutions;

        fsx.writeJSON("./package.json", pkg, {
            spaces: 2
        })
    })

    fsx.readJSON("./package-lock.json")
    .then(pkglk => {
        delete pkglk.dependencies["solid-scripts"]
        fsx.writeJSON("./package-lock.json", pkglk, {
            spaces: 2
        })
    })
}

console.log(chalk.red("WARNING:") + " theres no going back!\n");

readline.question("Are you sure that you want to eject? y/N >", answer => {
    readline.close();
    if (answer.match(/y|yes/gi) !== null) eject();
})