import { Avatar } from './avatar';
import { C } from '../utils/constants';

import { MapType } from '../utils/types';


export class Camera {
  private c: C;

  public x = 0;
  public y = 0;
  public width: number;
  public height: number;
  private maxX: number;
  private maxY: number;
  private following?: Avatar;

  constructor(c: C, map: MapType) {
    this.c = c;

    // Set camera properties to supplied values
    this.width = this.c.GAME_WIDTH;
    this.height = this.c.GAME_HEIGHT;

    // Set the max x and y for the camera
    this.maxX = map.COLS * this.c.MAP_TSIZE - this.width;
    this.maxY = map.ROWS * this.c.MAP_TSIZE - this.height;
  }

  updateMap(currentMap: MapType) {
    // Update the max x and y for the camera to the new map
    this.maxX = currentMap.COLS * this.c.MAP_TSIZE - this.width;
    this.maxY = currentMap.ROWS * this.c.MAP_TSIZE - this.height;
  }

  follow(sprite: Avatar): void {
    // Set the avatar to be followed
    this.following = sprite;
  }

  update(): void {
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
