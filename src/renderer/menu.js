const {shell, remote, clipboard, ipcRenderer} = require('electron');
// pointer-events
ipcRenderer.on('no-pointer', (event, opt) => {
    if (opt && !document.body.classList.contain('no-pointer')) {
        document.body.classList.add('no-pointer');
    } else if (!opt && document.body.classList.contain('no-pointer')) {
        document.body.classList.remove('no-pointer');
    }
});

// 메인 스레드에서 렌더러로 요청하는 커맨드
ipcRenderer.on('command', (event, cmd) => {
    let href;
    switch (cmd) {
        case 'cut':
            document.execCommand('cut');
            break;
        case 'copy':
            document.execCommand('copy');
            break;
        case 'paste':
            document.execCommand('paste');
            break;
        case 'delete':
            document.execCommand('delete');
            break;
        case 'selectall':
            document.execCommand('selectall');
            break;
        case 'copyimage':
            window.toastMessage('Image downloading..');
            const nativeImage = require('electron').nativeImage;
            var request = require('request').defaults({ encoding: null });
            request.get(Addr.img, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    clipboard.writeImage(nativeImage.createFromBuffer(body));
                    window.toastMessage('Image copied to clipboard');
                }
            });
            break;
        case 'copyimageurl':
            href = Util.getOrigPath(Addr.img);
            clipboard.writeText(href);
            break;
        case 'openimage':
            href = Util.getOrigPath(Addr.img);
            window.open(href);
            break;
        case 'openimagepopup':
            href = Util.getOrigPath(Addr.img);
            window.open(href, 'popup');
            break;
        case 'googleimage':
            href = 'https://www.google.com/searchbyimage?image_url=' +
                encodeURI(Util.getOrigPath(Addr.img));
            window.open(href);
            break;
        case 'openlink':
            href = Util.getOrigPath(Addr.link);
            window.open(href);
            break;
        case 'copylink':
            href = Util.getOrigPath(Addr.link);
            clipboard.writeText(href);
            break;
        case 'reload':
            document.location.reload();
            break;
        case 'back':
            window.history.back();
            break;
        case 'forward':
            window.history.forward();
            break;
        case 'copypageurl':
            if (window.location.href) clipboard.writeText(window.location.href);
            break;
        case 'openpageexternal':
            shell.openExternal(window.location.href);
            window.close();
            break;
    }
});

// context-menu event handler
window.addEventListener('contextmenu', e => {
    let target;

    // 기존 메뉴 이벤트를 무시
    e.preventDefault();

    // 현재 활성화된 element
    const el = document.activeElement;

    // 선택 영역이 있는지 여부
    const is_range = document.getSelection().type === 'Range';

    const image = document.querySelector('img:hover');
    const link = document.querySelector('a:hover');

    // input=text 또는 textarea를 가리킴
    const isText = (el.tagName.toLowerCase() === 'input') && (el.type === 'text');
    const isTextArea = (el.tagName.toLowerCase() === 'textarea');
    const isImage = !!image;
    const isLinked = !!link;

    if (isText || isTextArea) {
        target = (is_range) ? 'text_sel' : 'text';
    } else if (isImage) {
        // 이미지
        Addr.img = image.src;

        // 링크가 포함되어 있는 경우
        if (isLinked) {
            Addr.link = link.href;
            target = 'linkandimage';
        } else {
            target = 'image';
        }
    } else if (isLinked) {
        // 링크
        Addr.link = link.href;
        target = 'link';
    } else {
        // 기본 컨텍스트
        target = 'main';
    }

    // 컨텍스트 메뉴를 띄우라고 메인 스레드에 요청
    ipcRenderer.send('context-menu', target, is_range, Addr, true);
}, false);

if (config.enableUnlinkis) {
    document.addEventListener('DOMContentLoaded', Unlinkis);
}