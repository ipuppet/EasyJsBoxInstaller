try {
    var fs = require("fs")
    var path = require("path")
    var UglifyJS = require("uglify-js")
} catch (error) {
    $jsbox.notify("buildProject", { error })
    throw error
}
var rootPath = $context.query.path
var savePath = $context.query.savePath

try { fs.unlinkSync(savePath) } catch (error) { }

function message(msg) {
    console.log(msg)
}

function getProjectStructure(pathNow, projectStructure = []) {
    // 忽略 node_modules
    if (pathNow.indexOf("node_modules") > 0) return
    const files = {}
    const fileList = fs.readdirSync(pathNow)
    const shortPath = pathNow.replace(rootPath, "")
    fileList.forEach(item => {
        const itemPath = path.join(pathNow, item)
        const shortItemPath = itemPath.replace(rootPath, "")
        if (fs.lstatSync(itemPath).isDirectory()) {
            getProjectStructure(itemPath, projectStructure)
        } else {
            if (itemPath.slice(-3) === ".js") {
                let fileContent = fs.readFileSync(itemPath, "utf-8")
                const result = UglifyJS.minify(fileContent)
                if (result.error) throw result.error
                fileContent = result.code
                message(`File: ${shortItemPath}`)
                files[item] = fileContent
            } else if (itemPath.indexOf("LICENSE") > -1) {
                files[item] = fs.readFileSync(itemPath, "utf-8")
            }
        }
    })
    projectStructure.push({
        path: shortPath,
        files: files
    })
    return projectStructure
}

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname)
            return true
        }
    }
}

function build() {
    const projectStructure = getProjectStructure(rootPath)
    projectStructure.forEach(dir => {
        Object.keys(dir.files).forEach(fileName => {
            const filePath = path.join(savePath, dir.path)
            mkdirsSync(filePath)
            fs.writeFileSync(path.join(filePath, fileName), dir.files[fileName])
        })
    })
    return projectStructure.map(dir => {
        return dir.path
    })
}

message("Build start.")
try {
    $jsbox.notify("buildProject", { structure: build() })
    message("Build done.")
} catch (error) {
    $jsbox.notify("buildProject", { error })
    throw error
}