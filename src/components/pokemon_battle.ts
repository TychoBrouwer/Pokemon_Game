import * as pokedex from '../pokedex.json';
import * as moveIndex from '../move_index.json';
import * as encounterTable from '../encounter_table.json';

import { Loader } from '../utils/loader';
import { Player } from './player';

import { randomFromArray, generatePokemon, drawText, randomFromMinMax } from '../utils/helper';
import { c } from '../utils/constants';
import { keyboard } from '../utils/keyboard';

import { PlayerDataType, EncounterTableType, PokedexType, PokemonDataType, MoveIndexType, MoveType } from '../utils/types';

const enum BattleStatus {
  SlidePokemonIn,
  WriteAppearText,
  WriteGoText,
  ThrowPokemon,
  PlayerActionSelect,
  PlayerSelectMove,
  PlayerBag,
  PlayerChoosePokemon,
  PlayerRun,
  PlayerMove,
  EnemyTakesDamage,
  Finished,
}

export class PokemonBattle {
  private loader: Loader;
  private pokedex: PokedexType;
  private moveIndex: MoveIndexType;
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
  private battleMove = 0;
  private battleMoveName = '';
  private battleResultWin = false;

  private _previousElapsed = 0;
  private battleStatus = 0;
  private keyDown = false;
  private latestMoveDamage: number | null = null;

  private damageCalculated = false;
  private X_slidePokemonIn = 0;
  private X_slideEnemyHealth = 0;
  private X_slidePlayerHealth = 0;
  private X_avatarThrow = 0;
  private X_thrownPokeball = 0;
  private X_pokemonAttack = 0;
  private animation = 0;
  private pokemonAlternativeOpacity = 1;
  // private pokemonAttackAnimation = 0;
  private X_writeTextToBattleBox = 0;

  constructor(context: CanvasRenderingContext2D, loader: Loader, player: Player, route: string, encounterMethod: number) {
    // Set the loader to the supplied
    this.loader = loader;

    // Get the pokedex and encounterTable
    this.pokedex = pokedex;
    this.moveIndex = moveIndex;
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
      if (this.battleStatus === BattleStatus.Finished) {
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

  nextBattlePhase(battleStatus: number | undefined = undefined) {
    // Reset animation counter
    this.animation = 0;

    // Increment battleStatus;
    if (battleStatus) {
      this.battleStatus = battleStatus;
    } else {
      this.battleStatus++;
    }
  }

  tick(elapsed: number) {
    // Calculate the delta between the ticks
    let delta = (elapsed - this._previousElapsed) / 1000.0;
    delta = Math.min(delta, 0.25); // maximum delta of 250 ms
    this._previousElapsed = elapsed;

    if (this.battleStatus === BattleStatus.SlidePokemonIn) {
      this.drawBattleArena();
      // Draw enemy pokemon with slide, with avatar, with next phase
      this.drawEnemyPokemon(delta, true);
      // Draw player avatar sliding in
      const counter = this.drawAvatar(delta, true);
      // Draw action box without the player action selector
      this.drawActionBox(false);

      if (counter >= c.GAME_WIDTH) {
        this.nextBattlePhase();
      }
    } else if (this.battleStatus === BattleStatus.WriteAppearText) {
      this.drawBattleArena();
      // Draw enemy pokemon without slide, with avatar, without next phase
      this.drawEnemyPokemon(delta, false);
      // Draw player avatar
      this.drawAvatar(delta, false);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Write appear text to dialogue box, with next phase
      const text = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase() + ' appeared!|';
      const counter = this.writeTextToBattleBox(text, 0, 1, delta, 1, 0);
      // Draw enemy health with slide
      this.drawEnemyHealth(delta, true);

      if (counter >= text.length + 30) {
        this.X_writeTextToBattleBox = 0;

        this.drawActionBox(false);
        this.nextBattlePhase();
      }
    } else if (this.battleStatus === BattleStatus.WriteGoText) {
      // Write go text to dialogue box, with next phase
      const text = 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!';
      const counter = this.writeTextToBattleBox(text, 0, 1, delta, 1, 0);

      if (counter >= text.length + 10) {
        this.X_writeTextToBattleBox = 0;

        this.nextBattlePhase();
      }
    } else if (this.battleStatus === BattleStatus.ThrowPokemon) {
      this.drawBattleArena();
      // Draw enemy pokemon without slide, without avatar, without next phase
      this.drawEnemyPokemon(delta, false);
      // Draw enemy health without slide
      this.drawEnemyHealth(delta, false);
      // Draw player pokemon with slide, with throw, with next phase
      const counter = this.drawPlayerPokemon(delta, true);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Draw go text to dialogue box
      drawText(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);

      if (counter <= -500) {
        this.nextBattlePhase();
      }
    } else if (this.battleStatus === BattleStatus.PlayerActionSelect) {
      // Draw action box with player action selector
      this.drawActionBox(true);
      // Write action select text to dialogue box, without next phase
      drawText(this.ctx, this.font, 'What should ', 0, 1, 16, 121);
      drawText(this.ctx, this.font, this.playerPokemon.pokemonName.toUpperCase() + ' do?', 0, 1, 16, 121 + 16);

      // Detect keyboard press and increment/ decrement battleAction accordingly
      if (!this.keyDown) {
        if (keyboard.isDown(keyboard.LEFT)) {
          if (this.battleAction === 1 || this.battleAction === 3) {
            this.battleAction--;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.RIGHT)) { 
          if (this.battleAction === 0 || this.battleAction === 2) {
            this.battleAction++;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.UP)) { 
          if (this.battleAction === 2 || this.battleAction === 3) {
            this.battleAction -= 2;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.DOWN)) { 
          if (this.battleAction === 0 || this.battleAction === 1) {
            this.battleAction += 2;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.ENTER)) {
          // On enter go to next battle phase
          if (this.battleAction === 0) {
            this.nextBattlePhase(BattleStatus.PlayerSelectMove);
          } else if (this.battleAction === 1) {
            this.nextBattlePhase(BattleStatus.PlayerBag);
          } else if (this.battleAction === 2) {
            this.nextBattlePhase(BattleStatus.PlayerChoosePokemon);
          } else if (this.battleAction === 3) {
            this.nextBattlePhase(BattleStatus.PlayerRun);
          }

          this.keyDown = true;
        }
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
    
    } else if (this.battleStatus === BattleStatus.PlayerSelectMove) {
      // Draw the move selection box
      this.drawMoveSelectionBox();

      // For every move option
      for (const moveNumber of [0, 1, 2, 3]) {
        // Get move from player
        const move = this.playerPokemon.moves[moveNumber];
        let moveText;
        // If move is not assigned print '-'
        if (this.playerPokemon.moves[moveNumber]) {
          moveText= move.move;
        } else {
          moveText = '-';
        }

        // Calculate x and y for the text
        const xText = (moveNumber === 1 || moveNumber === 3) ? 8 + 80 : 8;
        const yText = (moveNumber === 2 || moveNumber === 3) ? 121 + 16 : 121;

        // Draw text to action selection box
        drawText(this.ctx, this.font, moveText.toUpperCase(), 0, 0, xText, yText)
      }

      // Detect keyboard press and increment/ decrement battleMove accordingly
      if (!this.keyDown) {
        if (keyboard.isDown(keyboard.LEFT)) {
          if ((this.battleMove === 1 && this.playerPokemon.moves[0]) || (this.battleMove === 3 && this.playerPokemon.moves[2])) {
            this.battleMove--;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.RIGHT)) { 
          if ((this.battleMove === 0 && this.playerPokemon.moves[1]) || (this.battleMove === 2 && this.playerPokemon.moves[3])) {
            this.battleMove++;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.UP)) { 
          if ((this.battleMove === 2 && this.playerPokemon.moves[0]) || (this.battleMove === 3 && this.playerPokemon.moves[1])) {
            this.battleMove -= 2;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.DOWN)) { 
          if ((this.battleMove === 0 && this.playerPokemon.moves[2]) || (this.battleMove === 1 && this.playerPokemon.moves[3])) {
            this.battleMove += 2;
          }

          this.keyDown = true;
        } else if (keyboard.isDown(keyboard.ENTER)) {
          this.keyDown = true;

          this.battleMoveName = this.playerPokemon.moves[this.battleMove].move;
          console.log(this.playerPokemon.pokemonName + ' used ' + this.battleMoveName)

          this.nextBattlePhase(BattleStatus.PlayerMove);
        }
      }

      // Current selected move details
      const moveDetails = this.playerPokemon.moves[this.battleMove];

      // Variables for printing move pp text
      const xText = 184;
      const yPpText = 121;
      // Draw move pp text
      const text = 'PP_' + moveDetails.pp.toString().padStart(2, '_') + '/' + moveDetails.ppMax.toString().padStart(2, '_');
      drawText(this.ctx, this.font, text, 0, 0, xText, yPpText)
      
      // Variable for printing move type text
      const yTypeText = 121 + 16;
      // Draw move type text
      drawText(this.ctx, this.font, moveDetails.type.toUpperCase(), 0, 0, xText, yTypeText)

      // Set the offset and column for the battle action selector
      let xOffset = this.battleMove * 80;
      let yColumn = 0;
      if (this.battleMove === 2 || this.battleMove === 3)  {
        xOffset = (this.battleMove - 2) * 80;
        yColumn = 1;
      }
  
      // Draw the action selector
      this.drawActionSelector(8 + xOffset, 8 + 74 + xOffset, yColumn);

    } else if (this.battleStatus === BattleStatus.PlayerMove) {
      const moveData = this.moveIndex[this.battleMoveName];

      if (moveData.damage_class === 'status') {
        // Non damage move
      } else {
        // Damage move
        if (this.damageCalculated === false) {
          console.log(this.enemyPokemon.health);

          const damage = this.calculateMoveDamage(true, moveData);
          this.enemyPokemon.health -= damage ? damage : 0;
          this.damageCalculated = true;

          console.log(this.enemyPokemon.health);

          // Draw action box without player action selector
          this.drawActionBox(false);
        } else {
          const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' used';
          const counter = this.writeTextToBattleBox(text1, 0, 1, delta, 1, 0);
          if (counter >= text1.length) {
            const text2 = this.battleMoveName.toUpperCase() + '!';
            const counter2 = this.writeTextToBattleBox(text2, 0, 1, delta, 1, 1);

            if (counter2 >= text2.length + 50 && this.X_pokemonAttack < 30) {
              this.drawBattleArena();
              // Draw enemy pokemon without slide, without avatar, without next phase
              this.drawEnemyPokemon(delta, false);
              // Draw enemy health without slide
              this.drawEnemyHealth(delta, false);
              // Draw player pokemon attack
              const counter = this.drawPokemonAttack(delta, true);
              // Draw action box without player action selector
              this.drawActionBox(false);
              // Draw text to dialogue box
              drawText(this.ctx, this.font, text1, 0, 1, 16, 121);
              drawText(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
              
              if (counter === 0) {
                this.nextBattlePhase();
              }
            }
          }
        }
      }
    } else if (this.battleStatus === BattleStatus.EnemyTakesDamage) {
      console.log('test');
    }

    // Reset keyDown variable if not down anymore
    if (!keyboard.isDown(keyboard.LEFT) && !keyboard.isDown(keyboard.RIGHT) && 
        !keyboard.isDown(keyboard.UP) && !keyboard.isDown(keyboard.DOWN) && 
        !keyboard.isDown(keyboard.ENTER)) {
      this.keyDown = false;
    }

    if (this.battleStatus !== BattleStatus.Finished) {
      // If battle is not finished request new animation frame
      window.requestAnimationFrame(this.tick.bind(this));
    }
  }

  calculateMoveDamage(playerSide: boolean, moveData: MoveType) {
    const attacker = playerSide ? this.playerPokemon : this.enemyPokemon;
    const defender = playerSide ? this.enemyPokemon : this.playerPokemon;

    // Determine necessary base stats
    const level = attacker.level;
    const power = moveData.power;
    const attackStat = (moveData.damage_class === 'physical') ? attacker.stats.attack : attacker.stats.specialAttack;
    const defenseStat = (moveData.damage_class === 'physical') ? defender.stats.defense : defender.stats.specialDefense;
    
    // Determine multipliers
    const burn = 1;
    const screen = 1;
    const targets = 1;
    const weather = 1;
    const ff = 1;
    const crit = 1;
    const wbr = 1;
    const charge = 1;
    const hh = 1;

    // Determine the same-type attack bonus
    const stab = attacker.types.find(typeData => typeData.type === moveData.type) ? 1.5 : 1;
    // calculate the type bonus, for each type of the defender pokemon
    let type = 1;
    for (let i = 0; i < defender.types.length; i++) {
      type = type * this.getTypeEffectiveness(defender.types[i].type, moveData.type)
    }
    // Get a random value between 85-100 inclusive
    const random = randomFromMinMax(85, 100);


    // Calculate the damage
    if (power) {
      const damage = (((((2 * level) / 5 + 2) * power * (attackStat / defenseStat)) / 50) * burn * screen * targets * weather * ff + 2) * crit * wbr * charge * hh * stab * type * random;
      
      return (damage / 100) << 0;
    }
  }

  getTypeEffectiveness(defenderType: string, moveType: string) {
    const types = [
      'normal', 'fight', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 
      'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy',
    ];

    const typesEffectiveness = [
        1,   1,   1,   1,   1, 0.5,   1,   0, 0.5,   1,   1,   1,   1,   1,   1,   1,   1,   1,
        2,   1, 0.5, 0.5,   1,   2, 0.5,   0,   2,   1,   1,   1,   1, 0.5,   2,   1,   2, 0.5,
        1,   2,   1,   1,   1, 0.5,   2,   1, 0.5,   1,   1,   2, 0.5,   1,   1,   1,   1,   1,
        1,   1,   1, 0.5, 0.5, 0.5,   1, 0.5,   0,   1,   1,   2,   1,   1,   1,   1,   1,   2,
        1,   1,   0,   2,   1,   2, 0.5,   1,   2,   2,   1, 0.5,   2,   1,   1,   1,   1,   1,
        1, 0.5,   2,   1, 0.5,   1,   3,   1, 0.5,   2,   1,   1,   1,   1,   2,   1,   1,   1,
        1, 0.5, 0.5, 0.5,   1,   1,   1, 0.5, 0.5, 0.5,   1,   2,   1,   2,   1,   1,   2, 0.5,
        0,   1,   1,   1,   1,   1,   1,   2,   1,   1,   1,   1,   1,   2,   1,   1, 0.5,   1,
        1,   1,   1,   1,   1,   2,   1,   1, 0.5, 0.5, 0.5,   1, 0.5,   1,   2,   1,   1,   2,
        1,   1,   1,   1,   1, 0.5,   2,   1,   2, 0.5, 0.5,   2,   1,   1,   2, 0.5,   1,   1,
        1,   1,   1,   1,   2,   2,   1,   1,   1,   2, 0.5, 0.5,   1,   1,   1, 0.5,   1,   1,
        1,   1, 0.5, 0.5,   2,   2, 0.5,   1, 0.5, 0.5,   2, 0.5,   1,   1,   1, 0.5,   1,   1,
        1,   1,   2,   1,   0,   1,   1,   1,   1,   1,   2, 0.5, 0.5,   1,   1, 0.5,   1,   1,
        1,   2,   1,   2,   1,   1,   1,   1, 0.5,   1,   1,   1,   1, 0.5,   1,   1,   0,   1,
        1,   1,   2,   1,   2,   1,   1,   1, 0.5, 0.5, 0.5,   2,   1,   1, 0.5,   2,   1,   1,
        1,   1,   1,   1,   1,   1,   1,   1, 0.5,   1,   1,   1,   1,   1,   1,   2,   1,   2,
        1, 0.5,   1,   1,   1,   1,   1,   2,   1,   1,   1,   1,   1,   2,   1,   1, 0.5, 0.5,
        1,   2,   1, 0.5,   1,   1,   1,   1, 0.5, 0.5,   1,   1,   1,   1,   1,   2,   2,   1,
    ];

    return typesEffectiveness[18 * ((types.indexOf(moveType) / 18) << 0) + types.indexOf(defenderType)]
  }

  drawEnemyPokemon(delta: number, slideIn: boolean) {
    // Calculate xPixel for the enemy pokemon
    let xPixel;
    if (slideIn) {
      const speed = 176;
      xPixel = (this.X_slidePokemonIn + delta * speed) << 0;
    } else {
      xPixel = c.GAME_WIDTH;
    }

    // Draw battle grounds enemy pokemon
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

    // Set alpha of enemy pokemon when sliding in
    if (slideIn) {
      this.ctx.globalAlpha = 0.8;
    }

    // Draw enemy pokemon
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
  }

  drawAvatar(delta: number, slideIn: boolean) {
    const speed = 176;
    let xPixel;

    if (slideIn) {
      // Calculate xPixel for the enemy pokemon
      xPixel = (this.X_slidePokemonIn + delta * speed) << 0;
    } else {
      xPixel = c.GAME_WIDTH;
    }

    // Draw battle grounds player pokemon
    this.drawPlayerBattleGrounds(c.GAME_WIDTH - xPixel);

    // Draw the player avatar
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

    // Update variables
    this.X_slidePokemonIn += delta * speed;

    return xPixel;
  }

  drawEnemyHealth(delta: number, slideIn: boolean) {
    const speed = 224;

    let xPixel = 0;
    if (slideIn) {
      // Calculate xPixel for the enemy pokemon
      xPixel = (this.X_slideEnemyHealth + delta * speed - c.ASSETS_ENEMY_HEALTH_WIDTH) << 0;

      if (xPixel > 13) { xPixel = 13 }
    } else {
      xPixel = 13;
    }

    // Draw enemy health box
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

    // Calculate variables for drawing the health bar
    const healthFrac = this.enemyPokemon.health / this.enemyPokemon.stats.hp;
    const healthbarWidth = (healthFrac * 48) << 0
    const healthbarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;

    // Draw enemy health bar
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

    // Draw the pokemon name, gender, and level
    drawText(this.ctx, this.font, this.enemyPokemon.pokemonName.toUpperCase() + ((this.enemyPokemon.gender) ? '#' : '^'), 1, 0, xPixel - 13 + 20, 22);
    drawText(this.ctx, this.font, this.enemyPokemon.level.toString(), 1, 0, xPixel - 13 + 89, 22);

    // Update variable
    this.X_slideEnemyHealth += delta * speed;
  }

  drawPlayerPokemon(delta: number, throwPokemon: boolean) {
    const speed = 176;
    const speedPokeball = 48;

    // Calculate xPixel for the pokemon position
    const xPixel = this.X_avatarThrow << 0;

    // Calculate the offset for the player avatar throw sprites
    const assetOffset = (xPixel > -80) ? c.AVATAR_BATTLE_HEIGHT : 
                        (xPixel > -100) ? 2 * c.AVATAR_BATTLE_HEIGHT : 
                        3 * c.AVATAR_BATTLE_HEIGHT;
                    
    let xPixelPokeball = 0;

    // Draw battle grounds player pokemon
    this.drawPlayerBattleGrounds(0)

    if (throwPokemon) {
      if (xPixel < -100) {
        // Calculate counter for pokeball animation
        this.animation = this.animation < 7.2 ? this.animation + 30 * delta : 0;
  
        // Calculate the x and y for the pokeball
        xPixelPokeball = (this.X_thrownPokeball + delta * speedPokeball) << 0;
        const yPixelPokeball = (0.08 * xPixelPokeball ** 2 - 2.2 * xPixelPokeball + 70) << 0
  
        // Draw the pokeball
        this.ctx.drawImage(
          this.battleAssets,
          c.POKEBALL_OFFSET_X + this.playerPokemon.pokeball * c.POKEBALL_SIZE,
          c.POKEBALL_OFFSET_Y + 37 + (this.animation << 0) * c.POKEBALL_SIZE,
          c.POKEBALL_SIZE,
          c.POKEBALL_SIZE,
          xPixelPokeball + 25,
          yPixelPokeball,
          c.POKEBALL_SIZE,
          c.POKEBALL_SIZE,
        );
  
        // Update variable
        this.X_thrownPokeball += delta * speedPokeball;
      }

      this.X_avatarThrow -= delta * speed;
    }

    // Pokemon appear animation
    if (xPixelPokeball >= 35) {
      // Calculate the opacity for the pink appearing pokemon
      const opacity = (this.pokemonAlternativeOpacity > 0) ? this.pokemonAlternativeOpacity : 0;
      this.ctx.globalAlpha = opacity;

      // Draw pink appearing pokemon
      this.ctx.drawImage(
        this.playerPokemonSprite,
        this.playerPokemon.xSource + 2 * c.POKEMON_SIZE + c.POKEMON_ALTERNATIVE_OFFSET,
        this.playerPokemon.ySource,
        c.POKEMON_SIZE,
        c.POKEMON_SIZE,
        (0.5 * (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE) + 0.5 * (c.POKEMON_SIZE - c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0),
        (c.BATTLE_ARENA_HEIGHT - (c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0) + 1,
        (c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0,
        (c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0,
      );
    }

    if (xPixelPokeball >= 70) {
      // Calculate the opacity for the appearing pokemon
      const opacity = (this.pokemonAlternativeOpacity > 0) ? this.pokemonAlternativeOpacity : 0;
      this.ctx.globalAlpha = 1 - opacity;

      // Draw appearing pokemon
      this.ctx.drawImage(
        this.playerPokemonSprite,
        this.playerPokemon.xSource + 2 * c.POKEMON_SIZE,
        this.playerPokemon.ySource,
        c.POKEMON_SIZE,
        c.POKEMON_SIZE,
        0.5 * (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE),
        c.BATTLE_ARENA_HEIGHT - c.POKEMON_SIZE,
        c.POKEMON_SIZE,
        c.POKEMON_SIZE,
      );

      // Update variable
      this.pokemonAlternativeOpacity -= delta * 8;

      // Draw player health
      this.drawPlayerHealth(delta, true);
    }

    this.ctx.globalAlpha = 1;
    
    // Player slide out animation
    this.ctx.drawImage(
      this.avatarAssets,
      c.AVATAR_BATTLE_OFFSET,
      assetOffset,
      c.AVATAR_BATTLE_WIDTH,
      c.AVATAR_BATTLE_HEIGHT,
      0.5 * c.BATTLE_SCENE_WIDTH + xPixel,
      c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT,
      c.AVATAR_BATTLE_WIDTH,
      c.AVATAR_BATTLE_HEIGHT,
    );

    return xPixel;
  }

  drawActionSelector(xStart: number, xEnd: number, column: number) {
    // Draw rectangular action selector
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

  writeTextToBattleBox(text: string, fontsize: number, fontColor: number, delta: number, delayAfter: number, textLine: number) {
    const speed = 304;
    const yText = 121 + 16 * textLine;

    const i = ((this.X_writeTextToBattleBox + delta * speed) / 6) << 0;
    const textToDisplay = text.slice(0, i);

    // Draw the text
    drawText(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);

    // If text writing is finished
    if (i < text.length + delayAfter * speed / 6) {
      this.X_writeTextToBattleBox += delta * speed;
    }

    return i;
  }

  drawPlayerBattleGrounds(xPixel: number) {
    // Draw battle grounds player pokemon
    this.ctx.drawImage(
      this.battleAssets,
      this.encounterMethod % 3 * c.BATTLE_SCENE_WIDTH,
      ((0.5 + this.encounterMethod / 3) << 0) * c.BATTLE_SCENE_HEIGHT + 3 * c.BATTLE_ARENA_HEIGHT + c.ACTION_BOX_HEIGHT,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
      xPixel,
      100,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
    );    
  }

  drawPlayerHealth(delta: number, slideIn: boolean) {
    const speedHealth = 224;
    // Calculate x for the player health box
    let xPixelPlayerHealth = (this.X_slidePlayerHealth - delta * speedHealth + c.GAME_WIDTH) << 0;

    // Maximize the xPixel to 127
    if (xPixelPlayerHealth < 127) xPixelPlayerHealth = 127;

    // Draw player health box
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

    // Calculate variables for drawing the health bar
    const healthFrac = this.playerPokemon.health / this.playerPokemon.stats.hp;
    const healthbarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;
    const healthbarWidth = (healthFrac * 48) << 0

    // Draw enemy health bar
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

    // Draw the pokemon name, gender, and level
    const nameText = this.playerPokemon.pokemonName.toUpperCase() + ((this.playerPokemon.gender) ? '#' : '^');
    const healthText = this.playerPokemon.health.toString().padStart(3, '_') + '/' + this.playerPokemon.stats.hp.toString().padStart(3, '_');
    drawText(this.ctx, this.font, nameText, 1, 0, xPixelPlayerHealth + 14, 74 + 6);
    drawText(this.ctx, this.font, this.playerPokemon.level.toString(), 1, 0, xPixelPlayerHealth + 84, 75 + 6);
    drawText(this.ctx, this.font, healthText, 1, 0, xPixelPlayerHealth + 59, 75 + 22);

    // Update variable
    if (slideIn) {
      this.X_slidePlayerHealth -= delta * speedHealth;
    }
  }

  drawBattleArena() {
    // Draw the battle scene background
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
    // Draw the battle dialogue box
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

    // Draw the player action choice box
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

  drawMoveSelectionBox() {
    // Draw the move selection box
    this.ctx.drawImage(
      this.battleAssets,
      0,
      3 * c.BATTLE_ARENA_HEIGHT + 4 * c.BATTLE_SCENE_HEIGHT + c.ACTION_BOX_HEIGHT + c.ASSETS_PLAYER_HEALTH_HEIGHT,
      c.GAME_WIDTH,
      c.ACTION_BOX_HEIGHT,
      0,
      c.BATTLE_ARENA_HEIGHT,
      c.GAME_WIDTH,
      c.ACTION_BOX_HEIGHT,
    );
  }

  drawPokemonAttack(delta: number, isPlayer: boolean) {
    const speed = 128;
    this.X_pokemonAttack = this.X_pokemonAttack + speed * delta;
    const xPixelOffset = (this.X_pokemonAttack < 10) ? this.X_pokemonAttack : (this.X_pokemonAttack < 30) ? 30 - this.X_pokemonAttack : 0

    // Draw battle grounds player pokemon
    this.drawPlayerBattleGrounds(0)

    // Draw player health
    this.drawPlayerHealth(delta, false);

    this.ctx.drawImage(
      this.playerPokemonSprite,
      this.playerPokemon.xSource + 2 * c.POKEMON_SIZE,
      this.playerPokemon.ySource,
      c.POKEMON_SIZE,
      c.POKEMON_SIZE,
      0.5 * (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE) + xPixelOffset,
      c.BATTLE_ARENA_HEIGHT - c.POKEMON_SIZE,
      c.POKEMON_SIZE,
      c.POKEMON_SIZE,
    );

    return xPixelOffset;
  }
}