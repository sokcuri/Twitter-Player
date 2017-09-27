const {ipcRenderer, webFrame, remote} = require('electron');

main.message('preload.js loaded', 'renderer');

let oldTitle = '';
const currentWindow = remote.getCurrentWindow();
if (!currentWindow.isDestroyed()) {
    currentWindow.on('page-title-updated', (event, title) => {
        const twpl_signature = ' - Twitter Player';
        if (oldTitle !== document.title && document.title.lastIndexOf(twpl_signature) == -1) {
            const title = document.title + twpl_signature;
            oldTitle = title;
            document.title = title;
        }
    });
}