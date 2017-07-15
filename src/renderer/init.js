const {ipcRenderer, remote, webFrame} = require('electron');
const path = require('path');
global.main = require('./main');

// sokcuri protocol bypass
webFrame.registerURLSchemeAsPrivileged('twimg');
webFrame.registerURLSchemeAsPrivileged('sokcuri');

// renderer object
global.renderer = {
    log: console.log,
    logEx: function () {
        renderer.log.apply(this, arguments);
        main.log([...arguments].join(), 'renderer');
    },
    info: console.info,
    infoEx: function () {
        renderer.info.apply(this, arguments);
        main.info([...arguments].join(), 'renderer');
    },
    warn: console.warn,
    warnEx: function () {
        renderer.warn.apply(this, arguments);
        main.warn([...arguments].join(), 'renderer');
    },
    error: console.error,
    errorEx: function () {
        if (arguments[0].indexOf('Unable to load preload script') != -1) {
            return;
        }

        renderer.error.apply(this, arguments);
        main.error([...arguments].join(), 'renderer');
    },
}
window.renderer = renderer;

// override error function
global.console.log = renderer.logEx;
global.console.error = renderer.errorEx;

// jQuery compatible
delete global.module.exports;

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
            main.warn(`config-object parameter parsing failed: ${e.message}`);
        }
    }
});

// override require
const renderer_basepath = __dirname;
var Module = require('module');

var originalRequire = Module.prototype.require;
Module.prototype.require = function (arg) {
    arguments[0] = (function (name) {
        switch(name) {
            case 'main':
                return path.join(renderer_basepath, 'main.js');
            default:
                return name;
        }
    })(arguments[0]);
    return originalRequire.apply(this, arguments);
}

try {
    // load origin preload script
    if (configObj.preload) {
        main.message(`Load preload-script: ${configObj.preload}`, 'renderer');
        require(configObj.preload);
    }
}
finally {
    // revert to overrided function when dom content loaded
    document.addEventListener('DOMContentLoaded', function () {
        // if comment below two code lines, can't enter login page (infinite-loading)
        global.console.log = renderer.log;
        global.console.error = renderer.error;

        const printResourceUsage = function () {
            Object.entries(webFrame.getResourceUsage()).forEach(item => {
                let infoString = '';
                Object.entries(item[1]).forEach((sub_item, n) => {
                    infoString += (n == 0) ? `${item[0]} ` : ', ';
                    infoString += `${sub_item[0]}: ${sub_item[1]}`;
                });
                
                renderer.infoEx(infoString);
            });
        }
        const clearCache = function () {
            printResourceUsage();
            renderer.infoEx('clearCache call');
            webFrame.clearCache();

            // each 1 hour
            setTimeout(clearCache, 1000 * 60 * 60);
        }

        clearCache();
    }, false);
}

// something


// more security

delete global.process
delete global.Buffer
delete global.setImmediate
delete global.clearImmediate
delete global.global