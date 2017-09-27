const electron = require('electron');
const {app, BrowserWindow, session, ipcMain, protocol, shell} = electron;
const {monkeyPatch, message, pathEnv} = require('./sokcuri');
const {URL} = require('url');
const path = require('path');
const util = require('util');
const request = require('request');
const dns = require('dns');
const mime = require('mime');
const Random = require("random-js");
const random = new Random(Random.engines.browserCrypto);
const config = require('./config');

// overrides application name
app.setName('Twitter Player');
app.setPath('userData', pathEnv.userDataPath);

// disable disk cache
app.commandLine.appendSwitch('disable-http-cache', true);

app.on('ready', () => {
    // Load configures
    config.load();

    require('../protocol/sokcuri');

    BrowserWindow.create = function () {
        // Arguments
        let pref = arguments[0] || {};
        pref.webPreferences = pref.webPreferences || {};

        // Config object
        let config = {
            preload: pref.webPreferences.preload
        }

        // Argument passing to renderer process using base64
        let argument_passing = Buffer.from(JSON.stringify(config)).toString('base64');

        // Override preload settings
        pref.webPreferences.blinkFeatures = pref.webPreferences.blinkFeatures || '';
        pref.webPreferences.blinkFeatures += `,--config-object:${argument_passing}`;
        pref.webPreferences.preload = path.join(__dirname, '..', 'renderer', 'init.js');
        pref.title = pref.title || app.getName();

        let browserWindow = new BrowserWindow(pref);

        const openPopup = (url, target) => {
            let popupWindow;
            popupWindow = BrowserWindow.create({width: 800, height: 800,
                webPreferences: {
                    preload: path.join(__dirname, '..', 'renderer', 'preload.js')
                }
            });
            popupWindow.loadURL(url);
        }

        browserWindow.webContents.on('new-window', (e, url, target) => {
            e.preventDefault();
            shell.openExternal(url);
            //openPopup(url, target);
        });

        browserWindow.on('close', (event) => {
            message('Close BrowserWindow', 'main');
        });

        // Custom protocol and intercept request
        const filter = {
            urls: ['*']
        };

        browserWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
            let requestURL = new URL(details.url);
            let redirectURL = '';

            if (requestURL.protocol === 'https:') {
                if (details.method == 'GET' &&
                    details.uploadData === undefined) {
                    if (requestURL.hostname === 'abs.twimg.com' && requestURL.href.lastIndexOf('.js') === requestURL.href.length - 3)
                        redirectURL = 'sokcuri://' + Buffer.from(JSON.stringify(requestURL.href)).toString('base64');
                    //else if (requestURL.hostname === 'pbs.twimg.com')
                    //    redirectURL = 'twimg://' + Buffer.from(JSON.stringify(requestURL.href)).toString('base64');
                }    
            }

            callback({cancel: false, redirectURL: redirectURL})
        });

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
        message('Create BrowserWindow', 'main');

        return browserWindow;
    }

    let mainWindow;
    const preference = (config.data && config.data.bounds) ? config.data.bounds : {};
    preference.icon = path.join(pathEnv.resPath, 'icon', (process.platform !== 'darwin' ? 'twitter.ico' : 'twitter.icns'));
    preference.webPreferences = {
        preload: path.join(__dirname, '..' , 'renderer', 'preload.js')
    }
    mainWindow = BrowserWindow.create(preference);
    mainWindow.on('close', (event) => {
        config.load();
        config.data.isMaximized = mainWindow.isMaximized();
        config.data.isFullScreen = mainWindow.isFullScreen();

        event.sender.hide();
        if (event.sender.isMaximized()) {
            event.sender.unmaximize();
        }
        if (event.sender.isFullScreen()){
            event.sender.setFullScreen(false);
        }
        
        config.data.bounds = mainWindow.getBounds();
        config.save();
    });

    mainWindow.loadURL('https://twitter.com/');
    if (config.data.isMaximized) {
        mainWindow.maximize();
    }

    if (config.data.isFullScreen) {
        mainWindow.setFullScreen(true);
    }
});

ipcMain.on('Main.message', (evt, msg, target, level) => {
    message(msg, target, level);
});