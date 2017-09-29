const {ipcRenderer, webFrame, remote} = require('electron');
const {pathEnv} = require('../start/sokcuri');

renderer.logEx(pathEnv.userDataPath);

ipcRenderer.on('uiShowMessage', (e, obj) => {
    $(document).trigger('uiShowMessage', {message: obj.message});
});

// twitter-text require시 window.twttr에 덮어씀
// 공웹의 window.twttr는 트윗 담아가기로 쓰이기 때문에 undefined 처리해야 기능이 정상작동함
window.twttxt = require('twitter-text');
window.twttr = undefined;

main.message('preload.js loaded', 'renderer');
