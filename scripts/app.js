const { VERSION, SHARED_PATH } = require("../EasyJsBox/src/kernel")
const BUILD_PATH = "/assets/build"
const INSTALLER_VERSION = JSON.parse($file.read("/config.json").string).info.version

function yourVersion() {
    return eval($file.read(`${SHARED_PATH}/src/kernel.js`)?.string)?.VERSION
}

function getVersionText() {
    return `Your Version: ${yourVersion()}\nEasyJsBox Version: ${VERSION}\nInstaller Version: ${INSTALLER_VERSION}`
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
                $("version-text").text = getVersionText()
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

function render() {
    $ui.render({
        type: "view",
        props: {
            navButtons: [
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
                                        progressSwitch(false)
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
                    text: getVersionText(),
                    font: $font(12),
                    lines: 0,
                    align: $align.center
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super)
                    make.bottom.inset(20)
                },
            }
        ]
    })
}

module.exports = {
    render: render
}