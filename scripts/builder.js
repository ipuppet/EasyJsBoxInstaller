try {
    var fs = require("fs")
    var path = require("path")
    var UglifyJS = require("uglify-js")
} catch (error) {
    $jsbox.notify("error", { error })
    throw error
}
var rootPath = $context.query.path
var savePath = $context.query.savePath
var count = 0 // 记录文件数量
var buildedCount = 0 // 记录已处理的文件数量

try { fs.unlinkSync(savePath) } catch (error) { }

function getProjectStructure(pathNow, projectStructure = []) {
    // 忽略 node_modules
    if (pathNow.indexOf("node_modules") > 0) return
    const files = []
    const fileList = fs.readdirSync(pathNow)
    const shortPath = pathNow.replace(rootPath, "")
    fileList.forEach(item => {
        const itemPath = path.join(pathNow, item)
        const shortItemPath = itemPath.replace(rootPath, "")
        if (fs.lstatSync(itemPath).isDirectory()) {
            getProjectStructure(itemPath, projectStructure)
        } else {
            if (itemPath.slice(-3) === ".js" || itemPath === "LICENSE") {
                files.push(item)
                count++
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
        dir.files.forEach(fileName => {
            const filePath = path.join(savePath, dir.path)
            mkdirsSync(filePath)
            const fileContent = fs.readFileSync(path.join(rootPath, dir.path, fileName), "utf-8")
            const result = UglifyJS.minify(fileContent)
            if (result.error) throw result.error
            fs.writeFileSync(path.join(filePath, fileName), result.code)
            buildedCount++
            $jsbox.notify("progress", {
                progress: buildedCount / count,
                path: dir.path,
                name: fileName
            })
        })
    })
    // 项目目录结构
    fs.writeFile(path.join(savePath, "structure.json"), JSON.stringify(projectStructure.map(dir => {
        return dir.path
    })), err => { if (err) throw err })
}
try {
    build()
    $jsbox.notify("buildDone")
} catch (error) {
    $jsbox.notify("error", { error })
    throw error
}