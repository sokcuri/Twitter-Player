const {ipcRenderer, remote} = require('electron');
var main = {
    message: function(msg) {
        ipcRenderer.send('Global.Message', msg);
    },
    ready: function() {
        ipcRenderer.send('BrowserWindow.Renderer.Ready');
    }
}

let currentWindow = remote.getCurrentWindow();
let configObj = JSON.parse(new Buffer(currentWindow.webContents.session.getUserAgent(), 'base64').toString('utf8'));

main.message(`load preload script - ${configObj.preload}`);
require(configObj.preload);

main.message(`revert userAgent string - ${configObj.userAgent}`);
currentWindow.webContents.session.setUserAgent(configObj.userAgent);

ipcRenderer.on('Renderer.redirect-url', function(event, url) {
    window.location.assign(url);
});