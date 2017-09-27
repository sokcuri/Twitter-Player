const electron = require('electron');
const {app, shell, Menu, MenuItem} = require('electron');
module.exports = function(mainWindow) {
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
        label: 'View',
        submenu: [
            {
                label: 'Twitter Main',
                accelerator: 'CmdOrCtrl+H',
                click (item, focusedWindow) {
                    if (focusedWindow) focusedWindow.loadURL('https://twitter.com/');
                },
            },
            {
            type: 'separator',
            },
            {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click (item, focusedWindow) {
                if (focusedWindow) focusedWindow.reload();
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
            click (item, focusedWindow) {
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
            click () {
                var flag = !mainWindow.isAlwaysOnTop();
                mainWindow.setAlwaysOnTop(flag);
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
            click () {
                shell.openExternal('https://github.com/sokcuri/Twitter-Player');
            },
            },
        ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    return menu;
}