const {ipcRenderer} = require('electron');
module.exports = {
    message: function(msg, target, level) {
        //ipcRenderer.send('Main.message', msg, target, level);
    },
    log: function() {
        arguments = [...arguments, 'log'];
        this.message.apply(this, arguments);
    },
    info: function() {
        arguments = [...arguments, 'info'];
        this.message.apply(this, arguments);
    },
    warn: function() {
        arguments = [...arguments, 'warn'];
        this.message.apply(this, arguments);
    },
    error: function() {
        arguments = [...arguments, 'error'];
        this.message.apply(this, arguments);
    }
}