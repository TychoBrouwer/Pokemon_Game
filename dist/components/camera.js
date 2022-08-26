import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../constants/game_constants';
export class Camera {
    constructor(map) {
        this.x = 0;
        this.y = 0;
        // Set camera properties to supplied values
        this.width = GAME_WIDTH;
        this.height = GAME_HEIGHT;
        // Set the max x and y for the camera
        this.maxX = map.COLS * TILE_SIZE - this.width;
        this.maxY = map.ROWS * TILE_SIZE - this.height;
    }
    updateMap(currentMap) {
        // Update the max x and y for the camera to the new map
        this.maxX = currentMap.COLS * TILE_SIZE - this.width;
        this.maxY = currentMap.ROWS * TILE_SIZE - this.height;
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
//# sourceMappingURL=camera.js.map