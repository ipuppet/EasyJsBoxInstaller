const fs = require("fs")
const path = require("path")
const UglifyJS = require("uglify-es")

const rootPath = $context.query.path
let savePath = $context.query.savePath
const projectStructure = []
function getProjectStructure(pathNow) {
    // 忽略 node_modules
    if (pathNow.indexOf("node_modules") > 0) return
    const files = {}
    const fileList = fs.readdirSync(pathNow)
    const shortPath = pathNow.replace(rootPath, "")
    fileList.forEach(item => {
        const itemPath = path.join(pathNow, item)
        const shortItemPath = itemPath.replace(rootPath, "")
        if (fs.lstatSync(itemPath).isDirectory()) {
            getProjectStructure(itemPath)
        } else {
            let fileContent = fs.readFileSync(itemPath, "utf-8")
            if (itemPath.slice(-3) === ".js") {
                const result = UglifyJS.minify(fileContent)
                if (result.error) throw result.error
                fileContent = result.code
                console.log("Builded: ", shortItemPath)
            } else {
                console.log("Normal file: ", shortItemPath)
            }
            files[item] = fileContent
        }
    })
    projectStructure.push({
        path: shortPath,
        files: files
    })
}

function build() {
    const code = {}
    projectStructure.forEach(dir => {
        Object.keys(dir.files).forEach(fileName => {
            if (fileName.slice(-3) === ".js")
                code[dir.path + "/" + fileName] = dir.files[fileName]
        })
    })
    console.log(code)
    const result = UglifyJS.minify(code)
    if (result.error) throw result.error
    return result.code
}

function generateNewFile() {
    return `
    const projectStructure = ${JSON.stringify(projectStructure)}
    projectStructure.forEach(item => {
        if (!$file.exists(item.path)) $file.mkdir(item.path)
        Object.keys(item.files).forEach(fileName => {
            let filePath = item.path + "/" + fileName
            if(filePath.slice(0, 1) === "/") filePath = filePath.slice(1)
            if ($file.exists(filePath)) return
            $file.write({
                data: $data({ "string": item.files[fileName] }),
                path: filePath
            })
        })
    })
    `.trim()
}

console.log("Build start.")
getProjectStructure(rootPath)
console.log("Build done")
if (fs.lstatSync(savePath).isDirectory()) savePath = path.join(savePath, "build.js")
fs.writeFileSync(savePath, build())
console.log("Saved to ", savePath)

$jsbox.notify("buildProject", { status: true })