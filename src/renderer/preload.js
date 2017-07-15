const {ipcRenderer, webFrame} = require('electron');

main.message('preload.js loaded', 'renderer');
