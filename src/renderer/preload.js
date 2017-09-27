const {ipcRenderer, webFrame, remote} = require('electron');

main.message('preload.js loaded', 'renderer');