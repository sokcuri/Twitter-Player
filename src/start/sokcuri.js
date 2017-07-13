/* Original code by Jamesallardice */
/* https://codereview.stackexchange.com/questions/20400/monkey-patching-native-javascript-constructors */
exports.MonkeyPatch = function (original, patches, called) {
    "use strict";
    const has = Object.prototype.hasOwnProperty;
    const slice = Array.prototype.slice;
    const bind = Function.bind;

    called = called || original;
    let newRef = function() {
        arguments[arguments.length++] = original;
        arguments.asdf = "asdf";
        if(this) {
            return patches ? patches.apply(this, arguments)
                                    : new (bind.apply(original, [{}, Array.from(arguments)]))
        } else {
            return called.apply(this, arguments);
        }
    };
    newRef.prototype = original.prototype;
    newRef.prototype.constructor = newRef;
    Object.getOwnPropertyNames(original).forEach(function (property) {
        if (!has.call(Function, property))
            newRef[property] = original[property];
    });

    return newRef;
}
