import * as pokedex from '../pokedex.json';
import * as moveIndex from '../move_index.json';
import * as encounterTable from '../encounter_table.json';

import { GameObject } from '../utils/game_object';
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
  PlayerBag,
  PlayerChoosePokemon,
  PlayerRun,
  PlayerSelectMove,
  PlayerMove,
  PlayerStatusMove,
  PlayerStatusText,
  PlayerPhysicalMove,
  EnemyTakesDamage,
  EnemyMove,
  EnemyStatusMove,
  enemyStatusText,
  EnemyPhysicalMove,
  PlayerTakesDamage,
  EnemyFainted,
  GainXpText,
  GainXp,
  LevelGained,
  LevelGainedText,
  FadeOut,
  FadeIn,
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
  private overlayCtx: CanvasRenderingContext2D;
  private battleAssets: HTMLCanvasElement;
  private font: HTMLCanvasElement;
  private avatarAssets: HTMLCanvasElement;

  private enemyPokemonSprite!: HTMLCanvasElement;
  private enemyPokemon: PokemonDataType;
  private enemyPokemonStages = {
    attack: 0,
    defense: 0,
    specialDefense: 0,
    specialAttack: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0,
  };

  private playerPokemonSprite!: HTMLCanvasElement;
  private playerData: PlayerDataType;
  private playerPokemon: PokemonDataType;
  private playerPokemonStages = {
    attack: 0,
    defense: 0,
    specialDefense: 0,
    specialAttack: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0,
  };


  private battleAction = 0;
  private escapeAttempts = 0;
  private battleMove = 0;
  private battleMoveName = '';
  private battleResultWin = false;

  private previousElapsed = 0;
  private delayStart = -1;
  private battleStatus = 0;
  private keyDown = false;

  private newHealth = -1;
  private newXp = -1;
  private attackHalfWay = false;
  private defenseHalfWay = false;
  private enemyMoveDecided = false;
  private moveEffectApplied = false;
  private drawAvatarFinished = false;
  private levelGained = false;
  private writeSecondLine = false;
  private animationCounter = 0;

  private battleBackground!: GameObject;
  private moveSelectorBox!: GameObject;
  private battleDialogueBox!: GameObject;
  private actionSelectorBox!: GameObject;

  private playerAvatar!: GameObject;
  private pokeball!: GameObject;

  private playerBattleGrounds!: GameObject;
  private playerPokemonObject!: GameObject;
  private playerPokemonAltObject!: GameObject;
  private playerPokemonHealthBox!: GameObject;
  private playerPokemonHealthBar!: GameObject;
  private playerPokemonHealthText!: GameObject;
  private playerPokemonXpBox!: GameObject;
  
  private enemyBattleGrounds!: GameObject;
  private enemyPokemonObject!: GameObject;
  private enemyPokemonHealthBox!: GameObject;
  private enemyPokemonHealthBar!: GameObject;
  private enemyPokemonHealthText!: GameObject;

  private playerHealthTextCanvas: HTMLCanvasElement;
  private playerHealthTextCtx: CanvasRenderingContext2D | null;
  private enemyHealthTextCanvas: HTMLCanvasElement;
  private enemyHealthTextCtx: CanvasRenderingContext2D | null;

  constructor(context: CanvasRenderingContext2D, overlayCtx: CanvasRenderingContext2D, loader: Loader, player: Player, route: string, encounterMethod: number) {
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
    this.overlayCtx = overlayCtx;

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

    this.loadGameObjects();

    // Create Canvas for the health texts
    this.playerHealthTextCanvas = document.createElement('canvas');
    this.playerHealthTextCanvas.height= c.ASSETS_PLAYER_HEALTH_HEIGHT;
    this.playerHealthTextCanvas.width = c.ASSETS_PLAYER_HEALTH_WIDTH;
    this.playerHealthTextCtx = this.playerHealthTextCanvas.getContext('2d');

    this.enemyHealthTextCanvas = document.createElement('canvas');
    this.enemyHealthTextCanvas.height= c.ASSETS_PLAYER_HEALTH_HEIGHT;
    this.enemyHealthTextCanvas.width = c.ASSETS_PLAYER_HEALTH_WIDTH;
    this.enemyHealthTextCtx = this.enemyHealthTextCanvas.getContext('2d');

    console.log(this.enemyPokemon);
    console.log(this.playerPokemon);
  }

  private init() {
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

  private loadGameObjects() {
    this.battleBackground = new GameObject(
      this.ctx,
      this.battleAssets,
      this.encounterMethod % 4 * c.GAME_WIDTH,
      ((0.5 + this.encounterMethod / 4) << 0) * c.BATTLE_ARENA_HEIGHT,
      c.GAME_WIDTH,
      c.BATTLE_ARENA_HEIGHT,
      0,
      0
    );

    this.moveSelectorBox = new GameObject(
      this.ctx,
      this.battleAssets,
      0,
      3 * c.BATTLE_ARENA_HEIGHT + 4 * c.BATTLE_SCENE_HEIGHT + c.ACTION_BOX_HEIGHT + c.ASSETS_PLAYER_HEALTH_HEIGHT,
      c.GAME_WIDTH,
      c.ACTION_BOX_HEIGHT,
      0,
      c.BATTLE_ARENA_HEIGHT
    );

    this.battleDialogueBox = new GameObject(
      this.ctx,
      this.battleAssets,
      0,
      3 * c.BATTLE_ARENA_HEIGHT,
      c.GAME_WIDTH,
      c.ACTION_BOX_HEIGHT,
      0,
      c.BATTLE_ARENA_HEIGHT
    );

    this.actionSelectorBox = new GameObject(
      this.ctx,
      this.battleAssets,
      c.GAME_WIDTH,
      3 * c.BATTLE_ARENA_HEIGHT,
      c.ACTION_BOX_WIDTH,
      c.ACTION_BOX_HEIGHT,
      c.GAME_WIDTH - c.ACTION_BOX_WIDTH,
      c.BATTLE_ARENA_HEIGHT
    );

    this.playerBattleGrounds = new GameObject(
      this.ctx,
      this.battleAssets,
      this.encounterMethod % 3 * c.BATTLE_SCENE_WIDTH,
      ((0.5 + this.encounterMethod / 3) << 0) * c.BATTLE_SCENE_HEIGHT + 3 * c.BATTLE_ARENA_HEIGHT + c.ACTION_BOX_HEIGHT,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
      240,
      100
    );

    this.playerPokemonObject = new GameObject(
      this.ctx,
      this.playerPokemonSprite,
      this.playerPokemon.xSource + 2 * c.POKEMON_SIZE,
      this.playerPokemon.ySource,
      c.POKEMON_SIZE,
      c.POKEMON_SIZE,
      (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE) / 2,
      c.BATTLE_ARENA_HEIGHT - c.POKEMON_SIZE
    );

    this.playerPokemonObject.setOpacity(0);

    this.playerPokemonAltObject = new GameObject(
      this.ctx,
      this.playerPokemonSprite,
      this.playerPokemon.xSource + 2 * c.POKEMON_SIZE + c.POKEMON_ALTERNATIVE_OFFSET,
      this.playerPokemon.ySource,
      c.POKEMON_SIZE,
      c.POKEMON_SIZE,
      (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE) / 2,
      c.BATTLE_ARENA_HEIGHT - c.POKEMON_SIZE
    );

    this.playerPokemonAltObject.setScale(0);

    this.playerPokemonHealthBox = new GameObject(
      this.ctx,
      this.battleAssets,
      0,
      c.ASSETS_HEALTH_OFFSET,
      c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_PLAYER_HEALTH_HEIGHT,
      c.GAME_WIDTH,
      75,
    );

    this.playerPokemonHealthBar = new GameObject(
      this.ctx,
      this.battleAssets,
      c.ASSETS_ENEMY_HEALTH_WIDTH + c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_HEALTH_OFFSET,
      48,
      2,
      c.GAME_WIDTH + 47,
      75 + 17,
    );

    this.playerPokemonHealthText = new GameObject(
      this.ctx,
      this.playerHealthTextCanvas,
      0,
      0,
      c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_PLAYER_HEALTH_HEIGHT,
      c.GAME_WIDTH,
      75,
    );

    this.playerPokemonXpBox = new GameObject(
      this.ctx,
      this.battleAssets,
      c.ASSETS_ENEMY_HEALTH_WIDTH + c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_HEALTH_OFFSET + 3 * 2,
      64,
      2,
      c.GAME_WIDTH + 31,
      75 + 33,
    );

    this.enemyBattleGrounds = new GameObject(
      this.ctx,
      this.battleAssets,
      this.encounterMethod % 3 * c.BATTLE_SCENE_WIDTH,
      ((0.5 + this.encounterMethod / 3) << 0) * c.BATTLE_SCENE_HEIGHT + 3 * c.BATTLE_ARENA_HEIGHT + c.ACTION_BOX_HEIGHT,
      c.BATTLE_SCENE_WIDTH,
      c.BATTLE_SCENE_HEIGHT,
      -c.BATTLE_SCENE_WIDTH,
      48
    );

    this.enemyPokemonObject = new GameObject(
      this.ctx,
      this.enemyPokemonSprite,
      this.enemyPokemon.xSource,
      this.enemyPokemon.ySource,
      c.POKEMON_SIZE,
      c.POKEMON_SIZE,
      -(c.BATTLE_SCENE_WIDTH + c.POKEMON_SIZE) / 2,
      22
    );

    this.enemyPokemonHealthBox = new GameObject(
      this.ctx,
      this.battleAssets,
      c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_HEALTH_OFFSET,
      c.ASSETS_ENEMY_HEALTH_WIDTH,
      c.ASSETS_ENEMY_HEALTH_HEIGHT,
      -c.ASSETS_ENEMY_HEALTH_WIDTH,
      16,
    );

    this.enemyPokemonHealthBar = new GameObject(
      this.ctx,
      this.battleAssets,
      c.ASSETS_ENEMY_HEALTH_WIDTH + c.ASSETS_PLAYER_HEALTH_WIDTH,
      c.ASSETS_HEALTH_OFFSET,
      48,
      2,
      -c.ASSETS_ENEMY_HEALTH_WIDTH + 39,
      16 + 17,
    );

    this.enemyPokemonHealthText = new GameObject(
      this.ctx,
      this.enemyHealthTextCanvas,
      0,
      0,
      c.ASSETS_ENEMY_HEALTH_WIDTH,
      c.ASSETS_ENEMY_HEALTH_HEIGHT,
      -c.ASSETS_ENEMY_HEALTH_WIDTH,
      16,
    );

    this.playerAvatar = new GameObject(
      this.ctx,
      this.avatarAssets,
      c.AVATAR_BATTLE_OFFSET,
      0,
      c.AVATAR_BATTLE_WIDTH,
      c.AVATAR_BATTLE_HEIGHT,
      c.GAME_WIDTH + c.BATTLE_SCENE_WIDTH / 2,
      c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT
    );

    this.playerAvatar.setAnimation(true, 0, 0, c.AVATAR_BATTLE_HEIGHT, 4);

    this.pokeball = new GameObject(
      this.ctx,
      this.battleAssets,
      c.POKEBALL_OFFSET_X,
      c.POKEBALL_OFFSET_Y + 37,
      c.POKEBALL_SIZE,
      c.POKEBALL_SIZE,
      25,
      70
    );

    this.pokeball.setAnimation(false, 32, 0, c.POKEBALL_SIZE, 8);
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

  private battleFinished(): Promise<void> {
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

  private nextBattlePhase(battleStatus: number) {
    // Increment battleStatus;
    this.battleStatus = battleStatus;    
  }

  private renderDelay(duration: number): boolean {
    if (this.delayStart === -1) {
      this.delayStart = this.previousElapsed;

    } else if (this.delayStart + duration <= this.previousElapsed) {

      return true;
    }

    return false;
  }

  private resetDelay() {
    this.delayStart = -1;
  }

  private tick(elapsed: number) {
    // Calculate the delta between the ticks
    let delta = (elapsed - this.previousElapsed) / 1000.0;
    delta = Math.min(delta, 0.25); // maximum delta of 250 ms
    this.previousElapsed = elapsed;

    if (this.battleStatus === BattleStatus.SlidePokemonIn) {
      this.battleBackground.render();
      // Draw enemy pokemon with slide, with avatar, with next phase
      this.drawEnemyPokemon(delta, true, false);
      // Draw player avatar sliding in
      const isFinished = this.drawAvatar(delta, true, false);
      // Draw action box without the player action selector
      this.drawActionBox(false);

      if (isFinished) {
        this.nextBattlePhase(BattleStatus.WriteAppearText);
      }
    } else if (this.battleStatus === BattleStatus.WriteAppearText) {
      this.battleBackground.render();
      // Draw enemy pokemon without slide, with avatar, without next phase
      this.drawEnemyPokemon(delta, false, false);
      // Draw player avatar
      this.drawAvatar(delta, false, false);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Write appear text to dialogue box, with next phase
      const text = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase() + ' appeared!|';
      const isFinished = this.writeToDialogueBox(delta, 1, text, '', 0, 1);
      // Draw enemy health with slide
      this.drawEnemyHealth(delta, true);

      if (isFinished) {
        this.drawActionBox(false);
        this.nextBattlePhase(BattleStatus.WriteGoText);
      }
    } else if (this.battleStatus === BattleStatus.WriteGoText) {
      // Write go text to dialogue box, with next phase
      const text = 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!';
      const isFinished = this.writeToDialogueBox(delta, 1, text, '', 0, 1);

      if (isFinished) {
        this.nextBattlePhase(BattleStatus.ThrowPokemon);
      }
    } else if (this.battleStatus === BattleStatus.ThrowPokemon) {
      this.battleBackground.render();
      // Draw enemy pokemon without slide
      this.drawEnemyPokemon(delta, false, false);
      // Draw enemy health without slide
      this.drawEnemyHealth(delta, false);
      // Draw player pokemon with slide, with throw
      const isFinished = this.drawThrowPlayerPokemon(delta);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Draw go text to dialogue box
      drawText(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);

      if (isFinished) {
        this.nextBattlePhase(BattleStatus.PlayerActionSelect);
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
    } else if (this.battleStatus === BattleStatus.PlayerRun) {
      this.escapeAttempts++;

      const escapeGuaranteed = this.playerPokemon.stats.speed >= this.enemyPokemon.stats.speed;
      const escapeOdds = (Math.floor(this.playerPokemon.stats.speed * 128 / this.enemyPokemon.stats.speed) + 30 * this.escapeAttempts) % 256;
      const escape = randomFromMinMax(0, 255) < escapeOdds;

      if (escapeGuaranteed || escape) {
        console.log('Escape successfully');
        this.battleResultWin = false;

        this.nextBattlePhase(BattleStatus.Finished);
      } else {
        console.log('escaped failed');

        this.nextBattlePhase(BattleStatus.EnemyMove);
      }
    } else if (this.battleStatus === BattleStatus.PlayerSelectMove) {
      // Draw the move selection box
      this.moveSelectorBox.render();

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
          this.playerPokemon.moves[this.battleMove].pp--;
          console.log(this.playerPokemon.pokemonName + ' used ' + this.battleMoveName);

          this.nextBattlePhase(BattleStatus.PlayerMove);
        }
      }
    } else if (this.battleStatus === BattleStatus.PlayerMove) {
      const moveData = this.moveIndex[this.battleMoveName];
      const isFinished = this.writeMoveText(delta, moveData, true);

      if (isFinished) {
        const accuracyBase = moveData.accuracy;
  
        let isHit = true;
        if (accuracyBase) {
          const stageAdjust = c.SPECIAL_STAGES[this.playerPokemonStages.accuracy - this.enemyPokemonStages.accuracy + 6];
          const modifier = 1;
          const accuracy = accuracyBase * stageAdjust * modifier;
  
          isHit = randomFromMinMax(1, 100) <= accuracy;
        }
  
        if (isHit) {
          if (moveData.damage_class === 'status') {
            this.nextBattlePhase(BattleStatus.PlayerStatusMove);
          } else {
            this.nextBattlePhase(BattleStatus.PlayerPhysicalMove);
          }  
        } else {
          // Move missed
        }
      }
    } else if (this.battleStatus === BattleStatus.PlayerStatusMove) {
      const moveData = this.moveIndex[this.battleMoveName];
      const isFinished = this.statusMove(delta, moveData, true);
      
      if (isFinished) {
        this.nextBattlePhase(BattleStatus.PlayerStatusText);
      }
    } else if (this.battleStatus === BattleStatus.PlayerStatusText) {
      const moveData = this.moveIndex[this.battleMoveName];
      const isFinished = this.writeStatusMoveText(delta, moveData, true);

      if (isFinished) {
        this.nextBattlePhase(BattleStatus.EnemyMove);
      }
    } else if (this.battleStatus === BattleStatus.PlayerPhysicalMove) {
      const moveData = this.moveIndex[this.battleMoveName];

      const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' used';
      const text2 = this.battleMoveName.toUpperCase() + '!';

      this.battleBackground.render();
      // Draw player pokemon attack
      const isFinished = this.physicalMove(delta, moveData, true);
      // const isFinished = this.drawDefaultAttack(delta, true);
      // Draw enemy health without slide
      this.drawEnemyHealth(delta, false);
      // Draw player health without slide
      this.drawPlayerHealth(delta, false);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Draw text to dialogue box
      drawText(this.ctx, this.font, text1, 0, 1, 16, 121);
      drawText(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
      
      if (isFinished) {
        this.nextBattlePhase(BattleStatus.EnemyTakesDamage);
      }
    } else if (this.battleStatus === BattleStatus.EnemyTakesDamage) {
      const isFinished = this.animateHealthBar(delta, true);

      this.drawEnemyHealth(delta, false);

      if (isFinished) {
        if (this.enemyPokemon.health <= 0) {
          this.battleResultWin = true;
          this.nextBattlePhase(BattleStatus.EnemyFainted);
        } else {
          this.nextBattlePhase(BattleStatus.EnemyMove);
        }
      }
    } else if (this.battleStatus === BattleStatus.EnemyMove) {
      if (!this.enemyMoveDecided) {
        this.battleMoveName = randomFromArray(this.enemyPokemon.moves).move;
        console.log('Foo ' + this.enemyPokemon.pokemonName + ' used ' + this.battleMoveName);

        this.enemyMoveDecided = true;
      }

      const moveData = this.moveIndex[this.battleMoveName];
      const isFinished = this.writeMoveText(delta, moveData, false);

      if (isFinished) {
        this.enemyMoveDecided = false;

        if (moveData.damage_class === 'status') {
          this.nextBattlePhase(BattleStatus.EnemyStatusMove);
        } else {
          this.nextBattlePhase(BattleStatus.EnemyPhysicalMove);
        }
      }
    } else if (this.battleStatus === BattleStatus.EnemyStatusMove) {
      const moveData = this.moveIndex[this.battleMoveName];
      const isFinished = this.statusMove(delta, moveData, false);
      
      if (isFinished) {
        this.nextBattlePhase(BattleStatus.enemyStatusText);
      }
    } else if (this.battleStatus === BattleStatus.enemyStatusText) {
      const moveData = this.moveIndex[this.battleMoveName];
      const isFinished = this.writeStatusMoveText(delta, moveData, false);

      if (isFinished) {
        this.nextBattlePhase(BattleStatus.PlayerActionSelect);
      }
    } else if (this.battleStatus === BattleStatus.EnemyPhysicalMove) {
      const moveData = this.moveIndex[this.battleMoveName];

      const text1 = this.enemyPokemon.pokemonName.toUpperCase() + ' used';
      const text2 = this.battleMoveName.toUpperCase() + '!';

      this.battleBackground.render();
      // Draw player pokemon attack
      const isFinished = this.physicalMove(delta, moveData, false);

      // Draw player health without slide
      this.drawPlayerHealth(delta, false);
      // Draw enemy health without slide
      this.drawEnemyHealth(delta, false);
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Draw text to dialogue box
      drawText(this.ctx, this.font, text1, 0, 1, 16, 121);
      drawText(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
      
      if (isFinished) {
        this.nextBattlePhase(BattleStatus.PlayerTakesDamage);
      }
    } else if (this.battleStatus === BattleStatus.PlayerTakesDamage) {
      const isFinished = this.animateHealthBar(delta, false);

      this.drawPlayerHealth(delta, false);

      if (isFinished) {
        if (this.playerPokemon.health <= 0) {
          this.battleResultWin = false;
          this.nextBattlePhase(BattleStatus.Finished);
        } else {
          this.nextBattlePhase(BattleStatus.PlayerActionSelect);
        }
      }
    } else if (this.battleStatus === BattleStatus.EnemyFainted) {  
      this.battleBackground.render();
      // Draw enemy pokemon
      const isFinished = this.drawEnemyPokemon(delta, false, true);
      // Draw battle grounds player pokemon
      this.playerBattleGrounds.render();
      // Draw player pokemon
      this.playerPokemonObject.render();
      // Draw action box without player action selector
      this.drawActionBox(false);
      // Draw enemy health without slide
      if (!isFinished) {
        this.drawEnemyHealth(delta, false);
      } else {
        const text1 = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase();
        const text2 = 'fainted!|'

        const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);

        if (isFinished) {
          this.nextBattlePhase(BattleStatus.GainXpText);
        }
      }
      // Draw player health without slide
      this.drawPlayerHealth(delta, false);
    } else if (this.battleStatus === BattleStatus.GainXpText) {
      if (this.newXp === -1) {
        this.newXp = this.calculateXpGained() + this.playerPokemon.xp;
      } else {
        // Draw action box without player action selector
        this.drawActionBox(false);

        const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' gained';
        const text2 = this.newXp - this.playerPokemon.xp + ' EXP. Points!|'

        const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);

        if (isFinished) {
          this.nextBattlePhase(BattleStatus.GainXp);
        }
      }
    } else if (this.battleStatus === BattleStatus.GainXp) {
      // Draw action box without player action selector
      this.drawActionBox(false);

      const isFinished = this.animateXpBar(delta);
      this.drawPlayerHealth(delta, false);

      if (isFinished) {
        if (this.levelGained) {
          this.recalculatePlayerStats();

          this.nextBattlePhase(BattleStatus.LevelGained);
        } else {
          this.nextBattlePhase(BattleStatus.FadeOut);
        }
      }
    } else if (this.battleStatus === BattleStatus.LevelGained) {
      // level gained animation to do!!!
      this.nextBattlePhase(BattleStatus.LevelGainedText);
    } else if (this.battleStatus === BattleStatus.LevelGainedText) {
      const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' grew to';
      const text2 = 'LV. ' + this.playerPokemon.level + '!';

      this.drawPlayerHealth(delta, false);
      const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);

      if (isFinished) {
        this.nextBattlePhase(BattleStatus.FadeOut);
      }
    } else if (this.battleStatus === BattleStatus.FadeOut) {
      const delayFinished = this.renderDelay(100);

      if (delayFinished) {
        const speed = 3;

        if (this.animationCounter >= 1) {
          this.animationCounter = 0;

          this.resetDelay();
          this.nextBattlePhase(BattleStatus.FadeIn);
        } else {
          this.overlayCtx.globalAlpha = this.animationCounter;
          this.overlayCtx.fillStyle = '#000000';
          this.overlayCtx.clearRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);
          this.overlayCtx.fillRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);
          this.overlayCtx.globalAlpha = 1;
  
          this.animationCounter += delta * speed;
        }
      }
    } else if (this.battleStatus === BattleStatus.FadeIn) {
      const delayFinished = this.renderDelay(100);

      if (delayFinished) {
        const speed = 3;

        if (this.animationCounter >= 1) {
          this.animationCounter = 0;

          this.resetDelay();
          this.nextBattlePhase(BattleStatus.Finished);
        } else {
          this.overlayCtx.globalAlpha = 1 - this.animationCounter;
          this.overlayCtx.fillStyle = '#000000';
          this.ctx.clearRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);
          this.overlayCtx.clearRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);
          this.overlayCtx.fillRect(0, 0, c.GAME_WIDTH, c.GAME_HEIGHT);
          this.overlayCtx.globalAlpha = 1;
  
          this.animationCounter += delta * speed;
        }
      }
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

  private calculateMoveDamage(playerAttack: boolean, moveData: MoveType) {
    const attacker = playerAttack ? this.playerPokemon : this.enemyPokemon;
    const defender = playerAttack ? this.enemyPokemon : this.playerPokemon;

    let defenseStat: number, attackStat: number, attackerStMp: number, defenderStMp: number;
    if (moveData.damage_class === 'physical') {
      attackStat = attacker.stats.attack;
      defenseStat = defender.stats.defense;
      
      if (playerAttack) {
        attackerStMp = c.NORMAL_STAGES[this.playerPokemonStages.attack + 6];
        defenderStMp = c.NORMAL_STAGES[this.enemyPokemonStages.defense + 6];
      } else {
        attackerStMp = c.NORMAL_STAGES[this.enemyPokemonStages.defense + 6];
        defenderStMp = c.NORMAL_STAGES[this.playerPokemonStages.attack + 6];
      }
    } else {
      attackStat = attacker.stats.specialAttack;
      defenseStat = defender.stats.specialDefense;

      if (playerAttack) {
        attackerStMp = c.NORMAL_STAGES[this.playerPokemonStages.specialAttack + 6];
        defenderStMp = c.NORMAL_STAGES[this.enemyPokemonStages.specialDefense + 6];
      } else {
        attackerStMp = c.NORMAL_STAGES[this.enemyPokemonStages.specialDefense + 6];
        defenderStMp = c.NORMAL_STAGES[this.playerPokemonStages.specialAttack + 6];
      }
    }

    // Determine necessary base stats
    const level = attacker.level;
    const power = moveData.power;
    
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
      const damage = (((((2 * level) / 5 + 2) * power * ((attackStat * attackerStMp) / (defenseStat * defenderStMp))) / 50) * burn * screen * targets * weather * ff + 2) * crit * wbr * charge * hh * stab * type * random;

      return (damage / 100) << 0;
    }

    return 0;
  }

  private calculateXpGained() {
    const xpShare = 1; // if no xp-share then number of not fainted pokemon used by player
    const luckyEgg = 1; // 1 is no lucky egg, 1.5 if lucky egg
    const pokemonOrigin = 1 // 1 if wild, 1.5 if trainer
    const tradedPokemon = 1 // 1.5 if pokemon was gained in domestic trade

    const xp = (this.enemyPokemon.xpBase * this.enemyPokemon.level) / (7 * xpShare) * luckyEgg * pokemonOrigin * tradedPokemon;
    
    return xp;
  }

  private recalculatePlayerStats() {
    const baseStats = this.playerPokemon.baseStats;
    const IV = this.playerPokemon.IV;
    const EV = this.playerPokemon.EV;
    const level = this.playerPokemon.level;
    const nature = this.playerPokemon.nature;
    const health = Math.floor((2 * baseStats[0].base_stat + IV.hp + Math.floor(EV.hp / 4)) * level / 100) + level + 10;

    this.playerPokemon.health += health - this.playerPokemon.stats.hp; 
    this.playerPokemon.stats = {
      hp: health,
      attack: Math.floor((Math.floor((2 * baseStats[1].base_stat + IV.attack + Math.floor(EV.attack / 4)) * level / 100) + 5) * nature.hp),
      defense: Math.floor((Math.floor((2 * baseStats[2].base_stat + IV.defense + Math.floor(EV.defense / 4)) * level / 100) + 5) * nature.defense),
      specialAttack: Math.floor((Math.floor((2 * baseStats[3].base_stat + IV.specialAttack + Math.floor(EV.specialAttack / 4)) * level / 100) + 5) * nature.specialAttack),
      specialDefense: Math.floor((Math.floor((2 * baseStats[4].base_stat + IV.specialDefense + Math.floor(EV.specialDefense / 4)) * level / 100) + 5) * nature.specialDefense),
      speed: Math.floor((Math.floor((2 * baseStats[5].base_stat + IV.speed + Math.floor(EV.speed / 4)) * level / 100) + 5) * nature.speed),
    }
  }

  private getTypeEffectiveness(defenderType: string, moveType: string) {
    return c.TYPES_EFFECTIVENESS[18 * ((c.TYPES.indexOf(moveType) / 18) << 0) + c.TYPES.indexOf(defenderType)]
  }

  private physicalMove(delta: number, moveData: MoveType, playerAttack: boolean) {
    let isFinished = false;

    if (moveData.name === 'tackle') {
      isFinished = this.drawDefaultAttack(delta, playerAttack);

      if (this.newHealth === -1) {
        const currentHealth = playerAttack ? this.enemyPokemon.health : this.playerPokemon.health;
        this.newHealth = Math.max(currentHealth - this.calculateMoveDamage(playerAttack, moveData), 0);  
      }
    }

    if (isFinished) {
      return true;
    }

    return false;
  }

  private statusMove(delta: number, moveData: MoveType, playerAttack: boolean) {
    const move = moveData.name;
    let isFinished = false;
    
    if (move === 'growl') {
      if (!this.moveEffectApplied) {
        this.moveEffectApplied = true;

        if (playerAttack) {
          this.enemyPokemonStages.attack--;
        } else {
          this.playerPokemonStages.attack--;
        }  
      }
  
      isFinished = this.renderDelay(800);
    } else if (move === 'string-shot') {
      if (!this.moveEffectApplied) {
        this.moveEffectApplied = true;

        if (playerAttack) {
          this.enemyPokemonStages.speed--;
        } else {
          this.playerPokemonStages.speed--;
        }
      }

      isFinished = this.renderDelay(800);
    }

    if (isFinished) {
      this.moveEffectApplied = false;
      this.resetDelay();

      return true;
    }

    return false;
  }

  private writeStatusMoveText(delta: number, moveData: MoveType, playerAttack: boolean) {
    let isFinished = false, text1 = '', text2 = '';

    let pokemonName: string;
    if (playerAttack) {
      pokemonName = this.enemyPokemon.pokemonName;
    } else {
      pokemonName = this.playerPokemon.pokemonName;
    }

    const move = moveData.name;

    if (move === 'growl') {
      text1 = 'Foe ' + pokemonName.toUpperCase() + '\'s ATTACK';
      text2 = 'fell!';
    } else if (move === 'string-shot') {
      text1 = 'Foe ' + pokemonName.toUpperCase() + '\'s SPEED';
      text2 = 'fell!';
    }

    // Draw action box without player action selector
    this.drawActionBox(false);

    // Write status move text
    isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);

    if (isFinished) {
      return true;
    }

    return false;

  }

  private writeMoveText(delta: number, moveData: MoveType, playerAttack: boolean) {
    let pokemonName: string;
    if (playerAttack) {
      pokemonName = this.playerPokemon.pokemonName;
    } else {
      pokemonName = this.enemyPokemon.pokemonName;
    }

    const text1 = pokemonName.toUpperCase() + ' used';
    const text2 = moveData.name.toUpperCase() + '!';

    // Draw action box without player action selector
    this.drawActionBox(false);

    // Damage move
    const isFinished = this.writeToDialogueBox(delta, 0, text1, text2, 0, 1);

    if (isFinished) {
      return true;
    }

    return false;
  }

  private animateHealthBar(delta: number, playerAttack: boolean) {
    const currentHealth = playerAttack ? this.enemyPokemon.health : this.playerPokemon.health;

    if (currentHealth > this.newHealth) {
      if (playerAttack) {
        this.enemyPokemon.health -= 16 * delta;
      } else {
        this.playerPokemon.health -= 16 * delta;
      }
    } else {
      if (playerAttack) {
        this.enemyPokemon.health = this.newHealth;
      } else {
        this.playerPokemon.health = this.newHealth;
      }
      this.newHealth = -1;

      return true;
    }

    return false;
  }

  private animateXpBar(delta: number) {
    const currentXp = this.playerPokemon.xp;

    if (currentXp < this.newXp) {
      this.playerPokemon.xp += 48 * delta;

      if (this.playerPokemon.xp > this.playerPokemon.xpNextLevel) {
        this.playerPokemon.level++;
        this.playerPokemon.xpCurLevel = c.LEVELS[this.playerPokemon.growth_rate][this.playerPokemon.level];
        this.playerPokemon.xpNextLevel = c.LEVELS[this.playerPokemon.growth_rate][this.playerPokemon.level + 1];
        
        this.levelGained = true;
      }
    } else {
      this.playerPokemon.xp = this.newXp;
      this.newXp = -1;

      return true;
    }

    return false;
  }

  private drawThrowPlayerPokemon(delta: number) {
    const speedPokeball = 64;

    let pokeballThrown = false;
    let pokemonAltFinished = false;
    let healthSlideFinished = false;
    
    // Draw battle grounds player pokemon
    this.playerBattleGrounds.render();

    if (this.drawAvatarFinished) {
      // Calculate the x and y for the pokeball
      const pokeballPosition = this.pokeball.getPosition();
      const xPixelPokeball = pokeballPosition.x + delta * speedPokeball;
      const yPixelPokeball = 0.1 * xPixelPokeball ** 2 - 7.5 * xPixelPokeball + 195;

      // Draw the pokeball
      this.pokeball.updateSourcePosition(c.POKEBALL_OFFSET_X + this.playerPokemon.pokeball * c.POKEBALL_SIZE, c.POKEBALL_OFFSET_Y + 37);
      this.pokeball.setPosition(xPixelPokeball, yPixelPokeball);
      this.pokeball.render(delta);

      if (pokeballPosition.x > 60) {
        pokeballThrown = true;
      }
    }

    // Pokemon appear animation
    if (pokeballThrown) {
      // Draw pink appearing pokemon
      pokemonAltFinished = this.playerPokemonAltObject.scaleTo(delta, 2, 1);
    }

    if (pokemonAltFinished) {
      // Draw appearing pokemon
      this.playerPokemonAltObject.opacityTo(delta, 3, false, 0);
      this.playerPokemonObject.opacityTo(delta, 3, true, 1);

      // Draw player health
      healthSlideFinished = this.drawPlayerHealth(delta, true);
    }
    
    // Player slide out animation
    this.drawAvatarFinished = this.drawAvatar(delta, false, true);

    return healthSlideFinished;
  }

  private drawDefaultAttack(delta: number, playerAttack: boolean) {
    const speed = 160;

    // Draw battle grounds player pokemon
    this.playerBattleGrounds.render();
    this.enemyBattleGrounds.render();

    // Set gameObjects and base x and y positions for the pokemon
    let attacker, defender, xPosAttacker, yPosAttacker, xPosDefender, yPosDefender;
    let direction = 1;
    if (playerAttack) {
      attacker = this.playerPokemonObject;
      defender = this.enemyPokemonObject;
  
      xPosAttacker = (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE) / 2;
      yPosAttacker = c.BATTLE_ARENA_HEIGHT - c.POKEMON_SIZE;
      xPosDefender = c.GAME_WIDTH - (c.BATTLE_SCENE_WIDTH + c.POKEMON_SIZE) / 2;
      yPosDefender = 22;
    } else {
      attacker = this.enemyPokemonObject;
      defender = this.playerPokemonObject;
  
      xPosDefender = (c.BATTLE_SCENE_WIDTH - c.POKEMON_SIZE) / 2;
      yPosDefender = c.BATTLE_ARENA_HEIGHT - c.POKEMON_SIZE;
      xPosAttacker = c.GAME_WIDTH - (c.BATTLE_SCENE_WIDTH + c.POKEMON_SIZE) / 2;
      yPosAttacker = 22;

      direction = -1;
    }

    // Draw the correct animation
    let forwardFinished = false;
    let backwardFinished = false;
    let forwardFinished2 = false;
    let backwardFinished2 = false;

    if (!this.attackHalfWay) {
      forwardFinished = attacker.animate(delta, speed, direction, 0, xPosAttacker + direction * 20, yPosAttacker, true);
    } else if (this.attackHalfWay) {
      backwardFinished = attacker.animate(delta, speed, -direction, 0, xPosAttacker, yPosAttacker, true);
    }

    if (forwardFinished) {
      this.attackHalfWay = true;
    }

    if (backwardFinished) {
      this.attackHalfWay = false;
    }

    if (this.attackHalfWay && !this.defenseHalfWay) {
      forwardFinished2 = defender.animate(delta, speed, direction, 0, xPosDefender + direction * 10, yPosDefender, true)
    } else if (this.defenseHalfWay) {
      backwardFinished2 = defender.animate(delta, speed, -direction, 0, xPosDefender, yPosDefender, true)
    } else {
      defender.render();
    }

    if (forwardFinished2) {
      this.defenseHalfWay = true;
    }

    if (backwardFinished2) {
      this.defenseHalfWay = false;
    }

    return backwardFinished2;
  }

  private drawPlayerHealth(delta: number, slideIn: boolean) {
    const speedHealth = 224;

    // Draw player health box
    if (slideIn) {
      this.playerPokemonHealthBox.animate(delta, speedHealth, -1, 0, 127, 75, true);
    } else {
      this.playerPokemonHealthBox.render();
    }

    // Calculate variables for drawing the xp bar
    const xpFrac = (this.playerPokemon.xp - this.playerPokemon.xpCurLevel) / (this.playerPokemon.xpNextLevel - this.playerPokemon.xpCurLevel);
    const xpBarWidth = (xpFrac * 48) << 0;

    // Calculate variables for drawing the health bar
    const healthFrac = this.playerPokemon.health / this.playerPokemon.stats.hp;
    const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;
    const healthBarWidth = (healthFrac * 48) << 0;

    // Draw player health and xp bar
    this.playerPokemonXpBox.setWidth(xpBarWidth);
    this.playerPokemonHealthBar.updateSourcePosition(c.ASSETS_ENEMY_HEALTH_WIDTH + c.ASSETS_PLAYER_HEALTH_WIDTH, c.ASSETS_HEALTH_OFFSET + healthBarOffset);
    this.playerPokemonHealthBar.setWidth(healthBarWidth);

    if (slideIn) {
      this.playerPokemonXpBox.animate(delta, speedHealth, -1, 0, 127 + 31, 75 + 33, true);  
      this.playerPokemonHealthBar.animate(delta, speedHealth, -1, 0, 127 + 47, 75 + 17, true);  
    } else {
      this.playerPokemonXpBox.render();
      this.playerPokemonHealthBar.render();
    }

    if (this.playerHealthTextCtx) {
      // Draw the pokemon name, gender, and level
      const nameText = this.playerPokemon.pokemonName.toUpperCase() + ((this.playerPokemon.gender) ? '#' : '^');
      const healthText = (this.playerPokemon.health << 0).toString().padStart(3, '_') + '/' + this.playerPokemon.stats.hp.toString().padStart(3, '_');

      this.playerHealthTextCtx.clearRect(0, 0, c.ASSETS_PLAYER_HEALTH_WIDTH, c.ASSETS_PLAYER_HEALTH_HEIGHT);
      drawText(this.playerHealthTextCtx, this.font, nameText, 1, 0, 14, 6);
      drawText(this.playerHealthTextCtx, this.font, this.playerPokemon.level.toString(), 1, 0, 84, 6);
      drawText(this.playerHealthTextCtx, this.font, healthText, 1, 0, 59, 22);

      this.playerPokemonHealthText.update(this.playerHealthTextCanvas);
      if (slideIn) {
        const isFinished = this.playerPokemonHealthText.animate(delta, speedHealth, -1, 0, 127, 75, true);

        return isFinished;
      } else {
        this.playerPokemonHealthText.render();
      }
    }

    return true;
  }

  private drawEnemyHealth(delta: number, slideIn: boolean) {
    const speedHealth = 224;

    // Draw enemy health box
    this.enemyPokemonHealthBox.animate(delta, speedHealth, 1, 0, 13, 16, true);

    // Calculate variables for drawing the health bar
    const healthFrac = this.enemyPokemon.health / this.enemyPokemon.stats.hp;
    const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;
    const healthBarWidth = (healthFrac * 48) << 0;

    // Draw enemy health bar
    this.playerPokemonHealthBar.updateSourcePosition(c.ASSETS_ENEMY_HEALTH_WIDTH + c.ASSETS_PLAYER_HEALTH_WIDTH, c.ASSETS_HEALTH_OFFSET + healthBarOffset);
    this.enemyPokemonHealthBar.setWidth(healthBarWidth);
    if (slideIn) {
      this.enemyPokemonHealthBar.animate(delta, speedHealth, 1, 0, 13 + 39, 16 + 17, true);
    } else {
      this.enemyPokemonHealthBar.render();
    }

    // Draw the pokemon name, gender, and level
    if (this.enemyHealthTextCtx) {
      const nameText = this.enemyPokemon.pokemonName.toUpperCase() + ((this.enemyPokemon.gender) ? '#' : '^');

      drawText(this.enemyHealthTextCtx, this.font, nameText, 1, 0, 6, 6);
      drawText(this.enemyHealthTextCtx, this.font, this.enemyPokemon.level.toString(), 1, 0, 76, 6);

      this.enemyPokemonHealthText.update(this.enemyHealthTextCanvas);
      if (slideIn) {
        this.enemyPokemonHealthText.animate(delta, speedHealth, 1, 0, 13, 16, true);
      } else {
        this.enemyPokemonHealthText.render();
      }
    }
  }

  private drawAvatar(delta: number, slideIn: boolean, slideOut: boolean) {
    const speed = 176;
    let isFinished = false;

    if (slideIn) {
      // Draw battle grounds player pokemon
      this.playerBattleGrounds.animate(delta, speed, -1, 0, 0, 100, true);

      // Draw the player avatar
      isFinished = this.playerAvatar.animate(delta, speed, -1, 0, c.BATTLE_SCENE_WIDTH / 2, c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT, true);
    } else if (slideOut) {
      // Next animation frame and animate
      this.playerAvatar.animationTrigger(1);
      const isFinishedFirstSprite = this.playerAvatar.animate(delta, speed, -1, 0, -16, c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT, false);

      // Next animation frame and animate
      if (isFinishedFirstSprite) {
        this.playerAvatar.animationTrigger(2);
        isFinished = this.playerAvatar.animate(delta, speed, -1, 0, -36, c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT, false);  
      }

      // Next animation frame and animate
      if (isFinished) {
        this.playerAvatar.animationTrigger(3);
        this.playerAvatar.animate(delta, speed, -1, 0, -c.AVATAR_BATTLE_WIDTH, c.BATTLE_ARENA_HEIGHT - c.AVATAR_BATTLE_HEIGHT, false);  
      }
    } else {
      // Draw battle grounds player pokemon
      this.playerBattleGrounds.render();

      // Draw the player avatar
      this.playerAvatar.render();
    }

    return isFinished;
  }

  private drawEnemyPokemon(delta: number, slideIn: boolean, slideOut: boolean) {
    let isFinished = false;
    const speed = 176;

    const x = c.GAME_WIDTH - (c.BATTLE_SCENE_WIDTH + c.POKEMON_SIZE) / 2;
    const y = 22;

    if (slideIn) {
      // Draw battle grounds enemy pokemon
      this.enemyBattleGrounds.animate(delta, speed, 1, 0, c.GAME_WIDTH - c.BATTLE_SCENE_WIDTH, 48, true);

      // Set alpha of enemy pokemon when sliding in
      this.enemyPokemonObject.setOpacity(0.8);
      // Draw enemy pokemon
      isFinished = this.enemyPokemonObject.animate(delta, speed, 1, 0, x, y, true);
    } else if (slideOut) {
      // Draw battle grounds enemy pokemon
      this.enemyBattleGrounds.render();

      if (this.enemyPokemonObject.y > 47) {
        this.enemyPokemonObject.setHeight(28);
      }

      isFinished = this.enemyPokemonObject.animate(delta, speed, 0, 1, x, 75, false);
    } else {
      // Draw battle grounds enemy pokemon
      this.enemyBattleGrounds.render();

      this.enemyPokemonObject.setOpacity(1);
      this.enemyPokemonObject.render();
    }

    return isFinished;
  }

  private writeToDialogueBox(delta: number, delayAfter: number, textCol1: string, textCol2: string, fontsize: number, fontColor: number) {
    const speed = 48;
    const i = (this.animationCounter + delta * speed) << 0;

    if (!this.writeSecondLine) {
      const yText = 121;
      const textToDisplay = textCol1.slice(0, i);

      // Draw the text
      drawText(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);

      if (i < textCol1.length) {
        this.animationCounter += delta * speed;
      } else {
        this.animationCounter = 0;
        this.writeSecondLine = true;
      }
    } else {
      const yText = 121 + 16;
      const textToDisplay = textCol2.slice(0, i);

      // Draw the text
      drawText(this.ctx, this.font, textCol1, 0, 1, 16, 121);
      drawText(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);

      if (i < textCol2.length + delayAfter * speed * 0.8) {
        this.animationCounter += delta * speed;
      } else {
        this.animationCounter = 0;
        this.writeSecondLine = false;

        return true;
      }  
    }

    return false;
  }

  private drawActionBox(actionChoice: boolean) {
    // Draw the battle dialogue box
    this.battleDialogueBox.render();

    // Draw the player action choice box
    if (actionChoice) {
      this.actionSelectorBox.render();
    }
  }

  private drawActionSelector(xStart: number, xEnd: number, column: number) {
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
}