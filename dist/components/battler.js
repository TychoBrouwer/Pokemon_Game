"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Battler = void 0;
const game_object_1 = require("../utils/game_object");
const game_constants_1 = require("../constants/game_constants");
const battle_constants_1 = require("../constants/battle_constants");
const asset_constants_1 = require("../constants/asset_constants");
const mon_constants_1 = require("../constants/mon_constants");
const helper_1 = require("../utils/helper");
class Battler {
    constructor(ctx, loader, pokemonData, battlerPositionId, encounterMethod, genderOffsets) {
        this.ctx = ctx;
        this.loader = loader;
        this.pokemonData = pokemonData;
        this.encounterMethod = encounterMethod;
        this.genderOffsets = genderOffsets;
        this.battlerPositionId = battlerPositionId;
        if (this.battlerPositionId === 0 || this.battlerPositionId === 2) {
            this.slideDirection = -1;
            this.playerSide = true;
        }
        else {
            this.slideDirection = 1;
            this.playerSide = false;
        }
        this.battleAssets = this.loader.loadImageToCanvas('battleAssets', asset_constants_1.FILE_BATTLE_HEIGHT, asset_constants_1.FILE_BATTLE_WIDTH);
        this.font = this.loader.loadImageToCanvas('font', asset_constants_1.FILE_FONT_HEIGHT, asset_constants_1.FILE_FONT_WIDTH);
        this.pokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (this.pokemonData.generation + 1), asset_constants_1.FILE_MON_HEIGHT[this.pokemonData.generation], asset_constants_1.FILE_MON_WIDTH);
        this.avatarAssets = this.loader.loadImageToCanvas('avatar', asset_constants_1.FILE_AVATAR_HEIGHT, asset_constants_1.FILE_AVATAR_WIDTH);
        this.pokemonTextCanvas = document.createElement('canvas');
        this.pokemonTextCanvas.height = asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT;
        this.pokemonTextCanvas.width = asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH;
        this.pokemonTextCtx = this.pokemonTextCanvas.getContext('2d');
        const healthX = this.playerSide ? 135 : 13;
        const healthY = this.playerSide ? 75 : 16;
        const playerHealthAdj = this.playerSide ? 8 : 0;
        this.battleGround = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 3 * battle_constants_1.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * battle_constants_1.BATTLE_SCENE_HEIGHT + 3 * battle_constants_1.BATTLE_ARENA_HEIGHT + battle_constants_1.ACTION_BOX_HEIGHT, battle_constants_1.BATTLE_SCENE_WIDTH, battle_constants_1.BATTLE_SCENE_HEIGHT, this.playerSide ? game_constants_1.GAME_WIDTH : -battle_constants_1.BATTLE_SCENE_WIDTH, this.playerSide ? 100 : 48);
        this.avatar = new game_object_1.GameObject(this.ctx, this.avatarAssets, asset_constants_1.ASSET_AVATAR_BATTLE_OFFSET, this.genderOffsets.ASSET_AVATAR_OFFSET, game_constants_1.AVATAR_BATTLE_WIDTH, game_constants_1.AVATAR_BATTLE_HEIGHT, this.playerSide ? game_constants_1.GAME_WIDTH + battle_constants_1.BATTLE_SCENE_WIDTH / 2 : -(battle_constants_1.BATTLE_SCENE_WIDTH + game_constants_1.AVATAR_BATTLE_WIDTH) / 2, this.playerSide ? battle_constants_1.BATTLE_ARENA_HEIGHT - game_constants_1.AVATAR_BATTLE_HEIGHT : 22);
        if (this.playerSide)
            this.avatar.setAnimation(true, 0, 0, game_constants_1.AVATAR_BATTLE_HEIGHT, 4);
        this.pokemonObject = new game_object_1.GameObject(this.ctx, this.pokemonSprite, this.pokemonData.xSource + (this.playerSide ? 2 * battle_constants_1.POKEMON_SIZE : 0), this.pokemonData.ySource, battle_constants_1.POKEMON_SIZE, battle_constants_1.POKEMON_SIZE, this.playerSide ? game_constants_1.GAME_WIDTH + (battle_constants_1.BATTLE_SCENE_WIDTH - battle_constants_1.POKEMON_SIZE) / 2 : -(battle_constants_1.BATTLE_SCENE_WIDTH + battle_constants_1.POKEMON_SIZE) / 2, this.playerSide ? battle_constants_1.BATTLE_ARENA_HEIGHT - battle_constants_1.POKEMON_SIZE : 22);
        this.pokemonHealthBox = new game_object_1.GameObject(this.ctx, this.battleAssets, this.playerSide ? 0 : asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET, this.playerSide ? asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH : asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH, asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT, this.playerSide ? game_constants_1.GAME_WIDTH : -asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH, healthY);
        this.pokemonHealthBar = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET, 48, 2, (this.playerSide ? game_constants_1.GAME_WIDTH : -asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH) + 39 + playerHealthAdj, healthY + 17);
        this.pokemonHealthText = new game_object_1.GameObject(this.ctx, this.pokemonTextCanvas, 0, 0, asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT, (this.playerSide ? game_constants_1.GAME_WIDTH : -asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH), healthY);
        this.pokemonXpBox = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET + 3 * 2, 64, 2, (this.playerSide ? game_constants_1.GAME_WIDTH : -asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH) + 39 + playerHealthAdj, healthY + 33);
        this.pokeball = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_POKEBALL_OFFSET_X, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 32, battle_constants_1.POKEBALL_SIZE, battle_constants_1.POKEBALL_SIZE, 25, 70);
        this.pokeball.setAnimation(false, 32, 0, battle_constants_1.POKEBALL_SIZE, 8);
    }
    animateHealthBar(delta, newHealth) {
        const currentHealth = this.pokemonData.health;
        if (currentHealth > newHealth) {
            this.pokemonData.health -= 16 * delta;
        }
        else {
            this.pokemonData.health = newHealth;
            return true;
        }
        return false;
    }
    animateXpBar(delta, newXp) {
        if (this.pokemonData.xp < newXp) {
            this.pokemonData.xp += 48 * delta;
            if (this.pokemonData.xp > this.pokemonData.xpNextLevel) {
                this.pokemonData.level++;
                this.pokemonData.xpCurLevel = mon_constants_1.LEVELS[this.pokemonData.growth_rate][this.pokemonData.level];
                this.pokemonData.xpNextLevel = mon_constants_1.LEVELS[this.pokemonData.growth_rate][this.pokemonData.level + 1];
                // this.levelGained = true;
            }
        }
        else {
            this.pokemonData.xp = newXp;
            return true;
        }
        return false;
    }
    drawHealthSlideIn(delta) {
        const speedHealth = 224;
        const healthX = this.playerSide ? 135 : 13;
        const playerHealthAdj = this.playerSide ? 8 : 0;
        this.pokemonHealthBox.animate(delta, speedHealth, this.slideDirection, 0, healthX - playerHealthAdj, this.pokemonHealthBox.y, false, true);
        const xpFrac = (this.pokemonData.xp - this.pokemonData.xpCurLevel) / (this.pokemonData.xpNextLevel - this.pokemonData.xpCurLevel);
        const xpBarWidth = (xpFrac * 48) << 0;
        const healthFrac = this.pokemonData.health / this.pokemonData.stats.hp;
        const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2 : 0;
        const healthBarWidth = (healthFrac * 48) << 0;
        this.pokemonHealthBar.updateSourcePosition(asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET + healthBarOffset);
        this.pokemonHealthBar.setWidth(healthBarWidth);
        this.pokemonHealthBar.animate(delta, speedHealth, this.slideDirection, 0, healthX + 39, this.pokemonHealthBar.y, false, true);
        this.pokemonXpBox.setWidth(xpBarWidth);
        this.pokemonXpBox.animate(delta, speedHealth, this.slideDirection, 0, healthX + 39 + playerHealthAdj, this.pokemonXpBox.y, false, true);
        let isFinished = false;
        if (this.pokemonTextCtx) {
            // Draw the pokemon name, gender, and level
            const nameText = this.pokemonData.pokemonName.toUpperCase() + ((this.pokemonData.gender) ? '#' : '^');
            const healthText = (this.pokemonData.health << 0).toString().padStart(3, '_') + '/' + this.pokemonData.stats.hp.toString().padStart(3, '_');
            this.pokemonTextCtx.clearRect(0, 0, asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT);
            (0, helper_1.drawText)(this.pokemonTextCtx, this.font, nameText, 1, 0, 6 + playerHealthAdj, 6);
            (0, helper_1.drawText)(this.pokemonTextCtx, this.font, this.pokemonData.level.toString(), 1, 0, 76 + playerHealthAdj, 6);
            if (this.playerSide) {
                (0, helper_1.drawText)(this.pokemonTextCtx, this.font, healthText, 1, 0, 59, 22);
            }
            this.pokemonHealthText.update(this.pokemonTextCanvas);
            isFinished = this.pokemonHealthText.animate(delta, speedHealth, this.slideDirection, 0, healthX - playerHealthAdj, this.pokemonHealthText.y, false, true);
        }
        return isFinished;
    }
    drawHealth() {
        this.pokemonHealthBox.render();
        this.pokemonHealthBar.render();
        this.pokemonXpBox.render();
        const playerHealthAdj = this.playerSide ? 8 : 0;
        const nameText = this.pokemonData.pokemonName.toUpperCase() + ((this.pokemonData.gender) ? '#' : '^');
        const healthText = (this.pokemonData.health << 0).toString().padStart(3, '_') + '/' + this.pokemonData.stats.hp.toString().padStart(3, '_');
        if (this.pokemonTextCtx) {
            (0, helper_1.drawText)(this.pokemonTextCtx, this.font, nameText, 1, 0, 6 + playerHealthAdj, 6);
            (0, helper_1.drawText)(this.pokemonTextCtx, this.font, this.pokemonData.level.toString(), 1, 0, 76 + playerHealthAdj, 6);
            if (this.playerSide) {
                (0, helper_1.drawText)(this.pokemonTextCtx, this.font, healthText, 1, 0, 59, 22);
            }
            this.pokemonHealthText.update(this.pokemonTextCanvas);
            this.pokemonHealthText.render();
        }
    }
    drawPokemonSlideIn(delta) {
        const speed = 176;
        const pokemonX = this.playerSide ? (battle_constants_1.BATTLE_SCENE_WIDTH - battle_constants_1.POKEMON_SIZE) / 2 : game_constants_1.GAME_WIDTH - (battle_constants_1.BATTLE_SCENE_WIDTH + battle_constants_1.POKEMON_SIZE) / 2;
        const groundsX = this.playerSide ? 0 : game_constants_1.GAME_WIDTH - battle_constants_1.BATTLE_SCENE_WIDTH;
        this.battleGround.animate(delta, speed, 1, 0, groundsX, this.battleGround.y, false, true);
        this.pokemonObject.darkenColor(0.9);
        const isFinished = this.pokemonObject.animate(delta, speed, this.slideDirection, 0, pokemonX, this.pokemonObject.y, false, true);
        if (isFinished) {
            this.pokemonObject.resetColor();
            this.pokemonObject.render();
        }
        return isFinished;
    }
    drawPokemonSlideDown(delta) {
        const speed = 176;
        const y = (this.playerSide ? battle_constants_1.BATTLE_ARENA_HEIGHT - battle_constants_1.POKEMON_SIZE : 22) + 53;
        // Draw battle grounds enemy pokemon
        this.pokemonObject.render();
        if (this.pokemonObject.y > 47) {
            this.pokemonObject.setHeight(28);
        }
        const isFinished = this.pokemonObject.animate(delta, speed, 0, 1, this.pokemonObject.x, y, false, false);
        this.battleGround.render();
        return isFinished;
    }
    drawPokeballThrow(delta) {
        const speedPokeball = 64;
        this.battleGround.render();
        let pokeballThrown = false;
        let pokemonAltFinished = false;
        let healthSlideFinished = false;
        // Calculate the x and y for the pokeball
        const pokeballPosition = this.pokeball.getPosition();
        const xPixelPokeball = pokeballPosition.x + delta * speedPokeball;
        const yPixelPokeball = 0.1 * Math.pow(xPixelPokeball, 2) - 7.5 * xPixelPokeball + 195;
        // Draw the pokeball
        this.pokeball.updateSourcePosition(asset_constants_1.ASSET_POKEBALL_OFFSET_X + this.pokemonData.pokeball * battle_constants_1.POKEBALL_SIZE, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 32);
        this.pokeball.setPosition(xPixelPokeball, yPixelPokeball);
        this.pokeball.render(delta);
        if (pokeballPosition.x > 60) {
            pokeballThrown = true;
        }
        if (pokeballThrown) {
            pokemonAltFinished = this.pokemonObject.scaleTo(delta, 2, 1, true);
            this.pokemonObject.setColor(254, 191, 246);
        }
        else {
            this.pokemonObject.setPosition(battle_constants_1.BATTLE_SCENE_WIDTH / 2, battle_constants_1.BATTLE_ARENA_HEIGHT);
            this.pokemonObject.setScale(0);
        }
        if (pokemonAltFinished) {
            this.pokemonObject.resetColor();
            this.pokemonObject.render();
            healthSlideFinished = this.drawHealthSlideIn(delta);
        }
        return healthSlideFinished;
    }
    drawPokemon() {
        this.battleGround.render();
        this.pokemonObject.render();
    }
    drawAvatarSlideIn(delta) {
        const speed = 176;
        const x = this.playerSide ? battle_constants_1.BATTLE_SCENE_WIDTH / 2 : game_constants_1.GAME_WIDTH - (battle_constants_1.BATTLE_SCENE_WIDTH + game_constants_1.AVATAR_BATTLE_WIDTH) / 2;
        const groundsX = this.playerSide ? 0 : game_constants_1.GAME_WIDTH - battle_constants_1.BATTLE_SCENE_WIDTH;
        // Draw battle grounds player pokemon
        this.battleGround.animate(delta, speed, this.slideDirection, 0, groundsX, this.battleGround.y, false, true);
        // Draw the player avatar
        const isFinished = this.avatar.animate(delta, speed, this.slideDirection, 0, x, this.avatar.y, false, true);
        return isFinished;
    }
    drawAnimatedAvatarSlideOut(delta) {
        const speed = 176;
        this.battleGround.render();
        const x1 = this.playerSide ? -16 : game_constants_1.GAME_WIDTH + 16;
        const x2 = this.playerSide ? -36 : game_constants_1.GAME_WIDTH + 36;
        const x3 = this.playerSide ? -game_constants_1.AVATAR_BATTLE_WIDTH : game_constants_1.GAME_WIDTH + game_constants_1.AVATAR_BATTLE_WIDTH;
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
    drawAvatarSlideOut(delta) {
        const speed = 176;
        const x = this.playerSide ? -game_constants_1.AVATAR_BATTLE_WIDTH : game_constants_1.GAME_WIDTH + game_constants_1.AVATAR_BATTLE_WIDTH;
        const isFinished = this.avatar.animate(delta, speed, this.slideDirection, 0, x, this.avatar.y, false, false);
        return isFinished;
    }
    drawAvatar() {
        this.battleGround.render();
        this.avatar.render();
    }
}
exports.Battler = Battler;
//# sourceMappingURL=battler.js.map