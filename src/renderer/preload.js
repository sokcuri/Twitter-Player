const {ipcRenderer, webFrame, remote} = require('electron');
const {pathEnv} = require('../start/sokcuri');

renderer.logEx(pathEnv.userDataPath);

ipcRenderer.on('uiShowMessage', (e, obj) => {
    $(document).trigger('uiShowMessage', {message: obj.message});
});

window.twttr = require('twitter-text');

main.message('preload.js loaded', 'renderer');
