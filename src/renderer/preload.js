const {ipcRenderer, webFrame, remote} = require('electron');

main.message('preload.js loaded', 'renderer');

remote.getCurrentWindow().on('page-title-updated', (event, title) => {
    if (!remote.getCurrentWindow().isDestroyed()) {
        if (title === 'TweetDeck') {
            document.title = 'TweetDeck Player';
        }
    }
});