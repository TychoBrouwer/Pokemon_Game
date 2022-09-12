import { GameObject } from '../utils/game_object';
import { Loader } from '../utils/loader';

import { AVATAR_BATTLE_HEIGHT, AVATAR_BATTLE_WIDTH, GAME_WIDTH } from '../constants/game_constants';
import { 
  ACTION_BOX_HEIGHT,
  BATTLE_ARENA_HEIGHT, 
  BATTLE_SCENE_HEIGHT, 
  BATTLE_SCENE_WIDTH, 
  POKEBALL_SIZE, 
  POKEMON_SIZE, 
} from '../constants/battle_constants';
import {
  ASSET_PLAYER_HEALTH_HEIGHT,
  ASSET_PLAYER_HEALTH_WIDTH,
  ASSET_HEALTH_OFFSET,
  ASSET_ENEMY_HEALTH_WIDTH,
  ASSET_AVATAR_BATTLE_OFFSET,
  ASSET_POKEBALL_OFFSET_X,
  ASSET_POKEBALL_OFFSET_Y,
} from '../constants/asset_constants';
import { LEVELS } from '../constants/mon_constants';

import { drawText } from '../utils/helper';

import { MoveType, PokemonDataType } from "../utils/types";

interface AnimationFunctionType {
  (delta: number, direction: number): boolean;
} 

export class Battler {
  private ctx: CanvasRenderingContext2D;
  private loader: Loader;
  public pokemonData: PokemonDataType;
  private encounterMethod: number;

  private elapsedTime = 0;
  private delayStart = -1;

  private battlerPositionId: 0 | 1 | 2 | 3;
  private slideDirection: 1 | -1;
  private playerSide: boolean;
  private genderOffsets: {[variableName: string]: number};
  private monDefaultPos: {x: number, y: number};
  public newPokemonHealth = 0;

  private callback = false;
  private animationResult = false;
  private animationQueue: [AnimationFunctionType, number][] = [];

  public pokemonStages = {
    attack: 0,
    defense: 0,
    specialDefense: 0,
    specialAttack: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0,
  };

  private battleAssets: HTMLCanvasElement;
  private font: HTMLCanvasElement;
  private pokemonSprite: HTMLCanvasElement;
  private avatarAssets: HTMLCanvasElement;

  private battleGround: GameObject;
  private avatar: GameObject;
  private pokemonObject: GameObject;
  private pokemonHealthBox: GameObject;
  private pokemonHealthBar: GameObject;
  private pokemonHealthText: GameObject;
  private pokemonXpBox: GameObject;
  private pokeball: GameObject;

  private pokemonTextCanvas: HTMLCanvasElement;
  private pokemonTextCtx: CanvasRenderingContext2D | null;

  constructor(ctx: CanvasRenderingContext2D, loader: Loader, pokemonData: PokemonDataType, battlerPositionId: 0 | 1 | 2 | 3, encounterMethod: number, genderOffsets: {[variableName: string]: number}) {
    this.ctx = ctx;
    this.loader = loader;
    this.pokemonData = pokemonData;
    this.encounterMethod = encounterMethod;
    this.genderOffsets = genderOffsets;

    this.battlerPositionId = battlerPositionId;
    if (this.battlerPositionId === 0 || this.battlerPositionId === 2) {
      this.slideDirection = -1;
      this.playerSide = true;
    } else {
      this.slideDirection = 1;
      this.playerSide = false;
    }

    this.battleAssets = this.loader.getImageCanvas('battleAssets');
    this.font = this.loader.getImageCanvas('font');
    this.pokemonSprite = this.loader.getImageCanvas('pokemonGeneration' + (this.pokemonData.generation + 1));
    this.avatarAssets = this.loader.getImageCanvas('avatar');

    this.pokemonTextCanvas = document.createElement('canvas');
    this.pokemonTextCanvas.height= ASSET_PLAYER_HEALTH_HEIGHT;
    this.pokemonTextCanvas.width = ASSET_ENEMY_HEALTH_WIDTH;
    this.pokemonTextCtx = this.pokemonTextCanvas.getContext('2d');

    // const healthX = this.playerSide ? 135 : 13;
    const healthY = this.playerSide ? 75 : 16;
    const playerHealthAdj = this.playerSide ? 8 : 0;
    this.monDefaultPos = {
      x: this.playerSide ? (BATTLE_SCENE_WIDTH - POKEMON_SIZE) / 2 : GAME_WIDTH - (BATTLE_SCENE_WIDTH + POKEMON_SIZE) / 2,
      y: this.playerSide ? BATTLE_ARENA_HEIGHT - POKEMON_SIZE : 22,
    }

    this.battleGround = new GameObject(
      this.ctx,
      this.battleAssets,
      false,
      this.encounterMethod % 3 * BATTLE_SCENE_WIDTH,
      ((0.5 + this.encounterMethod / 3) << 0) * BATTLE_SCENE_HEIGHT + 3 * BATTLE_ARENA_HEIGHT + ACTION_BOX_HEIGHT,
      BATTLE_SCENE_WIDTH,
      BATTLE_SCENE_HEIGHT,
      this.playerSide ? GAME_WIDTH : -BATTLE_SCENE_WIDTH,
      this.playerSide ? 100 : 48,
    );

    this.avatar = new GameObject(
      this.ctx,
      this.avatarAssets,
      false,
      ASSET_AVATAR_BATTLE_OFFSET,
      this.genderOffsets.ASSET_AVATAR_OFFSET,
      AVATAR_BATTLE_WIDTH,
      AVATAR_BATTLE_HEIGHT,
      this.playerSide ? GAME_WIDTH + BATTLE_SCENE_WIDTH / 2 : -(BATTLE_SCENE_WIDTH + AVATAR_BATTLE_WIDTH) / 2,
      this.playerSide ? BATTLE_ARENA_HEIGHT - AVATAR_BATTLE_HEIGHT : 22,
    );
    if (this.playerSide) this.avatar.setAnimation(true, 0, 0, AVATAR_BATTLE_HEIGHT, 4);

    this.pokemonObject = new GameObject(
      this.ctx,
      this.pokemonSprite,
      true,
      this.pokemonData.xSource + (this.playerSide ? 2 * POKEMON_SIZE : 0),
      this.pokemonData.ySource,
      POKEMON_SIZE,
      POKEMON_SIZE,
      this.playerSide ? GAME_WIDTH + (BATTLE_SCENE_WIDTH - POKEMON_SIZE) / 2 : -(BATTLE_SCENE_WIDTH + POKEMON_SIZE) / 2,
      this.monDefaultPos.y,
    );

    this.pokemonHealthBox = new GameObject(
      this.ctx,
      this.battleAssets,
      false,
      this.playerSide ? 0 : ASSET_PLAYER_HEALTH_WIDTH,
      ASSET_HEALTH_OFFSET,
      this.playerSide ? ASSET_PLAYER_HEALTH_WIDTH : ASSET_ENEMY_HEALTH_WIDTH,
      ASSET_PLAYER_HEALTH_HEIGHT,
      this.playerSide ? GAME_WIDTH : -ASSET_ENEMY_HEALTH_WIDTH,
      healthY,
    );

    this.pokemonHealthBar = new GameObject(
      this.ctx,
      this.battleAssets,
      false,
      ASSET_ENEMY_HEALTH_WIDTH + ASSET_PLAYER_HEALTH_WIDTH,
      ASSET_HEALTH_OFFSET,
      48,
      2,
      (this.playerSide ? GAME_WIDTH : -ASSET_ENEMY_HEALTH_WIDTH) + 39 + playerHealthAdj,
      healthY + 17,
    );

    this.pokemonHealthText = new GameObject(
      this.ctx,
      this.pokemonTextCanvas,
      false,
      0,
      0,
      ASSET_PLAYER_HEALTH_WIDTH,
      ASSET_PLAYER_HEALTH_HEIGHT,
      (this.playerSide ? GAME_WIDTH : -ASSET_ENEMY_HEALTH_WIDTH),
      healthY,
    );

    this.pokemonXpBox = new GameObject(
      this.ctx,
      this.battleAssets,
      false,
      ASSET_ENEMY_HEALTH_WIDTH + ASSET_PLAYER_HEALTH_WIDTH,
      ASSET_HEALTH_OFFSET + 3 * 2,
      64,
      2,
      (this.playerSide ? GAME_WIDTH : -ASSET_ENEMY_HEALTH_WIDTH) + 23 + playerHealthAdj,
      healthY + 33,
    );

    this.pokeball = new GameObject(
      this.ctx,
      this.battleAssets,
      false,
      ASSET_POKEBALL_OFFSET_X,
      ASSET_POKEBALL_OFFSET_Y + 32,
      POKEBALL_SIZE,
      POKEBALL_SIZE,
      25,
      70,
    );
    this.pokeball.setAnimation(false, 32, 0, POKEBALL_SIZE, 8);
  }

  private renderDelay(duration: number): boolean {
    if (this.delayStart === -1) {
      this.delayStart = this.elapsedTime;

    } else if (this.delayStart + duration <= this.elapsedTime) {
      return true;
    }

    return false;
  }

  private resetDelay() {
    this.delayStart = -1;
  }

  private getNextAnim() {
    return this.animationQueue[this.animationQueue.length - 1];
  }

  animateHealthBar(delta: number) {
    const currentHealth = this.pokemonData.health;

    if (currentHealth > this.newPokemonHealth) {
      this.pokemonData.health -= 16 * delta;
    } else {
      this.pokemonData.health = this.newPokemonHealth;

      return true;
    }

    return false;
  }

  animateXpBar(delta: number, newXp: number) {
    if (this.pokemonData.xp < newXp) {
      this.pokemonData.xp += 48 * delta;

      if (this.pokemonData.xp > this.pokemonData.xpNextLevel) {
        this.pokemonData.level++;
        this.pokemonData.xpCurLevel = LEVELS[this.pokemonData.growth_rate][this.pokemonData.level];
        this.pokemonData.xpNextLevel = LEVELS[this.pokemonData.growth_rate][this.pokemonData.level + 1];
        
        // this.levelGained = true;
      }
    } else {
      this.pokemonData.xp = newXp;

      return true;
    }

    return false;
  }

  drawHealthSlideIn(delta: number) {
    const speedHealth = 224;

    const healthX = this.playerSide ? 135 : 13;
    const playerHealthAdj = this.playerSide ? 8 : 0;

    this.pokemonHealthBox.animate(delta, speedHealth, this.slideDirection, 0, healthX - playerHealthAdj, this.pokemonHealthBox.y, false, true);

    const xpFrac = (this.pokemonData.xp - this.pokemonData.xpCurLevel) / (this.pokemonData.xpNextLevel - this.pokemonData.xpCurLevel);
    const xpBarWidth = (xpFrac * 48) << 0;

    const healthFrac = this.pokemonData.health / this.pokemonData.stats.hp;
    const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;
    const healthBarWidth = (healthFrac * 48) << 0;

    this.pokemonHealthBar.updateSourcePosition(ASSET_ENEMY_HEALTH_WIDTH + ASSET_PLAYER_HEALTH_WIDTH, ASSET_HEALTH_OFFSET + healthBarOffset);
    this.pokemonHealthBar.setWidth(healthBarWidth);
    this.pokemonHealthBar.animate(delta, speedHealth, this.slideDirection, 0, healthX + 39, this.pokemonHealthBar.y, false, true);

    this.pokemonXpBox.setWidth(xpBarWidth);
    this.pokemonXpBox.animate(delta, speedHealth, this.slideDirection, 0, healthX + 23, this.pokemonXpBox.y, false, true);

    let isFinished = false;
    if (this.pokemonTextCtx) {
      // Draw the pokemon name, gender, and level
      const nameText = this.pokemonData.pokemonName.toUpperCase() + ((this.pokemonData.gender) ? '#' : '^');
      const healthText = (this.pokemonData.health << 0).toString().padStart(3, '_') + '/' + this.pokemonData.stats.hp.toString().padStart(3, '_');

      this.pokemonTextCtx.clearRect(0, 0, ASSET_PLAYER_HEALTH_WIDTH, ASSET_PLAYER_HEALTH_HEIGHT);
      drawText(this.pokemonTextCtx, this.font, nameText, 1, 0, 6 + playerHealthAdj, 6);
      drawText(this.pokemonTextCtx, this.font, this.pokemonData.level.toString(), 1, 0, 76 + playerHealthAdj, 6);

      if (this.playerSide) {
        drawText(this.pokemonTextCtx, this.font, healthText, 1, 0, 59, 22);
      }

      this.pokemonHealthText.update(this.pokemonTextCanvas);
      
      isFinished = this.pokemonHealthText.animate(delta, speedHealth, this.slideDirection, 0, healthX - playerHealthAdj, this.pokemonHealthText.y, false, true);
    }

    return isFinished;
  }

  drawHealth() {
    this.pokemonHealthBox.render();

    const healthFrac = this.pokemonData.health / this.pokemonData.stats.hp;
    const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2: 0;
    const healthBarWidth = (healthFrac * 48) << 0;

    this.pokemonHealthBar.updateSourcePosition(ASSET_ENEMY_HEALTH_WIDTH + ASSET_PLAYER_HEALTH_WIDTH, ASSET_HEALTH_OFFSET + healthBarOffset);
    this.pokemonHealthBar.setWidth(healthBarWidth);
    this.pokemonHealthBar.render();

    if (this.playerSide) {
      const xpFrac = (this.pokemonData.xp - this.pokemonData.xpCurLevel) / (this.pokemonData.xpNextLevel - this.pokemonData.xpCurLevel);
      const xpBarWidth = (xpFrac * 48) << 0;

      this.pokemonXpBox.setWidth(xpBarWidth);
      this.pokemonXpBox.render();
    }

    const playerHealthAdj = this.playerSide ? 8 : 0;

    const nameText = this.pokemonData.pokemonName.toUpperCase() + ((this.pokemonData.gender) ? '#' : '^');
    const healthText = (this.pokemonData.health << 0).toString().padStart(3, '_') + '/' + this.pokemonData.stats.hp.toString().padStart(3, '_');

    if (this.pokemonTextCtx) {
      this.pokemonTextCtx.clearRect(0, 0, ASSET_PLAYER_HEALTH_WIDTH, ASSET_PLAYER_HEALTH_HEIGHT);
      drawText(this.pokemonTextCtx, this.font, nameText, 1, 0, 6 + playerHealthAdj, 6);
      drawText(this.pokemonTextCtx, this.font, this.pokemonData.level.toString(), 1, 0, 76 + playerHealthAdj, 6);

      if (this.playerSide) {
        drawText(this.pokemonTextCtx, this.font, healthText, 1, 0, 59, 22);
      }

      this.pokemonHealthText.update(this.pokemonTextCanvas);
      this.pokemonHealthText.render();
    }
  }

  drawPokemonSlideIn(delta: number) {
    const speed = 176;

    const pokemonX = this.playerSide ? (BATTLE_SCENE_WIDTH - POKEMON_SIZE) / 2 : GAME_WIDTH - (BATTLE_SCENE_WIDTH + POKEMON_SIZE) / 2;
    const groundsX = this.playerSide ? 0 : GAME_WIDTH - BATTLE_SCENE_WIDTH;

    this.battleGround.animate(delta, speed, 1, 0, groundsX, this.battleGround.y, false, true);
    this.pokemonObject.darkenColor(0.9);
    const isFinished = this.pokemonObject.animate(delta, speed, this.slideDirection, 0, pokemonX, this.pokemonObject.y, false, true);

    if (isFinished) {
      this.pokemonObject.resetColor();
      this.pokemonObject.render();
    }

    return isFinished;
  }

  drawPokemonSlideDown(delta: number) {
    const speed = 176;

    this.battleGround.render();

    const y = (this.playerSide ? BATTLE_ARENA_HEIGHT - POKEMON_SIZE : 22) + 53;

    // Draw battle grounds enemy pokemon
    this.pokemonObject.render();

    if (!this.playerSide && this.pokemonObject.y > 47) {
      this.pokemonObject.setHeight(28);
    }

    const isFinished = this.pokemonObject.animate(delta, speed, 0, 1, this.pokemonObject.x, y, false, false);

    return isFinished;
  }

  drawPokeballThrow(delta: number) {
    const speedPokeball = 64;

    this.battleGround.render();
    
    let pokeballThrown = false;
    let pokemonAltFinished = false;
    let healthSlideFinished = false;
    
    // Calculate the x and y for the pokeball
    const pokeballPosition = this.pokeball.getPosition();
    const xPixelPokeball = pokeballPosition.x + delta * speedPokeball;
    const yPixelPokeball = 0.1 * xPixelPokeball ** 2 - 7.5 * xPixelPokeball + 195;

    // Draw the pokeball
    this.pokeball.updateSourcePosition(ASSET_POKEBALL_OFFSET_X + this.pokemonData.pokeball * POKEBALL_SIZE, ASSET_POKEBALL_OFFSET_Y + 32);
    this.pokeball.setPosition(xPixelPokeball, yPixelPokeball);
    this.pokeball.render(delta);

    if (pokeballPosition.x > 60) {
      pokeballThrown = true;
    }

    if (pokeballThrown) {
      pokemonAltFinished = this.pokemonObject.scaleTo(delta, 2, 1, true);
    } else {
      this.pokemonObject.setPosition(BATTLE_SCENE_WIDTH / 2, BATTLE_ARENA_HEIGHT);
      this.pokemonObject.setScale(0);
    }

    if (pokemonAltFinished) {
      this.pokemonObject.resetColor();
      this.pokemonObject.render();

      healthSlideFinished = this.drawHealthSlideIn(delta);
    } else if (pokeballThrown) {
      this.pokemonObject.setColor(254, 191, 246);
    }
    
    return healthSlideFinished;
  }

  drawPokemon() {
    this.battleGround.render();
    this.pokemonObject.render();
  }

  drawAvatarSlideIn(delta: number) {
    const speed = 176;

    const x = this.playerSide ? BATTLE_SCENE_WIDTH / 2 : GAME_WIDTH - (BATTLE_SCENE_WIDTH + AVATAR_BATTLE_WIDTH) / 2;
    const groundsX = this.playerSide ? 0 : GAME_WIDTH - BATTLE_SCENE_WIDTH;

    // Draw battle grounds player pokemon
    this.battleGround.animate(delta, speed, this.slideDirection, 0, groundsX, this.battleGround.y, false, true);

    // Draw the player avatar
    const isFinished = this.avatar.animate(delta, speed, this.slideDirection, 0, x, this.avatar.y, false, true);
    
    return isFinished;
  }

  drawAnimatedAvatarSlideOut(delta: number) {
    const speed = 176;

    this.battleGround.render();

    const x1 = this.playerSide ? -16 : GAME_WIDTH + 16; 
    const x2 = this.playerSide ? -36 : GAME_WIDTH + 36; 
    const x3 = this.playerSide ? -AVATAR_BATTLE_WIDTH : GAME_WIDTH + AVATAR_BATTLE_WIDTH; 

    // Next animation frame and animate
    this.avatar.animationTrigger(1);
    const isFinishedFirstSprite = this.avatar.animate(delta, speed, this.slideDirection, 0, x1, this.avatar.y, false, false);

    // Next animation frame and animate
    let isFinished = false;
    if (isFinishedFirstSprite) {
      this.avatar.animationTrigger(2);
      isFinished = this.avatar.animate(delta, speed, this.slideDirection, 0, x2, this.avatar.y, false, false);  
    }

    // Next animation frame and animate
    if (isFinished) {
      this.avatar.animationTrigger(3);
      this.avatar.animate(delta, speed, this.slideDirection, 0, x3, this.avatar.y, false, false);  
    }

    return isFinished;
  }

  drawAvatarSlideOut(delta: number) {
    const speed = 176;

    const x = this.playerSide ? -AVATAR_BATTLE_WIDTH : GAME_WIDTH + AVATAR_BATTLE_WIDTH;
    const isFinished = this.avatar.animate(delta, speed, this.slideDirection, 0, x, this.avatar.y, false, false);
    
    return isFinished;
  }

  drawAvatar() {
    this.battleGround.render();
    this.avatar.render();
  }

  addAttackAnim(moveData: MoveType) {
    if (moveData.name === 'tackle') {
      this.animationQueue.push([ this.horizontalLunge, 1 ]);
    }
  }

  addDamageAnim(moveData: MoveType) {
    if (moveData.name === 'tackle') {
      this.animationQueue.push([ this.fadeInOut, -1 ]);
      this.animationQueue.push([ this.fadeInOut, -1 ]);
      this.animationQueue.push([ this.fadeInOut, -1 ]);
      this.animationQueue.push([ this.fadeInOut, -1 ]);

      if (this.playerSide) {
        this.animationQueue.push([ this.horizontalShake, 1 ]);
      } else {
        this.animationQueue.push([ this.horizontalShake, -1 ]);
        this.animationQueue.push([ this.horizontalShake, -1 ]);
      }
    }
  }

  drawAnim(delta: number) {
    this.animationResult = this.runAnimation(delta);

    if (this.animationResult) {
      this.animationQueue.pop();
      this.callback = false;

      if (this.animationQueue.length === 0) {
        return true;
      }
    }

    return false;
  }

  private horizontalLunge(delta: number, direction: number) {
    const speed = 128;

    this.battleGround.render();

    let isFinished = false;
    if (!this.callback) {
      this.callback = this.pokemonObject.animate(
        delta, speed,
        -this.slideDirection * direction, 0,
        this.monDefaultPos.x - this.slideDirection * direction * 15, this.monDefaultPos.y,
        false, true
      );
    } else if (this.callback) {
      isFinished = this.pokemonObject.animate(
        delta, speed,
        this.slideDirection * direction, 0,
        this.monDefaultPos.x, this.monDefaultPos.y,
        false, true
      );
    }

    return isFinished;
  }

  private horizontalShake(delta: number, direction: number) {
    const speed = 64;

    this.battleGround.render();

    let isFinished = false;
    if (!this.callback) {
      this.callback = this.pokemonObject.animate(
        delta, speed,
        -this.slideDirection * direction, 0,
        this.monDefaultPos.x - this.slideDirection * direction * 5, this.monDefaultPos.y,
        false, true
      );
    } else if (this.callback) {
      isFinished = this.pokemonObject.animate(
        delta, speed,
        this.slideDirection * direction, 0,
        this.monDefaultPos.x, this.monDefaultPos.y,
        false, true
      );
    }

    return isFinished;
  }

  private fadeInOut(_: number, __: number) {
    const delay = 70;

    this.battleGround.render();

    let isFinished = false;
    if (!this.callback) {
      this.callback = this.renderDelay(delay);
    } else if (this.callback) {
      this.pokemonObject.setOpacity(0);
      isFinished = this.renderDelay(delay * 2);
    }

    if (isFinished) {
      this.pokemonObject.setOpacity(1);
      this.resetDelay();
    }

    return isFinished;
  }

  private runAnimation(delta: number) {
    const nextAnimation = this.getNextAnim();
    if (nextAnimation) {
      const functionArgs = nextAnimation[1];

      return nextAnimation[0].call(this, delta, functionArgs);
    }
    
    return true
  }

  resetAnimation() {
    this.callback = false;
    this.animationResult = false;
  }

  updateElapsedTime(elapsedTime: number) {
    this.elapsedTime = elapsedTime;
  }
}