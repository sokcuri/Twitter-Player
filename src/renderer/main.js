const {ipcRenderer} = require('electron');
module.exports = {
    message: function(msg, target) {
        ipcRenderer.send('Global.Message', msg, target);
    }
}