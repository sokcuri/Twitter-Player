const {ipcRenderer, remote} = require('electron');
var main = {
    message: function(msg) {
        ipcRenderer.send('Global.Message', msg);
    },
    ready: function() {
        ipcRenderer.send('BrowserWindow.Renderer.Ready');
    }
}
main.message(this.title);
main.message("preload.js loaded");