import { Keyboard, Keys } from './types';

export const keyboard: Keyboard = {
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

  listenForEvents: function(keys: string[]) {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    keys.forEach(function (this: Keyboard, keyCode: string) {
      this.keys[keyCode as keyof Keys] = false;
    }.bind(this));

  },

  onKeyDown: function(event: KeyboardEvent) {
    const keyCode = event.key;

    if (keyCode in this.keys) {
      event.preventDefault();
      this.keys[keyCode as keyof Keys] = true;
    }
  },

  onKeyUp: function(event: KeyboardEvent) {
    const keyCode = event.key;

    if (keyCode in this.keys) {
      event.preventDefault();
      this.keys[keyCode as keyof Keys] = false;
    }
  },

  isDown: function(keyCode: string):boolean {
    if (!(keyCode in this.keys)) {
      throw new Error('Keycode ' + keyCode + ' is not being listened to');
    }

    return this.keys[keyCode as keyof Keys];
  }
};
