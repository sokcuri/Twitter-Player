/* Original code by Jamesallardice */
/* https://codereview.stackexchange.com/questions/20400/monkey-patching-native-javascript-constructors */
exports.MonkeyPatch = function (original, patches) {
    "use strict";
    const has = Object.prototype.hasOwnProperty;
    const slice = Array.prototype.slice;
    const bind = Function.bind;

    patches.called = patches.called || original;
    let newRef = function() {
        if(this) {
            return patches.constructed ? patches.constructed.apply(this, arguments)
                                    : new (bind.apply(original, [].concat({}, slice.call(arguments))))
        } else {
            return patches.called.apply(this, arguments);
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
