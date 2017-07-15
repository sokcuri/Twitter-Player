var electron = require('electron');
var {app, BrowserWindow, session, ipcMain, protocol} = electron;
var {monkeyPatch, ccolor} = require('./sokcuri');
var { URL } = require('url');
var path = require('path');
var util = require('util');
var request = require('request');
var dns = require('dns');
var mime = require('mime');

// overrides application name
app.setName('TweetDeck Player');

// http server
var fs = require('fs');
var http = require('http');
var url = require('url');
var ROOT_DIR = "html/";
var dnsList = [];
var server = http.createServer(function (req, res) {

    dns.setServers(['8.8.8.8', '8.8.4.4']);
    dns.resolve4('pbs.twimg.com', {ttl: true}, (err, dnsRes) => {
        if (!err) {
            dnsRes.forEach(res => {
                if (dnsList.indexOf(res.address) == -1)
                    dnsList.push(res.address);
            });
        }
    });

    let startTime = new Date();
    var requestURL = url.parse(req.url.substr(1), true, false);
    
    req.headers = req.headers || {};
    delete req.headers['Content-Encoding'];
    
    if (dnsList.length) {
        let seq = Math.floor((Math.random() * dnsList.length));
        req.headers['Host'] = requestURL.hostname;
        requestURL.hostname = dnsList[seq];
    }

    let contentLength = 0;
    let contentType = 'N/A';
    request({
        encoding: null,
        method: req.method,
        uri: requestURL.href,
        headers: req.headers
    }, function (error, response, body) {
        if (error) {
            res.end();
        }
    })
    .on('response', function(response) {
        res.writeHead(response.statusCode, response.headers);
    })
    .on('data', function(data) { // decompressed data
        res.write(data);
        contentLength += data.length;
    })
    .on('end', function () {
        res.end();
        let elapsedTime = ((contentLength / (new Date() - startTime)) * 1024 / 1000);
        elapsedTime = (elapsedTime > 1024) ? '[brightRed]' + (elapsedTime / 1000).toFixed(2) + 'mb/s' : elapsedTime.toFixed(2) + 'kb/s';
        message(`[magenta]twimg[reset] [brightCyan]${elapsedTime}[reset] ${requestURL.hostname} [grey]${res.statusCode}[reset] [brightWhite]${requestURL.href}[reset]`, 'protocol');
    })

}).listen(8080, 'localhost', 511, function () {
    message(`port ${server.address().port} open`)
});

// disable disk cache
app.commandLine.appendSwitch('disable-http-cache', true);

app.on('ready', () => {
    // Custom protocol and intercept request
    const filter = {
        urls: ['*']
    };

    dns.setServers(['8.8.8.8', '8.8.4.4']);

    var dnsList = {};
    protocol.registerBufferProtocol('twimg', (req, callback) => {
        let requestURL = new URL(req.url.substr('twimg://'.length));
        let hostname = requestURL.hostname;
        dnsList[requestURL.hostname] = dnsList[requestURL.hostname] || {};

        dns.resolve4(requestURL.hostname, {ttl: true}, (err, dnsRes) => {
            if (!err) {
                dnsRes.forEach(res => {
                    if (dnsList[requestURL.hostname].indexOf(res.address) == -1)
                        dnsList[requestURL.hostname].push(res.address);
                });
            }
        });
            

        if (dnsList.length) {
            let seq = Math.floor((Math.random() * dnsList.length));
            requestURL.hostname = dnsList[requestURL.hostname][seq];
        }

        session.defaultSession.cookies.get({url: requestURL.hostname}, (error, cookies) => {
            const jar = request.jar();
            cookies.forEach(cookie => {
                jar.setCookie(request.cookie(`${cookie.name}=${cookie.value};`), requestURL.hostname);
            });

            let startTime = new Date();
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
                data = data || Buffer.from('')

                let mimeType = res.headers['content-type'] || '';
                if (mimeType.indexOf(';') != -1) {
                    mimeType = mimeType.substr(0, mimeType.lastIndexOf(';'));
                }
                let elapsedTime = ((data.length / (new Date() - startTime)) * 1024 / 1000);
                elapsedTime = (elapsedTime > 1024) ? '[brightRed]' + (elapsedTime / 1000).toFixed(2) + 'mb/s' : elapsedTime.toFixed(2) + 'kb/s';
                message(`[magenta]twimg[reset] [brightCyan]${elapsedTime}[reset] ${requestURL.hostname} [grey]${res.statusCode}[reset] ${mimeType} [brightWhite]${requestURL.href}[reset]`, 'protocol')
                
                callback({
                    mimeType: mimeType || mime.lookup(requestURL.href),
                    data: data
                });
            });
        });
    
        }, (error) => {
            if (error) console.error('Failed to register protocol')

    });

    protocol.registerBufferProtocol('sokcuri', (req, callback) => {
        let startTime = new Date();
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
                data = data || Buffer.from('')

                let mimeType = res.headers['content-type'] || '';
                if (mimeType.indexOf(';') != -1)
                    mimeType = mimeType.substr(0, mimeType.lastIndexOf(';'));
                let elapsedTime = ((data.length / (new Date() - startTime)) * 1024 / 1000);
                elapsedTime = (elapsedTime > 1024) ? '[brightRed]' + (elapsedTime / 1000).toFixed(2) + 'mb/s' : elapsedTime.toFixed(2) + 'kb/s';
                message(`[cyan]sokcuri[reset] [brightCyan]${elapsedTime}[reset] [grey]${res.statusCode}[reset] ${mimeType} [brightWhite]${requestURL.href}[reset]`, 'protocol')
                callback({
                    mimeType: mimeType || mime.lookup(requestURL.href),
                    data: data
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

            browserWindow.on('close', (event) => {
                message('Close BrowserWindow', 'main');
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
                            redirectURL = 'http://127.0.0.1:8080/' + requestURL.href;
                    }    
                }

                callback({cancel: false, redirectURL: redirectURL})
            });


            browserWindow.webContents.session.webRequest.onHeadersReceived(filter, (details, callback) => {
                 if (details.responseHeaders['content-security-policy']) {
                     details.responseHeaders['content-security-policy'][0] = 
                        details.responseHeaders['content-security-policy'][0]
                        .replace('img-src', 'img-src http://127.0.0.1:*');
                 }


                callback({cancel: false, responseHeaders: details.responseHeaders, statusLine: details.statusLine})
            })

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
    );

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