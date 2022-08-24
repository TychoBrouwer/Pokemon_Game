"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loader = void 0;
class Loader {
    constructor() {
        this.images = {};
        this.canvas = {};
    }
    loadImage(key, src) {
        const img = new Image();
        const d = new Promise((resolve, reject) => {
            img.onload = function () {
                this.images[key] = img;
                this.loadImageToCanvas(key);
                resolve(img);
            }.bind(this);
            img.onerror = function () {
                reject('Could not load image: ' + src);
            };
        });
        img.src = src;
        return d;
    }
    getImageCanvas(key) {
        return this.canvas[key];
    }
    getImage(key) {
        if (key in this.images) {
            return this.images[key];
        }
    }
    loadImageToCanvas(key) {
        const assetCanvas = document.createElement('canvas');
        const tileAtlasCtx = assetCanvas.getContext('2d');
        const tileAtlasPreloader = this.getImage(key);
        if (tileAtlasCtx && tileAtlasPreloader) {
            assetCanvas.height = tileAtlasPreloader.height;
            assetCanvas.width = tileAtlasPreloader.width;
            tileAtlasCtx.drawImage(tileAtlasPreloader, 0, 0);
        }
        this.canvas[key] = assetCanvas;
    }
}
exports.Loader = Loader;
//# sourceMappingURL=loader.js.map