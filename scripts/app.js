const EASYJSBOX_SRC_PATH_JSBOX = "/EasyJsBox/src"
const EASYJSBOX_SRC_PATH_NODEJS = "../EasyJsBox/src"
const { SHARED_PATH, isOutdated, Kernel } = require(`${EASYJSBOX_SRC_PATH_NODEJS}/kernel`)
const BUILD_PATH = "/assets/build"
const INSTALLER_VERSION = JSON.parse($file.read("/config.json").string).info.version
const kernel = new Kernel()

function yourVersion() {
    const content = $file.read(`${SHARED_PATH}/src/kernel.js`)?.string
    if (!content) return ""
    const firstIndex = content.indexOf("\"")
    const lastIndex = content.indexOf("\"", 18)
    return content.slice(firstIndex + 1, lastIndex)
}

/**
 * 切换显示按钮和进度条
 * @param {Boolean} status true 显示按钮
 */
function progressSwitch(status) {
    $("install-button").hidden = !status
    $("progress").hidden = status
}

function progressController(value) {
    $("progress").value = value
}

function install() {
    progressSwitch(false)
    progressController(0)
    // 压缩源码
    $nodejs.run({
        path: "/scripts/builder.js",
        query: {
            path: $file.absolutePath("EasyJsBox"),
            savePath: $file.absolutePath(BUILD_PATH)
        },
        listener: {
            id: "buildDone",
            handler: () => {
                $file.delete(SHARED_PATH)
                $file.copy({
                    src: BUILD_PATH,
                    dst: SHARED_PATH
                })
                $("install-button").title = "Reinstall"
                $ui.success("Success!")
                progressSwitch(true)
            }
        }
    })
    // 监听错误
    $nodejs.listen("error", result => {
        $ui.error("Error! See the console for details.")
        console.error(result.error)
        progressSwitch(true)
        // 提示解决模块依赖
        if (result.error.code === "MODULE_NOT_FOUND") {
            $ui.alert({
                title: "Error",
                message: "Please resolve nodejs dependencies.",
                actions: [
                    {
                        title: "How?",
                        handler: () => {
                            $app.openURL("https://blog.ipuppet.top/detail/41/")
                        }
                    },
                    { title: "Ok" }
                ]
            })
        }
    })
    // 监听过程
    $nodejs.listen("progress", result => {
        progressController(result.progress)
    })
}

function checkUpdateFromGithub() {
    // TODO checkUpdateFromGithub
}

function checkUpdate() {
    let needUpdate = false
    const checkFiles = dir => {
        const files = []
        $file.list(`${EASYJSBOX_SRC_PATH_JSBOX}/${dir}`).forEach(file => {
            const path = `${EASYJSBOX_SRC_PATH_JSBOX}/${dir}/${file}`
            if ($file.isDirectory(path) || file.slice(file.lastIndexOf(".")) !== ".js") return
            const { VERSION } = require(`${EASYJSBOX_SRC_PATH_NODEJS}/${dir}/${file}`)
            const SHARED_VERSION = eval($file.read(`${SHARED_PATH}/src/${dir}/${file}`)?.string)?.VERSION
            if (isOutdated(SHARED_VERSION, VERSION)) {
                needUpdate = true
                files.push({
                    name: file,
                    versionThis: SHARED_VERSION,
                    versionNew: VERSION
                })
            } else {
                files.push({
                    name: file,
                    versionThis: SHARED_VERSION
                })
            }
        })
        return files
    }
    const toListData = data => {
        return data.map(item => {
            return {
                name: { text: item.name },
                version: {
                    text: item.versionNew ? `${item.versionThis} -> ${item.versionNew}` : item.versionThis
                }
            }
        })
    }
    const kernelData = toListData(checkFiles(""))
    const components = toListData(checkFiles("Components"))
    const plugins = toListData(checkFiles("Plugins"))
    const offset = 15
    kernel.UIKit.pushPageSheet({
        title: "Check for updates",
        doneText: needUpdate ? "Update" : "Done",
        done: needUpdate ? () => {
            setTimeout(() => install(), 500)
        } : undefined,
        views: [{
            type: "list",
            layout: $layout.fill,
            props: {
                header: {
                    type: "view",
                    props: { height: 50 },
                    views: [{
                        type: "label",
                        layout: make => {
                            make.left.inset(offset)
                            make.top.inset(20)
                        },
                        props: {
                            height: 50,
                            text: needUpdate ? "Needs to be updated" : "Everything is up to date!"
                        }
                    }]
                },
                data: [
                    {
                        title: "Kernel",
                        rows: kernelData
                    },
                    {
                        title: "Components",
                        rows: components
                    },
                    {
                        title: "Plugins",
                        rows: plugins
                    }
                ],
                template: [
                    {
                        type: "label",
                        props: {
                            id: "name"
                        },
                        layout: (make, view) => {
                            make.centerY.equalTo(view.super)
                            make.left.inset(offset)
                        }
                    },
                    {
                        type: "label",
                        props: {
                            id: "version"
                        },
                        layout: (make, view) => {
                            make.centerY.equalTo(view.super)
                            make.right.inset(offset)
                        }
                    }
                ]
            }
        }]
    })
}

function render() {
    $ui.render({
        type: "view",
        props: {
            navButtons: [
                {
                    symbol: "arrow.2.circlepath",
                    handler: () => checkUpdate()
                },
                {
                    image: $image("/assets/icon/github.png"),
                    handler: () => $app.openURL("https://github.com/ipuppet/EasyJsBoxInstaller")
                }
            ]
        },
        layout: $layout.fill,
        views: [
            {
                type: "label",
                props: {
                    text: "EasyJsBox\nInstaller",
                    lines: 0,
                    align: $align.center,
                    font: $font(30)
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super)
                    make.top.inset(20)
                },
            },
            {
                type: "progress",
                props: {
                    id: "progress",
                    hidden: true,
                    value: 0
                },
                layout: (make, view) => {
                    make.left.right.inset(20)
                    make.height.equalTo(5)
                    make.center.equalTo(view.super)
                }
            },
            { // Install
                type: "button",
                props: {
                    id: "install-button",
                    title: !yourVersion() ? "Install" : "Reinstall",
                    font: $font(16)
                },
                layout: (make, view) => {
                    make.width.equalTo(100)
                    make.height.equalTo(40)
                    make.center.equalTo(view.super)
                },
                events: {
                    tapped: () => {
                        $ui.alert({
                            title: "Continue",
                            message: !yourVersion() ? "About to start installation." : "Are you sure you want to reinstall?",
                            actions: [
                                {
                                    title: "OK",
                                    handler: () => {
                                        install()
                                    }
                                },
                                {
                                    title: "Cancel",
                                    handler: () => progressSwitch(true)
                                }
                            ]
                        })
                    }
                }
            },
            {
                type: "label",
                props: {
                    id: "version-text",
                    text: `Installer Version: ${INSTALLER_VERSION}`,
                    font: $font(12),
                    lines: 0,
                    align: $align.center
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super)
                    make.bottom.equalTo(view.super.safeArea).offset(-30)
                },
            }
        ],
        events: { appeared: () => checkUpdate() }
    })
}

module.exports = {
    render: render
}