import tileMap from '../assets/tiles.png';
import avatarAssets from '../assets/character.png';
import battleAssets from '../assets/battle_assets.png';
import starterAssets from '../assets/choose_starter.png';
import pokemonGeneration1 from '../assets/pokemon_1st_generation.png';
import pokemonGeneration2 from '../assets/pokemon_2st_generation.png';
import pokemonGeneration3 from '../assets/pokemon_3st_generation.png';
import font from '../assets/font.png';
import buildingAtlas from '../assets/building_assets.png';

import { Player } from './player';
import { Map } from './map';
import { Loader } from '../utils/loader';
import { Camera } from './camera';
import { Avatar } from './avatar';
import { PokemonBattle } from './pokemon_battle';

import { c } from '../utils/constants';
import { keyboard } from '../utils/keyboard';
import { randomFromMinMax, setLocalStorage, drawText } from '../utils/helper';


import { AddMapReturnType, PlayerDataType } from '../utils/types';

export class Game {
  private player = new Player();
  private loader = new Loader();
  private map!: Map;
  private avatar!: Avatar;
  private camera!: Camera;

  private tileAtlas!: HTMLCanvasElement;
  private starterAtlas!: HTMLCanvasElement;
  private font!: HTMLCanvasElement;
  private buildingAtlas!: HTMLCanvasElement;

  private gameCtx: CanvasRenderingContext2D;
  private battleCtx: CanvasRenderingContext2D;
  private overlayCtx: CanvasRenderingContext2D;
  public static GAME_WIDTH = c.GAME_WIDTH;
  public static GAME_HEIGHT = c.GAME_HEIGHT;

  private _previousElapsed = 0;
  private dirx = 0;
  private diry = 0;
  private direction = 0;
  private animation = 0;
  private currentPlayerCol = 0;
  private currentPlayerRow = 0;
  private currentMap: string;
  private gameTriggers: {[trigger: string]: boolean};
  private gameStatus = 'game';

  private selectedStarter = 1;
  private selectedConfirm = true;
  private keyDown = false;

  constructor(gameCtx: CanvasRenderingContext2D, battleCtx: CanvasRenderingContext2D, overlayCtx: CanvasRenderingContext2D) {
    // Set the canvas rendering contexts to the supplied
    this.gameCtx = gameCtx;
    this.battleCtx = battleCtx;
    this.overlayCtx = overlayCtx;

    // Get playerData and gameTriggers from localStorage
    let playerData: PlayerDataType = this.player.getStoredPlayerData('playerData');
    let gameTriggers: {[trigger: string]: boolean} = this.player.getStoredPlayerData('gameTriggers');

    // If playerData in localStorage does not have data, create new player
    if (!playerData.location) {
      playerData = this.player.createNewPlayer(true);
    }

    // If gameTriggers in localStorage does not have data, create gameTriggers object
    if (!gameTriggers.chooseStarter) {
      gameTriggers = {
        chooseStarter: false,
      }
    }
    
    // Set the currentMap to location retrieved from localStorage
    this.currentMap = playerData.location;
    // Set the gameTriggers
    this.gameTriggers = gameTriggers;

    // Promise for loading images into the Loader class
    const p = this.load();

    Promise.all(p).then(() => {
      // Running function to start key eventlistener and set necessary images
      this.init();

      // Create map object with the currentMap
      this.map = new Map(c.MAPS[playerData.location]);
      // Create avatar object with the loader and the map object
      this.avatar = new Avatar(this.loader, this.map);
      // Create camera object with the currentMap and the width and height for the game
      this.camera = new Camera(c.MAPS[playerData.location], c.GAME_WIDTH, c.GAME_HEIGHT);
      // Set the camera object to follow the avatar object
      this.camera.follow(this.avatar);

      // Update the map object to the currentMap's properties
      this.map.updateMap(this.currentMap)
      // Load the adjacent maps
      this.loadAdjacentMaps(true);
      // Set the player position to the correct current location
      this.avatar.loadMapUpdate(this.map, playerData.position.x, playerData.position.y);

      // Interval for saving the playerData to localStorage 
      setInterval(() => this.saveToLocalStorage(), 1000);

      // Start the tick loop with a canvas animation request
      window.requestAnimationFrame(this.tick.bind(this));
    });
  }

  private load(): Promise<HTMLImageElement | string>[] {
    return [
      this.loader.loadImage('tiles', tileMap),
      this.loader.loadImage('avatar', avatarAssets),
      this.loader.loadImage('battleAssets', battleAssets),
      this.loader.loadImage('starterAssets', starterAssets),
      this.loader.loadImage('pokemonGeneration1', pokemonGeneration1),
      this.loader.loadImage('pokemonGeneration2', pokemonGeneration2),
      this.loader.loadImage('pokemonGeneration3', pokemonGeneration3),
      this.loader.loadImage('font', font),
      this.loader.loadImage('buildingAtlas', buildingAtlas),
    ];
  }

  private init(): void {
    // Start the eventListeners for the supplied keys
    keyboard.listenForEvents([keyboard.LEFT, keyboard.RIGHT, keyboard.UP, keyboard.DOWN, keyboard.ENTER]);

    // Set the necessary images to class variables
    this.tileAtlas = this.loader.loadImageToCanvas('tiles', c.ASSETS_TILES_HEIGHT, c.ASSETS_TILES_WIDTH);
    this.starterAtlas = this.loader.loadImageToCanvas('starterAssets', c.ASSETS_STARTER_HEIGHT, c.ASSETS_STARTER_WIDTH);
    this.font = this.loader.loadImageToCanvas('font', c.ASSETS_FONT_HEIGHT, c.ASSETS_FONT_WIDTH);
    this.buildingAtlas = this.loader.loadImageToCanvas('buildingAtlas', c.ASSETS_BUILDING_TILES_HEIGHT, c.ASSETS_BUILDING_TILES_WIDTH);
  }

  async tick(elapsed: number) {
    // Calculate the delta between the ticks
    let delta = (elapsed - this._previousElapsed) / 1000.0;
    delta = Math.min(delta, 0.25); // maximum delta of 250 ms
    this._previousElapsed = elapsed;

    // check for gameStatus to decide what to render
    if (this.gameStatus === 'chooseStarter' || this.gameStatus === 'confirmStarter') {

      // Render chooseStarter sequence
      this.chooseStarter(delta);
    } else {
      // Clear the canvases
      this.battleCtx.clearRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);
      this.gameCtx.clearRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);

      // Update the game (movement and actions)
      this.update(delta);
      // Render layers to canvas.
      this.render(delta);
  
      // Find pokemon function
      await this.findPokemon();
    }
    
    // Request new animation frame
    window.requestAnimationFrame(this.tick.bind(this));
  }

  private saveToLocalStorage() {
    if (this.avatar) {
      this.player.setPlayerPosition(this.currentMap, this.avatar.x, this.avatar.y);
      const playerData = this.player.getPlayerData();
  
      setLocalStorage('playerData', playerData);
      setLocalStorage('gameTriggers', this.gameTriggers);
    }
  }

  async findPokemon(): Promise<void> {
    // Get current column and row of the avatar
    const column = Math.floor(this.avatar.x / c.MAP_TSIZE);
    const row = Math.floor(this.avatar.y / c.MAP_TSIZE);

    // Check if avatar has entered new tile
    if (column !== this.currentPlayerCol || row !== this.currentPlayerRow) {
      // Get the tile identity number from the map object
      const tile = this.map.getTile(0, this.currentPlayerCol, this.currentPlayerRow);
      // Get a random number for deciding if pokemon has been found
      const randomNumber = randomFromMinMax(0, 2879);

      if (tile === 2 && randomNumber < c.GRASS_ENCOUNTER_NUMBER) {
        // Define new pokemon battle
        const pokemonBattle = new PokemonBattle(this.battleCtx, this.overlayCtx, this.loader, this.player, this.currentMap, 0);

        // Start new pokemon battle and wait for result
        const battleResult = await pokemonBattle.battle();
        
        if (battleResult.result) {
          console.log('battle with ' + battleResult.pokemon.pokemonName + ' won!')
          // this.player.addPokemon(foundPokemon);
        } else {
          console.log('battle with ' + battleResult.pokemon.pokemonName + ' lost!')
        }
      }

      // Update current player column and row
      this.currentPlayerCol = column;
      this.currentPlayerRow = row;
    }
  }

  private chooseStarter(delta: number) {
    // Increment animation counter
    this.animation = this.animation < 9.94 ? this.animation + 10 * delta : 0;

    // Set the default x source of the three pokeballs
    let pokeballSource0 = 110;
    let pokeballSource1 = 110;
    let pokeballSource2 = 110;

    if (this.animation < 4) {
      // According to the value of the animation counter and selectedStarter set the x source
      pokeballSource0 = (this.selectedStarter === 0) ? 110 + (this.animation << 0) * 23 : 110;
      pokeballSource1 = (this.selectedStarter === 1) ? 110 + (this.animation << 0) * 23 : 110;
      pokeballSource2 = (this.selectedStarter === 2) ? 110 + (this.animation << 0) * 23 : 110;  
    }

    // Set the coordinates of the selector hand according to the current selected starter
    const handX = (this.selectedStarter === 0) ? 48 : (this.selectedStarter === 1) ? 108 : 169;
    const handY = (this.selectedStarter === 1) ? 33 : 9;

    // Draw the background
    this.battleCtx.drawImage(
      this.starterAtlas,
      0,
      0,
      c.GAME_WIDTH,
      c.GAME_HEIGHT,
      0,
      0,
      c.GAME_WIDTH,
      c.GAME_HEIGHT,
    );

    // Draw professors bag
    this.battleCtx.drawImage(
      this.starterAtlas,
      0,
      160,
      110,
      64,
      65,
      8,
      110,
      64,
    );

    // Draw the dialogue box
    this.battleCtx.drawImage(
      this.starterAtlas,
      0,
      244,
      206,
      46,
      17,
      113,
      206,
      46,
    );    

    // Draw first, most left pokeball
    this.battleCtx.drawImage(
      this.starterAtlas,
      pokeballSource0,
      160,
      23,
      20,
      50,
      54,
      23,
      20,
    );

    // Draw second, middle pokeball
    this.battleCtx.drawImage(
      this.starterAtlas,
      pokeballSource1,
      160,
      23,
      20,
      110,
      78,
      23,
      20,
    );

    // Draw third, most right pokeball
    this.battleCtx.drawImage(
      this.starterAtlas,
      pokeballSource2,
      160,
      23,
      20,
      170,
      54,
      23,
      20,
    );

    // Draw the selector hand
    this.battleCtx.drawImage(
      this.starterAtlas,
      202,
      160,
      25,
      27,
      handX,
      handY,
      25,
      27,
    );

    if (this.gameStatus === 'chooseStarter') {
      if (this.selectedStarter === 0) {
        // Draw the background for the pokemon text
        this.battleCtx.globalAlpha = 0.4;
        this.battleCtx.beginPath();
        this.battleCtx.rect(0, 72, 108, 32);
        this.battleCtx.fill();
        this.battleCtx.globalAlpha = 1;

        // Draw the upper part of the pokemon text
        this.battleCtx.drawImage(
          this.starterAtlas,
          0,
          224,
          86,
          10,
          6,
          76,
          86,
          10,
        );

        // Draw the lower part of the pokemon text
        this.battleCtx.drawImage(
          this.starterAtlas,
          0,
          234,
          42,
          10,
          31,
          92,
          42,
          10,
        );
      } else if (this.selectedStarter === 1) {
        // Draw the background for the pokemon text
        this.battleCtx.globalAlpha = 0.4;
        this.battleCtx.beginPath();
        this.battleCtx.rect(132, 80, 104, 32);
        this.battleCtx.fill();
        this.battleCtx.globalAlpha = 1;

        // Draw the upper part of the pokemon text
        this.battleCtx.drawImage(
          this.starterAtlas,
          86,
          224,
          62,
          10,
          140,
          82,
          62,
          10,
        );

        // Draw the lower part of the pokemon text
        this.battleCtx.drawImage(
          this.starterAtlas,
          86,
          234,
          42,
          10,
          186,
          98,
          42,
          10,
        );
      } else {
        // Draw the background for the pokemon text
        this.battleCtx.globalAlpha = 0.4;
        this.battleCtx.beginPath();
        this.battleCtx.rect(60, 32, 112, 32);
        this.battleCtx.fill();
        this.battleCtx.globalAlpha = 1;

        // Draw the upper part of the pokemon text
        this.battleCtx.drawImage(
          this.starterAtlas,
          148,
          224,
          75,
          10,
          78,
          36,
          75,
          10,
        );

        // Draw the lower part of the pokemon text
        this.battleCtx.drawImage(
          this.starterAtlas,
          148,
          234,
          42,
          10,
          98,
          52,
          42,
          10,
        );
      }

      // Draw the dialogue text to the box
      drawText(this.battleCtx, this.font, 'PROF. BIRCH is in trouble!', 0, 0, 24, 121);
      drawText(this.battleCtx, this.font, 'Release a POKéMON and rescue him!', 0, 0, 24, 137);
  
      // if key is pressed and not yet down, increment selectedStarter accordingly
      if (!this.keyDown) {
        if (keyboard.isDown(keyboard.LEFT) && this.selectedStarter !== 0) {
          this.selectedStarter--;
          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.RIGHT) && this.selectedStarter !== 2) {
          this.selectedStarter++;
          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.ENTER)) {
          // Enter next gameStatus to confirm starter choice
          this.gameStatus = 'confirmStarter';
          this.keyDown = true;
        } 
      }

      // Reset the selectedConfirm to the default of true
      this.selectedConfirm = true;
    } else if (this.gameStatus === 'confirmStarter') {
      // Draw conformation question to the dialogue box
      drawText(this.battleCtx, this.font, 'Do you choose this POKéMON?', 0, 0, 24, 121);

      // The x and y pixel for the center of the pokemon preview circle
      const xPixel = 120;
      const yPixel = 65;

      // Get the assets for the currently selected starter
      const pokemonId = (this.selectedStarter === 0) ? 252 : (this.selectedStarter === 1) ? 255 : 258;
      const generation = 2;
      const pokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (generation + 1), c.ASSETS_POKEMON_HEIGHT[generation], c.ASSETS_POKEMON_WIDTH);
      const xSource = (pokemonId - c.ASSETS_GENERATION_OFFSET[generation] - 1) % 3 * c.POKEMON_SPRITE_WIDTH;
      const ySource = (((pokemonId - c.ASSETS_GENERATION_OFFSET[generation] - 1) / 3) << 0) * c.POKEMON_SIZE;
  
      // Draw the pokemon preview circle
      this.battleCtx.fillStyle = '#ffffff';
      this.battleCtx.beginPath();
      this.battleCtx.arc(xPixel, yPixel, 40, 0, 2 * Math.PI);
      this.battleCtx.fill();
      this.battleCtx.fillStyle = '#000000';

      // Draw the pokemon preview to the center of the circle
      this.battleCtx.drawImage(
        pokemonSprite,
        xSource,
        ySource,
        c.POKEMON_SIZE,
        c.POKEMON_SIZE,
        (xPixel - c.POKEMON_SIZE / 2) << 0,
        (yPixel - c.POKEMON_SIZE / 2) << 0,
        c.POKEMON_SIZE,
        c.POKEMON_SIZE,
      );

      // Draw the yes/no conformation box
      this.battleCtx.drawImage(
        this.starterAtlas,
        206,
        244,
        54,
        46,
        170,
        58,
        54,
        46,
      );

      // The offset for the selection box
      const yOffset = (!this.selectedConfirm) ? 16 : 0;

      // Draw the selector rectangle
      this.battleCtx.beginPath();
      this.battleCtx.moveTo(177, 64.5 + yOffset);
      this.battleCtx.lineTo(216, 64.5 + yOffset);
      this.battleCtx.moveTo(216.5, 65 + yOffset);
      this.battleCtx.lineTo(216.5, 78 + yOffset);
      this.battleCtx.moveTo(216, 78.5 + yOffset);
      this.battleCtx.lineTo(177, 78.5 + yOffset);
      this.battleCtx.moveTo(176.5, 78 + yOffset);
      this.battleCtx.lineTo(176.5, 65 + yOffset);

      this.battleCtx.lineWidth = 1;
      this.battleCtx.globalAlpha = 1;
      this.battleCtx.strokeStyle = '#f86058';
      this.battleCtx.stroke();
  
      // if key is pressed and not yet down, change selectedConfirm accordingly
      if (!this.keyDown) {
        if (keyboard.isDown(keyboard.DOWN) && this.selectedConfirm !== false) {
          this.selectedConfirm = false;
          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.UP) && this.selectedConfirm !== true) {
          this.selectedConfirm = true;
          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.ENTER)) {
          // Continue back to game or return to starter selection screen accordingly
          if (!this.selectedConfirm) {
            this.gameStatus = 'chooseStarter';
          } else {
            // Add the chosen starter to the players inventory (level = 5)
            this.player.addPokemon(pokemonId, [5, -1]);
  
            this.gameStatus = 'game';
            this.gameTriggers.chooseStarter = true;
          }

          this.keyDown = true;
        }
      }
    }

    // Reset keyDown variable if not down anymore
    if (!keyboard.isDown(keyboard.LEFT) && !keyboard.isDown(keyboard.RIGHT) && 
        !keyboard.isDown(keyboard.UP) && !keyboard.isDown(keyboard.DOWN) && 
        !keyboard.isDown(keyboard.ENTER)) {
      this.keyDown = false;
    }
  }

  private loadAdjacentMaps(fromDirection: string | boolean = false) {
    // get list of adjacent map objects
    const Adjacent = this.map.getAdjacent(this.currentMap);
    // Construct list of added map strings
    const addedAreas = Adjacent.map(a => a.position)

    // Initiate variable for return object
    let updatedData: AddMapReturnType | undefined;

    // Foreach adjacent map add map to loaded map
    for (const adjacentMap of Object.values(Adjacent)) {
      updatedData = this.map.addMap(adjacentMap.name, adjacentMap.position, 0);
    }

    if (updatedData) {
      // Update camera maxX and maxY variables to the updated map
      this.camera.updateMap(updatedData.currentMap);

      // Initiate variable for the tiles added above and to the left of the currentMap
      const addedTiles = [ 0, 0 ];
      
      // THIS SHOULD MAYBE BE UPDATED!!
      if (addedAreas.includes('top') && addedAreas.includes('bottom') && fromDirection === 'top') {
        addedTiles[1] = updatedData.diff[1];
      } else if (addedAreas.includes('top') && !addedAreas.includes('bottom') && fromDirection === 'bottom') {
        addedTiles[1] = updatedData.diff[1];
      }
      
      if (addedAreas.includes('left') && addedAreas.includes('bottom') && fromDirection === 'top') {
        addedTiles[0] = updatedData.diff[0];
      } else if (addedAreas.includes('bottom') && addedAreas.includes('top') && fromDirection === 'bottom') {
        addedTiles[0] = updatedData.diff[0];
      }
      // /////////////////////////// //

      return addedTiles;
    }
  }

  private update(delta: number) {
    this.dirx = 0;
    this.diry = 0;

    // Get the new moving direction from pressed keys
    if (keyboard.isDown(keyboard.LEFT)) { this.dirx = -1; }
    else if (keyboard.isDown(keyboard.RIGHT)) { this.dirx = 1; }
    else if (keyboard.isDown(keyboard.UP)) { this.diry = -1; }
    else if (keyboard.isDown(keyboard.DOWN)) {this.diry = 1; }

    // Check if the player entered a new map
    const isNextMap = this.map.isNextMap(this.avatar.x, this.avatar.y);

    // If new map is entered, update accordingly
    if (typeof isNextMap !== 'boolean') {
      console.log('Entered new area: ' + this.currentMap);

      // Set the new entered map to currentMap
      this.currentMap = isNextMap[0];
      
      // Update the map object to the currentMap's properties
      this.map.updateMap(this.currentMap)
      // Load the adjacent maps and retrieve the tiles added above and to the left of the currentMap
      const addedTiles = this.loadAdjacentMaps(isNextMap[1]);

      if (addedTiles) {
        // Correct the avatars coordinates for the added adjacent maps
        this.avatar.newAreaMapUpdate(this.map, addedTiles);
      }

      if (this.currentMap === 'route 101' && this.gameTriggers.chooseStarter === false) {
        this.gameStatus = 'chooseStarter';
        // await this.chooseStarter();
      }
    }

    // Move the avatar accordingly
    this.avatar.move(delta, this.dirx, this.diry);
    // Update the camera position according to the new avatar position
    this.camera.update();
  }

  private render(delta: number): void {
    // Draw bottom, background layer of the game
    this.drawLayer(0);

    // Draw the full avatar spite
    this.drawPlayer(delta, false);

    // Draw middle layer of the game
    this.drawLayer(1);

    // Draw only the bottom of the avatar sprite
    this.drawPlayer(delta, true);

    // Draw top layer of the game
    this.drawLayer(2);
  }

  private drawLayer(layer: number): void {
    // get the render boundaries from the camera position
    const startCol = Math.floor(this.camera.x / c.MAP_TSIZE);
    const endCol = startCol + (this.camera.width / c.MAP_TSIZE);
    const startRow = Math.floor(this.camera.y / c.MAP_TSIZE);
    const endRow = startRow + (this.camera.height / c.MAP_TSIZE);
    const offsetX = -this.camera.x + startCol * c.MAP_TSIZE;
    const offsetY = -this.camera.y + startRow * c.MAP_TSIZE;

    // Loop through columns and rows
    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        // Get the tile identity number to draw
        let tile = this.map.getTile(layer, col, row);
        if (tile === -1) break; 
        // Get the x and y coordinates of the tile location
        const x = (col - startCol) * c.MAP_TSIZE + offsetX;
        const y = (row - startRow) * c.MAP_TSIZE + offsetY;

        let atlas: HTMLCanvasElement;

        // Tile numbers 0-499 for general tiles and tiles 500-> for building tiles
        // Select atlas appropriately
        if (500 <= tile) {
          atlas = this.buildingAtlas;
          tile = tile - 500;
        } else {
          atlas = this.tileAtlas;
        }

        // Draw tile to screen
        if (tile !== 0 && atlas) {
          this.gameCtx.drawImage(
            atlas,
            (tile - 1) % 16 * c.MAP_TSIZE,
            Math.floor((tile - 1) / 16) * c.MAP_TSIZE,
            c.MAP_TSIZE,
            c.MAP_TSIZE,
            Math.round(x),
            Math.round(y),
            c.MAP_TSIZE,
            c.MAP_TSIZE
          );
        }
      }
    }
  }

  private drawPlayer(delta: number, onlyDrawTop: boolean): void {
    if (!onlyDrawTop) {
      // Set player direction and increment animation counter
      this.direction = this.diry === 1 ? 0 : this.dirx === -1 ? 1 : this.diry === -1 ? 2 : this.dirx === 1 ? 3 : this.direction;
      if (this.diry === 0 && this.dirx === 0) {
        this.animation = 0;
      } else {
        this.animation = this.animation < 3.95 ? this.animation + 6 * delta : 0;
      }
    }

    // Set the height of sprite to be drawn
    const height = onlyDrawTop ? 0.75 * c.AVATAR_HEIGHT : c.AVATAR_HEIGHT;
    // Set the x pixel of the source from the direction and animation
    const xSource = this.direction * c.AVATAR_WIDTH * 4 + (this.animation << 0) * c.AVATAR_WIDTH;

    if (this.avatar.avatarAsset) {
      // Drawn the avatar sprite
      this.gameCtx.drawImage(
        this.avatar.avatarAsset,
        xSource,
        0,
        c.AVATAR_WIDTH,
        height,
        (0.5 + this.avatar.screenX - c.AVATAR_WIDTH / 2) << 0,
        (0.5 + this.avatar.screenY - c.AVATAR_HEIGHT / 2 + (((1 < this.animation && this.animation < 2) || (3 < this.animation && this.animation < 4)) ? 1 : 0)) << 0,
        c.AVATAR_WIDTH,
        height
      );
    }
  }
}