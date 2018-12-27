const electron = require('electron');
const config = require('./config');
const { URL } = require('url');
const { app, shell, Menu, MenuItem } = require('electron');
const os = require('os');
let timer = {};
module.exports = function (mainWindow) {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    role: 'quit',
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                {
                    role: 'undo',
                },
                {
                    role: 'redo',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'cut',
                },
                {
                    role: 'copy',
                },
                {
                    role: 'paste',
                },
                {
                    role: 'selectall',
                },
                {
                    role: 'delete',
                },
            ],
        },
        {
            label: 'Page',
            submenu: [
                {
                    label: 'Web Twitter Page',
                    click(item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.loadURL('https://twitter.com/');
                            focusedWindow.webContents.clearHistory()
                        }
                        config.load();
                        config.data.viewPageType = 'web';
                        config.save();
                    },
                },
                {
                    label: 'Mobile Twitter Page',
                    click(item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.loadURL('https://mobile.twitter.com/');
                            focusedWindow.webContents.clearHistory()
                        }
                        config.load();
                        config.data.viewPageType = 'mobile';
                        config.save();
                    },
                },
                {
                    type: 'separator',
                },
                {
                    label: 'Go to Main Page',
                    accelerator: 'CmdOrCtrl+G',
                    click(item, focusedWindow) {
                        let url = new URL(focusedWindow.webContents.getURL());
                        focusedWindow.webContents.clearHistory()
                        if (url.host === 'mobile.twitter.com') {
                            focusedWindow.loadURL(url.origin);
                        } else {
                            focusedWindow.loadURL('https://twitter.com/')
                        }
                    }
                },
                {
                    label: 'Go to Top of page',
                    accelerator: 'CmdOrCtrl+T',
                    click(item, focusedWindow) {
                        if (timer[0] === undefined || timer[0] < new Date().getTime()) {
                            timer[0] = new Date().getTime() + 300;
                        } else {
                            timer[0] = new Date().getTime() + 300;
                            return;
                        }
                        const url = new URL(focusedWindow.webContents.getURL());
                        if (url.host === 'twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('.nav > li.active > a').click()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('.nav > li.active > a').click()`, true);
                        } else if (url.host === 'mobile.twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/notifications"]').parentElement.querySelector('[aria-current="true"]').click()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/notifications"]').parentElement.querySelector('[aria-current="true"]').click()`, true);
                        }
                    },
                },
                {
                    type: 'separator',
                },
                {
                    label: 'Home',
                    accelerator: 'CmdOrCtrl+1',
                    click(item, focusedWindow) {
                        if (timer[1] === undefined || timer[1] < new Date().getTime()) {
                            timer[1] = new Date().getTime() + 200;
                        } else {
                            timer[1] = new Date().getTime() + 200;
                            return;
                        }
                        const url = new URL(focusedWindow.webContents.getURL());
                        if (url.host === 'twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('#search-query').blur()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('.DMActivity-close').click()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/"]').click()`, true);
                        } else if (url.host === 'mobile.twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/home"]').click()`, true);
                        }
                    },
                },
                {
                    label: 'Search',
                    accelerator: 'CmdOrCtrl+2',
                    click(item, focusedWindow) {
                        if (timer[2] === undefined || timer[2] < new Date().getTime()) {
                            timer[2] = new Date().getTime() + 200;
                        } else {
                            timer[2] = new Date().getTime() + 200;
                            return;
                        }
                        const url = new URL(focusedWindow.webContents.getURL());
                        if (url.host === 'twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('#search-query').focus()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('.DMActivity-close').click()`, true);
                        } else if (url.host === 'mobile.twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/explore"]').click()`, true);
                        }
                    },
                },
                {
                    label: 'Notification',
                    accelerator: 'CmdOrCtrl+3',
                    click(item, focusedWindow) {
                        if (timer[3] === undefined || timer[3] < new Date().getTime()) {
                            timer[3] = new Date().getTime() + 200;
                        } else {
                            timer[3] = new Date().getTime() + 200;
                            return;
                        }
                        const url = new URL(focusedWindow.webContents.getURL());
                        if (url.host === 'twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('#search-query').blur()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('.DMActivity-close').click()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/i/notifications"]').click()`, true);
                        } else if (url.host === 'mobile.twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/notifications"]').click()`, true);
                        }
                    },
                },
                {
                    label: 'Direct Message',
                    accelerator: 'CmdOrCtrl+4',
                    click(item, focusedWindow) {
                        if (timer[4] === undefined || timer[4] < new Date().getTime()) {
                            timer[4] = new Date().getTime() + 200;
                        } else {
                            timer[4] = new Date().getTime() + 200;
                            return;
                        }
                        const url = new URL(focusedWindow.webContents.getURL());
                        if (url.host === 'twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('#search-query').blur()`, true);
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('.dm-nav > a').click()`, true);
                        } else if (url.host === 'mobile.twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/messages"]').click()`, true);
                        }
                    },
                },
                {
                    type: 'separator',
                },
                {
                    label: 'New Tweet',
                    accelerator: 'CmdOrCtrl+N',
                    click(item, focusedWindow) {
                        if (timer[5] === undefined || timer[5] < new Date().getTime()) {
                            timer[5] = new Date().getTime() + 200;
                        } else {
                            timer[5] = new Date().getTime() + 200;
                            return;
                        }
                        const url = new URL(focusedWindow.webContents.getURL());
                        if (url.host === 'twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[data-component-context="new_tweet_button"]').click()`, true);
                        } else if (url.host === 'mobile.twitter.com') {
                            focusedWindow.webContents.executeJavaScript(`document.querySelector('[href="/compose/tweet"]').click()`, true);
                        }
                    },
                },
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Back',
                    accelerator: (os.platform() === 'darwin' ? 'Command+Left' : 'Alt+Left'),
                    click(item, focusedWindow) {
                        if (focusedWindow && focusedWindow.webContents.canGoBack()) {
                            focusedWindow.webContents.goBack()
                        }
                    }
                },
                {
                    label: 'Forward',
                    accelerator: (os.platform() === 'darwin' ? 'Command+Right' : 'Alt+Right'),
                    click(item, focusedWindow) {
                        if (focusedWindow && focusedWindow.webContents.canGoForward()) {
                            focusedWindow.webContents.goForward()
                        }
                    }
                },
                {
                    type: 'separator',
                },
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click(item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.webContents.reload()
                            focusedWindow.webContents.clearHistory()
                        }
                    },
                },
                {
                    role: 'togglefullscreen',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'resetzoom',
                },
                {
                    role: 'zoomin',
                },
                {
                    role: 'zoomout',
                },
                {
                    type: 'separator',
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                    click(item, focusedWindow) {
                        if (focusedWindow) focusedWindow.webContents.toggleDevTools();
                    },
                },
            ],
        },
        {
            role: 'window',
            submenu: [
                {
                    label: 'Always on top',
                    type: 'checkbox',
                    checked: mainWindow.isAlwaysOnTop(),
                    click() {
                        var flag = !mainWindow.isAlwaysOnTop();
                        mainWindow.setAlwaysOnTop(flag);
                        config.load();
                        config.data.alwaysOnTop = flag;
                        config.save();
                    },
                },
                {
                    role: 'minimize',
                },
            ],
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'About Twitter Player...',
                    click() {
                        shell.openExternal('https://github.com/sokcuri/Twitter-Player');
                    },
                },
            ],
        },
    ];
    if (os.platform() === 'darwin') {
        template[0] = {
            label: 'Twitter Player',
            submenu: [
                {
                    role: 'hide',
                },
                {
                    role: 'hideothers',
                },
                {
                    role: 'unhide',
                },
                {
                    type: 'separator',
                },
                {
                    role: 'quit',
                },
            ],
        };
    }
    const menu = Menu.buildFromTemplate(template);
    return menu;
}