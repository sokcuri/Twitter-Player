var ccs = require('console-control-strings')
exports.ccolor = function (strings, ...values) {
    // strings: template string
    // arguments+1..: template literal
    const colorTable = [
        'reset',

        'white', 'black', 'blue', 'cyan', 'green', 'magenta', 'red', 'yellow', 'grey',

        'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
        'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',

        'bgWhite', 'bgBlack', 'bgBlue', 'bgCyan', 'bgGreen', 'bgMagenta', 'bgRed', 'bgYellow', 'bgGrey',
        
        'bgBrightBlack', 'bgBrightRed', 'bgBrightGreen', 'bgBrightYellow',
        'bgBrightBlue', 'bgBrightMagenta', 'bgBrightCyan', 'bgBrightWhite'
    ];
    let mapping = {};
    colorTable.forEach(e => mapping[`[${e}]`] = ccs.color(e));
    
    let literals = [...arguments].splice(1) || '';
    let joinedString = '';

    for (let i = 0; i < Math.max(strings.length, literals.length); i++) {
        joinedString += strings.raw[i];
        if (literals.length > i) {
            joinedString += literals[i];
        }
    }
    
    return joinedString.replace(/\[\w+\]/ig, n => (mapping[n] || n));
}

exports.monkeyPatch = function (original, patches) {
    "use strict";
    const has = Object.prototype.hasOwnProperty;
    const slice = Array.prototype.slice;
    const bind = Function.bind;

    let newRef = function () {
        arguments[arguments.length++] = original;
        return patches ? patches.apply(this, arguments)
                       : new (bind.apply(original, [{}, Array.from(arguments)]))
    };
    
    newRef.prototype = original.prototype;
    
    Object.getOwnPropertyNames(original).forEach(function (property) {
        if (!has.call(Function, property))
            newRef[property] = original[property];
    });

    return newRef;
}