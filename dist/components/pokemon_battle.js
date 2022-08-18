"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokemonBattle = void 0;
const pokedex = __importStar(require("../pokedex.json"));
const moveIndex = __importStar(require("../move_index.json"));
const encounterTable = __importStar(require("../encounter_table.json"));
const game_object_1 = require("../utils/game_object");
const helper_1 = require("../utils/helper");
const keyboard_1 = require("../utils/keyboard");
class PokemonBattle {
    constructor(c, context, overlayCtx, loader, player, route, encounterMethod) {
        this.enemyPokemonStages = {
            attack: 0,
            defense: 0,
            specialDefense: 0,
            specialAttack: 0,
            speed: 0,
            accuracy: 0,
            evasion: 0,
        };
        this.playerPokemonStages = {
            attack: 0,
            defense: 0,
            specialDefense: 0,
            specialAttack: 0,
            speed: 0,
            accuracy: 0,
            evasion: 0,
        };
        this.bagSelected = 0;
        this.bagSwitchLeft = false;
        this.battleAction = 0;
        this.escapeAttempts = 0;
        this.battleMove = 0;
        this.battleMoveName = '';
        this.battleResultWin = false;
        this.previousElapsed = 0;
        this.delayStart = -1;
        this.battleStatus = 0;
        this.statusAfterFadeOut = 30 /* FadeIn */;
        this.statusAfterFadeIn = 31 /* Finished */;
        this.keyDown = false;
        this.newHealth = -1;
        this.newXp = -1;
        this.attackHalfWay = false;
        this.defenseHalfWay = false;
        this.enemyMoveDecided = false;
        this.moveEffectApplied = false;
        this.drawAvatarFinished = false;
        this.levelGained = false;
        this.writeSecondLine = false;
        this.animationCounter = 0;
        this.c = c;
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
        this.battleAssets = this.loader.loadImageToCanvas('battleAssets', this.c.ASSETS_BATTLE_HEIGHT, this.c.ASSETS_BATTLE_WIDTH);
        this.font = this.loader.loadImageToCanvas('font', this.c.ASSETS_FONT_HEIGHT, this.c.ASSETS_FONT_WIDTH);
        this.avatarAssets = this.loader.loadImageToCanvas('avatar', this.c.ASSETS_AVATAR_HEIGHT, this.c.ASSETS_AVATAR_WIDTH);
        // Get the playerData
        this.playerData = player.getPlayerData();
        // Get the current player pokemon from the PlayerData
        this.playerPokemon = this.playerData.pokemon[this.playerData.currentPokemon];
        // Get and generate the enemy pokemon and load necessary assets 
        this.enemyPokemon = this.init();
        this.loadGameObjects();
        // Create Canvas for the health texts
        this.playerHealthTextCanvas = document.createElement('canvas');
        this.playerHealthTextCanvas.height = this.c.ASSETS_PLAYER_HEALTH_HEIGHT;
        this.playerHealthTextCanvas.width = this.c.ASSETS_PLAYER_HEALTH_WIDTH;
        this.playerHealthTextCtx = this.playerHealthTextCanvas.getContext('2d');
        this.enemyHealthTextCanvas = document.createElement('canvas');
        this.enemyHealthTextCanvas.height = this.c.ASSETS_PLAYER_HEALTH_HEIGHT;
        this.enemyHealthTextCanvas.width = this.c.ASSETS_PLAYER_HEALTH_WIDTH;
        this.enemyHealthTextCtx = this.enemyHealthTextCanvas.getContext('2d');
        this.bagTextCanvas = document.createElement('canvas');
        this.bagTextCanvas.height = this.c.FONT_HEIGHT[0];
        this.bagTextCanvas.width = 64;
        this.bagTextCtx = this.bagTextCanvas.getContext('2d');
        console.log(this.enemyPokemon);
        console.log(this.playerPokemon);
    }
    init() {
        // Set the candidate pokemon 
        const candidates = this.encounterTable[this.route][this.encounterMethod.toString()];
        // Get the candidate ids taking in mind the encounter rates
        const candidateIds = [];
        for (const pokemonIndex in candidates) {
            candidateIds.push(...Array(candidates[pokemonIndex].rate).fill(parseInt(pokemonIndex)));
        }
        // Randomly choose the pokemon from candidateIds
        const pokemonId = (0, helper_1.randomFromArray)(candidateIds);
        // Generate enemy pokemon
        const enemyPokemon = (0, helper_1.generatePokemon)(this.c, this.pokedex[pokemonId.toString()], candidates[pokemonId].level, pokemonId, -1);
        // Set the necessary assets
        this.enemyPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (enemyPokemon.generation + 1), this.c.ASSETS_POKEMON_HEIGHT[enemyPokemon.generation], this.c.ASSETS_POKEMON_WIDTH);
        if (enemyPokemon.generation === this.playerPokemon.generation) {
            this.playerPokemonSprite = this.enemyPokemonSprite;
        }
        else {
            this.playerPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (this.playerPokemon.generation + 1), this.c.ASSETS_POKEMON_HEIGHT[this.playerPokemon.generation], this.c.ASSETS_POKEMON_WIDTH);
        }
        return enemyPokemon;
    }
    loadGameObjects() {
        this.battleBackground = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 4 * this.c.GAME_WIDTH, ((0.5 + this.encounterMethod / 4) << 0) * this.c.BATTLE_ARENA_HEIGHT, this.c.GAME_WIDTH, this.c.BATTLE_ARENA_HEIGHT, 0, 0);
        this.moveSelectorBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, 3 * this.c.BATTLE_ARENA_HEIGHT + 4 * this.c.BATTLE_SCENE_HEIGHT + this.c.ACTION_BOX_HEIGHT + this.c.ASSETS_PLAYER_HEALTH_HEIGHT, this.c.GAME_WIDTH, this.c.ACTION_BOX_HEIGHT, 0, this.c.BATTLE_ARENA_HEIGHT);
        this.battleDialogueBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, 3 * this.c.BATTLE_ARENA_HEIGHT, this.c.GAME_WIDTH, this.c.ACTION_BOX_HEIGHT, 0, this.c.BATTLE_ARENA_HEIGHT);
        this.actionSelectorBox = new game_object_1.GameObject(this.ctx, this.battleAssets, this.c.GAME_WIDTH, 3 * this.c.BATTLE_ARENA_HEIGHT, this.c.ACTION_BOX_WIDTH, this.c.ACTION_BOX_HEIGHT, this.c.GAME_WIDTH - this.c.ACTION_BOX_WIDTH, this.c.BATTLE_ARENA_HEIGHT);
        this.playerBattleGrounds = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 3 * this.c.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * this.c.BATTLE_SCENE_HEIGHT + 3 * this.c.BATTLE_ARENA_HEIGHT + this.c.ACTION_BOX_HEIGHT, this.c.BATTLE_SCENE_WIDTH, this.c.BATTLE_SCENE_HEIGHT, 240, 100);
        this.playerPokemonObject = new game_object_1.GameObject(this.ctx, this.playerPokemonSprite, this.playerPokemon.xSource + 2 * this.c.POKEMON_SIZE, this.playerPokemon.ySource, this.c.POKEMON_SIZE, this.c.POKEMON_SIZE, (this.c.BATTLE_SCENE_WIDTH - this.c.POKEMON_SIZE) / 2, this.c.BATTLE_ARENA_HEIGHT - this.c.POKEMON_SIZE);
        this.playerPokemonObject.setScale(0);
        this.playerPokemonHealthBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, this.c.ASSETS_HEALTH_OFFSET, this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_PLAYER_HEALTH_HEIGHT, this.c.GAME_WIDTH, 75);
        this.playerPokemonHealthBar = new game_object_1.GameObject(this.ctx, this.battleAssets, this.c.ASSETS_ENEMY_HEALTH_WIDTH + this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_HEALTH_OFFSET, 48, 2, this.c.GAME_WIDTH + 47, 75 + 17);
        this.playerPokemonHealthText = new game_object_1.GameObject(this.ctx, this.playerHealthTextCanvas, 0, 0, this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_PLAYER_HEALTH_HEIGHT, this.c.GAME_WIDTH, 75);
        this.playerPokemonXpBox = new game_object_1.GameObject(this.ctx, this.battleAssets, this.c.ASSETS_ENEMY_HEALTH_WIDTH + this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_HEALTH_OFFSET + 3 * 2, 64, 2, this.c.GAME_WIDTH + 31, 75 + 33);
        this.enemyBattleGrounds = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 3 * this.c.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * this.c.BATTLE_SCENE_HEIGHT + 3 * this.c.BATTLE_ARENA_HEIGHT + this.c.ACTION_BOX_HEIGHT, this.c.BATTLE_SCENE_WIDTH, this.c.BATTLE_SCENE_HEIGHT, -this.c.BATTLE_SCENE_WIDTH, 48);
        this.enemyPokemonObject = new game_object_1.GameObject(this.ctx, this.enemyPokemonSprite, this.enemyPokemon.xSource, this.enemyPokemon.ySource, this.c.POKEMON_SIZE, this.c.POKEMON_SIZE, -(this.c.BATTLE_SCENE_WIDTH + this.c.POKEMON_SIZE) / 2, 22);
        this.enemyPokemonHealthBox = new game_object_1.GameObject(this.ctx, this.battleAssets, this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_HEALTH_OFFSET, this.c.ASSETS_ENEMY_HEALTH_WIDTH, this.c.ASSETS_ENEMY_HEALTH_HEIGHT, -this.c.ASSETS_ENEMY_HEALTH_WIDTH, 16);
        this.enemyPokemonHealthBar = new game_object_1.GameObject(this.ctx, this.battleAssets, this.c.ASSETS_ENEMY_HEALTH_WIDTH + this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_HEALTH_OFFSET, 48, 2, -this.c.ASSETS_ENEMY_HEALTH_WIDTH + 39, 16 + 17);
        this.enemyPokemonHealthText = new game_object_1.GameObject(this.ctx, this.enemyHealthTextCanvas, 0, 0, this.c.ASSETS_ENEMY_HEALTH_WIDTH, this.c.ASSETS_ENEMY_HEALTH_HEIGHT, -this.c.ASSETS_ENEMY_HEALTH_WIDTH, 16);
        this.playerAvatar = new game_object_1.GameObject(this.ctx, this.avatarAssets, this.c.AVATAR_BATTLE_OFFSET, this.c.AVATAR_GENDER_OFFSET, this.c.AVATAR_BATTLE_WIDTH, this.c.AVATAR_BATTLE_HEIGHT, this.c.GAME_WIDTH + this.c.BATTLE_SCENE_WIDTH / 2, this.c.BATTLE_ARENA_HEIGHT - this.c.AVATAR_BATTLE_HEIGHT);
        this.playerAvatar.setAnimation(true, 0, 0, this.c.AVATAR_BATTLE_HEIGHT, 4);
        this.pokeball = new game_object_1.GameObject(this.ctx, this.battleAssets, this.c.POKEBALL_OFFSET_X, this.c.POKEBALL_OFFSET_Y + 37, this.c.POKEBALL_SIZE, this.c.POKEBALL_SIZE, 25, 70);
        this.pokeball.setAnimation(false, 32, 0, this.c.POKEBALL_SIZE, 8);
        this.bagBackground = new game_object_1.GameObject(this.ctx, this.battleAssets, this.c.ASSETS_BAG_BG_GENDER_OFFSET, this.c.ASSETS_BAG_OFFSET, this.c.GAME_WIDTH, this.c.GAME_HEIGHT, 0, 0);
        this.bag = new game_object_1.GameObject(this.ctx, this.battleAssets, 2 * this.c.GAME_WIDTH, this.c.ASSETS_BAG_OFFSET + this.c.ASSETS_BAG_GENDER_OFFSET, this.c.ASSETS_BAG_WIDTH, this.c.ASSETS_BAG_HEIGHT, 30, 6);
        this.bagText = new game_object_1.GameObject(this.ctx, this.bagTextCanvas, 0, 0, 64, this.c.FONT_HEIGHT[0], 32, 81);
        this.bagSelector = new game_object_1.GameObject(this.ctx, this.battleAssets, 2 * this.c.GAME_WIDTH + 5 * this.c.ASSETS_BAG_WIDTH + this.c.ASSETS_BAG_POK_SIZE, this.c.ASSETS_BAG_OFFSET + this.c.ASSETS_BAG_SEL_GENDER_OFFSET, this.c.ASSETS_BAG_SEL_WIDTH, this.c.ASSETS_BAG_SEL_HEIGHT, 42, 75);
        this.bagSwitchPokeball = new game_object_1.GameObject(this.ctx, this.battleAssets, 2 * this.c.GAME_WIDTH + 5 * this.c.ASSETS_BAG_WIDTH, this.c.ASSETS_BAG_OFFSET, this.c.ASSETS_BAG_POK_SIZE, this.c.ASSETS_BAG_POK_SIZE, 8, 80);
        this.bagSwitchPokeball.setAnimation(false, 32, 0, this.c.ASSETS_BAG_POK_SIZE, 7);
    }
    battle() {
        return __awaiter(this, void 0, void 0, function* () {
            // Start the tick loop with a canvas animation request
            window.requestAnimationFrame(this.tick.bind(this));
            // Wait for battle finished
            yield this.battleFinished();
            // Battle return object
            const battleData = {
                result: this.battleResultWin,
                pokemon: this.enemyPokemon,
            };
            // Clear battle canvas rendering context
            this.ctx.clearRect(0, 0, this.c.GAME_WIDTH, this.c.GAME_HEIGHT);
            // Return battleData
            return battleData;
        });
    }
    battleFinished() {
        return new Promise((resolve) => {
            // resolve if battle is finished
            if (this.battleStatus === 31 /* Finished */) {
                resolve();
            }
            else {
                // Check every 10 ms for battleFinished
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    yield this.battleFinished();
                    resolve();
                }), 10);
            }
        });
    }
    nextBattlePhase(battleStatus) {
        // Increment battleStatus;
        this.battleStatus = battleStatus;
    }
    renderDelay(duration) {
        if (this.delayStart === -1) {
            this.delayStart = this.previousElapsed;
        }
        else if (this.delayStart + duration <= this.previousElapsed) {
            return true;
        }
        return false;
    }
    resetDelay() {
        this.delayStart = -1;
    }
    tick(elapsed) {
        // Calculate the delta between the ticks
        let delta = (elapsed - this.previousElapsed) / 1000.0;
        delta = Math.min(delta, 0.25); // maximum delta of 250 ms
        this.previousElapsed = elapsed;
        if (this.battleStatus === 0 /* SlidePokemonIn */) {
            this.battleBackground.render();
            // Draw enemy pokemon with slide, with avatar, with next phase
            this.drawEnemyPokemon(delta, true, false);
            // Draw player avatar sliding in
            const isFinished = this.drawAvatar(delta, true, false);
            // Draw action box without the player action selector
            this.drawActionBox(false);
            if (isFinished) {
                this.nextBattlePhase(1 /* WriteAppearText */);
            }
        }
        else if (this.battleStatus === 1 /* WriteAppearText */) {
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
                this.nextBattlePhase(2 /* WriteGoText */);
            }
        }
        else if (this.battleStatus === 2 /* WriteGoText */) {
            // Write go text to dialogue box, with next phase
            const text = 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!';
            const isFinished = this.writeToDialogueBox(delta, 1, text, '', 0, 1);
            if (isFinished) {
                this.nextBattlePhase(3 /* ThrowPokemon */);
            }
        }
        else if (this.battleStatus === 3 /* ThrowPokemon */) {
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
            (0, helper_1.drawText)(this.c, this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);
            if (isFinished) {
                this.nextBattlePhase(4 /* PlayerActionSelect */);
            }
        }
        else if (this.battleStatus === 4 /* PlayerActionSelect */) {
            if (this.statusAfterFadeOut === 4 /* PlayerActionSelect */) {
                this.nextBattlePhase(30 /* FadeIn */);
                this.statusAfterFadeOut = 30 /* FadeIn */;
            }
            else if (this.statusAfterFadeOut === 30 /* FadeIn */) {
                this.statusAfterFadeIn = 31 /* Finished */;
            }
            // Detect keyboard press and increment/ decrement battleAction accordingly
            if (!this.keyDown) {
                if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.LEFT)) {
                    if (this.battleAction === 1 || this.battleAction === 3) {
                        this.battleAction--;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.RIGHT)) {
                    if (this.battleAction === 0 || this.battleAction === 2) {
                        this.battleAction++;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.UP)) {
                    if (this.battleAction === 2 || this.battleAction === 3) {
                        this.battleAction -= 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.DOWN)) {
                    if (this.battleAction === 0 || this.battleAction === 1) {
                        this.battleAction += 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
                    // On enter go to next battle phase
                    if (this.battleAction === 0) {
                        this.nextBattlePhase(10 /* PlayerSelectMove */);
                    }
                    else if (this.battleAction === 1) {
                        this.statusAfterFadeOut = 5 /* PlayerBag */;
                        this.statusAfterFadeIn = 5 /* PlayerBag */;
                        this.nextBattlePhase(29 /* FadeOut */);
                    }
                    else if (this.battleAction === 2) {
                        this.nextBattlePhase(7 /* PlayerChoosePokemon */);
                    }
                    else if (this.battleAction === 3) {
                        this.nextBattlePhase(8 /* PlayerRun */);
                    }
                    this.keyDown = true;
                }
            }
            this.battleBackground.render();
            // Draw enemy pokemon without slide
            this.drawEnemyPokemon(delta, false, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw enemy player without slide
            this.drawPlayerHealth(delta, false);
            // Draw player pokemon with slide, with throw
            this.drawThrowPlayerPokemon(delta);
            // Draw action box with player action selector
            this.drawActionBox(true);
            // Write action select text to dialogue box, without next phase
            (0, helper_1.drawText)(this.c, this.ctx, this.font, 'What should ', 0, 1, 16, 121);
            (0, helper_1.drawText)(this.c, this.ctx, this.font, this.playerPokemon.pokemonName.toUpperCase() + ' do?', 0, 1, 16, 121 + 16);
            // Set the offset and column for the battle action selector
            let xOffset = this.battleAction * 46;
            let yColumn = 0;
            if (this.battleAction === 2 || this.battleAction === 3) {
                xOffset = (this.battleAction - 2) * 46;
                yColumn = 1;
            }
            // Draw the action selector
            this.drawActionSelector(this.c.GAME_WIDTH - this.c.ACTION_BOX_WIDTH + 8 + xOffset, this.c.GAME_WIDTH - this.c.ACTION_BOX_WIDTH + 8 + 42 + xOffset, yColumn);
        }
        else if (this.battleStatus === 5 /* PlayerBag */) {
            if (this.statusAfterFadeOut === 5 /* PlayerBag */) {
                this.nextBattlePhase(30 /* FadeIn */);
                this.statusAfterFadeOut = 4 /* PlayerActionSelect */;
            }
            else if (this.statusAfterFadeOut === 4 /* PlayerActionSelect */) {
                this.statusAfterFadeIn = 4 /* PlayerActionSelect */;
            }
            this.bagBackground.render();
            this.ctx.fillStyle = '#F8E0A8';
            this.ctx.fillRect(112, 16, 120, 128);
            this.bagSwitchPokeball.render();
            this.bag.updateSourcePosition(2 * this.c.GAME_WIDTH + this.bagSelected * this.c.ASSETS_BAG_WIDTH, this.c.ASSETS_BAG_OFFSET + this.c.ASSETS_BAG_GENDER_OFFSET);
            this.bag.render();
            this.bagSelector.updateSourcePosition(2 * this.c.GAME_WIDTH + 5 * this.c.ASSETS_BAG_WIDTH + 16, this.c.ASSETS_BAG_OFFSET + this.c.ASSETS_BAG_SEL_GENDER_OFFSET + this.bagSelected * this.c.ASSETS_BAG_SEL_HEIGHT);
            this.bagSelector.render();
            const text = this.c.BAG_POCKETS[this.bagSelected];
            (0, helper_1.drawText)(this.c, this.ctx, this.font, text, 0, 2, 32, 81);
            // Detect keyboard press and increment/ decrement battleAction accordingly
            if (!this.keyDown) {
                if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.LEFT)) {
                    if (this.bagSelected > 0) {
                        this.bagSelected--;
                        this.bagSwitchLeft = true;
                        this.nextBattlePhase(6 /* BagSwitch */);
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.RIGHT)) {
                    if (this.bagSelected < 4) {
                        this.bagSelected++;
                        this.bagSwitchLeft = false;
                        this.nextBattlePhase(6 /* BagSwitch */);
                    }
                    this.keyDown = true;
                    // } else if (keyboard.isDown(keyboard.UP)) { 
                    //   this.keyDown = true;
                    // } else if (keyboard.isDown(keyboard.DOWN)) { 
                    //   this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
                    // On enter go to next battle phase
                    this.keyDown = true;
                }
            }
        }
        else if (this.battleStatus === 6 /* BagSwitch */) {
            const previousSelected = this.bagSwitchLeft ? this.bagSelected + 1 : this.bagSelected - 1;
            const limit = 64, speed = 196;
            let text = '', direction = 1;
            if (this.bagSwitchLeft) {
                text = this.c.BAG_POCKETS[this.bagSelected] + this.c.BAG_POCKETS[previousSelected];
            }
            else {
                text = this.c.BAG_POCKETS[previousSelected] + this.c.BAG_POCKETS[this.bagSelected];
                direction = -1;
            }
            this.bagBackground.render();
            this.ctx.fillStyle = '#F8E0A8';
            this.ctx.fillRect(112, 16, 120, Math.abs(this.animationCounter) / limit * 128);
            if (this.animationCounter > -20 && this.animationCounter < 20) {
                this.bag.updateSourcePosition(2 * this.c.GAME_WIDTH + previousSelected * this.c.ASSETS_BAG_WIDTH, this.c.ASSETS_BAG_OFFSET + this.c.ASSETS_BAG_GENDER_OFFSET);
                this.bag.animate(delta, 128, 0, 1, 30, 6 - direction * this.animationCounter / 6, true);
            }
            else {
                this.bag.updateSourcePosition(2 * this.c.GAME_WIDTH + this.bagSelected * this.c.ASSETS_BAG_WIDTH, this.c.ASSETS_BAG_OFFSET + this.c.ASSETS_BAG_GENDER_OFFSET);
                this.bag.animate(delta, 128, 0, 1, 30, 6, true);
            }
            this.bag.render();
            this.bagSelector.updateSourcePosition(2 * this.c.GAME_WIDTH + 5 * this.c.ASSETS_BAG_WIDTH + 16, this.c.ASSETS_BAG_OFFSET + this.c.ASSETS_BAG_SEL_GENDER_OFFSET + this.bagSelected * this.c.ASSETS_BAG_SEL_HEIGHT);
            this.bagSelector.render();
            this.bagSwitchPokeball.render(delta);
            if (this.bagTextCtx) {
                this.bagTextCtx.clearRect(0, 0, 64, this.c.FONT_HEIGHT[0]);
                const x = (!this.bagSwitchLeft) ? this.animationCounter : this.animationCounter - direction * limit;
                (0, helper_1.drawText)(this.c, this.bagTextCtx, this.font, text, 0, 2, (0.5 + x) << 0, 0);
            }
            this.bagText.update(this.bagTextCanvas);
            this.bagText.render();
            const items = this.playerData.inventory[this.bagSelected];
            const currentLine = (Math.abs(this.animationCounter) / limit * 128) / 16 << 0;
            const itemsToDisplay = Math.min(Object.keys(items).length + 1, currentLine);
            console.log(Object.keys(items));
            console.log(Object.values(items));
            for (let i = 0; i < itemsToDisplay; i++) {
                const x = i * 16;
                if (i === itemsToDisplay - 1) {
                    (0, helper_1.drawText)(this.c, this.ctx, this.font, 'CLOSE BAG', 0, 2, 112, 17 + x);
                }
                else {
                    (0, helper_1.drawText)(this.c, this.ctx, this.font, Object.keys(items)[i].toString().toUpperCase(), 0, 0, 112, 17 + x);
                    (0, helper_1.drawText)(this.c, this.ctx, this.font, 'x' + Object.values(items)[i].toString().padStart(2, '_'), 0, 0, 213, 17 + x);
                }
            }
            if (this.animationCounter > -limit && this.animationCounter < limit) {
                this.animationCounter += delta * direction * speed;
                if (this.animationCounter < -limit || this.animationCounter > limit) {
                    this.animationCounter = direction * limit;
                }
            }
            else {
                this.animationCounter = 0;
                this.bagSwitchPokeball.resetAnimation();
                this.nextBattlePhase(5 /* PlayerBag */);
            }
        }
        else if (this.battleStatus === 8 /* PlayerRun */) {
            this.escapeAttempts++;
            const escapeGuaranteed = this.playerPokemon.stats.speed >= this.enemyPokemon.stats.speed;
            const escapeOdds = (Math.floor(this.playerPokemon.stats.speed * 128 / this.enemyPokemon.stats.speed) + 30 * this.escapeAttempts) % 256;
            const escape = (0, helper_1.randomFromMinMax)(0, 255) < escapeOdds;
            if (escapeGuaranteed || escape) {
                console.log('Escape successfully');
                this.battleResultWin = false;
                this.nextBattlePhase(9 /* PlayerRunText */);
            }
            else {
                console.log('escaped failed');
                this.nextBattlePhase(17 /* EnemyMove */);
            }
        }
        else if (this.battleStatus === 9 /* PlayerRunText */) {
            const text1 = 'Got away safely!|';
            this.drawActionBox(false);
            const isFinished = this.writeToDialogueBox(delta, 1, text1, '', 0, 1);
            if (isFinished) {
                this.nextBattlePhase(29 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 10 /* PlayerSelectMove */) {
            // Draw the move selection box
            this.moveSelectorBox.render();
            // For every move option
            for (const moveNumber of [0, 1, 2, 3]) {
                // Get move from player
                const move = this.playerPokemon.moves[moveNumber];
                let moveText;
                // If move is not assigned print '-'
                if (this.playerPokemon.moves[moveNumber]) {
                    moveText = move.move;
                }
                else {
                    moveText = '-';
                }
                // Calculate x and y for the text
                const xText = (moveNumber === 1 || moveNumber === 3) ? 8 + 80 : 8;
                const yText = (moveNumber === 2 || moveNumber === 3) ? 121 + 16 : 121;
                // Draw text to action selection box
                (0, helper_1.drawText)(this.c, this.ctx, this.font, moveText.toUpperCase(), 0, 0, xText, yText);
            }
            // Current selected move details
            const moveDetails = this.playerPokemon.moves[this.battleMove];
            // Variables for printing move pp text
            const xText = 184;
            const yPpText = 121;
            // Draw move pp text
            const text = 'PP_' + moveDetails.pp.toString().padStart(2, '_') + '/' + moveDetails.ppMax.toString().padStart(2, '_');
            (0, helper_1.drawText)(this.c, this.ctx, this.font, text, 0, 0, xText, yPpText);
            // Variable for printing move type text
            const yTypeText = 121 + 16;
            // Draw move type text
            (0, helper_1.drawText)(this.c, this.ctx, this.font, moveDetails.type.toUpperCase(), 0, 0, xText, yTypeText);
            // Set the offset and column for the battle action selector
            let xOffset = this.battleMove * 80;
            let yColumn = 0;
            if (this.battleMove === 2 || this.battleMove === 3) {
                xOffset = (this.battleMove - 2) * 80;
                yColumn = 1;
            }
            // Draw the action selector
            this.drawActionSelector(8 + xOffset, 8 + 74 + xOffset, yColumn);
            // Detect keyboard press and increment/ decrement battleMove accordingly
            if (!this.keyDown) {
                if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.LEFT)) {
                    if ((this.battleMove === 1 && this.playerPokemon.moves[0]) || (this.battleMove === 3 && this.playerPokemon.moves[2])) {
                        this.battleMove--;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.RIGHT)) {
                    if ((this.battleMove === 0 && this.playerPokemon.moves[1]) || (this.battleMove === 2 && this.playerPokemon.moves[3])) {
                        this.battleMove++;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.UP)) {
                    if ((this.battleMove === 2 && this.playerPokemon.moves[0]) || (this.battleMove === 3 && this.playerPokemon.moves[1])) {
                        this.battleMove -= 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.DOWN)) {
                    if ((this.battleMove === 0 && this.playerPokemon.moves[2]) || (this.battleMove === 1 && this.playerPokemon.moves[3])) {
                        this.battleMove += 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
                    this.keyDown = true;
                    this.battleMoveName = this.playerPokemon.moves[this.battleMove].move;
                    this.playerPokemon.moves[this.battleMove].pp--;
                    console.log(this.playerPokemon.pokemonName + ' used ' + this.battleMoveName);
                    this.nextBattlePhase(11 /* PlayerMove */);
                }
            }
        }
        else if (this.battleStatus === 11 /* PlayerMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.writeMoveText(delta, moveData, true);
            if (isFinished) {
                const accuracyBase = moveData.accuracy;
                let isHit = true;
                if (accuracyBase) {
                    const stageAdjust = this.c.SPECIAL_STAGES[this.playerPokemonStages.accuracy - this.enemyPokemonStages.accuracy + 6];
                    const modifier = 1;
                    const accuracy = accuracyBase * stageAdjust * modifier;
                    isHit = (0, helper_1.randomFromMinMax)(1, 100) <= accuracy;
                }
                if (isHit) {
                    if (moveData.damage_class === 'status') {
                        this.nextBattlePhase(12 /* PlayerStatusMove */);
                    }
                    else if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(14 /* PlayerSpecialMove */);
                    }
                    else {
                        this.nextBattlePhase(15 /* PlayerDamageMove */);
                    }
                }
                else {
                    // Move missed
                }
            }
        }
        else if (this.battleStatus === 12 /* PlayerStatusMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusMove(delta, moveData, true);
            if (isFinished) {
                this.nextBattlePhase(13 /* PlayerStatusEffect */);
            }
        }
        else if (this.battleStatus === 14 /* PlayerSpecialMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.specialMove(delta, moveData, true);
            if (isFinished) {
                this.nextBattlePhase(15 /* PlayerDamageMove */);
            }
        }
        else if (this.battleStatus === 13 /* PlayerStatusEffect */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusEffect(delta, moveData, true);
            if (isFinished) {
                this.nextBattlePhase(17 /* EnemyMove */);
            }
        }
        else if (this.battleStatus === 15 /* PlayerDamageMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' used';
            const text2 = this.battleMoveName.toUpperCase() + '!';
            this.battleBackground.render();
            // Draw player pokemon attack
            const isFinished = this.damageMove(delta, moveData, true);
            // const isFinished = this.drawDefaultAttack(delta, true);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
            // Draw action box without player action selector
            this.drawActionBox(false);
            // Draw text to dialogue box
            (0, helper_1.drawText)(this.c, this.ctx, this.font, text1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.c, this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
            if (isFinished) {
                this.nextBattlePhase(16 /* EnemyTakesDamage */);
            }
        }
        else if (this.battleStatus === 16 /* EnemyTakesDamage */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.animateHealthBar(delta, true);
            this.drawEnemyHealth(delta, false);
            if (isFinished) {
                if (this.enemyPokemon.health <= 0) {
                    this.battleResultWin = true;
                    this.nextBattlePhase(23 /* EnemyFainted */);
                }
                else {
                    if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(13 /* PlayerStatusEffect */);
                    }
                    else {
                        this.nextBattlePhase(17 /* EnemyMove */);
                    }
                }
            }
        }
        else if (this.battleStatus === 17 /* EnemyMove */) {
            if (!this.enemyMoveDecided) {
                this.battleMoveName = (0, helper_1.randomFromArray)(this.enemyPokemon.moves).move;
                console.log('foo ' + this.enemyPokemon.pokemonName + ' used ' + this.battleMoveName);
                this.enemyMoveDecided = true;
            }
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.writeMoveText(delta, moveData, false);
            if (isFinished) {
                this.enemyMoveDecided = false;
                if (moveData.damage_class === 'status') {
                    this.nextBattlePhase(18 /* EnemyStatusMove */);
                }
                else if (moveData.damage_class === 'special') {
                    this.nextBattlePhase(20 /* EnemySpecialMove */);
                }
                else {
                    this.nextBattlePhase(21 /* EnemyDamageMove */);
                }
            }
        }
        else if (this.battleStatus === 18 /* EnemyStatusMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusMove(delta, moveData, false);
            if (isFinished) {
                this.nextBattlePhase(19 /* EnemyStatusEffect */);
            }
        }
        else if (this.battleStatus === 20 /* EnemySpecialMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.specialMove(delta, moveData, false);
            if (isFinished) {
                this.nextBattlePhase(21 /* EnemyDamageMove */);
            }
        }
        else if (this.battleStatus === 19 /* EnemyStatusEffect */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusEffect(delta, moveData, false);
            if (isFinished) {
                this.nextBattlePhase(4 /* PlayerActionSelect */);
            }
        }
        else if (this.battleStatus === 21 /* EnemyDamageMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const text1 = this.enemyPokemon.pokemonName.toUpperCase() + ' used';
            const text2 = this.battleMoveName.toUpperCase() + '!';
            this.battleBackground.render();
            // Draw player pokemon attack
            const isFinished = this.damageMove(delta, moveData, false);
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw action box without player action selector
            this.drawActionBox(false);
            // Draw text to dialogue box
            (0, helper_1.drawText)(this.c, this.ctx, this.font, text1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.c, this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
            if (isFinished) {
                this.nextBattlePhase(22 /* PlayerTakesDamage */);
            }
        }
        else if (this.battleStatus === 22 /* PlayerTakesDamage */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.animateHealthBar(delta, false);
            this.drawPlayerHealth(delta, false);
            if (isFinished) {
                if (this.playerPokemon.health <= 0) {
                    this.battleResultWin = false;
                    this.nextBattlePhase(31 /* Finished */);
                }
                else {
                    if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(19 /* EnemyStatusEffect */);
                    }
                    else {
                        this.nextBattlePhase(4 /* PlayerActionSelect */);
                    }
                }
            }
        }
        else if (this.battleStatus === 23 /* EnemyFainted */) {
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
            }
            else {
                const text1 = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase();
                const text2 = 'fainted!|';
                const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
                if (isFinished) {
                    this.nextBattlePhase(24 /* GainXpText */);
                }
            }
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
        }
        else if (this.battleStatus === 24 /* GainXpText */) {
            if (this.newXp === -1) {
                this.newXp = this.calculateXpGained() + this.playerPokemon.xp;
            }
            else {
                // Draw action box without player action selector
                this.drawActionBox(false);
                const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' gained';
                const text2 = this.newXp - this.playerPokemon.xp + ' EXP. Points!|';
                const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
                if (isFinished) {
                    this.nextBattlePhase(25 /* GainXp */);
                }
            }
        }
        else if (this.battleStatus === 25 /* GainXp */) {
            // Draw action box without player action selector
            this.drawActionBox(false);
            const isFinished = this.animateXpBar(delta);
            this.drawPlayerHealth(delta, false);
            if (isFinished) {
                if (this.levelGained) {
                    this.recalculatePlayerStats();
                    this.nextBattlePhase(26 /* LevelGained */);
                }
                else {
                    this.nextBattlePhase(29 /* FadeOut */);
                }
            }
        }
        else if (this.battleStatus === 26 /* LevelGained */) {
            // level gained animation to do!!!
            this.nextBattlePhase(27 /* LevelGainedText */);
        }
        else if (this.battleStatus === 27 /* LevelGainedText */) {
            const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' grew to';
            const text2 = 'LV. ' + this.playerPokemon.level + '!';
            this.drawPlayerHealth(delta, false);
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                const newMoveAdded = this.addNewLevelMoves();
                if (newMoveAdded) {
                    this.nextBattlePhase(28 /* NewMoveText */);
                }
                else {
                    this.nextBattlePhase(29 /* FadeOut */);
                }
            }
        }
        else if (this.battleStatus === 28 /* NewMoveText */) {
            const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' learned';
            const text2 = this.playerPokemon.moves[this.playerPokemon.moves.length - 1].move.toUpperCase() + '!';
            this.drawActionBox(false);
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.nextBattlePhase(29 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 29 /* FadeOut */) {
            const delayFinished = this.renderDelay(100);
            if (delayFinished) {
                const speed = 3;
                if (this.animationCounter >= 1) {
                    this.animationCounter = 0;
                    this.resetDelay();
                    this.nextBattlePhase(this.statusAfterFadeOut);
                }
                else {
                    this.overlayCtx.globalAlpha = this.animationCounter;
                    this.overlayCtx.fillStyle = '#000000';
                    this.overlayCtx.clearRect(0, 0, this.c.GAME_WIDTH, this.c.GAME_HEIGHT);
                    this.overlayCtx.fillRect(0, 0, this.c.GAME_WIDTH, this.c.GAME_HEIGHT);
                    this.overlayCtx.globalAlpha = 1;
                    this.animationCounter += delta * speed;
                }
            }
        }
        else if (this.battleStatus === 30 /* FadeIn */) {
            const delayFinished = this.renderDelay(100);
            if (delayFinished) {
                const speed = 3;
                if (this.animationCounter >= 1) {
                    this.animationCounter = 0;
                    this.resetDelay();
                    this.nextBattlePhase(this.statusAfterFadeIn);
                }
                else {
                    this.overlayCtx.globalAlpha = 1 - this.animationCounter;
                    this.overlayCtx.fillStyle = '#000000';
                    if (this.statusAfterFadeIn === 31 /* Finished */) {
                        this.ctx.clearRect(0, 0, this.c.GAME_WIDTH, this.c.GAME_HEIGHT);
                    }
                    this.overlayCtx.clearRect(0, 0, this.c.GAME_WIDTH, this.c.GAME_HEIGHT);
                    this.overlayCtx.fillRect(0, 0, this.c.GAME_WIDTH, this.c.GAME_HEIGHT);
                    this.overlayCtx.globalAlpha = 1;
                    this.animationCounter += delta * speed;
                }
            }
        }
        // Reset keyDown variable if not down anymore
        if (!keyboard_1.keyboard.isDown(keyboard_1.keyboard.LEFT) && !keyboard_1.keyboard.isDown(keyboard_1.keyboard.RIGHT) &&
            !keyboard_1.keyboard.isDown(keyboard_1.keyboard.UP) && !keyboard_1.keyboard.isDown(keyboard_1.keyboard.DOWN) &&
            !keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
            this.keyDown = false;
        }
        if (this.battleStatus !== 31 /* Finished */) {
            // If battle is not finished request new animation frame
            window.requestAnimationFrame(this.tick.bind(this));
        }
    }
    calculateMoveDamage(playerAttack, moveData) {
        const attacker = playerAttack ? this.playerPokemon : this.enemyPokemon;
        const defender = playerAttack ? this.enemyPokemon : this.playerPokemon;
        let defenseStat, attackStat, attackerStMp, defenderStMp;
        if (moveData.damage_class === 'physical') {
            attackStat = attacker.stats.attack;
            defenseStat = defender.stats.defense;
            if (playerAttack) {
                attackerStMp = this.c.NORMAL_STAGES[this.playerPokemonStages.attack + 6];
                defenderStMp = this.c.NORMAL_STAGES[this.enemyPokemonStages.defense + 6];
            }
            else {
                attackerStMp = this.c.NORMAL_STAGES[this.enemyPokemonStages.defense + 6];
                defenderStMp = this.c.NORMAL_STAGES[this.playerPokemonStages.attack + 6];
            }
        }
        else {
            attackStat = attacker.stats.specialAttack;
            defenseStat = defender.stats.specialDefense;
            if (playerAttack) {
                attackerStMp = this.c.NORMAL_STAGES[this.playerPokemonStages.specialAttack + 6];
                defenderStMp = this.c.NORMAL_STAGES[this.enemyPokemonStages.specialDefense + 6];
            }
            else {
                attackerStMp = this.c.NORMAL_STAGES[this.enemyPokemonStages.specialDefense + 6];
                defenderStMp = this.c.NORMAL_STAGES[this.playerPokemonStages.specialAttack + 6];
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
            type = type * this.getTypeEffectiveness(defender.types[i].type, moveData.type);
        }
        // Get a random value between 85-100 inclusive
        const random = (0, helper_1.randomFromMinMax)(85, 100);
        // Calculate the damage
        if (power) {
            const damage = (((((2 * level) / 5 + 2) * power * ((attackStat * attackerStMp) / (defenseStat * defenderStMp))) / 50) * burn * screen * targets * weather * ff + 2) * crit * wbr * charge * hh * stab * type * random;
            return (damage / 100) << 0;
        }
        return 0;
    }
    calculateXpGained() {
        const xpShare = 1; // if no xp-share then number of not fainted pokemon used by player
        const luckyEgg = 1; // 1 is no lucky egg, 1.5 if lucky egg
        const pokemonOrigin = 1; // 1 if wild, 1.5 if trainer
        const tradedPokemon = 1; // 1.5 if pokemon was gained in domestic trade
        const xp = (this.enemyPokemon.xpBase * this.enemyPokemon.level) / (7 * xpShare) * luckyEgg * pokemonOrigin * tradedPokemon;
        return xp;
    }
    recalculatePlayerStats() {
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
        };
    }
    addNewLevelMoves() {
        const pokedexEntry = this.pokedex[this.playerPokemon.pokemonId.toString()];
        for (let i = 0; i < pokedexEntry.moves.length; i++) {
            const move = pokedexEntry.moves[i];
            const moveDetails = moveIndex[move.move];
            // Loop through the group details
            for (let j = 0; j < move.version_group_details.length; j++) {
                const details = move.version_group_details[j];
                // If method is level-up and level is the same level
                if (details.move_learn_method === 'level-up' && details.level_learned_at === this.playerPokemon.level) {
                    // Push new learned move to pokemon moves
                    this.playerPokemon.moves.push({
                        move: move.move,
                        type: moveDetails.type,
                        pp: moveDetails.pp,
                        ppMax: moveDetails.pp,
                    });
                    // Remove extra move if
                    if (this.playerPokemon.moves.length > 4) {
                        this.playerPokemon.moves.shift();
                    }
                    return true;
                }
            }
        }
        return false;
    }
    getTypeEffectiveness(defenderType, moveType) {
        return this.c.TYPES_EFFECTIVENESS[18 * ((this.c.TYPES.indexOf(moveType) / 18) << 0) + this.c.TYPES.indexOf(defenderType)];
    }
    damageMove(delta, moveData, playerAttack) {
        let isFinished = false;
        // if (moveData.name === 'tackle') {
        //   isFinished = this.drawDefaultAttack(delta, playerAttack);
        // } else if (moveData.name === 'mud-slap') {
        isFinished = this.drawDefaultAttack(delta, playerAttack);
        if (this.newHealth === -1) {
            const currentHealth = playerAttack ? this.enemyPokemon.health : this.playerPokemon.health;
            this.newHealth = Math.max(currentHealth - this.calculateMoveDamage(playerAttack, moveData), 0);
        }
        if (isFinished) {
            return true;
        }
        return false;
    }
    statusMove(delta, moveData, playerAttack) {
        // const move = moveData.name;
        let isFinished = false;
        // if (move === 'growl') {
        // } else if (move === 'string-shot') {
        // }
        isFinished = this.renderDelay(800);
        if (isFinished) {
            this.moveEffectApplied = false;
            this.resetDelay();
            return true;
        }
        return false;
    }
    specialMove(delta, moveData, playerAttack) {
        // const move = moveData.name;
        let isFinished = false;
        // if (move === 'mud-slap') {
        // }
        isFinished = this.renderDelay(800);
        if (isFinished) {
            this.moveEffectApplied = false;
            this.resetDelay();
            return true;
        }
        return false;
    }
    statusEffect(delta, moveData, playerAttack) {
        let isFinished = false, text1 = '', text2 = '';
        let pokemonName;
        if (playerAttack) {
            pokemonName = this.enemyPokemon.pokemonName;
            if (!this.moveEffectApplied) {
                this.moveEffectApplied = true;
                if (moveData.target === 'selected-pokemon' || moveData.target === 'all-opponents') {
                    this.enemyPokemonStages[moveData.stat_changes[0].stat] += moveData.stat_changes[0].change;
                }
                else if (moveData.target === 'user') {
                    this.playerPokemonStages[moveData.stat_changes[0].stat] += moveData.stat_changes[0].change;
                }
            }
        }
        else {
            pokemonName = this.playerPokemon.pokemonName;
            if (!this.moveEffectApplied) {
                this.moveEffectApplied = true;
                if (moveData.target === 'selected-pokemon' || moveData.target === 'all-opponents') {
                    this.playerPokemonStages[moveData.stat_changes[0].stat] += moveData.stat_changes[0].change;
                }
                else if (moveData.target === 'user') {
                    this.enemyPokemonStages[moveData.stat_changes[0].stat] += moveData.stat_changes[0].change;
                }
            }
        }
        text1 = pokemonName.toUpperCase() + '\'s ' + moveData.stat_changes[0].stat.toUpperCase();
        if (moveData.stat_changes[0].change === -1) {
            text2 = 'fell!';
        }
        else if (moveData.stat_changes[0].change === -2) {
            text2 = 'harshly fell!';
        }
        else if (moveData.stat_changes[0].change === -3) {
            text2 = 'severely fell!';
        }
        else if (moveData.stat_changes[0].change === 1) {
            text2 = 'rose!';
        }
        else if (moveData.stat_changes[0].change === 2) {
            text2 = 'sharply rose!';
        }
        else if (moveData.stat_changes[0].change === 3) {
            text2 = 'rose drastically!';
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
    writeMoveText(delta, moveData, playerAttack) {
        let pokemonName;
        if (playerAttack) {
            pokemonName = this.playerPokemon.pokemonName;
        }
        else {
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
    animateHealthBar(delta, playerAttack) {
        const currentHealth = playerAttack ? this.enemyPokemon.health : this.playerPokemon.health;
        if (currentHealth > this.newHealth) {
            if (playerAttack) {
                this.enemyPokemon.health -= 16 * delta;
            }
            else {
                this.playerPokemon.health -= 16 * delta;
            }
        }
        else {
            if (playerAttack) {
                this.enemyPokemon.health = this.newHealth;
            }
            else {
                this.playerPokemon.health = this.newHealth;
            }
            this.newHealth = -1;
            return true;
        }
        return false;
    }
    animateXpBar(delta) {
        const currentXp = this.playerPokemon.xp;
        if (currentXp < this.newXp) {
            this.playerPokemon.xp += 48 * delta;
            if (this.playerPokemon.xp > this.playerPokemon.xpNextLevel) {
                this.playerPokemon.level++;
                this.playerPokemon.xpCurLevel = this.c.LEVELS[this.playerPokemon.growth_rate][this.playerPokemon.level];
                this.playerPokemon.xpNextLevel = this.c.LEVELS[this.playerPokemon.growth_rate][this.playerPokemon.level + 1];
                this.levelGained = true;
            }
        }
        else {
            this.playerPokemon.xp = this.newXp;
            this.newXp = -1;
            return true;
        }
        return false;
    }
    drawThrowPlayerPokemon(delta) {
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
            const yPixelPokeball = 0.1 * Math.pow(xPixelPokeball, 2) - 7.5 * xPixelPokeball + 195;
            // Draw the pokeball
            this.pokeball.updateSourcePosition(this.c.POKEBALL_OFFSET_X + this.playerPokemon.pokeball * this.c.POKEBALL_SIZE, this.c.POKEBALL_OFFSET_Y + 37);
            this.pokeball.setPosition(xPixelPokeball, yPixelPokeball);
            this.pokeball.render(delta);
            if (pokeballPosition.x > 60) {
                pokeballThrown = true;
            }
        }
        // Pokemon appear animation
        if (pokeballThrown) {
            // Draw pink appearing pokemon
            pokemonAltFinished = this.playerPokemonObject.scaleTo(delta, 2, 1);
            if (!pokemonAltFinished) {
                this.playerPokemonObject.setColor(254, 191, 246);
            }
        }
        if (pokemonAltFinished) {
            // Draw pokemon
            this.playerPokemonObject.resetColor();
            this.playerPokemonObject.render();
            // Draw player health
            healthSlideFinished = this.drawPlayerHealth(delta, true);
        }
        // Player slide out animation
        this.drawAvatarFinished = this.drawAvatar(delta, false, true);
        return healthSlideFinished;
    }
    drawDefaultAttack(delta, playerAttack) {
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
            xPosAttacker = (this.c.BATTLE_SCENE_WIDTH - this.c.POKEMON_SIZE) / 2;
            yPosAttacker = this.c.BATTLE_ARENA_HEIGHT - this.c.POKEMON_SIZE;
            xPosDefender = this.c.GAME_WIDTH - (this.c.BATTLE_SCENE_WIDTH + this.c.POKEMON_SIZE) / 2;
            yPosDefender = 22;
        }
        else {
            attacker = this.enemyPokemonObject;
            defender = this.playerPokemonObject;
            xPosDefender = (this.c.BATTLE_SCENE_WIDTH - this.c.POKEMON_SIZE) / 2;
            yPosDefender = this.c.BATTLE_ARENA_HEIGHT - this.c.POKEMON_SIZE;
            xPosAttacker = this.c.GAME_WIDTH - (this.c.BATTLE_SCENE_WIDTH + this.c.POKEMON_SIZE) / 2;
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
        }
        else if (this.attackHalfWay) {
            backwardFinished = attacker.animate(delta, speed, -direction, 0, xPosAttacker, yPosAttacker, true);
        }
        if (forwardFinished) {
            this.attackHalfWay = true;
        }
        if (backwardFinished) {
            this.attackHalfWay = false;
        }
        if (this.attackHalfWay && !this.defenseHalfWay) {
            forwardFinished2 = defender.animate(delta, speed, direction, 0, xPosDefender + direction * 10, yPosDefender, true);
        }
        else if (this.defenseHalfWay) {
            backwardFinished2 = defender.animate(delta, speed, -direction, 0, xPosDefender, yPosDefender, true);
        }
        else {
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
    drawPlayerHealth(delta, slideIn) {
        const speedHealth = 224;
        // Draw player health box
        if (slideIn) {
            this.playerPokemonHealthBox.animate(delta, speedHealth, -1, 0, 127, 75, true);
        }
        else {
            this.playerPokemonHealthBox.render();
        }
        // Calculate variables for drawing the xp bar
        const xpFrac = (this.playerPokemon.xp - this.playerPokemon.xpCurLevel) / (this.playerPokemon.xpNextLevel - this.playerPokemon.xpCurLevel);
        const xpBarWidth = (xpFrac * 48) << 0;
        // Calculate variables for drawing the health bar
        const healthFrac = this.playerPokemon.health / this.playerPokemon.stats.hp;
        const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2 : 0;
        const healthBarWidth = (healthFrac * 48) << 0;
        // Draw player health and xp bar
        this.playerPokemonXpBox.setWidth(xpBarWidth);
        this.playerPokemonHealthBar.updateSourcePosition(this.c.ASSETS_ENEMY_HEALTH_WIDTH + this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_HEALTH_OFFSET + healthBarOffset);
        this.playerPokemonHealthBar.setWidth(healthBarWidth);
        if (slideIn) {
            this.playerPokemonXpBox.animate(delta, speedHealth, -1, 0, 127 + 31, 75 + 33, true);
            this.playerPokemonHealthBar.animate(delta, speedHealth, -1, 0, 127 + 47, 75 + 17, true);
        }
        else {
            this.playerPokemonXpBox.render();
            this.playerPokemonHealthBar.render();
        }
        if (this.playerHealthTextCtx) {
            // Draw the pokemon name, gender, and level
            const nameText = this.playerPokemon.pokemonName.toUpperCase() + ((this.playerPokemon.gender) ? '#' : '^');
            const healthText = (this.playerPokemon.health << 0).toString().padStart(3, '_') + '/' + this.playerPokemon.stats.hp.toString().padStart(3, '_');
            this.playerHealthTextCtx.clearRect(0, 0, this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_PLAYER_HEALTH_HEIGHT);
            (0, helper_1.drawText)(this.c, this.playerHealthTextCtx, this.font, nameText, 1, 0, 14, 6);
            (0, helper_1.drawText)(this.c, this.playerHealthTextCtx, this.font, this.playerPokemon.level.toString(), 1, 0, 84, 6);
            (0, helper_1.drawText)(this.c, this.playerHealthTextCtx, this.font, healthText, 1, 0, 59, 22);
            this.playerPokemonHealthText.update(this.playerHealthTextCanvas);
            if (slideIn) {
                const isFinished = this.playerPokemonHealthText.animate(delta, speedHealth, -1, 0, 127, 75, true);
                return isFinished;
            }
            else {
                this.playerPokemonHealthText.render();
            }
        }
        return true;
    }
    drawEnemyHealth(delta, slideIn) {
        const speedHealth = 224;
        // Draw enemy health box
        this.enemyPokemonHealthBox.animate(delta, speedHealth, 1, 0, 13, 16, true);
        // Calculate variables for drawing the health bar
        const healthFrac = this.enemyPokemon.health / this.enemyPokemon.stats.hp;
        const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2 : 0;
        const healthBarWidth = (healthFrac * 48) << 0;
        // Draw enemy health bar
        this.playerPokemonHealthBar.updateSourcePosition(this.c.ASSETS_ENEMY_HEALTH_WIDTH + this.c.ASSETS_PLAYER_HEALTH_WIDTH, this.c.ASSETS_HEALTH_OFFSET + healthBarOffset);
        this.enemyPokemonHealthBar.setWidth(healthBarWidth);
        if (slideIn) {
            this.enemyPokemonHealthBar.animate(delta, speedHealth, 1, 0, 13 + 39, 16 + 17, true);
        }
        else {
            this.enemyPokemonHealthBar.render();
        }
        // Draw the pokemon name, gender, and level
        if (this.enemyHealthTextCtx) {
            const nameText = this.enemyPokemon.pokemonName.toUpperCase() + ((this.enemyPokemon.gender) ? '#' : '^');
            (0, helper_1.drawText)(this.c, this.enemyHealthTextCtx, this.font, nameText, 1, 0, 6, 6);
            (0, helper_1.drawText)(this.c, this.enemyHealthTextCtx, this.font, this.enemyPokemon.level.toString(), 1, 0, 76, 6);
            this.enemyPokemonHealthText.update(this.enemyHealthTextCanvas);
            if (slideIn) {
                this.enemyPokemonHealthText.animate(delta, speedHealth, 1, 0, 13, 16, true);
            }
            else {
                this.enemyPokemonHealthText.render();
            }
        }
    }
    drawAvatar(delta, slideIn, slideOut) {
        const speed = 176;
        let isFinished = false;
        if (slideIn) {
            // Draw battle grounds player pokemon
            this.playerBattleGrounds.animate(delta, speed, -1, 0, 0, 100, true);
            // Draw the player avatar
            isFinished = this.playerAvatar.animate(delta, speed, -1, 0, this.c.BATTLE_SCENE_WIDTH / 2, this.c.BATTLE_ARENA_HEIGHT - this.c.AVATAR_BATTLE_HEIGHT, true);
        }
        else if (slideOut) {
            // Next animation frame and animate
            this.playerAvatar.animationTrigger(1);
            const isFinishedFirstSprite = this.playerAvatar.animate(delta, speed, -1, 0, -16, this.c.BATTLE_ARENA_HEIGHT - this.c.AVATAR_BATTLE_HEIGHT, false);
            // Next animation frame and animate
            if (isFinishedFirstSprite) {
                this.playerAvatar.animationTrigger(2);
                isFinished = this.playerAvatar.animate(delta, speed, -1, 0, -36, this.c.BATTLE_ARENA_HEIGHT - this.c.AVATAR_BATTLE_HEIGHT, false);
            }
            // Next animation frame and animate
            if (isFinished) {
                this.playerAvatar.animationTrigger(3);
                this.playerAvatar.animate(delta, speed, -1, 0, -this.c.AVATAR_BATTLE_WIDTH, this.c.BATTLE_ARENA_HEIGHT - this.c.AVATAR_BATTLE_HEIGHT, false);
            }
        }
        else {
            // Draw battle grounds player pokemon
            this.playerBattleGrounds.render();
            // Draw the player avatar
            this.playerAvatar.render();
        }
        return isFinished;
    }
    drawEnemyPokemon(delta, slideIn, slideOut) {
        const speed = 176;
        const x = this.c.GAME_WIDTH - (this.c.BATTLE_SCENE_WIDTH + this.c.POKEMON_SIZE) / 2;
        const y = 22;
        if (slideIn) {
            // Draw battle grounds enemy pokemon
            this.enemyBattleGrounds.animate(delta, speed, 1, 0, this.c.GAME_WIDTH - this.c.BATTLE_SCENE_WIDTH, 48, true);
            // Darken enemy pokemon when sliding in
            this.enemyPokemonObject.darkenColor(0.9);
            // Draw enemy pokemon
            const isFinished = this.enemyPokemonObject.animate(delta, speed, 1, 0, x, y, true);
            if (isFinished) {
                this.enemyPokemonObject.resetColor();
                this.enemyPokemonObject.render();
                return true;
            }
        }
        else if (slideOut) {
            // Draw battle grounds enemy pokemon
            this.enemyBattleGrounds.render();
            if (this.enemyPokemonObject.y > 47) {
                this.enemyPokemonObject.setHeight(28);
            }
            const isFinished = this.enemyPokemonObject.animate(delta, speed, 0, 1, x, 75, false);
            if (isFinished) {
                return true;
            }
        }
        else {
            // Draw battle grounds enemy pokemon
            this.enemyBattleGrounds.render();
            this.enemyPokemonObject.render();
        }
        return false;
    }
    writeToDialogueBox(delta, delayAfter, textCol1, textCol2, fontsize, fontColor) {
        const speed = 48;
        const i = (this.animationCounter + delta * speed) << 0;
        if (!this.writeSecondLine) {
            const yText = 121;
            const textToDisplay = textCol1.slice(0, i);
            // Draw the text
            (0, helper_1.drawText)(this.c, this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
            if (i < textCol1.length) {
                this.animationCounter += delta * speed;
            }
            else {
                this.animationCounter = 0;
                this.writeSecondLine = true;
            }
        }
        else {
            const yText = 121 + 16;
            const textToDisplay = textCol2.slice(0, i);
            // Draw the text
            (0, helper_1.drawText)(this.c, this.ctx, this.font, textCol1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.c, this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
            if (i < textCol2.length + delayAfter * speed * 0.8) {
                this.animationCounter += delta * speed;
            }
            else {
                this.animationCounter = 0;
                this.writeSecondLine = false;
                return true;
            }
        }
        return false;
    }
    drawActionBox(actionChoice) {
        // Draw the battle dialogue box
        this.battleDialogueBox.render();
        // Draw the player action choice box
        if (actionChoice) {
            this.actionSelectorBox.render();
        }
    }
    drawActionSelector(xStart, xEnd, column) {
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
exports.PokemonBattle = PokemonBattle;
//# sourceMappingURL=pokemon_battle.js.map