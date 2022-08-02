"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = void 0;
const constants_1 = require("../utils/constants");
class Camera {
    constructor(map, width, height) {
        this.x = 0;
        this.y = 0;
        // Set camera properties to supplied values
        this.width = width;
        this.height = height;
        // Set the max x and y for the camera
        this.maxX = map.COLS * constants_1.c.MAP_TSIZE - width;
        this.maxY = map.ROWS * constants_1.c.MAP_TSIZE - height;
    }
    updateMap(currentMap) {
        // Update the max x and y for the camera to the new map
        this.maxX = currentMap.COLS * constants_1.c.MAP_TSIZE - this.width;
        this.maxY = currentMap.ROWS * constants_1.c.MAP_TSIZE - this.height;
    }
    follow(sprite) {
        // Set the avatar to be followed
        this.following = sprite;
    }
    update() {
        if (this.following) {
            // Compute and and set new x and y for the camera 
            this.following.screenX = this.width / 2;
            this.following.screenY = this.height / 2;
            this.x = this.following.x - this.width / 2;
            this.y = this.following.y - this.height / 2;
            this.x = Math.max(0, Math.min(this.x, this.maxX));
            this.y = Math.max(0, Math.min(this.y, this.maxY));
            if (this.following.x < this.width / 2 ||
                this.following.x > this.maxX + this.width / 2) {
                this.following.screenX = this.following.x - this.x;
            }
            if (this.following.y < this.height / 2 ||
                this.following.y > this.maxY + this.height / 2) {
                this.following.screenY = this.following.y - this.y;
            }
        }
    }
}
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map