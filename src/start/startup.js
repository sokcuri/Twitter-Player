const electron = require('electron');
const {app, BrowserWindow, session, ipcMain, protocol, shell} = electron;
const {monkeyPatch, ccolor, message} = require('./sokcuri');
const {URL} = require('url');
const path = require('path');
const util = require('util');
const request = require('request');
const dns = require('dns');
const mime = require('mime');
const Random = require("random-js");
const random = new Random(Random.engines.browserCrypto);

// overrides application name
app.setName('Twitter Player');

// disable disk cache
app.commandLine.appendSwitch('disable-http-cache', true);

app.on('ready', () => {
    // Custom protocol and intercept request
    const filter = {
        urls: ['*']
    };

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
    mainWindow = BrowserWindow.create({width: 800, height: 800,
        webPreferences: {
            preload: path.join(__dirname, '..', 'renderer', 'preload.js')
        }
    });
    mainWindow.loadURL('https://twitter.com/');
});

ipcMain.on('Main.message', (evt, msg, target, level) => {
    message(msg, target, level);
});