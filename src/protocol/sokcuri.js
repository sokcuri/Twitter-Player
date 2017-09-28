const electron = require('electron');
const {protocol, session} = electron;
const request = require('request');
const {URL} = require('url');
const {monkeyPatch, message} = require('../start/sokcuri');
const textEncoding = require('text-encoding');
const TextDecoder = textEncoding.TextDecoder;
const TextEncoder = textEncoding.TextEncoder;

let pattern_data = [];
request({
    url: 'https://raw.githubusercontent.com/sokcuri/Twitter-Player/statue/over_280.js?' + new Date().getTime(),
    headers: {
        'User-Agent': session.defaultSession.getUserAgent(),
    },
}, function (err, res, data) {
    res = res || {};
    res.headers = res.headers || {};
    res.statusCode = res.statusCode || 'N/A';
    try {
        pattern_data = eval(data);
    } catch(e) {
        console.error(e);
    }
});

protocol.registerBufferProtocol('sokcuri', (req, callback) => {
    let startTime = new Date();
    try
    {
    req.url = JSON.parse(Buffer.from(req.url.substr('sokcuri://'.length), 'base64').toString('utf8'));
    } catch (e)
    {
        req.url = '';
        console.info("Req.url error", req.url);
        return;
    }
    let requestURL = new URL(req.url);

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

            

            let string_data = new TextDecoder("utf-8").decode(data);
            
            for (let d of pattern_data) {
                string_data = string_data.replace(d[0], d[1]);
            }
            data = new TextEncoder("utf-8").encode(string_data);

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