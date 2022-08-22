import { TILE_SIZE, MAPS } from '../constants/game_constants';

import { MapType, MapLocation } from '../utils/types';

export class Map {
  public currentMap: MapType
  private MapLocation: MapLocation;
  private prevMapCols = 0;
  private prevMapRows = 0;

  private adjacentMaps: {
    [direction: string]: string;
  }

  constructor(map: MapType) {
    // Set the currentMap
    this.currentMap = map;
    // Set the adjacent loaded maps object
    this.adjacentMaps = {};

    // Reset the location of the currentMap on the whole map
    this.MapLocation = {
      xBegin: 0,
      xEnd: this.currentMap.COLS,
      yBegin: 0,
      yEnd: this.currentMap.ROWS,
    }
  }

  getTile(layer: number, col: number, row: number): number {
    // Get the tile number of the supplied layer, column, and row
    return this.currentMap.layers[layer][row * this.currentMap.COLS + col];
  }

  updateMap(mapName: string) {
    // Set the previous map columns and rows variables
    this.prevMapCols = this.currentMap.COLS
    this.prevMapRows = this.currentMap.ROWS

    // Update the currentMap
    this.currentMap = MAPS[mapName];
    // Reset the adjacent loaded maps object
    this.adjacentMaps = {};

    // Reset the location of the currentMap on the whole map
    this.MapLocation = {
      xBegin: 0,
      xEnd: this.currentMap.COLS,
      yBegin: 0,
      yEnd: this.currentMap.ROWS,
    }
  }

  isNextMap(x: number, y: number): boolean | string[] {
    if (this.MapLocation) {
      // Get the column and row of the coordinates
      const currentCol = this.getCol(x);
      const currentRow = this.getRow(y);

      // console.debug('x-axis: ' + this.MapLocation.xBegin + ' : ' + currentCol + ' : ' + this.MapLocation.xEnd)
      // console.debug('y-axis: ' + this.MapLocation.yBegin + ' : ' + currentRow + ' : ' + this.MapLocation.yEnd)

      // Check if x and y fall outside of currentMap and return the entered map if needed
      if (this.MapLocation.xBegin < currentCol && currentCol < this.MapLocation.xEnd) {
        if (this.MapLocation.yBegin > currentRow) return [this.adjacentMaps['top'], 'top'];
        if (this.MapLocation.yEnd < currentRow)   return [this.adjacentMaps['bottom'], 'bottom'];  
      } else {
        if (this.MapLocation.xBegin > currentCol) return [this.adjacentMaps['left'], 'left'];
        if (this.MapLocation.xEnd < currentCol)   return [this.adjacentMaps['right'], 'right'];  
      }
    }

    // Else return false
    return false;
  }

  isSolidTileAtXY(x: number, y: number, dirX: number, dirY: number): boolean {
    // Get the column and row of the coordinates
    const col = this.getCol(x);
    const row = this.getRow(y);

    // Go through and reduce through all layers
    return this.currentMap.layers.reduce((res: boolean, layer: number[], index: number) => {
      // Array of completely solid tiles
      const solidTiles = [
        10, 11, 12, 13, 36, 37, 38, 39, 40, 41, 42,
        549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560,
        565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576,
        581, 582, 583, 584, 585, 597, 598, 599, 600, 601,
      ];

      // Get the current tile
      const tile = this.getTile(index, col, row);
      // Check if completely solid
      const isSolid = solidTiles.includes(tile);

      // Get halve columns and rows
      const colHalfTile = col + 0.5;
      const rowHalfTile = row + 0.5;

      // compute solid in one way or partly solid tiles
      const partlySolid: boolean =
        (tile === 3 && rowHalfTile * TILE_SIZE < y && (dirY === -1 || dirX !== 0)) ||
        (tile === 4 && rowHalfTile * TILE_SIZE < y && (dirY === -1 || dirX === -1)) ||
        (tile === 7 && rowHalfTile * TILE_SIZE < y && (dirY === -1 || dirX === 1)) ||
        (tile === 5 && rowHalfTile * TILE_SIZE < y && colHalfTile * TILE_SIZE < x) ||
        (tile === 8 && rowHalfTile * TILE_SIZE < y && colHalfTile * TILE_SIZE > x) ||

        (tile === 6 && 
          (rowHalfTile * TILE_SIZE < y || colHalfTile * TILE_SIZE < x) && 
          (dirX === -1 || dirY === -1)
        ) ||

        (tile === 9 && (
          rowHalfTile * TILE_SIZE < y || colHalfTile * TILE_SIZE < x && 
          (dirX === 1 || dirY === -1)
        )) ||
        (tile === 30 && (row + 0.3) * TILE_SIZE < y) ||
        (tile === 33 && colHalfTile * TILE_SIZE < x && (dirX === -1 || dirY !== 0)) ||
        (tile === 34 && colHalfTile * TILE_SIZE < x && (dirX === -1 || dirY === 1));
        (tile === 35 && 
          (rowHalfTile * TILE_SIZE < y  ||
          colHalfTile * TILE_SIZE < x) && (dirX === -1 || dirY !== 0)
        );
        
      // Return and compute the result of the solidity determination
      return res || isSolid || partlySolid;
    }, false);
  }

  addMap(mapName: string, location: string, tileOffset: number) {
    // Get the map to add
    const mapToAdd = MAPS[mapName];

    // Initialize the final layers array to be returned
    const finalLayers: number[][] = [];
    // Initialize the variables for the final size of the complete map
    let finalCols = 0, finalRows = 0;

    // Foreach layer combine the mapToAdd and the currentMap
    for (let layer = 0; layer < this.currentMap.layers.length; layer++) {
      // If layer does not exist, initialize it
      if (!finalLayers[layer]) finalLayers[layer] = [];
      if (location === 'right' || location === 'left') {
        // Foreach row, combine the arrays appropriate
        for (let row = 0; row < this.currentMap.ROWS; row++) {
          // Compute the begin and end columns of the currentMap for this row
          const begin = row * this.currentMap.COLS;
          const end = begin + this.currentMap.COLS;
    
          // Compute the begin and end columns of the mapToAdd for this row
          const begin2 = row * mapToAdd.COLS;
          const end2 = begin2 + mapToAdd.COLS;
          
          // Slice the map arrays for the row
          const arrayCurrentMap = this.currentMap.layers[layer].slice(begin, end);
          const arrayAddedMap = (typeof mapToAdd.layers[layer][begin2] === 'number') ? mapToAdd.layers[layer].slice(begin2, end2) : Array(end2 - begin2).fill(0);
    
          // Push the arrays to the final array in the proper order
          if (location === 'left') {
            finalLayers[layer].push(...arrayAddedMap);
          }

          finalLayers[layer].push(...arrayCurrentMap);

          if (location === 'right') {
            finalLayers[layer].push(...arrayAddedMap);
          }
        }

        if (location === 'left' && layer === 0) {
          // Change the location of the currentMap on the whole map
          this.MapLocation.xBegin = this.MapLocation.xBegin + mapToAdd.COLS;
          this.MapLocation.xEnd = this.MapLocation.xEnd + mapToAdd.COLS;
        }

        // Set the final dimensions of the whole map appropriately
        finalCols = this.currentMap.COLS + mapToAdd.COLS;
        finalRows = this.currentMap.ROWS;
      } else if (location === 'top' || location === 'bottom') {
        // Initialize the array to be added
        const arrayAddedMap = [];

        // Construct the array of the mapToAdd to be added
        for (let row = 0; row < mapToAdd.ROWS; row++) {
          for (let col = 0; col < this.currentMap.COLS; col++) {
            if (col >= tileOffset && col < this.currentMap.COLS + tileOffset) {
              arrayAddedMap.push(mapToAdd.layers[layer][col - tileOffset + row * mapToAdd.COLS]);
            } else {
              arrayAddedMap.push(0);
            }
          }
        }
    
        // Push the arrays to the final array in the proper order
        if (location === 'bottom') {
          finalLayers[layer].push(...this.currentMap.layers[layer]);
        }

        finalLayers[layer].push(...arrayAddedMap);

        if (location === 'top') {
          finalLayers[layer].push(...this.currentMap.layers[layer]);

          if (layer === 0) {
            // Change the location of the currentMap on the whole map
            this.MapLocation.yBegin = this.MapLocation.yBegin + mapToAdd.ROWS;
            this.MapLocation.yEnd = this.MapLocation.yEnd + mapToAdd.ROWS; 
          }
        }

        // Set the final dimensions of the whole map appropriately
        finalCols = this.currentMap.COLS;
        finalRows = this.currentMap.ROWS + mapToAdd.ROWS;
      }
    }

    // console.log('previous map rows: ' + this.prevMapRows + ' | current map rows:  ' + finalRows)
    // console.log('rows difference: ' + (finalRows - this.prevMapRows))
    // console.log('previous to top: ' + this.prevAddedRows + '    | added rows to top: ' + this.added[1])
    // console.log('rows added difference: ' + (this.added[1] - this.prevAddedRows))
    // console.log('previous map cols: ' + this.prevMapCols + ' | current map cols:  ' + finalCols)
    // console.log('cols difference: ' + (finalCols - this.prevMapCols))
    // console.log('previous to left: ' + this.prevAddedCols + '   | added cols to left: ' + this.added[0])
    // console.log('cols added difference: ' + (this.added[0] - this.prevAddedCols))

    // Add the added map to the adjacently loaded maps object
    this.adjacentMaps[location] = mapName;
    // Set the new whole currentMap
    this.currentMap = {
      layers: finalLayers,
      COLS: finalCols,
      ROWS: finalRows,
    }

    // Return the needed variables
    return {
      currentMap: this.currentMap,
      diff: [ finalCols - this.prevMapCols, finalRows - this.prevMapRows ],
    }
  }

  getAdjacent(mapName: string) {
    // Return the adjacent maps according to supplied map
    if (mapName === 'route 101') {
      return [
        {name: 'littleroot town', position: 'bottom'},
        {name: 'oldale town', position: 'top'},
      ];
    } else if (mapName === 'route 102') {
      return [
        {name: 'oldale town', position: 'right'},
      ];
    } else if (mapName === 'littleroot town') {
      return [
        {name: 'route 101', position: 'top'},
      ];
    } else if (mapName === 'oldale town') {
      return [
        {name: 'route 101', position: 'bottom'},
        {name: 'route 102', position: 'left'},
      ];
    }

    return []
  }

  getCol(x: number): number {
    // Get the column of an x coordinate
    return Math.floor(x / TILE_SIZE);
  }

  getRow(y: number): number {
    // Get the row of a y coordinate
    return Math.floor(y / TILE_SIZE);
  }

  getX(col: number): number {
    // Get x of a column of the map
    return col * TILE_SIZE;
  }

  getY(row: number): number {
    // Get y of a row of the map
    return row * TILE_SIZE;
  }
}
