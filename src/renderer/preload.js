const {ipcRenderer, webFrame, remote} = require('electron');

main.message('preload.js loaded', 'renderer');

let oldTitle = '';
remote.getCurrentWindow().on('page-title-updated', (event, title) => {
    if (!remote.getCurrentWindow().isDestroyed()) {
        if (oldTitle !== document.title) {
            const title = document.title + ' - Twitter Player';
            oldTitle = title;
            document.title = title;
        }
    }
});