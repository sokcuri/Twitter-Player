var electron = require('electron');
var {protocol, session} = electron;
var request = require('request');
var {URL} = require('url');
var {monkeyPatch, message} = require('../start/sokcuri');
var textEncoding = require('text-encoding');
var TextDecoder = textEncoding.TextDecoder;
var TextEncoder = textEncoding.TextEncoder;

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
            let pattern_data = [
                ['version:"cramming",max_tweet_length:280,default_weight:200,ranges:[{start:0,end:4351,weight:100},{start:4352,end:65535,weight:200}]})',
                 'version:"default",max_tweet_length:280,default_weight:100,ranges:[{start:0,end:4351,weight:100},{start:4352,end:65535,weight:100}]})'],
                ['version:"default",max_tweet_length:140,scale:100,default_weight:100,short_url_length:23,short_url_length_https:23}',
                 'version:"fault",max_tweet_length:280,scale:100,default_weight:100,short_url_length:23,short_url_length_https:23}'],
                ['getDeciderValue:function(t){return n.deciders[t]}',
                'getDeciderValue:function(t){n.deciders["cramming_feature_enabled"]=true;n.deciders["cramming_ui_enabled"]=false;return n.deciders[t]}'],
                ['r=c.a.getDeciderValue("cramming_ui_enabled")?{weighted_character_count:!0}',
                 'r=true?{weighted_character_count:!0}']
            ]
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