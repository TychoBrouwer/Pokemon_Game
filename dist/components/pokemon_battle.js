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
const constants_1 = require("../utils/constants");
const keyboard_1 = require("../utils/keyboard");
class PokemonBattle {
    constructor(context, loader, player, route, encounterMethod) {
        this.battleAction = 0;
        this.battleMove = 0;
        this.battleMoveName = '';
        this.battleResultWin = false;
        this._previousElapsed = 0;
        this.battleStatus = 0;
        this.keyDown = false;
        this.moveStatus = 0;
        this.newHealth = 0;
        this.attackHalfWay = false;
        this.defenseHalfWay = false;
        this.drawAvatarFinished = false;
        this.writeSecondLine = false;
        this.X_writeTextToBattleBox = 0;
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
        this.battleAssets = this.loader.loadImageToCanvas('battleAssets', constants_1.c.ASSETS_BATTLE_HEIGHT, constants_1.c.ASSETS_BATTLE_WIDTH);
        this.font = this.loader.loadImageToCanvas('font', constants_1.c.ASSETS_FONT_HEIGHT, constants_1.c.ASSETS_FONT_WIDTH);
        this.avatarAssets = this.loader.loadImageToCanvas('avatar', constants_1.c.ASSETS_AVATAR_HEIGHT, constants_1.c.ASSETS_AVATAR_WIDTH);
        // Get the playerData
        this.playerData = player.getPlayerData();
        // Get the current player pokemon from the PlayerData
        this.playerPokemon = this.playerData.pokemon[this.playerData.currentPokemon];
        // Get and generate the enemy pokemon and load necessary assets 
        this.enemyPokemon = this.init();
        this.loadGameObjects();
        // Create Canvas for the health texts
        this.playerHealthTextCanvas = document.createElement('canvas');
        this.playerHealthTextCanvas.height = constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT;
        this.playerHealthTextCanvas.width = constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH;
        this.playerHealthTextCtx = this.playerHealthTextCanvas.getContext('2d');
        this.enemyHealthTextCanvas = document.createElement('canvas');
        this.enemyHealthTextCanvas.height = constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT;
        this.enemyHealthTextCanvas.width = constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH;
        this.enemyHealthTextCtx = this.enemyHealthTextCanvas.getContext('2d');
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
        const enemyPokemon = (0, helper_1.generatePokemon)(this.pokedex[pokemonId.toString()], candidates[pokemonId].level, pokemonId, -1);
        // Set the necessary assets
        this.enemyPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (enemyPokemon.generation + 1), constants_1.c.ASSETS_POKEMON_HEIGHT[enemyPokemon.generation], constants_1.c.ASSETS_POKEMON_WIDTH);
        if (enemyPokemon.generation === this.playerPokemon.generation) {
            this.playerPokemonSprite = this.enemyPokemonSprite;
        }
        else {
            this.playerPokemonSprite = this.loader.loadImageToCanvas('pokemonGeneration' + (this.playerPokemon.generation + 1), constants_1.c.ASSETS_POKEMON_HEIGHT[this.playerPokemon.generation], constants_1.c.ASSETS_POKEMON_WIDTH);
        }
        return enemyPokemon;
    }
    loadGameObjects() {
        this.battleBackground = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 4 * constants_1.c.GAME_WIDTH, ((0.5 + this.encounterMethod / 4) << 0) * constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.BATTLE_ARENA_HEIGHT, 0, 0);
        this.moveSelectorBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, 3 * constants_1.c.BATTLE_ARENA_HEIGHT + 4 * constants_1.c.BATTLE_SCENE_HEIGHT + constants_1.c.ACTION_BOX_HEIGHT + constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.ACTION_BOX_HEIGHT, 0, constants_1.c.BATTLE_ARENA_HEIGHT);
        this.battleDialogueBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, 3 * constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.ACTION_BOX_HEIGHT, 0, constants_1.c.BATTLE_ARENA_HEIGHT);
        this.actionSelectorBox = new game_object_1.GameObject(this.ctx, this.battleAssets, constants_1.c.GAME_WIDTH, 3 * constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.ACTION_BOX_WIDTH, constants_1.c.ACTION_BOX_HEIGHT, constants_1.c.GAME_WIDTH - constants_1.c.ACTION_BOX_WIDTH, constants_1.c.BATTLE_ARENA_HEIGHT);
        this.playerBattleGrounds = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 3 * constants_1.c.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * constants_1.c.BATTLE_SCENE_HEIGHT + 3 * constants_1.c.BATTLE_ARENA_HEIGHT + constants_1.c.ACTION_BOX_HEIGHT, constants_1.c.BATTLE_SCENE_WIDTH, constants_1.c.BATTLE_SCENE_HEIGHT, 240, 100);
        this.playerPokemonObject = new game_object_1.GameObject(this.ctx, this.playerPokemonSprite, this.playerPokemon.xSource + 2 * constants_1.c.POKEMON_SIZE, this.playerPokemon.ySource, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, (constants_1.c.BATTLE_SCENE_WIDTH - constants_1.c.POKEMON_SIZE) / 2, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.POKEMON_SIZE);
        this.playerPokemonObject.setOpacity(0);
        this.playerPokemonAltObject = new game_object_1.GameObject(this.ctx, this.playerPokemonSprite, this.playerPokemon.xSource + 2 * constants_1.c.POKEMON_SIZE + constants_1.c.POKEMON_ALTERNATIVE_OFFSET, this.playerPokemon.ySource, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, (constants_1.c.BATTLE_SCENE_WIDTH - constants_1.c.POKEMON_SIZE) / 2, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.POKEMON_SIZE);
        this.playerPokemonAltObject.setScale(0);
        this.playerPokemonHealthBox = new game_object_1.GameObject(this.ctx, this.battleAssets, 0, constants_1.c.ASSETS_HEALTH_OFFSET, constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT, constants_1.c.GAME_WIDTH, 75);
        this.playerPokemonHealthBar = new game_object_1.GameObject(this.ctx, this.battleAssets, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH + constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET, 48, 2, constants_1.c.GAME_WIDTH + 47, 75 + 17);
        this.playerPokemonHealthText = new game_object_1.GameObject(this.ctx, this.playerHealthTextCanvas, 0, 0, constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT, constants_1.c.GAME_WIDTH, 75);
        this.enemyBattleGrounds = new game_object_1.GameObject(this.ctx, this.battleAssets, this.encounterMethod % 3 * constants_1.c.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * constants_1.c.BATTLE_SCENE_HEIGHT + 3 * constants_1.c.BATTLE_ARENA_HEIGHT + constants_1.c.ACTION_BOX_HEIGHT, constants_1.c.BATTLE_SCENE_WIDTH, constants_1.c.BATTLE_SCENE_HEIGHT, -constants_1.c.BATTLE_SCENE_WIDTH, 48);
        this.enemyPokemonObject = new game_object_1.GameObject(this.ctx, this.enemyPokemonSprite, this.enemyPokemon.xSource, this.enemyPokemon.ySource, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, -(constants_1.c.BATTLE_SCENE_WIDTH + constants_1.c.POKEMON_SIZE) / 2, 48 - constants_1.c.POKEMON_SIZE / 2);
        this.enemyPokemonHealthBox = new game_object_1.GameObject(this.ctx, this.battleAssets, constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH, constants_1.c.ASSETS_ENEMY_HEALTH_HEIGHT, -constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH, 16);
        this.enemyPokemonHealthBar = new game_object_1.GameObject(this.ctx, this.battleAssets, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH + constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET, 48, 2, -constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH + 39, 16 + 17);
        this.enemyPokemonHealthText = new game_object_1.GameObject(this.ctx, this.enemyHealthTextCanvas, 0, 0, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH, constants_1.c.ASSETS_ENEMY_HEALTH_HEIGHT, -constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH, 16);
        this.playerAvatar = new game_object_1.GameObject(this.ctx, this.avatarAssets, constants_1.c.AVATAR_BATTLE_OFFSET, 0, constants_1.c.AVATAR_BATTLE_WIDTH, constants_1.c.AVATAR_BATTLE_HEIGHT, constants_1.c.GAME_WIDTH + constants_1.c.BATTLE_SCENE_WIDTH / 2, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.AVATAR_BATTLE_HEIGHT);
        this.playerAvatar.setAnimation(true, 0, 0, constants_1.c.AVATAR_BATTLE_HEIGHT, 4);
        this.pokeball = new game_object_1.GameObject(this.ctx, this.battleAssets, constants_1.c.POKEBALL_OFFSET_X, constants_1.c.POKEBALL_OFFSET_Y + 37, constants_1.c.POKEBALL_SIZE, constants_1.c.POKEBALL_SIZE, 25, 70);
        this.pokeball.setAnimation(false, 32, 0, constants_1.c.POKEBALL_SIZE, 8);
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
            this.ctx.clearRect(0, 0, constants_1.c.GAME_WIDTH, constants_1.c.GAME_HEIGHT);
            // Return battleData
            return battleData;
        });
    }
    battleFinished() {
        return new Promise((resolve) => {
            // resolve if battle is finished
            if (this.battleStatus === 15 /* Finished */) {
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
    nextBattlePhase(battleStatus = undefined) {
        // Increment battleStatus;
        if (battleStatus) {
            this.battleStatus = battleStatus;
        }
        else {
            this.battleStatus++;
        }
    }
    tick(elapsed) {
        var _a;
        // Calculate the delta between the ticks
        let delta = (elapsed - this._previousElapsed) / 1000.0;
        delta = Math.min(delta, 0.25); // maximum delta of 250 ms
        this._previousElapsed = elapsed;
        if (this.battleStatus === 0 /* SlidePokemonIn */) {
            this.battleBackground.render();
            // Draw enemy pokemon with slide, with avatar, with next phase
            this.drawEnemyPokemon(delta, true);
            // Draw player avatar sliding in
            const isFinished = this.drawAvatar(delta, true, false);
            // Draw action box without the player action selector
            this.drawActionBox(false);
            if (isFinished) {
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 1 /* WriteAppearText */) {
            this.battleBackground.render();
            // Draw enemy pokemon without slide, with avatar, without next phase
            this.drawEnemyPokemon(delta, false);
            // Draw player avatar
            this.drawAvatar(delta, false, false);
            // Draw action box without player action selector
            this.drawActionBox(false);
            // Write appear text to dialogue box, with next phase
            const text = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase() + ' appeared!|';
            const isFinished = this.writeTextToBattleBox(delta, 1, text, 0, 1, 0);
            // Draw enemy health with slide
            this.drawEnemyHealth(delta, true);
            if (isFinished) {
                this.drawActionBox(false);
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 2 /* WriteGoText */) {
            // Write go text to dialogue box, with next phase
            const text = 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!';
            const isFinished = this.writeTextToBattleBox(delta, 1, text, 0, 1, 0);
            if (isFinished) {
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 3 /* ThrowPokemon */) {
            this.battleBackground.render();
            // Draw enemy pokemon without slide
            this.drawEnemyPokemon(delta, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw player pokemon with slide, with throw
            const isFinished = this.drawThrowPlayerPokemon(delta);
            // Draw action box without player action selector
            this.drawActionBox(false);
            // Draw go text to dialogue box
            (0, helper_1.drawText)(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);
            if (isFinished) {
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 4 /* PlayerActionSelect */) {
            // Draw action box with player action selector
            this.drawActionBox(true);
            // Write action select text to dialogue box, without next phase
            (0, helper_1.drawText)(this.ctx, this.font, 'What should ', 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, this.playerPokemon.pokemonName.toUpperCase() + ' do?', 0, 1, 16, 121 + 16);
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
                        this.nextBattlePhase(5 /* PlayerSelectMove */);
                    }
                    else if (this.battleAction === 1) {
                        this.nextBattlePhase(6 /* PlayerBag */);
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
            // Set the offset and column for the battle action selector
            let xOffset = this.battleAction * 46;
            let yColumn = 0;
            if (this.battleAction === 2 || this.battleAction === 3) {
                xOffset = (this.battleAction - 2) * 46;
                yColumn = 1;
            }
            // Draw the action selector
            this.drawActionSelector(constants_1.c.GAME_WIDTH - constants_1.c.ACTION_BOX_WIDTH + 8 + xOffset, constants_1.c.GAME_WIDTH - constants_1.c.ACTION_BOX_WIDTH + 8 + 42 + xOffset, yColumn);
        }
        else if (this.battleStatus === 5 /* PlayerSelectMove */) {
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
                    console.log(this.playerPokemon.pokemonName + ' used ' + this.battleMoveName);
                    this.nextBattlePhase(10 /* PlayerMove */);
                }
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
            this.drawActionSelector(8 + xOffset, 8 + 74 + xOffset, yColumn);
        }
        else if (this.battleStatus === 9 /* PlayerMoveText */) {
            const moveData = this.moveIndex[this.battleMoveName];
            if (moveData.damage_class === 'status') {
                // Non damage move
            }
            else {
                const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' used';
                const text2 = this.battleMoveName.toUpperCase() + '!';
                // Draw action box without player action selector
                this.drawActionBox(false);
                // Damage move
                let isFinished = false;
                if (!this.writeSecondLine) {
                    isFinished = this.writeTextToBattleBox(delta, 0, text1, 0, 1, 0);
                }
                if (isFinished || this.writeSecondLine) {
                    this.writeSecondLine = true;
                    (0, helper_1.drawText)(this.ctx, this.font, text1, 0, 1, 16, 121);
                    const isFinished2 = this.writeTextToBattleBox(delta, 1, text2, 0, 1, 1);
                    if (isFinished2) {
                        this.writeSecondLine = false;
                        this.nextBattlePhase();
                    }
                }
            }
        }
        else if (this.battleStatus === 10 /* PlayerMove */) {
            const text1 = this.playerPokemon.pokemonName.toUpperCase() + ' used';
            const text2 = this.battleMoveName.toUpperCase() + '!';
            this.battleBackground.render();
            // Draw enemy pokemon without slide
            this.drawEnemyPokemon(delta, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
            // Draw player pokemon attack
            const isFinished = this.drawPokemonAttack(delta, true);
            // Draw action box without player action selector
            this.drawActionBox(false);
            // Draw text to dialogue box
            (0, helper_1.drawText)(this.ctx, this.font, text1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
            if (isFinished) {
                this.writeSecondLine = false;
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 11 /* EnemyTakesDamage */) {
            const moveData = this.moveIndex[this.battleMoveName];
            if (this.moveStatus === 0) {
                if (moveData.damage_class === 'status') {
                    this.moveStatus = 2;
                    console.log('pokemon used status move');
                }
                else {
                    this.newHealth = this.enemyPokemon.health - ((_a = this.calculateMoveDamage(true, moveData)) !== null && _a !== void 0 ? _a : 0);
                    this.moveStatus = 1;
                }
            }
            else if (this.moveStatus === 1) {
                if (this.enemyPokemon.health > this.newHealth) {
                    this.enemyPokemon.health -= 16 * delta;
                }
                else {
                    this.enemyPokemon.health = this.newHealth;
                    this.moveStatus = 0;
                    this.nextBattlePhase();
                }
                this.drawEnemyHealth(delta, false);
            }
            else if (this.moveStatus === 2) {
                // Execute status move
            }
        }
        else if (this.battleStatus === 12 /* EnemyMoveText */) {
            const moveData = (0, helper_1.randomFromArray)(this.enemyPokemon.moves);
            if (moveData.damage_class === 'status') {
                // Non damage move
            }
            else {
                const text1 = this.enemyPokemon.pokemonName.toUpperCase() + ' used';
                const text2 = this.battleMoveName.toUpperCase() + '!';
                // Draw action box without player action selector
                this.drawActionBox(false);
                // Damage move
                let isFinished = false;
                if (!this.writeSecondLine) {
                    isFinished = this.writeTextToBattleBox(delta, 0, text1, 0, 1, 0);
                }
                if (isFinished || this.writeSecondLine) {
                    this.writeSecondLine = true;
                    const isFinished2 = this.writeTextToBattleBox(delta, 1, text2, 0, 1, 1);
                    if (isFinished2) {
                        this.writeSecondLine = false;
                        this.nextBattlePhase();
                    }
                }
            }
        }
        else if (this.battleStatus === 13 /* EnemyMove */) {
            const text1 = this.enemyPokemon.pokemonName.toUpperCase() + ' used';
            const text2 = this.battleMoveName.toUpperCase() + '!';
            this.battleBackground.render();
            // Draw enemy pokemon without slide
            this.drawEnemyPokemon(delta, false);
            // Draw enemy health without slide
            this.drawEnemyHealth(delta, false);
            // Draw player health without slide
            this.drawPlayerHealth(delta, false);
            // Draw player pokemon attack
            const isFinished = this.drawPokemonAttack(delta, false);
            // Draw action box without player action selector
            this.drawActionBox(false);
            // Draw text to dialogue box
            (0, helper_1.drawText)(this.ctx, this.font, text1, 0, 1, 16, 121);
            (0, helper_1.drawText)(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
            if (isFinished) {
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 14 /* PlayerTakesDamage */) {
            //   if (moveData.damage_class === 'status') {
            //     // Non damage move
            //   } else {
            //     // Draw action box without player action selector
            //   }
            // } else if (this.battleStatus === BattleStatus.PlayerTakesDamage) {
            //   if (this.moveStatus === 0) {
            //     const moveData: MoveType = randomFromArray(this.enemyPokemon.moves);
            //     if (moveData.damage_class === 'status') {
            //       this.moveStatus = 2;
            //       console.log('pokemon used status move');
            //     } else {
            //       this.newHealth = this.enemyPokemon.health - (this.calculateMoveDamage(false, moveData) ?? 0);
            //       this.moveStatus = 1;
            //       console.log(this.newHealth);
            //     }
            //   } else if (this.moveStatus === 1) {
            //     if (this.enemyPokemon.health > this.newHealth) {
            //       this.enemyPokemon.health -= 16 * delta;
            //     } else {
            //       this.enemyPokemon.health = this.newHealth;
            //       this.moveStatus = 0;
            //       this.nextBattlePhase();
            //     }
            //     this.drawPlayerHealth(delta, false);
            //   } else if (this.moveStatus === 2) {
            //     // Execute status move
            //   }
        }
        // Reset keyDown variable if not down anymore
        if (!keyboard_1.keyboard.isDown(keyboard_1.keyboard.LEFT) && !keyboard_1.keyboard.isDown(keyboard_1.keyboard.RIGHT) &&
            !keyboard_1.keyboard.isDown(keyboard_1.keyboard.UP) && !keyboard_1.keyboard.isDown(keyboard_1.keyboard.DOWN) &&
            !keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
            this.keyDown = false;
        }
        if (this.battleStatus !== 15 /* Finished */) {
            // If battle is not finished request new animation frame
            window.requestAnimationFrame(this.tick.bind(this));
        }
    }
    calculateMoveDamage(playerAttack, moveData) {
        const attacker = playerAttack ? this.playerPokemon : this.enemyPokemon;
        const defender = playerAttack ? this.enemyPokemon : this.playerPokemon;
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
            type = type * this.getTypeEffectiveness(defender.types[i].type, moveData.type);
        }
        // Get a random value between 85-100 inclusive
        const random = (0, helper_1.randomFromMinMax)(85, 100);
        // Calculate the damage
        if (power) {
            const damage = (((((2 * level) / 5 + 2) * power * (attackStat / defenseStat)) / 50) * burn * screen * targets * weather * ff + 2) * crit * wbr * charge * hh * stab * type * random;
            return (damage / 100) << 0;
        }
    }
    getTypeEffectiveness(defenderType, moveType) {
        return constants_1.c.TYPES_EFFECTIVENESS[18 * ((constants_1.c.TYPES.indexOf(moveType) / 18) << 0) + constants_1.c.TYPES.indexOf(defenderType)];
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
            this.pokeball.updateSourcePosition(constants_1.c.POKEBALL_OFFSET_X + this.playerPokemon.pokeball * constants_1.c.POKEBALL_SIZE, constants_1.c.POKEBALL_OFFSET_Y + 37);
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
    drawPokemonAttack(delta, playerAttack) {
        const speed = 160;
        // Draw battle grounds player pokemon
        this.playerBattleGrounds.render();
        // Set gameObjects and base x and y positions for the pokemon
        let attacker, defender, xPosAttacker, yPosAttacker, xPosDefender, yPosDefender;
        if (playerAttack) {
            attacker = this.playerPokemonObject;
            defender = this.enemyPokemonObject;
            xPosAttacker = (constants_1.c.BATTLE_SCENE_WIDTH - constants_1.c.POKEMON_SIZE) / 2;
            yPosAttacker = constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.POKEMON_SIZE;
            xPosDefender = constants_1.c.GAME_WIDTH - (constants_1.c.BATTLE_SCENE_WIDTH + constants_1.c.POKEMON_SIZE) / 2;
            yPosDefender = 48 - constants_1.c.POKEMON_SIZE / 2;
        }
        else {
            attacker = this.enemyPokemonObject;
            defender = this.playerPokemonObject;
            xPosDefender = (constants_1.c.BATTLE_SCENE_WIDTH - constants_1.c.POKEMON_SIZE) / 2;
            yPosDefender = constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.POKEMON_SIZE;
            xPosAttacker = constants_1.c.GAME_WIDTH - (constants_1.c.BATTLE_SCENE_WIDTH + constants_1.c.POKEMON_SIZE) / 2;
            yPosAttacker = 48 - constants_1.c.POKEMON_SIZE / 2;
        }
        // Draw the correct animation
        let forwardFinished = false;
        let backwardFinished = false;
        let forwardFinished2 = false;
        let backwardFinished2 = false;
        if (!this.attackHalfWay) {
            forwardFinished = attacker.animate(delta, speed, 1, 0, xPosAttacker + 20, yPosAttacker, true);
        }
        if (forwardFinished || this.attackHalfWay) {
            this.attackHalfWay = true;
            backwardFinished = attacker.animate(delta, speed, -1, 0, xPosAttacker, yPosAttacker, true);
        }
        // Reset variable for next attack
        if (backwardFinished) {
            this.attackHalfWay = false;
        }
        if (this.attackHalfWay && !this.defenseHalfWay) {
            forwardFinished2 = defender.animate(delta, speed, 1, 0, xPosDefender + 10, yPosDefender, true);
        }
        if (forwardFinished2 || this.defenseHalfWay) {
            this.defenseHalfWay = true;
            backwardFinished2 = defender.animate(delta, speed, -1, 0, xPosDefender, yPosDefender, true);
        }
        // Reset variable for next attack
        if (backwardFinished2) {
            this.defenseHalfWay = false;
        }
        return backwardFinished2;
    }
    drawPlayerHealth(delta, slideIn) {
        const speedHealth = 224;
        // Draw player health box
        this.playerPokemonHealthBox.animate(delta, speedHealth, -1, 0, 127, 75, true);
        // Calculate variables for drawing the health bar
        const healthFrac = this.playerPokemon.health / this.playerPokemon.stats.hp;
        const healthBarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2 : 0;
        const healthBarWidth = (healthFrac * 48) << 0;
        // Draw player health bar
        this.playerPokemonHealthBar.updateSourcePosition(constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH + constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET + healthBarOffset);
        this.playerPokemonHealthBar.setWidth(healthBarWidth);
        if (slideIn) {
            this.playerPokemonHealthBar.animate(delta, speedHealth, -1, 0, 127 + 47, 75 + 17, true);
        }
        else {
            this.playerPokemonHealthBar.render();
        }
        if (this.playerHealthTextCtx) {
            // Draw the pokemon name, gender, and level
            const nameText = this.playerPokemon.pokemonName.toUpperCase() + ((this.playerPokemon.gender) ? '#' : '^');
            const healthText = this.playerPokemon.health.toString().padStart(3, '_') + '/' + this.playerPokemon.stats.hp.toString().padStart(3, '_');
            (0, helper_1.drawText)(this.playerHealthTextCtx, this.font, nameText, 1, 0, 14, 6);
            (0, helper_1.drawText)(this.playerHealthTextCtx, this.font, this.playerPokemon.level.toString(), 1, 0, 84, 6);
            (0, helper_1.drawText)(this.playerHealthTextCtx, this.font, healthText, 1, 0, 59, 22);
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
        this.playerPokemonHealthBar.updateSourcePosition(constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH + constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET + healthBarOffset);
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
            (0, helper_1.drawText)(this.enemyHealthTextCtx, this.font, nameText, 1, 0, 6, 6);
            (0, helper_1.drawText)(this.enemyHealthTextCtx, this.font, this.enemyPokemon.level.toString(), 1, 0, 76, 6);
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
            isFinished = this.playerAvatar.animate(delta, speed, -1, 0, constants_1.c.BATTLE_SCENE_WIDTH / 2, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.AVATAR_BATTLE_HEIGHT, true);
        }
        else if (slideOut) {
            // Next animation frame and animate
            this.playerAvatar.animationTrigger(1);
            const isFinishedFirstSprite = this.playerAvatar.animate(delta, speed, -1, 0, -16, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.AVATAR_BATTLE_HEIGHT, false);
            // Next animation frame and animate
            if (isFinishedFirstSprite) {
                this.playerAvatar.animationTrigger(2);
                isFinished = this.playerAvatar.animate(delta, speed, -1, 0, -36, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.AVATAR_BATTLE_HEIGHT, false);
            }
            // Next animation frame and animate
            if (isFinished) {
                this.playerAvatar.animationTrigger(3);
                this.playerAvatar.animate(delta, speed, -1, 0, -constants_1.c.AVATAR_BATTLE_WIDTH, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.AVATAR_BATTLE_HEIGHT, false);
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
    drawEnemyPokemon(delta, slideIn) {
        const speed = 176;
        const x = constants_1.c.GAME_WIDTH - (constants_1.c.BATTLE_SCENE_WIDTH + constants_1.c.POKEMON_SIZE) / 2;
        const y = 48 - constants_1.c.POKEMON_SIZE / 2;
        if (slideIn) {
            // Draw battle grounds enemy pokemon
            this.enemyBattleGrounds.animate(delta, speed, 1, 0, constants_1.c.GAME_WIDTH - constants_1.c.BATTLE_SCENE_WIDTH, 48, true);
            // Set alpha of enemy pokemon when sliding in
            this.enemyPokemonObject.setOpacity(0.8);
            // Draw enemy pokemon
            this.enemyPokemonObject.animate(delta, speed, 1, 0, x, y, true);
        }
        else {
            // Draw battle grounds enemy pokemon
            this.enemyBattleGrounds.render();
            this.enemyPokemonObject.setOpacity(1);
            this.enemyPokemonObject.render();
        }
    }
    writeTextToBattleBox(delta, delayAfter, text, fontsize, fontColor, textLine) {
        const speed = 16;
        const yText = 121 + 16 * textLine;
        const i = (this.X_writeTextToBattleBox + delta * speed) << 0;
        const textToDisplay = text.slice(0, i);
        // Draw the text
        (0, helper_1.drawText)(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
        if (i < text.length + delayAfter * delta * 1792) {
            this.X_writeTextToBattleBox += delta * speed;
        }
        else {
            this.X_writeTextToBattleBox = 0;
            return true;
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