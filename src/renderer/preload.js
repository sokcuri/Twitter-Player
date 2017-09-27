const {ipcRenderer, webFrame, remote} = require('electron');

ipcRenderer.on('uiShowMessage', (e, obj) => {
    $(document).trigger('uiShowMessage', {message: obj.message});
});

main.message('preload.js loaded', 'renderer');
