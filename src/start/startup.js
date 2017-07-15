var electron = require('electron');
var {app, BrowserWindow, session, ipcMain, protocol} = electron;
var {monkeyPatch, ccolor} = require('./sokcuri');
var { URL } = require('url');
var path = require('path');
var util = require('util');
var request = require('request');
var dns = require('dns');

// overrides application name
app.setName('TweetDeck Player');

// disable disk cache
app.commandLine.appendSwitch('disable-http-cache', true);

app.on('ready', () => {
    // Custom protocol and intercept request
    const filter = {
        urls: ['*']
    };

    dns.setServers(['8.8.8.8', '8.8.4.4']);

    protocol.registerBufferProtocol('twimg', (req, callback) => {
        dns.resolve4('pbs.twimg.com', {ttl: true}, (err, dnsRes) => {
            let requestURL = new URL(req.url.substr('twimg://'.length));
            let hostname = requestURL.hostname;
            let ttl = 0;
            if (!err) {
                let seq = Math.floor((Math.random() * dnsRes.length));
                requestURL.hostname = dnsRes[seq].address;
                ttl = dnsRes[seq].ttl;
            }
            session.defaultSession.cookies.get({url: requestURL.hostname}, (error, cookies) => {
                const jar = request.jar();
                cookies.forEach(cookie => {
                    jar.setCookie(request.cookie(`${cookie.name}=${cookie.value};`), requestURL.hostname);
                });

                request({
                    encoding: null,
                    method: req.method,
                    url: requestURL.href,
                    headers: {
                        'User-Agent': session.defaultSession.getUserAgent(),
                        'Referer': req.referer,
                        'Host': hostname
                    },
                    jar
                }, function (err, res, data) {
                    res = res || {};
                    res.headers = res.headers || {};
                    res.statusCode = res.statusCode || 'N/A';

                    let mimeType = res.headers['content-type'] || '';
                    if (mimeType.indexOf(';') != -1) {
                        mimeType = mimeType.substr(0, mimeType.lastIndexOf(';'));
                    }
                    message(`[magenta]twimg[reset] ${requestURL.hostname}(${ttl}) [grey]${res.statusCode}[reset] ${mimeType} [brightWhite]${requestURL.href}[reset]`, 'protocol')
                    callback({
                        mimeType: mimeType,
                        data: data || Buffer.from('')
                    });
                });
            });
        
            }, (error) => {
                if (error) console.error('Failed to register protocol')

        });
    });

    protocol.registerBufferProtocol('sokcuri', (req, callback) => {
        let requestURL = new URL(req.url.substr('sokcuri://'.length));

        session.defaultSession.cookies.get({url: requestURL.hostname}, (error, cookies) => {
            const jar = request.jar();
            cookies.forEach(cookie => {
                jar.setCookie(request.cookie(`${cookie.name}=${cookie.value};`), requestURL.hostname);
            });

            request({
                encoding: null,
                method: req.method,
                url: requestURL.href,
                headers: {
                    'User-Agent': session.defaultSession.getUserAgent(),
                    'Referer': req.referer
                },
                jar
            }, function (err, res, data) {
                res = res || {};
                res.headers = res.headers || {};
                res.statusCode = res.statusCode || 'N/A';

                let mimeType = res.headers['content-type'] || '';
                if (mimeType.indexOf(';') != -1)
                    mimeType = mimeType.substr(0, mimeType.lastIndexOf(';'));
                message(`[cyan]sokcuri[reset] [grey]${res.statusCode}[reset] ${mimeType} [brightWhite]${requestURL.href}[reset]`, 'protocol')
                callback({
                    mimeType: mimeType,
                    data: data || Buffer.from('')
                });
            });
        });
    
        }, (error) => {
            if (error) console.error('Failed to register protocol')
    })

    // Monkey patch to BrowserWindow Constructor
    BrowserWindow = monkeyPatch(BrowserWindow,
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
            args[0].title = args[0].title || app.getName();

            // Call Original BrowserWindow constructor
            let browserWindow = new (Function.prototype.bind.apply(base, [{},...args]));

            const openPopup = (url, target) => {
                let popupWindow;
                popupWindow = new BrowserWindow({width: 800, height: 800,
                    webPreferences: {
                        preload: path.join(__dirname, '..', 'renderer', 'preload.js')
                    }
                });
                popupWindow.loadURL(url);
            }

            browserWindow.webContents.on('new-window', (e, url, target) => {
                e.preventDefault();
                openPopup(url, target);
            });

            browserWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
                let requestURL = new URL(details.url);
                let redirectURL = '';

                if (requestURL.protocol === 'https:') {
                    if (details.method == 'GET' &&
                        details.uploadData === undefined) {
                        if (requestURL.hostname === 'ton.twimg.com')
                            redirectURL = 'sokcuri://' + requestURL.href;
                        else if (requestURL.hostname === 'pbs.twimg.com')
                            redirectURL = 'twimg://' + requestURL.href;
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
            message('BrowserWindow Monkey-patching completed', 'main');

            return browserWindow;
        }
    );

    message('Create BrowserWindow', 'main');
    let mainWindow;
    mainWindow = new BrowserWindow({width: 800, height: 800,
        webPreferences: {
            preload: path.join(__dirname, '..', 'renderer', 'preload.js')
        }
    });
    mainWindow.loadURL('https://tweetdeck.twitter.com/');
});

const message = function (msg, target, level) {
    target = (function (s) {
        switch (s) {
            case 'main':
                return `[grey][[brightBlue]Main[grey]][reset]\x20`;
            case 'renderer':
                return `[grey][[brightRed]Renderer[grey]][reset]\x20`;
            case 'protocol':
                return `[grey][[brightGreen]Protocol[grey]][reset]\x20`;
            default:
                return '';
        }
    })(target);
    level = (function (l) {
        switch (l) {
            case 'log':
                return '';
            case 'info':
                return `[bgBlue][brightWhite]INFO[reset]\x20`;
            case 'warn':
                return `[bgYellow][brightWhite]WARN[reset]\x20`;
            case 'error':
                return `[bgRed][brightWhite]ERR[reset]\x20`;
            default:
                return '';
        }
    })(level);
    console.log(ccolor`${target}${level}${msg}`);
}

ipcMain.on('Main.message', (evt, msg, target, level) => {
    message(msg, target, level);
});