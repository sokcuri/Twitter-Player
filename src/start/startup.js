var electron = require('electron');
var {app, BrowserWindow, session, ipcMain} = electron;
var {MonkeyPatch} = require('./sokcuri');
var path = require('path');
var util = require('util');

app.on('ready', () => {
    // Monkey patch to BrowserWindow Constructor
    BrowserWindow = MonkeyPatch(BrowserWindow, {
        constructed: function () {
            // Argument
            var args = [].slice.call(arguments);

            // Config Object
            var config = {
                preload: args[0].webPreferences.preload,
                userAgent: session.defaultSession.getUserAgent()
            }

            // override preload setting
            args[0].webPreferences = args[0].webPreferences || {};
            args[0].webPreferences.preload = path.join(__dirname, '../', 'renderer', 'init.js');

            // Call Original BrowserWindow constructor
            let browserWindow = new (Function.prototype.bind.apply(require('electron').BrowserWindow, [{}].concat(args)));

            // Argument passing to Renderer Process (using base64 enc)
            browserWindow.webContents.session.setUserAgent(new Buffer(JSON.stringify(config)).toString('base64'));

            /* Fix to Electron */
            // electron cannot post redirect request
            browserWindow.webContents.on('did-get-redirect-request', (e, oldURL, newURL, isMainFrame) => {
                if (isMainFrame) {
                    setTimeout(function() {
                        browserWindow.send('Renderer.redirect-url', newURL)
                    }, 100);
                    e.preventDefault();
                }
            });

            return browserWindow;
        }
});

var Module = require('module');
var originalRequire = Module.prototype.require;

Module.prototype.require = function(arg){
  //console.log(arguments);
//  if (arg == "electron") return;
  //do your thing here
  return originalRequire.apply(this, arguments);
};
    let SpecialS = function () {

    }
    let mainWindow;
    global.sharedObj = {prop1: 'asdf', prop2: () => { return "asdf";}};
    mainWindow = new BrowserWindow({width: 800, height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../', 'renderer', 'preload.js')
        }
    });
    mainWindow.loadURL('https://twitter.com');
});

ipcMain.on('Global.Message', (evt, arg) => {
    console.log(arg);
});