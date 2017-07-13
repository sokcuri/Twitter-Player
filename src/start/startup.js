var electron = require('electron');
var {app, BrowserWindow, session, ipcMain} = electron;
var {MonkeyPatch} = require('./sokcuri');
var path = require('path');
var util = require('util');
var chalk = require('chalk');

app.on('ready', () => {
    // Monkey patch to BrowserWindow Constructor
    BrowserWindow = MonkeyPatch(BrowserWindow,
        function () {
            // Argument
            var args = Array.from(arguments);
            var base = args.splice(args.length - 1, 1)[0];            

            // Config Object
            var config = {
                preload: args[0].webPreferences.preload
            }

            // Argument passing to Renderer Process (using base64 enc)
            var argument_base64 = Buffer.from(JSON.stringify(config)).toString('base64');

            // override preload setting
            args[0] = args[0] || {};
            args[0].webPreferences = args[0].webPreferences || {};
            args[0].webPreferences.blinkFeatures = args[0].webPreferences.blinkFeatures || '';
            args[0].webPreferences.blinkFeatures = `${args[0].webPreferences.blinkFeatures},--config-object:${argument_base64}`;
            args[0].webPreferences.preload = path.join(__dirname, '..', 'renderer', 'init.js');

            // Call Original BrowserWindow constructor
            let browserWindow = new (Function.prototype.bind.apply(base, [{},...args]));

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
            message('BrowserWindow Monkey-patching completed', 'main');

            return browserWindow;
        }
    );

    message('Create BrowserWindow', 'main');
    let mainWindow;
    global.sharedObj = {prop1: 'asdf', prop2: () => { return "asdf";}};
    mainWindow = new BrowserWindow({width: 800, height: 800,
        webPreferences: {
            preload: path.join(__dirname, '..', 'renderer', 'preload.js'),
        }
    });
    mainWindow.loadURL('https://twitter.com');
});

const message = function (msg, target) {
    target = target || '';
    if (target == 'main')
        target = `${chalk.gray('[')}${chalk.blue('Main')}${chalk.gray(']')}\x20`;
    if (target == 'renderer')
        target = `${chalk.gray('[')}${chalk.red('Renderer')}${chalk.gray(']')}\x20`;
    console.log('%s%s', target, msg);
}
ipcMain.on('Global.Message', (evt, msg, target) => {
    message(msg, target);
});