const {ipcRenderer, remote} = require('electron');
const main = require('./main.js');

// variable declaration
let currentWindow = remote.getCurrentWindow();
let configObj;

// Redirect-url trick
ipcRenderer.on('Renderer.redirect-url', function(event, url) {
    window.location.assign(url);
});

// Get config-object
process.argv.forEach(arg => {
    let param_name = '--config-object:';
    let len = arg.indexOf(param_name);
    if (len != -1) {
        try {
            let base64Text = arg.substr(len + param_name.length);
            configObj = JSON.parse(Buffer.from(base64Text, 'base64').toString('utf8'));
        }
        catch(e) {
            main.message(`config-object parameter parsing failed: ${e.message}`);
        }
    }
});

// load origin preload script
main.message(`Load preload-script: ${configObj.preload}`, 'renderer');
require(configObj.preload);

// something