let path = require('path'),
    findUp = require('find-up'),
    ignore = require('ignore'),
    fs = require('fs'),
    mem = require('mem')


// rootDir = 'D:\\projects\\NODE\\braceup'

let mem_getGitIgnores = mem(getGitIgnores),
    mem_addIgnoreFiles = mem(addIgnoreFiles, {
        cacheKey: arguments_ => arguments_.join(',')
    });



async function getGitIgnores(filePath, rootDir, toFind = '.gitignore') {

    let cwd = path.dirname(filePath),
        p = null,
        c = 0,
        found = [],
        foundPath;

    while (p !== rootDir && c < 1000) {

        foundPath = await findUp(dir => {
            return path.dirname(rootDir) == dir ? findUp.stop : toFind;
        }, { cwd });

        if (foundPath) {
            found.push(foundPath);
            p = path.dirname(foundPath);

        } else {

            p = cwd;

        }

        cwd = path.dirname(p);


        c++;
    }

    return found;
}

function addIgnoreFiles(ignoreFiles, ignoreGit = true, ignorePattern) {
    // console.log(ignoreFiles);

    let ig = ignore(),
        ignorePatterns = ignoreFiles
        .map(f => fs.readFileSync(f).toString())
        .forEach(f => ig.add(f));


    if (ignoreGit) {
        ig.add('.git')
    }

    return ig;
}

async function findRoot(filePath) {

    // attempt to find the nearest .git directory
    let cwd = filePath,
        opts = {
            cwd,
            type: 'directory'
        },
        gitDir = await findUp('.git', opts);

    if (!gitDir) {
        throw new Error(`Root Directory is not entered and the system couldn't find a .git repository to reference set Root`)
    }

    return path.dirname(gitDir);

}

async function canIgnore(filePath, rootDir = null, ignoreGit = true, ignorePattern) {

    // ensure root directory is entered
    rootDir = rootDir || await findRoot(filePath);

    // set parent dir that must not be above root dir
    let parentDir = path.dirname(filePath);
    // never go above root dir..
    if (parentDir.indexOf(rootDir) == -1) {
        parentDir = filePath;
    }


    let relativeFiles = [filePath].map(f => path.relative(rootDir, f));


    let ig;

    if (!ignorePattern) {
        let ignoreFiles = await mem_getGitIgnores(parentDir, rootDir);
        ig = mem_addIgnoreFiles(ignoreFiles, ignoreGit);
    } else {
        ig = ignore();
        ig.add(ignorePattern)
        if (ignoreGit) {
            ig.add('.git')
        }
    }


    return (ig.filter(relativeFiles).length == 0)

}



module.exports = {
    getGitIgnores: mem_getGitIgnores,
    canIgnore
}