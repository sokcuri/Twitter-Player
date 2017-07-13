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
let configObj;

process.argv.forEach(arg => {
    let param_name = '--config-object:';
    let len = arg.indexOf(param_name);
    if (len != -1) {
        try
        {
            let base64Text = arg.substr(len + param_name.length);
            configObj = JSON.parse(Buffer.from(base64Text, 'base64').toString('utf8'));
        }
        catch(e) {
            main.message(`config-object parameter parsing failed: ${e.message}`);
        }
    }
});

main.message(`load preload script - ${configObj.preload}`);
require(configObj.preload);

ipcRenderer.on('Renderer.redirect-url', function(event, url) {
    window.location.assign(url);
});