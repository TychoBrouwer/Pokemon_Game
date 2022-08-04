"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyboard = void 0;
exports.keyboard = {
    LEFT: 'a',
    RIGHT: 'd',
    UP: 'w',
    DOWN: 's',
    ENTER: 'Enter',
    keys: {
        a: false,
        d: false,
        w: false,
        s: false,
        enter: false,
    },
    listenForEvents: function (keys) {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        keys.forEach(function (keyCode) {
            this.keys[keyCode] = false;
        }.bind(this));
    },
    onKeyDown: function (event) {
        const keyCode = event.key;
        if (keyCode in this.keys) {
            event.preventDefault();
            this.keys[keyCode] = true;
        }
    },
    onKeyUp: function (event) {
        const keyCode = event.key;
        if (keyCode in this.keys) {
            event.preventDefault();
            this.keys[keyCode] = false;
        }
    },
    isDown: function (keyCode) {
        if (!(keyCode in this.keys)) {
            throw new Error('Keycode ' + keyCode + ' is not being listened to');
        }
        return this.keys[keyCode];
    }
};
//# sourceMappingURL=keyboard.js.map