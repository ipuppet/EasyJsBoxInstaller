const SHARED_PATH = "shared://EasyJsBox"
const VERSION = require("../EasyJsBox/src/kernel").VERSION
const INSTALLER_VERSION = JSON.parse($file.read("/config.json").string).info.version

function getYourVersion() {
    const VERSION = eval($file.read(`${SHARED_PATH}/src/kernel.js`)?.string)?.VERSION
    return VERSION
}

function getVersionText() {
    return `Your Version: ${getYourVersion()}\nEasyJsBox Version: ${VERSION}\nInstaller Version: ${INSTALLER_VERSION}`
}

function install() {
    $file.delete(SHARED_PATH)
    $file.copy({
        src: "/EasyJsBox",
        dst: SHARED_PATH
    })
    $("version-text").text = getVersionText()
    $("install-button").title = !getYourVersion() ? "Install" : "Reinstall"
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
            { // Install
                type: "button",
                props: {
                    id: "install-button",
                    title: !getYourVersion() ? "Install" : "Reinstall",
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
                            message: "About to start installation.",
                            actions: [
                                {
                                    title: "OK",
                                    handler: install
                                },
                                { title: "Cancel" }
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