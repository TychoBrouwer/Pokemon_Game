import * as pokedex from '../pokedex.json';
import * as encounterTable from '../encounter_table.json';

import { Loader } from '../utils/loader';
import { Player } from './player';

import { randomFromArray, generatePokemon, drawText } from '../utils/helper';
import { c } from '../utils/constants';
import { keyboard } from '../utils/keyboard';

import { PlayerDataType, EncounterTableType, PokedexType, PokemonDataType } from '../utils/types';

const BATTLE_STATUS = [
  'slidePokemonIn',
  'writeAppearText',
  'writeGoText',
  'throwPokemon',
  'playerActionSelect',
  'playerAction',
  'finished',
];

// const BATTLE_ACTIONS = [
//   'fight',
//   'bag',
//   'pokemon',
//   'run'
// ];

export class PokemonBattle {
  private loader: Loader;
  private pokedex: PokedexType;
  private encounterTable: EncounterTableType;

  private encounterMethod: number;
  private route: string;
  private ctx: CanvasRenderingContext2D;
  private battleAssets: HTMLCanvasElement;
  private font: HTMLCanvasElement;
  private avatarAssets: HTMLCanvasElement;

  private enemyPokemonSprite!: HTMLCanvasElement;
  private enemyPokemon: PokemonDataType;

  private playerPokemonSprite!: HTMLCanvasElement;
  private playerData: PlayerDataType;
  private playerPokemon: PokemonDataType;

  private battleAction = 0;
  private battleResultWin = false;

  private _previousElapsed = 0;
  private battleStatus = 0;
  private X_slidePokemonIn = 0;
  private X_slideEnemyHealth = 0;
  private X_slidePlayerHealth = 0;
  private X_throwPokemon = 0;
  private X_throwPokeball = 0;
  private pokeballAnimation = 0;
  private pokemoinAlternativeOpacity = 1;
  private X_writeTextToBattleBox = 0;

  constructor(context: CanvasRenderingContext2D, loader: Loader, player: Player, route: string, encounterMethod: number) {
    // Set the loader to the supplied
    this.loader = loader;

    // Get the pokedex and encounterTable
    this.pokedex = pokedex;
    this.encounterTable = encounterTable;

    // Set the supplied variables
    this.encounterMethod = encounterMethod;
    this.route = route;
    this.ctx = context;

    // Set the necessary assets
    this.battleAssets = this.loader.loadImageToCanvas('battleAssets', c.ASSETS_BATTLE_HEIGHT, c.ASSETS_BATTLE_WIDTH);
    this.font = this.loader.loadImageToCanvas('font', c.ASSETS_FONT_HEIGHT, c.ASSETS_FONT_WIDTH);
    this.avatarAssets = this.loader.loadImageToCanvas('avatar', c.ASSETS_AVATAR_HEIGHT, c.ASSETS_AVATAR_WIDTH);

    // Get the playerData
    this.playerData = player.getPlayerData();

    // Get the current player pokemon from the PlayerData
    this.playerPokemon = this.playerData.pokemon[this.playerData.currentPokemon];

    // Get and generate the enemy pokemon and load necessary assets 
    this.enemyPokemon = this.init();

    console.log(this.enemyPokemon);
    console.log(this.playerPokemon);
  }

  init() {
    // Set the candidate pokemon 
    const candidates = this.encounterTable[this.route][this.encounterMethod.toString()];

    // Get the candidate ids taking in mind the encounter rates
    const candidateIds: number[] = [];
    for (const pokemonIndex in candidates) {
      candidateIds.push(...Array(candidates[pokemonIndex].rate).fill(parseInt(pokemonIndex)))
    }

    // Randomly choose the pokemon from candidateIds
    const pokemonId = randomFromArray(candidateIds);
    // Generate enemy pokemon
    const enemyPokemon = generatePokemon(this.pokedex[pokemonId.toString()], candidates[pokemonId].level, pokemonId, -1);

    // Set the necessary assets
    this.enemyPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (enemyPokemon.generation + 1), c.ASSETS_POKEMON_HEIGHT[enemyPokemon.generation], c.ASSETS_POKEMON_WIDTH);
    if (enemyPokemon.generation === this.playerPokemon.generation) {
      this.playerPokemonSprite = this.enemyPokemonSprite;
    } else {
      this.playerPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (this.playerPokemon.generation + 1), c.ASSETS_POKEMON_HEIGHT[this.playerPokemon.generation], c.ASSETS_POKEMON_WIDTH);
    }
    
    return enemyPokemon;
  }
  
  async battle() {
    // Start the tick loop with a canvas animation request
    window.requestAnimationFrame(this.tick.bind(this));

    // Wait for battle finished
    await this.battleFinished();

    // Battle return object
    const battleData = {
      result: this.battleResultWin,
      pokemon: this.enemyPokemon,
    };

    // Clear battle canvas rendering context
    this.ctx.clearRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);

    // Return battleData
    return battleData;
  }

  battleFinished(): Promise<void> {
    return new Promise((resolve) => {
      // resolve if battle is finished
      if (BATTLE_STATUS[this.battleStatus] === 'finished') {
        resolve();
      } else {
        // Check every 10 ms for battleFinished
        setTimeout(async () => { 
          await this.battleFinished();
          resolve();
        }, 10);
      }
    })
  }

  nextBattlePhase() {
    // Increment battleStatus;
    this.battleStatus++;
  }

  async tick(elapsed: number) {
    // Calculate the delta between the ticks
    let delta = (elapsed - this._previousElapsed) / 1000.0;
    delta = Math.min(delta, 0.25); // maximum delta of 250 ms
    this._previousElapsed = elapsed;

    if (BATTLE_STATUS[this.battleStatus] === 'slidePokemonIn') {
      this.drawBattleArena();
      // Draw enemy pokemon with slide, with avatar, with next phase
      this.drawEnemyPokemon(delta, true, true);
      // Draw action box without the player action selector
      this.drawActionBox(false);

    } else if (BATTLE_STATUS[this.battleStatus] === 'writeAppearText') {
      this.drawBattleArena();
      // Draw enemy pokemon without slide, with avatar, without next phase
      this.drawEnemyPokemon(0, true, false);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Write appear text to dialogue box, with next phase
      this.writeTextToBattleBox('Wild ' + this.enemyPokemon.pokemonName.toUpperCase() + ' appeared!|', 0, 1, delta, 1, 0, true, true);
      // Draw enemy health with slide
      this.drawEnemyHealth(delta);

    } else if (BATTLE_STATUS[this.battleStatus] === 'writeGoText') {
      // Write go text to dialogue box, with next phase
      this.writeTextToBattleBox('Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, delta, 0, 0, true, true);

    } else if (BATTLE_STATUS[this.battleStatus] === 'throwPokemon') {
      this.drawBattleArena();
      // Draw enemy pokemon without slide, without avatar, without next phase
      this.drawEnemyPokemon(0, false, false);
      // Draw enemy health without slide
      this.drawEnemyHealth(0);
      // Draw enemy pokemon with slide, with throw, with next phase
      this.drawPlayerPokemon(delta, true, true);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Draw go text to dialogue box
      drawText(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121)

    } else if (BATTLE_STATUS[this.battleStatus] === 'playerActionSelect') {
      // Draw action box with player action selector
      this.drawActionBox(true);
      // Write action select text to dialogue box, without next phase
      this.writeTextToBattleBox('What should ', 0, 1, delta, 0, 0, false, false);
      this.writeTextToBattleBox(this.playerPokemon.pokemonName.toUpperCase() + ' do?', 0, 1, delta, 0, 1, false, false);

      // Detect keyboard press and increment/ decrement battleAction accordingly
      if (keyboard.isDown(keyboard.LEFT)) {
        if (this.battleAction === 1 || this.battleAction === 3) {
          this.battleAction--;
        }
      } else if (keyboard.isDown(keyboard.RIGHT)) { 
        if (this.battleAction === 0 || this.battleAction === 2) {
          this.battleAction++;
        }
      } else if (keyboard.isDown(keyboard.UP)) { 
        if (this.battleAction === 2 || this.battleAction === 3) {
          this.battleAction -= 2;
        }
      } else if (keyboard.isDown(keyboard.DOWN)) { 
        if (this.battleAction === 0 || this.battleAction === 1) {
          this.battleAction += 2;
        }
      } else if (keyboard.isDown(keyboard.ENTER)) {
        // On enter go to next battle phase
        this.nextBattlePhase();
      }

      // Set the offset and column for the battle action selector
      let xOffset = this.battleAction * 46;
      let yColumn = 0;
      if (this.battleAction === 2 || this.battleAction === 3)  {
        xOffset = (this.battleAction - 2) * 46;
        yColumn = 1;
      }
  
      // Draw the action selector
      this.drawActionSelector(c.GAME_WIDTH - c.ACTION_BOX_WIDTH + 8 + xOffset, c.GAME_WIDTH - c.ACTION_BOX_WIDTH + 8 + 42 + xOffset, yColumn);
    
    } else if (BATTLE_STATUS[this.battleStatus] === 'playerAction') {
      console.log(this.battleAction);
    }
    
    if (BATTLE_STATUS[this.battleStatus] !== 'finished') {
      // If battle is not finished request new animation frame
      window.requestAnimationFrame(this.tick.bind(this));
    }
  }

  drawEnemyPokemon(delta: number, drawPlayer = false, nextPhase = false) {
    const speed = 176;
    const xPixel = (this.X_slidePokemonIn + delta * speed) << 0;

    this.ctx.drawImage(
      this.battleAssets,
      this.encounterMethod % 3 * c.BATTLE_SCENE_WIDTH,
      ((0.5 + this.encounterMethod / 3) << 0) * c.BATTLE_SCENE_HEIGHT + 3 * c.BATTLE_ARENA_HEIGHT + c.ACTION_BOX_HEIGHT,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
      xPixel - c.BATTLE_SCENE_WIDTH,
      48,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
    );

    const enemyPokemonCtx = this.enemyPokemonSprite.getContext('2d');

    if (enemyPokemonCtx && xPixel <= c.GAME_WIDTH - 1) {
      this.ctx.globalAlpha = 0.8;
    }

    this.ctx.drawImage(
      this.enemyPokemonSprite,
      this.enemyPokemon.xSource,
      this.enemyPokemon.ySource,
      c.POKEMON_SIZE,
      c.POKEMON_SIZE,
      xPixel - 0.75 * c.BATTLE_SCENE_WIDTH,
      48 - c.POKEMON_SIZE / 2,
      c.POKEMON_SIZE,
      c.POKEMON_SIZE,
    );

    this.ctx.globalAlpha = 1;

    this.ctx.drawImage(
      this.battleAssets,
      this.encounterMethod % 3 * c.BATTLE_SCENE_WIDTH,
      ((0.5 + this.encounterMethod / 3) << 0) * c.BATTLE_SCENE_HEIGHT + 3 * c.BATTLE_ARENA_HEIGHT + c.ACTION_BOX_HEIGHT,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
      c.GAME_WIDTH - xPixel,
      100,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
    );
    
    if (drawPlayer) {
      this.ctx.drawImage(
        this.avatarAssets,
        c.AVATAR_BATTLE_OFFSET,
        0,
        c.AVATAR_BATTLE_WIDTH,
        c.AVATAR_BATTLE_HEIGHT,
        c.GAME_WIDTH - xPixel + 0.5 * c.BATTLE_SCENE_WIDTH,
        c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT,
        c.AVATAR_BATTLE_WIDTH,
        c.AVATAR_BATTLE_HEIGHT,
      );

      if (xPixel >= c.GAME_WIDTH && nextPhase) {
        this.nextBattlePhase();
      }

      this.X_slidePokemonIn += delta * speed;
      this.X_throwPokemon = this.X_slidePokemonIn;
    }
  }

  drawEnemyHealth(delta: number) {
    const speed = 224;
    let xPixel = (this.X_slideEnemyHealth + delta * speed - c.ASSETS_ENEMY_HEALTH_WIDTH) << 0;

    if (xPixel > 13) xPixel = 13;

    this.ctx.drawImage(
      this.battleAssets,
      c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_HEALTH_OFFSET,
      c.ASSETS_ENEMY_HEALTH_WIDTH,
      c.ASSETS_ENEMY_HEALTH_HEIGHT,
      xPixel,
      16,
      c.ASSETS_ENEMY_HEALTH_WIDTH,
      c.ASSETS_ENEMY_HEALTH_HEIGHT,
    );

    const healthFrac = this.enemyPokemon.health / this.enemyPokemon.stats.hp;
    const healthbarWidth = (healthFrac * 48) << 0
    const healthbarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;

    this.ctx.drawImage(
      this.battleAssets,
      c.ASSETS_ENEMY_HEALTH_WIDTH + c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_HEALTH_OFFSET + healthbarOffset,
      healthbarWidth,
      2,
      xPixel + 39,
      16 + 17,
      healthbarWidth,
      2,
    );

    drawText(this.ctx, this.font, this.enemyPokemon.pokemonName.toUpperCase() + ((this.enemyPokemon.gender) ? '#' : '^'), 1, 0, xPixel - 13 + 20, 22);
    drawText(this.ctx, this.font, this.enemyPokemon.level.toString(), 1, 0, xPixel - 13 + 89, 22);

    this.X_slideEnemyHealth += delta * speed;
  }

  drawPlayerPokemon(delta: number, throwPokemon = false, nextPhase = false) {
    const speed = 176;
    const speedPokeball = 48;

    const xPixel = (this.X_throwPokemon + delta * speed) << 0;

    const assetOffset = (xPixel < c.GAME_WIDTH + 0.6 * c.BATTLE_SCENE_WIDTH) ? c.AVATAR_BATTLE_HEIGHT : 
                        (xPixel < c.GAME_WIDTH + 0.75 * c.BATTLE_SCENE_WIDTH) ? 2 * c.AVATAR_BATTLE_HEIGHT : 
                        3 * c.AVATAR_BATTLE_HEIGHT;
                    
    let xPixelPokeball = 0;
    if (xPixel >= 340) {
      this.pokeballAnimation = this.pokeballAnimation < 7.2 ? this.pokeballAnimation + 0.2 : 0;

      xPixelPokeball = (this.X_throwPokeball + delta * speedPokeball) << 0;
      const yPixelPokeball = (0.08 * xPixelPokeball ** 2 - 2.2 * xPixelPokeball + 70) << 0

      this.ctx.drawImage(
        this.battleAssets,
        c.POKEBALL_OFFSET_X + this.playerPokemon.pokeball * c.POKEBALL_SIZE,
        c.POKEBALL_OFFSET_Y + 37 + (this.pokeballAnimation << 0) * c.POKEBALL_SIZE,
        c.POKEBALL_SIZE,
        c.POKEBALL_SIZE,
        xPixelPokeball + 25,
        yPixelPokeball,
        c.POKEBALL_SIZE,
        c.POKEBALL_SIZE,
      );

      if (throwPokemon) {
        this.X_throwPokeball += delta * speedPokeball;
      }
    }

    if (xPixelPokeball >= 30) {
      const opacity = (this.pokemoinAlternativeOpacity > 0) ? this.pokemoinAlternativeOpacity : 0;
      this.ctx.globalAlpha = opacity;

      if (opacity > 0) {      
        this.ctx.drawImage(
          this.playerPokemonSprite,
          this.playerPokemon.xSource + 2 * c.POKEMON_SIZE + c.POKEMON_ALTERNATIVE_OFFSET,
          this.playerPokemon.ySource,
          c.POKEMON_SIZE,
          c.POKEMON_SIZE,
          (0.5 * (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE) + 0.5 * (c.POKEMON_SIZE - (xPixelPokeball - 30) / 40 * c.POKEMON_SIZE) << 0),
          (c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT + c.POKEMON_SIZE - (xPixelPokeball - 30) / 40 * c.POKEMON_SIZE) << 0,
          c.POKEMON_SIZE * (xPixelPokeball - 30) / 40,
          c.POKEMON_SIZE * (xPixelPokeball - 30) / 40,
        );
      }

      this.ctx.globalAlpha = 1 - opacity;
      
      if (xPixelPokeball >= 70) {
        this.ctx.drawImage(
          this.playerPokemonSprite,
          this.playerPokemon.xSource + 2 * c.POKEMON_SIZE,
          this.playerPokemon.ySource,
          c.POKEMON_SIZE,
          c.POKEMON_SIZE,
          0.5 * (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE),
          c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT,
          c.POKEMON_SIZE,
          c.POKEMON_SIZE,
        );

        this.pokemoinAlternativeOpacity -= delta * 8;

        const speedHealth = 224;
        let xPixelPlayerHealth = (this.X_slidePlayerHealth - delta * speedHealth + c.GAME_WIDTH) << 0;
    
        if (xPixelPlayerHealth < 127) xPixelPlayerHealth = 127;

        this.ctx.drawImage(
          this.battleAssets,
          0,
          c.ASSETS_HEALTH_OFFSET,
          c.ASSETS_PLAYER_HEALTH_WIDTH,
          c.ASSETS_PLAYER_HEALTH_HEIGHT,
          xPixelPlayerHealth,
          75,
          c.ASSETS_PLAYER_HEALTH_WIDTH,
          c.ASSETS_PLAYER_HEALTH_HEIGHT,
        );

        const healthFrac = this.playerPokemon.health / this.playerPokemon.stats.hp;
        const healthbarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;
        const healthbarWidth = (healthFrac * 48) << 0

        this.ctx.drawImage(
          this.battleAssets,
          c.ASSETS_ENEMY_HEALTH_WIDTH + c.ASSETS_PLAYER_HEALTH_WIDTH,
          c.ASSETS_HEALTH_OFFSET + healthbarOffset,
          healthbarWidth,
          2,
          xPixelPlayerHealth + 47,
          75 + 17,
          healthbarWidth,
          2,
        );

        drawText(this.ctx, this.font, this.playerPokemon.pokemonName.toUpperCase() + ((this.playerPokemon.gender) ? '#' : '^'), 1, 0, xPixelPlayerHealth + 14, 74 + 6)
        drawText(this.ctx, this.font, this.playerPokemon.level.toString(), 1, 0, xPixelPlayerHealth + 84, 75 + 6)
        drawText(this.ctx, this.font, this.playerPokemon.health.toString().padStart(3, '_') + '/' + this.playerPokemon.stats.hp.toString().padStart(3, '_'), 1, 0, xPixelPlayerHealth + 59, 75 + 22)

        if (throwPokemon) {
          this.X_slidePlayerHealth -= delta * speedHealth;
        }
      }

      this.ctx.globalAlpha = 1;
    }
                    
    this.ctx.drawImage(
      this.avatarAssets,
      c.AVATAR_BATTLE_OFFSET,
      assetOffset,
      c.AVATAR_BATTLE_WIDTH,
      c.AVATAR_BATTLE_HEIGHT,
      c.GAME_WIDTH - xPixel + 0.5 * c.BATTLE_SCENE_WIDTH,
      c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT,
      c.AVATAR_BATTLE_WIDTH,
      c.AVATAR_BATTLE_HEIGHT,
    );

    if (xPixelPokeball >= 100 && nextPhase) {
      this.nextBattlePhase();
    }

    if (throwPokemon) {
      this.X_throwPokemon += delta * speed;
    }
  }

  drawActionSelector(xStart: number, xEnd: number, column: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(xStart, 121 + column * 16 - 0.5);
    this.ctx.lineTo(xEnd - 1, 121 + column * 16 - 0.5);
    this.ctx.moveTo(xEnd - 0.5, 121 + column * 16);
    this.ctx.lineTo(xEnd - 0.5, 121 + 14 + column * 16);
    this.ctx.moveTo(xEnd - 1, 121 + 14 + column * 16 + 0.5);
    this.ctx.lineTo(xStart, 121 + 14 + column * 16 + 0.5);
    this.ctx.moveTo(xStart - 0.5, 121 + 14 + column * 16);
    this.ctx.lineTo(xStart - 0.5, 121 + column * 16);

    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#f86058';
    this.ctx.stroke();
  }

  writeTextToBattleBox(text: string, fontsize: number, fontColor: number, delta: number, delayAfter: number, textLine: number, writeOut: boolean, nextPhase = false) {
    const speed = 304;
    const yText = 121 + 16 * textLine;

    if (writeOut) {
      const i = ((this.X_writeTextToBattleBox + delta * speed) / 6) << 0;
      const textToDisplay =  text.slice(0, i);
  
      drawText(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
  
      if (i >= text.length + delayAfter * speed / 6) {
        this.X_writeTextToBattleBox = 0;
  
        this.drawActionBox(false);
  
        if (nextPhase) {
          this.nextBattlePhase();
        }
      } else {
        this.X_writeTextToBattleBox += delta * speed;
      }
    } else {
      drawText(this.ctx, this.font, text, fontsize, fontColor, 16, yText);
    }
  } 

  drawBattleArena() {
    this.ctx.drawImage(
      this.battleAssets,
      this.encounterMethod % 4 * c.GAME_WIDTH,
      ((0.5 + this.encounterMethod / 4) << 0) * c.BATTLE_ARENA_HEIGHT,
      c.GAME_WIDTH,
      c.BATTLE_ARENA_HEIGHT,
      0,
      0,
      c.GAME_WIDTH,
      c.BATTLE_ARENA_HEIGHT,
    );
  }

  drawActionBox(actionChoice: boolean) {
    this.ctx.drawImage(
      this.battleAssets,
      0,
      3 * c.BATTLE_ARENA_HEIGHT,
      c.GAME_WIDTH,
      c.ACTION_BOX_HEIGHT,
      0,
      c.BATTLE_ARENA_HEIGHT,
      c.GAME_WIDTH,
      c.ACTION_BOX_HEIGHT,
    );  

    if (actionChoice) {
      this.ctx.drawImage(
        this.battleAssets,
        c.GAME_WIDTH,
        3 * c.BATTLE_ARENA_HEIGHT,
        c.ACTION_BOX_WIDTH,
        c.ACTION_BOX_HEIGHT,
        c.GAME_WIDTH - c.ACTION_BOX_WIDTH,
        c.BATTLE_ARENA_HEIGHT,
        c.ACTION_BOX_WIDTH,
        c.ACTION_BOX_HEIGHT,
      );
    }
  }
}