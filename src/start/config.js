const electron = require('electron');
const { app } = electron;
const { pathEnv } = require('./sokcuri');
const fs = require('fs');
const path = require('path');

module.exports = {

    // 설정파일 로드
    _filePath: pathEnv.userDataPath + '/config.json',
    _defaultConfig: {
        viewPageType: 'web',
        alwaysOnTop: false
    },
    data: {},
    load() {
        const config = this._defaultConfig;
        let userConfig;
        const fc = fs.constants; // shortcut
        try {
            fs.accessSync(this._filePath, (fc.F_OK | fc.R_OK | fc.W_OK));
            userConfig = JSON.parse(fs.readFileSync(this._filePath, 'utf8'));
        } catch (e) {
            userConfig = {};
        }
        Object.assign(config, userConfig);

        this.data = config;
        return config;
    },
    // 설정파일 저장
    save() {
        // 폴더가 삭제되거나 없으면 만들어줌
        function ensureDirectoryExistence(filePath) {
            var dirname = path.dirname(filePath);
            if (fs.existsSync(dirname)) {
                return true;
            }
            ensureDirectoryExistence(dirname);
            fs.mkdirSync(dirname);
        }
        ensureDirectoryExistence(pathEnv.userDataPath);

        const jsonStr = JSON.stringify(this.data, null, 2);
        fs.writeFileSync(this._filePath, jsonStr, 'utf8');
    },
};