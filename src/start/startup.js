const electron = require('electron');
const {app, BrowserWindow, session, ipcMain, protocol, shell, Menu, MenuItem, clipboard, dialog} = electron;
const {monkeyPatch, message, pathEnv, orig } = require('./sokcuri');
const {URL} = require('url');
const fs = require('fs');
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

// app exit when window all closed
app.on('window-all-closed', () => {
    app.quit();
});

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
            popupWindow = BrowserWindow.create({
                width: 800, height: 800,
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
                    if (requestURL.hostname.match(/([a-z0-9\-]+[.])*twimg.com/) && requestURL.href.lastIndexOf('.js') === requestURL.href.length - 3)
                        redirectURL = 'sokcuri://' + requestURL.host + requestURL.pathname + '/' + Buffer.from(JSON.stringify(requestURL.href)).toString('base64');
                    //else if (requestURL.hostname === 'pbs.twimg.com')
                    //    redirectURL = 'twimg://' + Buffer.from(JSON.stringify(requestURL.href)).toString('base64');
                }
            }

            callback({ cancel: false, redirectURL: redirectURL })
        });

        /* Fix to Electron */
        // electron cannot post redirect request
        browserWindow.webContents.on('did-get-redirect-request', (e, oldURL, newURL, isMainFrame) => {
            /* Ad issue raise. disabled.
            if (newURL.match(/(https?:\/\/([a-z0-9]+[.])*twitter.com|sokcuri:\/\/|twimg:\/\/)/) === null) {
                shell.openExternal(newURL);
                e.preventDefault();
            }*/
            if (isMainFrame) {
                setTimeout(function () {
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
    preference.autoHideMenuBar = true;
    preference.webPreferences = {
        preload: path.join(__dirname, '..', 'renderer', 'preload.js')
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
        if (event.sender.isFullScreen()) {
            event.sender.setFullScreen(false);
        }

        config.data.bounds = mainWindow.getBounds();
        config.save();
    });
    mainWindow.on('page-title-updated', (event, title) => {
        const twpl_signature = ' - Twitter Player';
        if (title.lastIndexOf(twpl_signature) == -1) {
            const changedTitle = title + twpl_signature;
            mainWindow.setTitle(changedTitle);
            event.preventDefault();
        }
    });
    mainWindow.loadURL((config.data.viewPageType === 'mobile' ? 'https://mobile.twitter.com/' : 'https://twitter.com'));
    if (config.data.isMaximized) {
        mainWindow.maximize();
    }
    if (config.data.isFullScreen) {
        mainWindow.setFullScreen(true);
    }
    if (config.data.alwaysOnTop) {
        mainWindow.setAlwaysOnTop(true);
    }
    const app_menu = (require('./app-menu.js'))(mainWindow);
    if (app.platform === 'darwin')
    {
        template.unshift({
        label: app.getName(),
        submenu: [
          {
            role: 'about',
          },
          {
            type: 'separator',
          },
          {
            type: 'separator',
          },
          {
            role: 'hide',
          },
          {
            role: 'hideothers',
          },
          {
            role: 'unhide',
          },
          {
            type: 'separator',
          },
          {
            role: 'quit',
          },
        ],
      });
    }
    mainWindow.setMenu(app_menu);
    Menu.setApplicationMenu(app_menu)
});

app.on('browser-window-created', function (event, win) {
    win.webContents.on('context-menu', (event, params) => {
        const menuCommand = {
            back: { label: 'Back', click: () => win.webContents.goBack(), enabled: win.webContents.canGoBack(), accelerator: (process.platform === 'darwin' ? 'Cmd+Left' : 'Alt+Left') },
            forward: { label: 'Forward', click: () => win.webContents.goForward(), enabled: win.webContents.canGoForward(), accelerator: (process.platform === 'darwin' ? 'Cmd+Left' : 'Alt+Right') },
            reload: { label: 'Reload', click: () => win.webContents.reload(), accelerator: 'CmdOrCtrl+R' },
            separator: { type: 'separator' },
            copy_page_url: { label: 'Copy Page URL', click: () => clipboard.writeText(params.pageURL) },
            open_page_browser: { label: 'Open Page in Browser', click: () => shell.openExternal(params.pageURL) },
            homepage: { label: 'Go to Main Page', click: () => {
                let url = new URL(params.pageURL);
                if (url.host === 'mobile.twitter.com') {
                    win.loadURL(url.origin);
                } else {
                    win.loadURL('https://twitter.com/')
                }
            }, accelerator: 'CmdOrCtrl+H' },
            cut: { role: 'cut', accelerator: 'CmdOrCtrl+X', enabled: params.editFlags.canCut },
            copy: { role: 'copy', accelerator: 'CmdOrCtrl+C', enabled: params.editFlags.canCopy },
            paste: { role: 'paste', accelerator: 'CmdOrCtrl+V', enabled: params.editFlags.canPaste },
            select_all: { role: 'selectall', accelerator: 'CmdOrCtrl+A', enabled: params.editFlags.canSelectAll },
            delete: { role: 'delete', enabled: params.editFlags.canDelete },
            open_link: { label: 'Open Link', click: () => {
                if (params.linkURL.match(/(https?:\/\/([a-z0-9]+[.])*twitter.com|sokcuri:\/\/|twimg:\/\/)/) === null)
                    shell.openExternal(params.linkURL)
                else win.loadURL(params.linkURL);
            } },
            copy_link_url: { label: 'Copy Link URL', click: () => clipboard.writeText(params.linkURL) },
            copy_image: { label: 'Copy image', click: () => {
                const nativeImage = require('electron').nativeImage;
                var request = require('request').defaults({ encoding: null });
                request.get(orig.getOrigPath(params.srcURL), function (error, response, body) {
                  if (!error && response.statusCode === 200) {
                    clipboard.writeImage(nativeImage.createFromBuffer(body));
                    win.webContents.send('uiShowMessage', {message: 'Image copied to clipboard'});
                  }
                });
            } },
            save_image: { label: 'Save image as..', click: () => {
                // 원본 해상도 이미지 경로를 가져온다
                const path = orig.getOrigPath(params.srcURL);
                const filename = orig.getFileName(path);
                const ext = orig.getFileExtension(path);
                const filters = [];

                // Save dialog에 들어갈 파일 필터 정의
                switch (ext) {
                case 'jpg':
                    filters.push({name: 'JPG File', extensions: ['jpg']});
                    break;
                case 'png':
                    filters.push({name: 'PNG File', extensions: ['png']});
                    break;
                case 'gif':
                    filters.push({name: 'GIF File', extensions: ['gif']});
                    break;
                default:
                    filters.push({name: ext.toUpperCase() + ' File', extensions: [ext.toLowerCase()]});
                }
                filters.push({name: 'All Files', extensions: ['*']});

                // Save Dialog를 띄운다
                const savepath = dialog.showSaveDialog({
                defaultPath: filename,
                filters,
                });

                // savepath가 없는 경우 리턴
                if (typeof savepath === 'undefined') return;

                session.defaultSession.cookies.get({url: 'https://twitter.com'}, (error, cookies) => {
                const jar = request.jar();
                cookies.forEach(cookie => {
                    const cookieString = `${cookie.name}=${cookie.value};`;
                    jar.setCookie(request.cookie(cookieString), 'https://ton.twitter.com');
                });
                // http 요청을 보내고 저장
                request({
                    url: path,
                    jar,
                }).pipe(fs.createWriteStream(savepath));
                });
            }},
            copy_image_url: { label: 'Copy image URL', click: () => clipboard.writeText(orig.getOrigPath(params.srcURL)) },
            search_google_img: { label: 'Search image with Google', click: () => {
                href = 'https://www.google.com/searchbyimage?image_url=' +
                encodeURI(orig.getOrigPath(params.srcURL));
                shell.openExternal(href);
            } }
        }
        const menu = new Menu();
        if (params.isEditable) {
            menu.append(new MenuItem(menuCommand.cut));
            menu.append(new MenuItem(menuCommand.copy));
            menu.append(new MenuItem(menuCommand.paste));
            menu.append(new MenuItem(menuCommand.delete));
            menu.append(new MenuItem(menuCommand.separator));
            menu.append(new MenuItem(menuCommand.select_all));
        } else {
            if (params.linkURL) {
                menu.append(new MenuItem(menuCommand.open_link));
                menu.append(new MenuItem(menuCommand.copy_link_url));
                menu.append(new MenuItem(menuCommand.separator));
            }
            if (params.mediaType === 'image') {
                menu.append(new MenuItem(menuCommand.copy_image));
                menu.append(new MenuItem(menuCommand.save_image));
                menu.append(new MenuItem(menuCommand.copy_image_url));
                menu.append(new MenuItem(menuCommand.search_google_img));
                menu.append(new MenuItem(menuCommand.separator));
            }
            if (params.selectionText) {
                menu.append(new MenuItem(menuCommand.copy));
                menu.append(new MenuItem(menuCommand.separator));
            }
            if (!params.linkURL && !params.srcURL) {
                menu.append(new MenuItem(menuCommand.back));
                menu.append(new MenuItem(menuCommand.forward));
                menu.append(new MenuItem(menuCommand.reload));
                menu.append(new MenuItem(menuCommand.separator));
            }
            menu.append(new MenuItem(menuCommand.copy_page_url));
            menu.append(new MenuItem(menuCommand.open_page_browser));
            menu.append(new MenuItem(menuCommand.separator));
            menu.append(new MenuItem(menuCommand.homepage));
        }
        menu.popup(win, {
            x: params.x,
            y: params.y,
            async: true
        });
    });
})

ipcMain.on('Main.message', (evt, msg, target, level) => {
    message(msg, target, level);
});
