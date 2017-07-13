exports.MonkeyPatch = function (original, patches) {
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
    newRef.prototype.constructor = newRef;
    Object.getOwnPropertyNames(original).forEach(function (property) {
        if (!has.call(Function, property))
            newRef[property] = original[property];
    });

    return newRef;
}