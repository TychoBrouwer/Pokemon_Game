import { Avatar } from './avatar';

import { MapType } from '../utils/types';

import { c } from '../utils/constants';

export class Camera {
  public x = 0;
  public y = 0;
  public width: number;
  public height: number;
  private maxX: number;
  private maxY: number;
  private following?: Avatar;

  constructor(map: MapType, width: number, height: number) {
    // Set camera properties to supplied values
    this.width = width;
    this.height = height;

    // Set the max x and y for the camera
    this.maxX = map.COLS * c.MAP_TSIZE - width;
    this.maxY = map.ROWS * c.MAP_TSIZE - height;
  }

  updateMap(currentMap: MapType) {
    // Update the max x and y for the camera to the new map
    this.maxX = currentMap.COLS * c.MAP_TSIZE - this.width;
    this.maxY = currentMap.ROWS * c.MAP_TSIZE - this.height;
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
