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
const pokedex = __importStar(require("../data/pokedex.json"));
const moveIndex = __importStar(require("../data/move_index.json"));
const itemIndex = __importStar(require("../data/item_index.json"));
const encounterTable = __importStar(require("../data/encounter_table.json"));
const game_object_1 = require("../utils/game_object");
const helper_1 = require("../utils/helper");
const keyboard_1 = require("../utils/keyboard");
const battle_constants_1 = require("../constants/battle_constants");
const game_constants_1 = require("../constants/game_constants");
const bag_constants_1 = require("../constants/bag_constants");
const items_constants_1 = require("../constants/items_constants");
const mon_constants_1 = require("../constants/mon_constants");
const asset_constants_1 = require("../constants/asset_constants");
class PokemonBattle {
    constructor(context, overlayCtx, loader, player, route, encounterMethod) {
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
        this.battleAction = 0;
        this.escapeAttempts = 0;
        this.battleMove = 0;
        this.battleMoveName = '';
        this.battleResultWin = false;
        this.turnsPassed = -1;
        this.playerMove = true;
        this.bagSelected = 0;
        this.bagSwitchLeft = false;
        this.bagSelectedItem = 0;
        this.bagSelectedOffset = 0;
        this.selectedConfirm = true;
        this.previousElapsed = 0;
        this.delayStart = -1;
        this.battleStatus = 0;
        this.statusAfterFadeOut = 40 /* FadeIn */;
        this.statusAfterFadeIn = 42 /* Finished */;
        this.keyDown = false;
        this.newHealth = -1;
        this.newXp = -1;
        this.attackHalfWay = false;
        this.defenseHalfWay = false;
        this.enemyMoveDecided = false;
        this.moveEffectApplied = false;
        this.levelGained = false;
        this.writeSecondLine = false;
        this.animationCounter = 0;
        this.shakes = 0;
        this.shakeCheckDone = false;
        // Set the loader to the supplied
        this.loader = loader;
        // Get the pokedex and encounterTable
        this.pokedex = pokedex;
        this.moveIndex = moveIndex;
        this.itemIndex = itemIndex;
        this.encounterTable = encounterTable;
        this.player = player;
        // Set the supplied variables
        this.encounterMethod = encounterMethod;
        this.route = route;
        this.ctx = context;
        this.overlayCtx = overlayCtx;
        // Set the necessary assets
        this.battleAssets = this.loader.loadImageToCanvas('battleAssets', asset_constants_1.FILE_BATTLE_HEIGHT, asset_constants_1.FILE_BATTLE_WIDTH);
        this.font = this.loader.loadImageToCanvas('font', asset_constants_1.FILE_FONT_HEIGHT, asset_constants_1.FILE_FONT_WIDTH);
        this.avatarAssets = this.loader.loadImageToCanvas('avatar', asset_constants_1.FILE_AVATAR_HEIGHT, asset_constants_1.FILE_AVATAR_WIDTH);
        // Get the playerData and accountData
        this.playerData = player.getPlayerData();
        this.accountData = player.getAccountData();
        this.genderOffsets = {
            ASSET_AVATAR_OFFSET: 0,
            ASSET_BAG_BG_OFFSET: 0,
            ASSET_BAG_OFFSET: 0,
            ASSET_BAG_SEL_OFFSET: 0,
        };
        this.setGenderVariables(this.accountData.male);
        // Get the current player pokemon from the PlayerData
        this.playerPokemon = this.playerData.pokemon[this.playerData.currentPokemon];
        // Get and generate the enemy pokemon and load necessary assets 
        this.enemyPokemon = this.init();
        this.loadGameObjects();
        // Create Canvas for the health texts
        this.playerHealthTextCanvas = document.createElement('canvas');
        this.playerHealthTextCanvas.height = asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT;
        this.playerHealthTextCanvas.width = asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH;
        this.playerHealthTextCtx = this.playerHealthTextCanvas.getContext('2d');
        this.enemyHealthTextCanvas = document.createElement('canvas');
        this.enemyHealthTextCanvas.height = asset_constants_1.ASSET_ENEMY_HEALTH_HEIGHT;
        this.enemyHealthTextCanvas.width = asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH;
        this.enemyHealthTextCtx = this.enemyHealthTextCanvas.getContext('2d');
        this.bagTextCanvas = document.createElement('canvas');
        this.bagTextCanvas.height = game_constants_1.FONT_HEIGHT[0];
        this.bagTextCanvas.width = 64;
        this.bagTextCtx = this.bagTextCanvas.getContext('2d');
        this.pokeBallXSource = asset_constants_1.ASSET_POKEBALL_OFFSET_X + 8 * battle_constants_1.POKEBALL_SIZE;
        console.log(this.enemyPokemon);
        console.log(this.playerPokemon);
    }
    setGenderVariables(male) {
        if (male) {
            this.genderOffsets = {
                ASSET_AVATAR_OFFSET: 4 * game_constants_1.AVATAR_BATTLE_HEIGHT,
                ASSET_BAG_BG_OFFSET: game_constants_1.GAME_WIDTH,
                ASSET_BAG_OFFSET: asset_constants_1.ASSET_BAG_HEIGHT,
                ASSET_BAG_SEL_OFFSET: 5 * asset_constants_1.ASSET_BAG_SEL_HEIGHT,
            };
        }
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
        const enemyPokemon = (0, helper_1.generatePokemon)(this.pokedex[pokemonId.toString()], candidates[pokemonId].level, pokemonId, -1);
        // Set the necessary assets
        this.enemyPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (enemyPokemon.generation + 1), asset_constants_1.FILE_MON_HEIGHT[enemyPokemon.generation], asset_constants_1.FILE_MON_WIDTH);
        if (enemyPokemon.generation === this.playerPokemon.generation) {
            this.playerPokemonSprite = this.enemyPokemonSprite;
        }
        else {
            this.playerPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (this.playerPokemon.generation + 1), asset_constants_1.FILE_MON_HEIGHT[this.playerPokemon.generation], asset_constants_1.FILE_MON_WIDTH);
        }
        return enemyPokemon;
    }
    loadGameObjects() {
        this.battleBackground = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 4 * game_constants_1.GAME_WIDTH, ((0.5 + this.encounterMethod / 4) << 0) * battle_constants_1.BATTLE_ARENA_HEIGHT, game_constants_1.GAME_WIDTH, battle_constants_1.BATTLE_ARENA_HEIGHT, 0, 0);
        this.moveSelectorBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, 3 * battle_constants_1.BATTLE_ARENA_HEIGHT + 4 * battle_constants_1.BATTLE_SCENE_HEIGHT + battle_constants_1.ACTION_BOX_HEIGHT + asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT, game_constants_1.GAME_WIDTH, battle_constants_1.ACTION_BOX_HEIGHT, 0, battle_constants_1.BATTLE_ARENA_HEIGHT);
        this.battleDialogueBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, 3 * battle_constants_1.BATTLE_ARENA_HEIGHT, game_constants_1.GAME_WIDTH, battle_constants_1.ACTION_BOX_HEIGHT, 0, battle_constants_1.BATTLE_ARENA_HEIGHT);
        this.actionSelectorBox = new game_object_1.GameObject(this.ctx, this.battleAssets, game_constants_1.GAME_WIDTH, 3 * battle_constants_1.BATTLE_ARENA_HEIGHT, battle_constants_1.ACTION_BOX_WIDTH, battle_constants_1.ACTION_BOX_HEIGHT, game_constants_1.GAME_WIDTH - battle_constants_1.ACTION_BOX_WIDTH, battle_constants_1.BATTLE_ARENA_HEIGHT);
        this.playerBattleGrounds = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 3 * battle_constants_1.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * battle_constants_1.BATTLE_SCENE_HEIGHT + 3 * battle_constants_1.BATTLE_ARENA_HEIGHT + battle_constants_1.ACTION_BOX_HEIGHT, battle_constants_1.BATTLE_SCENE_WIDTH, battle_constants_1.BATTLE_SCENE_HEIGHT, 240, 100);
        this.playerPokemonObject = new game_object_1.GameObject(this.ctx, this.playerPokemonSprite, this.playerPokemon.xSource + 2 * battle_constants_1.POKEMON_SIZE, this.playerPokemon.ySource, battle_constants_1.POKEMON_SIZE, battle_constants_1.POKEMON_SIZE, (battle_constants_1.BATTLE_SCENE_WIDTH - battle_constants_1.POKEMON_SIZE) / 2, battle_constants_1.BATTLE_ARENA_HEIGHT - battle_constants_1.POKEMON_SIZE);
        this.playerPokemonObject.setScale(0);
        this.playerPokemonHealthBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, asset_constants_1.ASSET_HEALTH_OFFSET, asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT, game_constants_1.GAME_WIDTH, 75);
        this.playerPokemonHealthBar = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET, 48, 2, game_constants_1.GAME_WIDTH + 47, 75 + 17);
        this.playerPokemonHealthText = new game_object_1.GameObject(this.ctx, this.playerHealthTextCanvas, 0, 0, asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT, game_constants_1.GAME_WIDTH, 75);
        this.playerPokemonXpBox = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET + 3 * 2, 64, 2, game_constants_1.GAME_WIDTH + 31, 75 + 33);
        this.enemyBattleGrounds = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 3 * battle_constants_1.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * battle_constants_1.BATTLE_SCENE_HEIGHT + 3 * battle_constants_1.BATTLE_ARENA_HEIGHT + battle_constants_1.ACTION_BOX_HEIGHT, battle_constants_1.BATTLE_SCENE_WIDTH, battle_constants_1.BATTLE_SCENE_HEIGHT, -battle_constants_1.BATTLE_SCENE_WIDTH, 48);
        this.enemyPokemonObject = new game_object_1.GameObject(this.ctx, this.enemyPokemonSprite, this.enemyPokemon.xSource, this.enemyPokemon.ySource, battle_constants_1.POKEMON_SIZE, battle_constants_1.POKEMON_SIZE, -(battle_constants_1.BATTLE_SCENE_WIDTH + battle_constants_1.POKEMON_SIZE) / 2, 22);
        this.enemyPokemonHealthBox = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET, asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH, asset_constants_1.ASSET_ENEMY_HEALTH_HEIGHT, -asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH, 16);
        this.enemyPokemonHealthBar = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET, 48, 2, -asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + 39, 16 + 17);
        this.enemyPokemonHealthText = new game_object_1.GameObject(this.ctx, this.enemyHealthTextCanvas, 0, 0, asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH, asset_constants_1.ASSET_ENEMY_HEALTH_HEIGHT, -asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH, 16);
        this.playerAvatar = new game_object_1.GameObject(this.ctx, this.avatarAssets, asset_constants_1.ASSET_AVATAR_BATTLE_OFFSET, this.genderOffsets.ASSET_AVATAR_OFFSET, game_constants_1.AVATAR_BATTLE_WIDTH, game_constants_1.AVATAR_BATTLE_HEIGHT, game_constants_1.GAME_WIDTH + battle_constants_1.BATTLE_SCENE_WIDTH / 2, battle_constants_1.BATTLE_ARENA_HEIGHT - game_constants_1.AVATAR_BATTLE_HEIGHT);
        this.playerAvatar.setAnimation(true, 0, 0, game_constants_1.AVATAR_BATTLE_HEIGHT, 4);
        this.pokeball = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_POKEBALL_OFFSET_X, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 32, battle_constants_1.POKEBALL_SIZE, battle_constants_1.POKEBALL_SIZE, 25, 70);
        this.pokeball.setAnimation(false, 32, 0, battle_constants_1.POKEBALL_SIZE, 8);
        this.catchPokeball = new game_object_1.GameObject(this.ctx, this.battleAssets, asset_constants_1.ASSET_POKEBALL_OFFSET_X, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 32, battle_constants_1.POKEBALL_SIZE, battle_constants_1.POKEBALL_SIZE, 28, 74);
        this.bagBackground = new game_object_1.GameObject(this.ctx, this.battleAssets, this.genderOffsets.ASSET_BAG_BG_OFFSET, asset_constants_1.ASSET_BAG_OFFSET, game_constants_1.GAME_WIDTH, game_constants_1.GAME_HEIGHT, 0, 0);
        this.bag = new game_object_1.GameObject(this.ctx, this.battleAssets, 2 * game_constants_1.GAME_WIDTH, asset_constants_1.ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET, asset_constants_1.ASSET_BAG_WIDTH, asset_constants_1.ASSET_BAG_HEIGHT, 30, 6);
        this.bagText = new game_object_1.GameObject(this.ctx, this.bagTextCanvas, 0, 0, 64, game_constants_1.FONT_HEIGHT[0], 32, 81);
        this.bagSelector = new game_object_1.GameObject(this.ctx, this.battleAssets, 2 * game_constants_1.GAME_WIDTH + 5 * asset_constants_1.ASSET_BAG_WIDTH + asset_constants_1.ASSET_BAG_POK_SIZE, asset_constants_1.ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_SEL_OFFSET, asset_constants_1.ASSET_BAG_SEL_WIDTH, asset_constants_1.ASSET_BAG_SEL_HEIGHT, 42, 75);
        this.bagSwitchPokeball = new game_object_1.GameObject(this.ctx, this.battleAssets, 2 * game_constants_1.GAME_WIDTH + 6 * asset_constants_1.ASSET_BAG_WIDTH, asset_constants_1.ASSET_BAG_OFFSET, asset_constants_1.ASSET_BAG_POK_SIZE, asset_constants_1.ASSET_BAG_POK_SIZE, 8, 80);
        this.bagSwitchPokeball.setAnimation(false, 32, 0, asset_constants_1.ASSET_BAG_POK_SIZE, 7);
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
            this.ctx.clearRect(0, 0, game_constants_1.GAME_WIDTH, game_constants_1.GAME_HEIGHT);
            // Return battleData
            return battleData;
        });
    }
    battleFinished() {
        return new Promise((resolve) => {
            // resolve if battle is finished
            if (this.battleStatus === 42 /* Finished */) {
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
        if (this.battleStatus === 0 /* SlideAvatarIn */) {
            this.battleBackground.render();
            // Draw enemy pokemon with slide, with avatar, with next phase
            this.drawEnemyPokemon(delta, true, false);
            // Draw player avatar sliding in
            const isFinished = this.drawAvatar(delta, true, false);
            // Draw action dialogue box
            this.battleDialogueBox.render();
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
            // Write appear text to dialogue box, with next phase
            const text = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase() + ' appeared!|';
            const isFinished = this.writeToDialogueBox(delta, 1, text, '', 0, 1);
            // Draw enemy health with slide
            this.drawEnemyHealth(delta, true);
            if (isFinished) {
                // Draw action dialogue box
                this.battleDialogueBox.render();
                this.nextBattlePhase(2 /* WriteGoText */);
            }
        }
        else if (this.battleStatus === 2 /* WriteGoText */) {
            // Write go text to dialogue box, with next phase
            const text = 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!';
            const isFinished = this.writeToDialogueBox(delta, 1, text, '', 0, 1);
            if (isFinished) {
                this.nextBattlePhase(3 /* SlideAvatarOut */);
            }
        }
        else if (this.battleStatus === 3 /* SlideAvatarOut */) {
            this.battleBackground.render();
            // Draw enemy pokemon without slide
            this.drawEnemyPokemon(delta, false, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw player avatar with slideOut
            const isFinished = this.drawAvatar(delta, false, true);
            // Draw action dialogue box
            this.battleDialogueBox.render();
            // Draw go text to dialogue box
            (0, helper_1.drawText)(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);
            if (isFinished) {
                this.nextBattlePhase(4 /* ThrowPokemon */);
            }
        }
        else if (this.battleStatus === 4 /* ThrowPokemon */) {
            this.battleBackground.render();
            // Draw enemy pokemon without slide
            this.drawEnemyPokemon(delta, false, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw player avatar with slideOut
            this.drawAvatar(delta, false, true);
            // Draw player pokemon with slide, with throw
            const isFinished = this.drawPlayerPokemon(delta, true);
            // Draw action dialogue box
            this.battleDialogueBox.render();
            // Draw go text to dialogue box
            (0, helper_1.drawText)(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);
            if (isFinished) {
                this.nextBattlePhase(5 /* PlayerActionSelect */);
            }
        }
        else if (this.battleStatus === 5 /* PlayerActionSelect */) {
            if (this.statusAfterFadeOut === 5 /* PlayerActionSelect */) {
                this.nextBattlePhase(40 /* FadeIn */);
                this.statusAfterFadeOut = 40 /* FadeIn */;
            }
            else if (this.statusAfterFadeOut === 40 /* FadeIn */) {
                this.statusAfterFadeIn = 42 /* Finished */;
            }
            this.turnsPassed++;
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
                        this.nextBattlePhase(20 /* PlayerSelectMove */);
                    }
                    else if (this.battleAction === 1) {
                        this.statusAfterFadeOut = 6 /* PlayerBag */;
                        this.statusAfterFadeIn = 6 /* PlayerBag */;
                        this.nextBattlePhase(39 /* FadeOut */);
                    }
                    else if (this.battleAction === 2) {
                        this.nextBattlePhase(17 /* PlayerChoosePokemon */);
                    }
                    else if (this.battleAction === 3) {
                        this.nextBattlePhase(18 /* PlayerRun */);
                    }
                    this.keyDown = true;
                }
            }
            this.drawCleanBattleScene(delta, true);
            // Draw action choice selector
            this.actionSelectorBox.render();
            (0, helper_1.drawText)(this.ctx, this.font, 'What should ', 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, this.playerPokemon.pokemonName.toUpperCase() + ' do?', 0, 1, 16, 121 + 16);
            // Set the offset and column for the battle action selector
            let xOffset = this.battleAction * 46;
            let yColumn = 0;
            if (this.battleAction === 2 || this.battleAction === 3) {
                xOffset = (this.battleAction - 2) * 46;
                yColumn = 1;
            }
            // Draw the action selector
            this.drawActionSelector(game_constants_1.GAME_WIDTH - battle_constants_1.ACTION_BOX_WIDTH + 8 + xOffset, game_constants_1.GAME_WIDTH - battle_constants_1.ACTION_BOX_WIDTH + 8 + 42 + xOffset, 121, yColumn);
        }
        else if (this.battleStatus === 6 /* PlayerBag */) {
            if (this.statusAfterFadeOut === 6 /* PlayerBag */) {
                this.nextBattlePhase(40 /* FadeIn */);
                this.statusAfterFadeOut = 5 /* PlayerActionSelect */;
            }
            else if (this.statusAfterFadeOut === 5 /* PlayerActionSelect */) {
                this.statusAfterFadeIn = 5 /* PlayerActionSelect */;
            }
            const items = this.playerData.inventory[this.bagSelected];
            const itemsToDisplay = Math.min(items.length + 1, 8);
            this.drawBag(true, false);
            // Detect keyboard press and increment/ decrement battleAction accordingly
            if (!this.keyDown) {
                if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.LEFT)) {
                    if (this.bagSelected > 0) {
                        this.bagSelected--;
                        this.bagSwitchLeft = true;
                        this.bagSelectedItem = 0;
                        this.bagSelectedOffset = 0;
                        this.nextBattlePhase(7 /* BagSwitch */);
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.RIGHT)) {
                    if (this.bagSelected < 4) {
                        this.bagSelected++;
                        this.bagSwitchLeft = false;
                        this.bagSelectedItem = 0;
                        this.bagSelectedOffset = 0;
                        this.nextBattlePhase(7 /* BagSwitch */);
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.UP)) {
                    if (this.bagSelectedItem > 0) {
                        this.bagSelectedItem--;
                    }
                    else if (this.bagSelectedOffset > 0) {
                        this.bagSelectedOffset--;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.DOWN)) {
                    if (this.bagSelectedItem < itemsToDisplay - 1) {
                        this.bagSelectedItem++;
                    }
                    else if (this.bagSelectedOffset + this.bagSelectedItem < items.length) {
                        this.bagSelectedOffset++;
                    }
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
                    if (this.bagSelectedItem !== itemsToDisplay - 1) {
                        this.nextBattlePhase(8 /* BagConfirmUseItem */);
                    }
                    else {
                        this.nextBattlePhase(39 /* FadeOut */);
                    }
                    this.keyDown = true;
                }
            }
        }
        else if (this.battleStatus === 7 /* BagSwitch */) {
            const previousSelected = this.bagSwitchLeft ? this.bagSelected + 1 : this.bagSelected - 1;
            const limit = 64, speed = 196;
            let text = '', direction = 1;
            if (this.bagSwitchLeft) {
                text = bag_constants_1.BAG_POCKETS[this.bagSelected] + bag_constants_1.BAG_POCKETS[previousSelected];
            }
            else {
                text = bag_constants_1.BAG_POCKETS[previousSelected] + bag_constants_1.BAG_POCKETS[this.bagSelected];
                direction = -1;
            }
            this.bagBackground.render();
            this.ctx.fillStyle = '#F8E0A8';
            this.ctx.fillRect(112, 16, 120, Math.abs(this.animationCounter) / limit * 128);
            if (this.animationCounter > -20 && this.animationCounter < 20) {
                this.bag.updateSourcePosition(2 * game_constants_1.GAME_WIDTH, asset_constants_1.ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET);
                this.bag.animate(delta, 128, 0, 1, 30, 6 - direction * this.animationCounter / 6, false, true);
            }
            else {
                this.bag.updateSourcePosition(2 * game_constants_1.GAME_WIDTH, asset_constants_1.ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET);
                this.bag.animate(delta, 128, 0, 1, 30, 6, false, true);
            }
            this.bag.render();
            this.bagSelector.updateSourcePosition(2 * game_constants_1.GAME_WIDTH + 6 * asset_constants_1.ASSET_BAG_WIDTH + 16, asset_constants_1.ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_SEL_OFFSET + this.bagSelected * asset_constants_1.ASSET_BAG_SEL_HEIGHT);
            this.bagSelector.render();
            this.bagSwitchPokeball.render(delta);
            if (this.bagTextCtx) {
                this.bagTextCtx.clearRect(0, 0, 64, game_constants_1.FONT_HEIGHT[0]);
                const x = (!this.bagSwitchLeft) ? this.animationCounter : this.animationCounter - direction * limit;
                (0, helper_1.drawText)(this.bagTextCtx, this.font, text, 0, 2, (0.5 + x) << 0, 0);
            }
            this.bagText.update(this.bagTextCanvas);
            this.bagText.render();
            const items = this.playerData.inventory[this.bagSelected];
            const currentLine = (Math.abs(this.animationCounter) / limit * 128) / 16 << 0;
            const itemsToDisplay = Math.min(items.length + 1, currentLine);
            for (let i = 0; i < itemsToDisplay; i++) {
                const x = i * 16;
                if (i === items.length) {
                    (0, helper_1.drawText)(this.ctx, this.font, 'CLOSE BAG', 0, 3, 112, 17 + x);
                }
                else {
                    const itemData = this.itemIndex[items[i].itemId];
                    (0, helper_1.drawText)(this.ctx, this.font, itemData.name.toUpperCase(), 0, 3, 112, 17 + x);
                    if (items[i].amount !== -1) {
                        (0, helper_1.drawText)(this.ctx, this.font, 'x' + items[i].amount.toString().padStart(2, '_'), 0, 3, 214, 17 + x);
                    }
                }
            }
            if (itemsToDisplay >= 1) {
                this.bagSelectedItem = 0;
                this.drawActionSelector(112, 233, 17, this.bagSelectedItem);
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
                this.nextBattlePhase(6 /* PlayerBag */);
            }
        }
        else if (this.battleStatus === 8 /* BagConfirmUseItem */) {
            this.drawBag(false, true);
            (0, helper_1.drawText)(this.ctx, this.font, 'What would you', 0, 3, 4, 105);
            (0, helper_1.drawText)(this.ctx, this.font, 'like to do?', 0, 3, 4, 105 + 16);
            // Draw the yes/no conformation box
            this.ctx.drawImage(this.battleAssets, game_constants_1.GAME_WIDTH, 3 * battle_constants_1.BATTLE_ARENA_HEIGHT + 4 * battle_constants_1.BATTLE_SCENE_HEIGHT + battle_constants_1.ACTION_BOX_HEIGHT + asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT, 54, 46, 57, 57, 54, 46);
            // The offset for the selection box
            const column = (!this.selectedConfirm) ? 1 : 0;
            this.drawActionSelector(64, 105, 64, column);
            // if key is pressed and not yet down, change selectedConfirm accordingly
            if (!this.keyDown) {
                if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.DOWN) && this.selectedConfirm !== false) {
                    this.selectedConfirm = false;
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.UP) && this.selectedConfirm !== true) {
                    this.selectedConfirm = true;
                    this.keyDown = true;
                }
                else if (keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
                    // Continue back to the bag or use the item
                    if (!this.selectedConfirm) {
                        this.selectedConfirm = true;
                        this.nextBattlePhase(6 /* PlayerBag */);
                    }
                    else {
                        const items = this.playerData.inventory[this.bagSelected];
                        const itemCategory = this.itemIndex[items[this.bagSelectedItem + this.bagSelectedOffset].itemId].category;
                        if (itemCategory === 'standard-balls' || itemCategory === 'special-balls') {
                            this.statusAfterFadeOut = 9 /* UsePokeBall */;
                            this.statusAfterFadeIn = 9 /* UsePokeBall */;
                            this.nextBattlePhase(39 /* FadeOut */);
                        }
                        else if (itemCategory === 'healing') {
                            this.nextBattlePhase(15 /* UseHealingItem */);
                        }
                    }
                    this.keyDown = true;
                }
            }
        }
        else if (this.battleStatus === 9 /* UsePokeBall */) {
            if (this.statusAfterFadeOut === 9 /* UsePokeBall */) {
                this.nextBattlePhase(40 /* FadeIn */);
                this.statusAfterFadeOut = 40 /* FadeIn */;
            }
            else if (this.statusAfterFadeOut === 40 /* FadeIn */) {
                this.statusAfterFadeIn = 42 /* Finished */;
            }
            this.drawCleanBattleScene(delta, true);
            const items = this.playerData.inventory[this.bagSelected];
            const itemId = items[this.bagSelectedItem + this.bagSelectedOffset].itemId;
            const itemName = this.itemIndex[itemId].name;
            const playerName = this.accountData.playerName[0].toUpperCase() + this.accountData.playerName.substring(1);
            if (this.statusAfterFadeIn === 42 /* Finished */) {
                this.pokeBallXSource = asset_constants_1.ASSET_POKEBALL_OFFSET_X + items_constants_1.POKE_BALLS[itemId] * battle_constants_1.POKEBALL_SIZE;
                this.catchPokeball.updateSourcePosition(this.pokeBallXSource, asset_constants_1.ASSET_POKEBALL_OFFSET_Y);
                const isFinished = this.writeToDialogueBox(delta, 0, playerName + ' used', itemName.toUpperCase() + '!', 0, 1);
                if (isFinished) {
                    this.catchPokeball.setPosition(28, 74);
                    this.nextBattlePhase(10 /* ThrowPokeBall */);
                }
            }
        }
        else if (this.battleStatus === 10 /* ThrowPokeBall */) {
            this.drawCleanBattleScene(delta, false);
            const items = this.playerData.inventory[this.bagSelected];
            const itemName = this.itemIndex[items[this.bagSelectedItem + this.bagSelectedOffset].itemId].name;
            const playerName = this.accountData.playerName[0].toUpperCase() + this.accountData.playerName.substring(1);
            (0, helper_1.drawText)(this.ctx, this.font, playerName + ' used', 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, itemName.toUpperCase() + '!', 0, 1, 16, 121 + 16);
            const isFinished = this.throwCatchPokeBall(delta);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            if (isFinished) {
                this.nextBattlePhase(11 /* BouncePokeBall */);
            }
        }
        else if (this.battleStatus === 11 /* BouncePokeBall */) {
            this.drawCleanBattleScene(delta, true);
            const items = this.playerData.inventory[this.bagSelected];
            const itemId = items[this.bagSelectedItem + this.bagSelectedOffset].itemId;
            const itemName = this.itemIndex[itemId].name;
            const playerName = this.accountData.playerName[0].toUpperCase() + this.accountData.playerName.substring(1);
            (0, helper_1.drawText)(this.ctx, this.font, playerName + ' used', 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, itemName.toUpperCase() + '!', 0, 1, 16, 121 + 16);
            const isFinished = this.bouncePokeBall(delta);
            if (isFinished) {
                this.nextBattlePhase(12 /* ShakePokeBall */);
            }
        }
        else if (this.battleStatus === 12 /* ShakePokeBall */) {
            this.drawCleanBattleScene(delta, true);
            const items = this.playerData.inventory[this.bagSelected];
            const itemId = items[this.bagSelectedItem + this.bagSelectedOffset].itemId;
            const itemName = this.itemIndex[itemId].name;
            const playerName = this.accountData.playerName[0].toUpperCase() + this.accountData.playerName.substring(1);
            (0, helper_1.drawText)(this.ctx, this.font, playerName + ' used', 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, itemName.toUpperCase() + '!', 0, 1, 16, 121 + 16);
            let checkPassed = false;
            if (!this.shakeCheckDone) {
                const catchRates = {
                    'master-ball': 255,
                    'ultra-ball': 2,
                    'great-ball': 1.5,
                    'poke-ball': 1,
                    'safari-ball': 1.5,
                    'net-ball': this.enemyPokemon.types.some(e => e.type === 'water') || this.enemyPokemon.types.some(e => e.type === 'bug') ? 3.5 : 1,
                    'nest-ball': Math.max((41 - this.enemyPokemon.level) / 10, 1),
                    'repeat-ball': this.playerData.pokemon.some(e => e.pokemonName === this.enemyPokemon.pokemonName) ? 3.5 : 1,
                    'timer-ball': Math.min((this.turnsPassed + 10) / 10, 4),
                    'luxury-ball': 1,
                    'premier-ball': 1,
                    'dive-ball': 1,
                };
                if (itemId === 'luxury-ball')
                    this.enemyPokemon.base_happiness = this.enemyPokemon.base_happiness * 2;
                const hpMax = this.enemyPokemon.stats.hp;
                const hpCurrent = this.enemyPokemon.health;
                const rate = this.enemyPokemon.capture_rate;
                const ballBonus = catchRates[itemId];
                const statusBonus = 1;
                const a = ((3 * hpMax - 2 * hpCurrent) * rate * ballBonus) / (3 * hpMax) * statusBonus;
                const b = 1048560 / (Math.sqrt(Math.sqrt(16711680 / a) << 0) << 0) << 0;
                const randomInt = (0, helper_1.randomFromMinMax)(0, 65535);
                checkPassed = randomInt < b;
                if (a >= 255) {
                    checkPassed = true;
                }
                this.shakes++;
                this.shakeCheckDone = true;
            }
            const isFinished = this.shakePokeBall(delta);
            if (isFinished) {
                if (!checkPassed && this.shakeCheckDone) {
                    this.nextBattlePhase(13 /* PokemonBrokeFree */);
                    this.shakes = 0;
                }
                else if (this.shakes <= 3) {
                    this.nextBattlePhase(12 /* ShakePokeBall */);
                }
                else {
                    this.battleResultWin = true;
                    this.nextBattlePhase(14 /* PokemonCaptured */);
                }
                this.shakeCheckDone = false;
            }
        }
        else if (this.battleStatus === 13 /* PokemonBrokeFree */) {
            this.drawCleanBattleScene(delta, true);
            this.enemyPokemonObject.setPosition(game_constants_1.GAME_WIDTH - (battle_constants_1.BATTLE_SCENE_WIDTH + battle_constants_1.POKEMON_SIZE) / 2, 22);
            this.enemyPokemonObject.setScale(1);
            this.enemyPokemonObject.resetColor();
            const text1 = 'Pokemon broke free';
            const text2 = '';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.nextBattlePhase(27 /* EnemyTurn */);
            }
        }
        else if (this.battleStatus === 14 /* PokemonCaptured */) {
            this.drawCleanBattleScene(delta, true);
            this.catchPokeball.render();
            const text1 = 'Gotcha';
            const text2 = this.enemyPokemon.pokemonName.toUpperCase() + ' was caught!|';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.nextBattlePhase(41 /* AddToPokedex */);
            }
        }
        else if (this.battleStatus === 41 /* AddToPokedex */) {
            this.drawCleanBattleScene(delta, true);
            this.catchPokeball.opacityTo(delta, 8, false, 0);
            const text1 = this.enemyPokemon.pokemonName.toUpperCase() + '\'s data was';
            const text2 = 'added to the POKéDEX.|';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.drawCleanBattleScene(delta, true);
                this.player.addPokemon(this.enemyPokemon);
                this.nextBattlePhase(39 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 18 /* PlayerRun */) {
            this.escapeAttempts++;
            const escapeGuaranteed = this.playerPokemon.stats.speed >= this.enemyPokemon.stats.speed;
            const escapeOdds = (Math.floor(this.playerPokemon.stats.speed * 128 / this.enemyPokemon.stats.speed) + 30 * this.escapeAttempts) % 256;
            const escape = (0, helper_1.randomFromMinMax)(0, 255) < escapeOdds;
            if (escapeGuaranteed || escape) {
                console.log('Escape successfully');
                this.battleResultWin = false;
                this.nextBattlePhase(19 /* PlayerRunText */);
            }
            else {
                console.log('escaped failed');
                this.nextBattlePhase(27 /* EnemyTurn */);
            }
        }
        else if (this.battleStatus === 19 /* PlayerRunText */) {
            const text1 = 'Got away safely!|';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, '', 0, 1);
            if (isFinished) {
                this.nextBattlePhase(39 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 20 /* PlayerSelectMove */) {
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
                (0, helper_1.drawText)(this.ctx, this.font, moveText.toUpperCase(), 0, 0, xText, yText);
            }
            // Current selected move details
            const moveDetails = this.playerPokemon.moves[this.battleMove];
            // Variables for printing move pp text
            const xText = 184;
            const yPpText = 121;
            // Draw move pp text
            const text = 'PP_' + moveDetails.pp.toString().padStart(2, '_') + '/' + moveDetails.ppMax.toString().padStart(2, '_');
            (0, helper_1.drawText)(this.ctx, this.font, text, 0, 0, xText, yPpText);
            // Variable for printing move type text
            const yTypeText = 121 + 16;
            // Draw move type text
            (0, helper_1.drawText)(this.ctx, this.font, moveDetails.type.toUpperCase(), 0, 0, xText, yTypeText);
            // Set the offset and column for the battle action selector
            let xOffset = this.battleMove * 80;
            let yColumn = 0;
            if (this.battleMove === 2 || this.battleMove === 3) {
                xOffset = (this.battleMove - 2) * 80;
                yColumn = 1;
            }
            // Draw the action selector
            this.drawActionSelector(8 + xOffset, 8 + 74 + xOffset, 121, yColumn);
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
                    this.nextBattlePhase(21 /* PlayerTurn */);
                }
            }
        }
        else if (this.battleStatus === 21 /* PlayerTurn */) {
            this.playerMove = true;
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.writeMoveText(delta, moveData);
            if (isFinished) {
                const accuracyBase = moveData.accuracy;
                let isHit = true;
                if (accuracyBase) {
                    const stageAdjust = battle_constants_1.SPECIAL_STAGES[this.playerPokemonStages.accuracy - this.enemyPokemonStages.accuracy + 6];
                    const modifier = 1;
                    const accuracy = accuracyBase * stageAdjust * modifier;
                    isHit = (0, helper_1.randomFromMinMax)(1, 100) <= accuracy;
                }
                if (isHit) {
                    if (moveData.damage_class === 'status') {
                        this.nextBattlePhase(22 /* PlayerStatusMove */);
                    }
                    else if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(24 /* PlayerSpecialMove */);
                    }
                    else {
                        this.nextBattlePhase(25 /* PlayerDamageMove */);
                    }
                }
                else {
                    // Move missed
                }
            }
        }
        else if (this.battleStatus === 22 /* PlayerStatusMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusMove(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(23 /* PlayerStatusEffect */);
            }
        }
        else if (this.battleStatus === 24 /* PlayerSpecialMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.specialMove(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(25 /* PlayerDamageMove */);
            }
        }
        else if (this.battleStatus === 23 /* PlayerStatusEffect */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusEffect(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(27 /* EnemyTurn */);
            }
        }
        else if (this.battleStatus === 25 /* PlayerDamageMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' used';
            const text2 = this.battleMoveName.toUpperCase() + '!';
            this.battleBackground.render();
            // Draw player pokemon attack
            const isFinished = this.damageMove(delta, moveData);
            // const isFinished = this.drawDefaultAttack(delta, true);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
            // Draw action dialogue box
            this.battleDialogueBox.render();
            // Draw text to dialogue box
            (0, helper_1.drawText)(this.ctx, this.font, text1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
            if (isFinished) {
                this.nextBattlePhase(26 /* EnemyTakesDamage */);
            }
        }
        else if (this.battleStatus === 26 /* EnemyTakesDamage */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.animateHealthBar(delta);
            this.drawEnemyHealth(delta, false);
            if (isFinished) {
                if (this.enemyPokemon.health <= 0) {
                    this.battleResultWin = true;
                    this.nextBattlePhase(33 /* EnemyFainted */);
                }
                else {
                    if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(23 /* PlayerStatusEffect */);
                    }
                    else {
                        this.nextBattlePhase(27 /* EnemyTurn */);
                    }
                }
            }
        }
        else if (this.battleStatus === 27 /* EnemyTurn */) {
            this.playerMove = false;
            if (!this.enemyMoveDecided) {
                this.battleMoveName = (0, helper_1.randomFromArray)(this.enemyPokemon.moves.map(moveData => moveData.move));
                console.log('foo ' + this.enemyPokemon.pokemonName + ' used ' + this.battleMoveName);
                this.enemyMoveDecided = true;
            }
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.writeMoveText(delta, moveData);
            if (isFinished) {
                this.enemyMoveDecided = false;
                if (moveData.damage_class === 'status') {
                    this.nextBattlePhase(28 /* EnemyStatusMove */);
                }
                else if (moveData.damage_class === 'special') {
                    this.nextBattlePhase(30 /* EnemySpecialMove */);
                }
                else {
                    this.nextBattlePhase(31 /* EnemyDamageMove */);
                }
            }
        }
        else if (this.battleStatus === 28 /* EnemyStatusMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusMove(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(29 /* EnemyStatusEffect */);
            }
        }
        else if (this.battleStatus === 30 /* EnemySpecialMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.specialMove(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(31 /* EnemyDamageMove */);
            }
        }
        else if (this.battleStatus === 29 /* EnemyStatusEffect */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusEffect(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(5 /* PlayerActionSelect */);
            }
        }
        else if (this.battleStatus === 31 /* EnemyDamageMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const text1 = this.enemyPokemon.pokemonName.toUpperCase() + ' used';
            const text2 = this.battleMoveName.toUpperCase() + '!';
            this.battleBackground.render();
            // Draw player pokemon attack
            const isFinished = this.damageMove(delta, moveData);
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw action dialogue box
            this.battleDialogueBox.render();
            // Draw text to dialogue box
            (0, helper_1.drawText)(this.ctx, this.font, text1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
            if (isFinished) {
                this.nextBattlePhase(32 /* PlayerTakesDamage */);
            }
        }
        else if (this.battleStatus === 32 /* PlayerTakesDamage */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.animateHealthBar(delta);
            this.drawPlayerHealth(delta, false);
            if (isFinished) {
                if (this.playerPokemon.health <= 0) {
                    this.battleResultWin = false;
                    this.nextBattlePhase(42 /* Finished */);
                }
                else {
                    if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(29 /* EnemyStatusEffect */);
                    }
                    else {
                        this.nextBattlePhase(5 /* PlayerActionSelect */);
                    }
                }
            }
        }
        else if (this.battleStatus === 33 /* EnemyFainted */) {
            this.battleBackground.render();
            // Draw enemy pokemon
            const isFinished = this.drawEnemyPokemon(delta, false, true);
            // Draw battle grounds player pokemon
            this.playerBattleGrounds.render();
            // Draw player pokemon
            this.drawPlayerPokemon(delta, false);
            // Draw enemy health without slide
            if (!isFinished) {
                this.drawEnemyHealth(delta, false);
            }
            else {
                const text1 = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase();
                const text2 = 'fainted!|';
                const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
                if (isFinished) {
                    this.nextBattlePhase(34 /* GainXpText */);
                }
            }
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
        }
        else if (this.battleStatus === 34 /* GainXpText */) {
            if (this.newXp === -1) {
                this.newXp = this.calculateXpGained() + this.playerPokemon.xp;
            }
            else {
                const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' gained';
                const text2 = this.newXp - this.playerPokemon.xp + ' EXP. Points!|';
                const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
                if (isFinished) {
                    this.nextBattlePhase(35 /* GainXp */);
                }
            }
        }
        else if (this.battleStatus === 35 /* GainXp */) {
            // Draw action dialogue box
            this.battleDialogueBox.render();
            const isFinished = this.animateXpBar(delta);
            this.drawPlayerHealth(delta, false);
            if (isFinished) {
                if (this.levelGained) {
                    this.recalculatePlayerStats();
                    this.nextBattlePhase(36 /* LevelGained */);
                }
                else {
                    this.nextBattlePhase(39 /* FadeOut */);
                }
            }
        }
        else if (this.battleStatus === 36 /* LevelGained */) {
            // level gained animation to do!!!
            this.nextBattlePhase(37 /* LevelGainedText */);
        }
        else if (this.battleStatus === 37 /* LevelGainedText */) {
            const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' grew to';
            const text2 = 'LV. ' + this.playerPokemon.level + '!';
            this.drawPlayerHealth(delta, false);
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                const newMoveAdded = this.addNewLevelMoves();
                if (newMoveAdded) {
                    this.nextBattlePhase(38 /* NewMoveText */);
                }
                else {
                    this.nextBattlePhase(39 /* FadeOut */);
                }
            }
        }
        else if (this.battleStatus === 38 /* NewMoveText */) {
            const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' learned';
            const text2 = this.playerPokemon.moves[this.playerPokemon.moves.length - 1].move.toUpperCase() + '!';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.nextBattlePhase(39 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 39 /* FadeOut */) {
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
                    this.overlayCtx.clearRect(0, 0, game_constants_1.GAME_WIDTH, game_constants_1.GAME_HEIGHT);
                    this.overlayCtx.fillRect(0, 0, game_constants_1.GAME_WIDTH, game_constants_1.GAME_HEIGHT);
                    this.overlayCtx.globalAlpha = 1;
                    this.animationCounter += delta * speed;
                }
            }
        }
        else if (this.battleStatus === 40 /* FadeIn */) {
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
                    if (this.statusAfterFadeIn === 42 /* Finished */) {
                        this.ctx.clearRect(0, 0, game_constants_1.GAME_WIDTH, game_constants_1.GAME_HEIGHT);
                    }
                    this.overlayCtx.clearRect(0, 0, game_constants_1.GAME_WIDTH, game_constants_1.GAME_HEIGHT);
                    this.overlayCtx.fillRect(0, 0, game_constants_1.GAME_WIDTH, game_constants_1.GAME_HEIGHT);
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
        if (this.battleStatus !== 42 /* Finished */) {
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
                attackerStMp = battle_constants_1.NORMAL_STAGES[this.playerPokemonStages.attack + 6];
                defenderStMp = battle_constants_1.NORMAL_STAGES[this.enemyPokemonStages.defense + 6];
            }
            else {
                attackerStMp = battle_constants_1.NORMAL_STAGES[this.enemyPokemonStages.defense + 6];
                defenderStMp = battle_constants_1.NORMAL_STAGES[this.playerPokemonStages.attack + 6];
            }
        }
        else {
            attackStat = attacker.stats.specialAttack;
            defenseStat = defender.stats.specialDefense;
            if (playerAttack) {
                attackerStMp = battle_constants_1.NORMAL_STAGES[this.playerPokemonStages.specialAttack + 6];
                defenderStMp = battle_constants_1.NORMAL_STAGES[this.enemyPokemonStages.specialDefense + 6];
            }
            else {
                attackerStMp = battle_constants_1.NORMAL_STAGES[this.enemyPokemonStages.specialDefense + 6];
                defenderStMp = battle_constants_1.NORMAL_STAGES[this.playerPokemonStages.specialAttack + 6];
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
        return mon_constants_1.TYPES_EFFECTIVENESS[18 * ((mon_constants_1.TYPES.indexOf(moveType) / 18) << 0) + mon_constants_1.TYPES.indexOf(defenderType)];
    }
    damageMove(delta, moveData) {
        let isFinished = false;
        // if (moveData.name === 'tackle') {
        //   isFinished = this.drawDefaultAttack(delta, playerAttack);
        // } else if (moveData.name === 'mud-slap') {
        isFinished = this.drawDefaultAttack(delta);
        if (this.newHealth === -1) {
            const currentHealth = this.playerMove ? this.enemyPokemon.health : this.playerPokemon.health;
            this.newHealth = Math.max(currentHealth - this.calculateMoveDamage(this.playerMove, moveData), 0);
        }
        if (isFinished) {
            return true;
        }
        return false;
    }
    statusMove(delta, moveData) {
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
    specialMove(delta, moveData) {
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
    statusEffect(delta, moveData) {
        let isFinished = false, text1 = '', text2 = '';
        let pokemonName;
        if (this.playerMove) {
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
        // Write status move text
        isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
        if (isFinished) {
            return true;
        }
        return false;
    }
    writeMoveText(delta, moveData) {
        const pokemonName = this.playerMove ? this.playerPokemon.pokemonName : this.enemyPokemon.pokemonName;
        const text1 = pokemonName.toUpperCase() + ' used';
        const text2 = moveData.name.toUpperCase() + '!';
        // Damage move
        const isFinished = this.writeToDialogueBox(delta, 0, text1, text2, 0, 1);
        if (isFinished) {
            return true;
        }
        return false;
    }
    throwCatchPokeBall(delta) {
        const speedPokeball = 192;
        // Calculate the x and y for the pokeball
        const pokeballPosition = this.catchPokeball.getPosition();
        let xPixelPokeball = pokeballPosition.x + delta * speedPokeball;
        let yPixelPokeball = 0.00809 * Math.pow(xPixelPokeball, 2) - 1.981 * xPixelPokeball + 123;
        let isFinished = false;
        if (xPixelPokeball > 170) {
            this.animationCounter += delta * speedPokeball;
            if (this.animationCounter >= 24) {
                this.catchPokeball.updateSourcePosition(this.pokeBallXSource, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 16);
            }
            else {
                this.catchPokeball.updateSourcePosition(this.pokeBallXSource, asset_constants_1.ASSET_POKEBALL_OFFSET_Y);
            }
            xPixelPokeball = 170;
            yPixelPokeball = 20;
        }
        else {
            this.catchPokeball.updateSourcePosition(this.pokeBallXSource, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 32);
        }
        if (this.animationCounter >= 24) {
            this.enemyPokemonObject.setColor(254, 191, 246);
            this.enemyPokemonObject.animate(delta, 72, 0, -1, 170, 26, false, false);
            isFinished = this.enemyPokemonObject.scaleTo(delta, 1, 0, false);
            if (isFinished) {
                this.animationCounter = 0;
            }
        }
        // Draw the pokeball
        this.catchPokeball.setPosition(xPixelPokeball, yPixelPokeball);
        this.catchPokeball.render(delta);
        return isFinished;
    }
    bouncePokeBall(delta) {
        const speedPokeball = 192;
        let isFinished = false;
        if (this.animationCounter < 24) {
            this.animationCounter += delta * speedPokeball;
        }
        if (this.animationCounter >= 24) {
            this.animationCounter = this.animationCounter << 0;
            this.catchPokeball.updateSourcePosition(this.pokeBallXSource, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 32);
            if (this.animationCounter % 2 === 0) {
                const downFinished = this.catchPokeball.animate(delta, 8, 0, 1, 170, 47, 'sigmoid90-up', true);
                if (downFinished) {
                    this.animationCounter++;
                }
            }
            else {
                const upFinished = this.catchPokeball.animate(delta, 8, 0, -1, 170, 22 + (this.animationCounter - 24) * 5, 'sigmoid90-down', true);
                if (upFinished) {
                    this.animationCounter++;
                }
            }
        }
        else {
            this.catchPokeball.updateSourcePosition(this.pokeBallXSource, asset_constants_1.ASSET_POKEBALL_OFFSET_Y);
        }
        if (22 + (this.animationCounter - 24) * 5 >= 47) {
            this.animationCounter = 0;
            isFinished = true;
        }
        // Draw the pokeball
        this.catchPokeball.render(delta);
        return isFinished;
    }
    shakePokeBall(delta) {
        this.catchPokeball.render();
        return true;
    }
    animateHealthBar(delta) {
        const currentHealth = this.playerMove ? this.enemyPokemon.health : this.playerPokemon.health;
        if (currentHealth > this.newHealth) {
            if (this.playerMove) {
                this.enemyPokemon.health -= 16 * delta;
            }
            else {
                this.playerPokemon.health -= 16 * delta;
            }
        }
        else {
            if (this.playerMove) {
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
                this.playerPokemon.xpCurLevel = mon_constants_1.LEVELS[this.playerPokemon.growth_rate][this.playerPokemon.level];
                this.playerPokemon.xpNextLevel = mon_constants_1.LEVELS[this.playerPokemon.growth_rate][this.playerPokemon.level + 1];
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
    drawBag(itemDetails, itemUse) {
        this.bagBackground.render();
        this.ctx.fillStyle = '#F8E0A8';
        this.ctx.fillRect(112, 16, 120, 128);
        this.bagSwitchPokeball.render();
        this.bag.updateSourcePosition(2 * game_constants_1.GAME_WIDTH + (this.bagSelected + 1) * asset_constants_1.ASSET_BAG_WIDTH, asset_constants_1.ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET);
        this.bag.render();
        this.bagSelector.updateSourcePosition(2 * game_constants_1.GAME_WIDTH + 6 * asset_constants_1.ASSET_BAG_WIDTH + 16, asset_constants_1.ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_SEL_OFFSET + this.bagSelected * asset_constants_1.ASSET_BAG_SEL_HEIGHT);
        this.bagSelector.render();
        const text = bag_constants_1.BAG_POCKETS[this.bagSelected];
        (0, helper_1.drawText)(this.ctx, this.font, text, 0, 2, 32, 81);
        const items = this.playerData.inventory[this.bagSelected];
        const itemsToDisplay = Math.min(items.length + 1, 8);
        for (let i = this.bagSelectedOffset; i < itemsToDisplay + this.bagSelectedOffset; i++) {
            const x = (i - this.bagSelectedOffset) * 16;
            let fontColor = 3;
            if (i === this.bagSelectedItem + this.bagSelectedOffset && itemUse) {
                fontColor = 4;
            }
            if (i === items.length) {
                (0, helper_1.drawText)(this.ctx, this.font, 'CLOSE BAG', 0, fontColor, 112, 17 + x);
            }
            else {
                const itemData = this.itemIndex[items[i].itemId];
                (0, helper_1.drawText)(this.ctx, this.font, itemData.name.toUpperCase(), 0, fontColor, 112, 17 + x);
                if (items[i].amount !== -1) {
                    (0, helper_1.drawText)(this.ctx, this.font, 'x' + items[i].amount.toString().padStart(2, '_'), 0, fontColor, 214, 17 + x);
                }
            }
        }
        this.drawActionSelector(112, 233, 17, this.bagSelectedItem);
        if (itemDetails && items[this.bagSelectedItem + this.bagSelectedOffset]) {
            const itemText = this.itemIndex[items[this.bagSelectedItem + this.bagSelectedOffset].itemId].flavour_text_entry.split('\n');
            (0, helper_1.drawText)(this.ctx, this.font, itemText[0], 0, 3, 4, 105);
            (0, helper_1.drawText)(this.ctx, this.font, itemText[1], 0, 3, 4, 105 + 16);
            (0, helper_1.drawText)(this.ctx, this.font, itemText[2], 0, 3, 4, 105 + 32);
        }
    }
    drawPlayerPokemon(delta, throwPokeBall) {
        // Draw battle grounds player pokemon
        this.playerBattleGrounds.render();
        if (throwPokeBall) {
            const speedPokeball = 64;
            let pokeballThrown = false;
            let pokemonAltFinished = false;
            let healthSlideFinished = false;
            // Calculate the x and y for the pokeball
            const pokeballPosition = this.pokeball.getPosition();
            const xPixelPokeball = pokeballPosition.x + delta * speedPokeball;
            const yPixelPokeball = 0.1 * Math.pow(xPixelPokeball, 2) - 7.5 * xPixelPokeball + 195;
            // Draw the pokeball
            this.pokeball.updateSourcePosition(asset_constants_1.ASSET_POKEBALL_OFFSET_X + this.playerPokemon.pokeball * battle_constants_1.POKEBALL_SIZE, asset_constants_1.ASSET_POKEBALL_OFFSET_Y + 32);
            this.pokeball.setPosition(xPixelPokeball, yPixelPokeball);
            this.pokeball.render(delta);
            if (pokeballPosition.x > 60) {
                pokeballThrown = true;
            }
            // Pokemon appear animation
            if (pokeballThrown) {
                // Draw pink appearing pokemon
                pokemonAltFinished = this.playerPokemonObject.scaleTo(delta, 2, 1, true);
                // if (!pokemonAltFinished) {
                this.playerPokemonObject.setColor(254, 191, 246);
                // }
            }
            if (pokemonAltFinished) {
                // Draw pokemon
                this.playerPokemonObject.resetColor();
                this.playerPokemonObject.render();
                // Draw player health
                healthSlideFinished = this.drawPlayerHealth(delta, true);
            }
            return healthSlideFinished;
        }
        else {
            this.playerPokemonObject.render();
        }
        return true;
    }
    drawDefaultAttack(delta) {
        const speed = 196;
        // Draw battle grounds player pokemon
        this.playerBattleGrounds.render();
        this.enemyBattleGrounds.render();
        // Set gameObjects and base x and y positions for the pokemon
        let attacker, defender, xPosAttacker, yPosAttacker, xPosDefender, yPosDefender;
        let direction = 1;
        if (this.playerMove) {
            attacker = this.playerPokemonObject;
            defender = this.enemyPokemonObject;
            xPosAttacker = (battle_constants_1.BATTLE_SCENE_WIDTH - battle_constants_1.POKEMON_SIZE) / 2;
            yPosAttacker = battle_constants_1.BATTLE_ARENA_HEIGHT - battle_constants_1.POKEMON_SIZE;
            xPosDefender = game_constants_1.GAME_WIDTH - (battle_constants_1.BATTLE_SCENE_WIDTH + battle_constants_1.POKEMON_SIZE) / 2;
            yPosDefender = 22;
        }
        else {
            attacker = this.enemyPokemonObject;
            defender = this.playerPokemonObject;
            xPosDefender = (battle_constants_1.BATTLE_SCENE_WIDTH - battle_constants_1.POKEMON_SIZE) / 2;
            yPosDefender = battle_constants_1.BATTLE_ARENA_HEIGHT - battle_constants_1.POKEMON_SIZE;
            xPosAttacker = game_constants_1.GAME_WIDTH - (battle_constants_1.BATTLE_SCENE_WIDTH + battle_constants_1.POKEMON_SIZE) / 2;
            yPosAttacker = 22;
            direction = -1;
        }
        // Draw the correct animation
        let forwardFinished = false;
        let backwardFinished = false;
        let forwardFinished2 = false;
        let backwardFinished2 = false;
        if (!this.attackHalfWay) {
            forwardFinished = attacker.animate(delta, speed, direction, 0, xPosAttacker + direction * 20, yPosAttacker, false, true);
        }
        else if (this.attackHalfWay) {
            backwardFinished = attacker.animate(delta, speed, -direction, 0, xPosAttacker, yPosAttacker, false, true);
        }
        if (forwardFinished) {
            this.attackHalfWay = true;
        }
        if (backwardFinished) {
            this.attackHalfWay = false;
        }
        if (this.attackHalfWay && !this.defenseHalfWay) {
            forwardFinished2 = defender.animate(delta, speed, direction, 0, xPosDefender + direction * 10, yPosDefender, false, true);
        }
        else if (this.defenseHalfWay) {
            backwardFinished2 = defender.animate(delta, speed, -direction, 0, xPosDefender, yPosDefender, false, true);
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
            this.playerPokemonHealthBox.animate(delta, speedHealth, -1, 0, 127, 75, false, true);
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
        this.playerPokemonHealthBar.updateSourcePosition(asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET + healthBarOffset);
        this.playerPokemonHealthBar.setWidth(healthBarWidth);
        if (slideIn) {
            this.playerPokemonXpBox.animate(delta, speedHealth, -1, 0, 127 + 31, 75 + 33, false, true);
            this.playerPokemonHealthBar.animate(delta, speedHealth, -1, 0, 127 + 47, 75 + 17, false, true);
        }
        else {
            this.playerPokemonXpBox.render();
            this.playerPokemonHealthBar.render();
        }
        if (this.playerHealthTextCtx) {
            // Draw the pokemon name, gender, and level
            const nameText = this.playerPokemon.pokemonName.toUpperCase() + ((this.playerPokemon.gender) ? '#' : '^');
            const healthText = (this.playerPokemon.health << 0).toString().padStart(3, '_') + '/' + this.playerPokemon.stats.hp.toString().padStart(3, '_');
            this.playerHealthTextCtx.clearRect(0, 0, asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_PLAYER_HEALTH_HEIGHT);
            (0, helper_1.drawText)(this.playerHealthTextCtx, this.font, nameText, 1, 0, 14, 6);
            (0, helper_1.drawText)(this.playerHealthTextCtx, this.font, this.playerPokemon.level.toString(), 1, 0, 84, 6);
            (0, helper_1.drawText)(this.playerHealthTextCtx, this.font, healthText, 1, 0, 59, 22);
            this.playerPokemonHealthText.update(this.playerHealthTextCanvas);
            if (slideIn) {
                const isFinished = this.playerPokemonHealthText.animate(delta, speedHealth, -1, 0, 127, 75, false, true);
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
        this.enemyPokemonHealthBox.animate(delta, speedHealth, 1, 0, 13, 16, false, true);
        // Calculate variables for drawing the health bar
        const healthFrac = this.enemyPokemon.health / this.enemyPokemon.stats.hp;
        const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2 : 0;
        const healthBarWidth = (healthFrac * 48) << 0;
        // Draw enemy health bar
        this.playerPokemonHealthBar.updateSourcePosition(asset_constants_1.ASSET_ENEMY_HEALTH_WIDTH + asset_constants_1.ASSET_PLAYER_HEALTH_WIDTH, asset_constants_1.ASSET_HEALTH_OFFSET + healthBarOffset);
        this.enemyPokemonHealthBar.setWidth(healthBarWidth);
        if (slideIn) {
            this.enemyPokemonHealthBar.animate(delta, speedHealth, 1, 0, 13 + 39, 16 + 17, false, true);
        }
        else {
            this.enemyPokemonHealthBar.render();
        }
        // Draw the pokemon name, gender, and level
        if (this.enemyHealthTextCtx) {
            const nameText = this.enemyPokemon.pokemonName.toUpperCase() + ((this.enemyPokemon.gender) ? '#' : '^');
            (0, helper_1.drawText)(this.enemyHealthTextCtx, this.font, nameText, 1, 0, 6, 6);
            (0, helper_1.drawText)(this.enemyHealthTextCtx, this.font, this.enemyPokemon.level.toString(), 1, 0, 76, 6);
            this.enemyPokemonHealthText.update(this.enemyHealthTextCanvas);
            if (slideIn) {
                this.enemyPokemonHealthText.animate(delta, speedHealth, 1, 0, 13, 16, false, true);
            }
            else {
                this.enemyPokemonHealthText.render();
            }
        }
    }
    drawAvatar(delta, slideIn, slideOut) {
        const speed = 176;
        let isFinished = false;
        // Draw battle grounds player pokemon
        this.playerBattleGrounds.render();
        if (slideIn) {
            // Draw battle grounds player pokemon
            this.playerBattleGrounds.animate(delta, speed, -1, 0, 0, 100, false, true);
            // Draw the player avatar
            isFinished = this.playerAvatar.animate(delta, speed, -1, 0, battle_constants_1.BATTLE_SCENE_WIDTH / 2, battle_constants_1.BATTLE_ARENA_HEIGHT - game_constants_1.AVATAR_BATTLE_HEIGHT, false, true);
        }
        else if (slideOut) {
            // Next animation frame and animate
            this.playerAvatar.animationTrigger(1);
            const isFinishedFirstSprite = this.playerAvatar.animate(delta, speed, -1, 0, -16, battle_constants_1.BATTLE_ARENA_HEIGHT - game_constants_1.AVATAR_BATTLE_HEIGHT, false, false);
            // Next animation frame and animate
            if (isFinishedFirstSprite) {
                this.playerAvatar.animationTrigger(2);
                isFinished = this.playerAvatar.animate(delta, speed, -1, 0, -36, battle_constants_1.BATTLE_ARENA_HEIGHT - game_constants_1.AVATAR_BATTLE_HEIGHT, false, false);
            }
            // Next animation frame and animate
            if (isFinished) {
                this.playerAvatar.animationTrigger(3);
                this.playerAvatar.animate(delta, speed, -1, 0, -game_constants_1.AVATAR_BATTLE_WIDTH, battle_constants_1.BATTLE_ARENA_HEIGHT - game_constants_1.AVATAR_BATTLE_HEIGHT, false, false);
            }
        }
        else {
            // Draw the player avatar
            this.playerAvatar.render();
        }
        return isFinished;
    }
    drawEnemyPokemon(delta, slideIn, slideOut) {
        const speed = 176;
        const x = game_constants_1.GAME_WIDTH - (battle_constants_1.BATTLE_SCENE_WIDTH + battle_constants_1.POKEMON_SIZE) / 2;
        const y = 22;
        if (slideIn) {
            // Draw battle grounds enemy pokemon
            this.enemyBattleGrounds.animate(delta, speed, 1, 0, game_constants_1.GAME_WIDTH - battle_constants_1.BATTLE_SCENE_WIDTH, 48, false, true);
            // Darken enemy pokemon when sliding in
            this.enemyPokemonObject.darkenColor(0.9);
            // Draw enemy pokemon
            const isFinished = this.enemyPokemonObject.animate(delta, speed, 1, 0, x, y, false, true);
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
            const isFinished = this.enemyPokemonObject.animate(delta, speed, 0, 1, x, 75, false, false);
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
    drawCleanBattleScene(delta, drawEnemyHealth) {
        this.battleBackground.render();
        // Draw enemy pokemon without slide
        this.drawEnemyPokemon(delta, false, false);
        if (drawEnemyHealth) {
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
        }
        // Draw player health without slide
        this.drawPlayerHealth(delta, false);
        // Draw player pokemon with slide, without throw
        this.drawPlayerPokemon(delta, false);
        // Draw action box without player action selector
        this.battleDialogueBox.render();
    }
    writeToDialogueBox(delta, delayAfter, textCol1, textCol2, fontsize, fontColor) {
        const speed = 48;
        const i = (this.animationCounter + delta * speed) << 0;
        this.battleDialogueBox.render();
        if (!this.writeSecondLine) {
            const yText = 121;
            const textToDisplay = textCol1.slice(0, i);
            // Draw the text
            (0, helper_1.drawText)(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
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
            (0, helper_1.drawText)(this.ctx, this.font, textCol1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
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
    drawActionSelector(xStart, xEnd, yStart, column) {
        // Draw rectangular action selector
        this.ctx.beginPath();
        this.ctx.moveTo(xStart, yStart + column * 16 - 0.5);
        this.ctx.lineTo(xEnd - 1, yStart + column * 16 - 0.5);
        this.ctx.moveTo(xEnd - 0.5, yStart + column * 16);
        this.ctx.lineTo(xEnd - 0.5, yStart + 14 + column * 16);
        this.ctx.moveTo(xEnd - 1, yStart + 14 + column * 16 + 0.5);
        this.ctx.lineTo(xStart, yStart + 14 + column * 16 + 0.5);
        this.ctx.moveTo(xStart - 0.5, yStart + 14 + column * 16);
        this.ctx.lineTo(xStart - 0.5, yStart + column * 16);
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#f86058';
        this.ctx.stroke();
    }
}
exports.PokemonBattle = PokemonBattle;
//# sourceMappingURL=pokemon_battle%20copy.js.map