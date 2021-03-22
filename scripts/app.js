const { VERSION, SHARED_PATH } = require("../EasyJsBox/src/kernel")
const BUILD_PATH = "/assets/build"
const INSTALLER_VERSION = JSON.parse($file.read("/config.json").string).info.version

function yourVersion() {
    return eval($file.read(`${SHARED_PATH}/src/kernel.js`)?.string)?.VERSION
}

function getVersionText() {
    return `Your Version: ${yourVersion()}\nEasyJsBox Version: ${VERSION}\nInstaller Version: ${INSTALLER_VERSION}`
}

function build(callback) {
    $nodejs.run({
        path: "/scripts/builder.js",
        query: {
            path: $file.absolutePath("EasyJsBox"),
            savePath: $file.absolutePath(BUILD_PATH)
        },
        listener: {
            id: "buildProject",
            handler: result => {
                try {
                    callback(result)
                } catch (error) {
                    console.error(error)
                }
            }
        }
    })
}

function install(callback) {
    // 压缩源码
    build(result => {
        if (result.error) {
            if (result.error) {
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
                } else {
                    console.error(result.error)
                    $ui.error("Error! See console.")
                }
            }
        } else {
            $file.delete(SHARED_PATH)
            $file.copy({
                src: BUILD_PATH,
                dst: SHARED_PATH
            })
            // 项目目录结构
            $file.write({
                data: $data({ string: JSON.stringify(result.structure) }),
                path: `${SHARED_PATH}/structure.json`
            })
            console.log(result.structure)
            $("version-text").text = getVersionText()
            $("install-button").title = "Reinstall"
            $ui.success("Success!")
        }
        callback()
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
                type: "spinner",
                props: {
                    loading: true
                },
                layout: (make, view) => {
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
                    tapped: sender => {
                        sender.hidden = true
                        $ui.alert({
                            title: "Continue",
                            message: !yourVersion() ? "About to start installation." : "Are you sure you want to reinstall?",
                            actions: [
                                {
                                    title: "OK",
                                    handler: () => install(() => sender.hidden = false)
                                },
                                {
                                    title: "Cancel",
                                    handler: () => sender.hidden = false
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