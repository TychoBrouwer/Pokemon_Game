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
        this.latestMoveDamage = null;
        this.damageCalculated = false;
        this.X_slidePokemonIn = 0;
        this.X_slideEnemyHealth = 0;
        this.X_slidePlayerHealth = 0;
        this.X_avatarThrow = 0;
        this.X_thrownPokeball = 0;
        this.X_pokemonAttack = 0;
        this.animation = 0;
        this.pokemonAlternativeOpacity = 1;
        // private pokemonAttackAnimation = 0;
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
            if (this.battleStatus === 11 /* Finished */) {
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
        // Reset animation counter
        this.animation = 0;
        // Increment battleStatus;
        if (battleStatus) {
            this.battleStatus = battleStatus;
        }
        else {
            this.battleStatus++;
        }
    }
    tick(elapsed) {
        // Calculate the delta between the ticks
        let delta = (elapsed - this._previousElapsed) / 1000.0;
        delta = Math.min(delta, 0.25); // maximum delta of 250 ms
        this._previousElapsed = elapsed;
        if (this.battleStatus === 0 /* SlidePokemonIn */) {
            this.drawBattleArena();
            // Draw enemy pokemon with slide, with avatar, with next phase
            this.drawEnemyPokemon(delta, true);
            // Draw player avatar sliding in
            const counter = this.drawAvatar(delta, true);
            // Draw action box without the player action selector
            this.drawActionBox(false);
            if (counter >= constants_1.c.GAME_WIDTH) {
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 1 /* WriteAppearText */) {
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
        }
        else if (this.battleStatus === 2 /* WriteGoText */) {
            // Write go text to dialogue box, with next phase
            const text = 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!';
            const counter = this.writeTextToBattleBox(text, 0, 1, delta, 1, 0);
            if (counter >= text.length + 10) {
                this.X_writeTextToBattleBox = 0;
                this.nextBattlePhase();
            }
        }
        else if (this.battleStatus === 3 /* ThrowPokemon */) {
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
            (0, helper_1.drawText)(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);
            if (counter <= -500) {
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
            this.drawMoveSelectionBox();
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
                    this.nextBattlePhase(9 /* PlayerMove */);
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
        else if (this.battleStatus === 9 /* PlayerMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            if (moveData.damage_class === 'status') {
                // Non damage move
            }
            else {
                // Damage move
                if (this.damageCalculated === false) {
                    console.log(this.enemyPokemon.health);
                    const damage = this.calculateMoveDamage(true, moveData);
                    this.enemyPokemon.health -= damage ? damage : 0;
                    this.damageCalculated = true;
                    console.log(this.enemyPokemon.health);
                    // Draw action box without player action selector
                    this.drawActionBox(false);
                }
                else {
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
                            (0, helper_1.drawText)(this.ctx, this.font, text1, 0, 1, 16, 121);
                            (0, helper_1.drawText)(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
                            if (counter === 0) {
                                this.nextBattlePhase();
                            }
                        }
                    }
                }
            }
        }
        else if (this.battleStatus === 10 /* EnemyTakesDamage */) {
            console.log('test');
        }
        // Reset keyDown variable if not down anymore
        if (!keyboard_1.keyboard.isDown(keyboard_1.keyboard.LEFT) && !keyboard_1.keyboard.isDown(keyboard_1.keyboard.RIGHT) &&
            !keyboard_1.keyboard.isDown(keyboard_1.keyboard.UP) && !keyboard_1.keyboard.isDown(keyboard_1.keyboard.DOWN) &&
            !keyboard_1.keyboard.isDown(keyboard_1.keyboard.ENTER)) {
            this.keyDown = false;
        }
        if (this.battleStatus !== 11 /* Finished */) {
            // If battle is not finished request new animation frame
            window.requestAnimationFrame(this.tick.bind(this));
        }
    }
    calculateMoveDamage(playerSide, moveData) {
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
        const types = [
            'normal', 'fight', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel',
            'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy',
        ];
        const typesEffectiveness = [
            1, 1, 1, 1, 1, 0.5, 1, 0, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            2, 1, 0.5, 0.5, 1, 2, 0.5, 0, 2, 1, 1, 1, 1, 0.5, 2, 1, 2, 0.5,
            1, 2, 1, 1, 1, 0.5, 2, 1, 0.5, 1, 1, 2, 0.5, 1, 1, 1, 1, 1,
            1, 1, 1, 0.5, 0.5, 0.5, 1, 0.5, 0, 1, 1, 2, 1, 1, 1, 1, 1, 2,
            1, 1, 0, 2, 1, 2, 0.5, 1, 2, 2, 1, 0.5, 2, 1, 1, 1, 1, 1,
            1, 0.5, 2, 1, 0.5, 1, 3, 1, 0.5, 2, 1, 1, 1, 1, 2, 1, 1, 1,
            1, 0.5, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 0.5, 1, 2, 1, 2, 1, 1, 2, 0.5,
            0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0.5, 1,
            1, 1, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 0.5, 1, 0.5, 1, 2, 1, 1, 2,
            1, 1, 1, 1, 1, 0.5, 2, 1, 2, 0.5, 0.5, 2, 1, 1, 2, 0.5, 1, 1,
            1, 1, 1, 1, 2, 2, 1, 1, 1, 2, 0.5, 0.5, 1, 1, 1, 0.5, 1, 1,
            1, 1, 0.5, 0.5, 2, 2, 0.5, 1, 0.5, 0.5, 2, 0.5, 1, 1, 1, 0.5, 1, 1,
            1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 2, 0.5, 0.5, 1, 1, 0.5, 1, 1,
            1, 2, 1, 2, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 0, 1,
            1, 1, 2, 1, 2, 1, 1, 1, 0.5, 0.5, 0.5, 2, 1, 1, 0.5, 2, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 1, 2, 1, 2,
            1, 0.5, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0.5, 0.5,
            1, 2, 1, 0.5, 1, 1, 1, 1, 0.5, 0.5, 1, 1, 1, 1, 1, 2, 2, 1,
        ];
        return typesEffectiveness[18 * ((types.indexOf(moveType) / 18) << 0) + types.indexOf(defenderType)];
    }
    drawEnemyPokemon(delta, slideIn) {
        // Calculate xPixel for the enemy pokemon
        let xPixel;
        if (slideIn) {
            const speed = 176;
            xPixel = (this.X_slidePokemonIn + delta * speed) << 0;
        }
        else {
            xPixel = constants_1.c.GAME_WIDTH;
        }
        // Draw battle grounds enemy pokemon
        this.ctx.drawImage(this.battleAssets, this.encounterMethod % 3 * constants_1.c.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * constants_1.c.BATTLE_SCENE_HEIGHT + 3 * constants_1.c.BATTLE_ARENA_HEIGHT + constants_1.c.ACTION_BOX_HEIGHT, constants_1.c.BATTLE_SCENE_WIDTH, constants_1.c.BATTLE_SCENE_HEIGHT, xPixel - constants_1.c.BATTLE_SCENE_WIDTH, 48, constants_1.c.BATTLE_SCENE_WIDTH, constants_1.c.BATTLE_SCENE_HEIGHT);
        // Set alpha of enemy pokemon when sliding in
        if (slideIn) {
            this.ctx.globalAlpha = 0.8;
        }
        // Draw enemy pokemon
        this.ctx.drawImage(this.enemyPokemonSprite, this.enemyPokemon.xSource, this.enemyPokemon.ySource, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, xPixel - 0.75 * constants_1.c.BATTLE_SCENE_WIDTH, 48 - constants_1.c.POKEMON_SIZE / 2, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE);
        this.ctx.globalAlpha = 1;
    }
    drawAvatar(delta, slideIn) {
        const speed = 176;
        let xPixel;
        if (slideIn) {
            // Calculate xPixel for the enemy pokemon
            xPixel = (this.X_slidePokemonIn + delta * speed) << 0;
        }
        else {
            xPixel = constants_1.c.GAME_WIDTH;
        }
        // Draw battle grounds player pokemon
        this.drawPlayerBattleGrounds(constants_1.c.GAME_WIDTH - xPixel);
        // Draw the player avatar
        this.ctx.drawImage(this.avatarAssets, constants_1.c.AVATAR_BATTLE_OFFSET, 0, constants_1.c.AVATAR_BATTLE_WIDTH, constants_1.c.AVATAR_BATTLE_HEIGHT, constants_1.c.GAME_WIDTH - xPixel + 0.5 * constants_1.c.BATTLE_SCENE_WIDTH, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.AVATAR_BATTLE_HEIGHT, constants_1.c.AVATAR_BATTLE_WIDTH, constants_1.c.AVATAR_BATTLE_HEIGHT);
        // Update variables
        this.X_slidePokemonIn += delta * speed;
        return xPixel;
    }
    drawEnemyHealth(delta, slideIn) {
        const speed = 224;
        let xPixel = 0;
        if (slideIn) {
            // Calculate xPixel for the enemy pokemon
            xPixel = (this.X_slideEnemyHealth + delta * speed - constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH) << 0;
            if (xPixel > 13) {
                xPixel = 13;
            }
        }
        else {
            xPixel = 13;
        }
        // Draw enemy health box
        this.ctx.drawImage(this.battleAssets, constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH, constants_1.c.ASSETS_ENEMY_HEALTH_HEIGHT, xPixel, 16, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH, constants_1.c.ASSETS_ENEMY_HEALTH_HEIGHT);
        // Calculate variables for drawing the health bar
        const healthFrac = this.enemyPokemon.health / this.enemyPokemon.stats.hp;
        const healthbarWidth = (healthFrac * 48) << 0;
        const healthbarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2 : 0;
        // Draw enemy health bar
        this.ctx.drawImage(this.battleAssets, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH + constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET + healthbarOffset, healthbarWidth, 2, xPixel + 39, 16 + 17, healthbarWidth, 2);
        // Draw the pokemon name, gender, and level
        (0, helper_1.drawText)(this.ctx, this.font, this.enemyPokemon.pokemonName.toUpperCase() + ((this.enemyPokemon.gender) ? '#' : '^'), 1, 0, xPixel - 13 + 20, 22);
        (0, helper_1.drawText)(this.ctx, this.font, this.enemyPokemon.level.toString(), 1, 0, xPixel - 13 + 89, 22);
        // Update variable
        this.X_slideEnemyHealth += delta * speed;
    }
    drawPlayerPokemon(delta, throwPokemon) {
        const speed = 176;
        const speedPokeball = 48;
        // Calculate xPixel for the pokemon position
        const xPixel = this.X_avatarThrow << 0;
        // Calculate the offset for the player avatar throw sprites
        const assetOffset = (xPixel > -80) ? constants_1.c.AVATAR_BATTLE_HEIGHT :
            (xPixel > -100) ? 2 * constants_1.c.AVATAR_BATTLE_HEIGHT :
                3 * constants_1.c.AVATAR_BATTLE_HEIGHT;
        let xPixelPokeball = 0;
        // Draw battle grounds player pokemon
        this.drawPlayerBattleGrounds(0);
        if (throwPokemon) {
            if (xPixel < -100) {
                // Calculate counter for pokeball animation
                this.animation = this.animation < 7.2 ? this.animation + 30 * delta : 0;
                // Calculate the x and y for the pokeball
                xPixelPokeball = (this.X_thrownPokeball + delta * speedPokeball) << 0;
                const yPixelPokeball = (0.08 * Math.pow(xPixelPokeball, 2) - 2.2 * xPixelPokeball + 70) << 0;
                // Draw the pokeball
                this.ctx.drawImage(this.battleAssets, constants_1.c.POKEBALL_OFFSET_X + this.playerPokemon.pokeball * constants_1.c.POKEBALL_SIZE, constants_1.c.POKEBALL_OFFSET_Y + 37 + (this.animation << 0) * constants_1.c.POKEBALL_SIZE, constants_1.c.POKEBALL_SIZE, constants_1.c.POKEBALL_SIZE, xPixelPokeball + 25, yPixelPokeball, constants_1.c.POKEBALL_SIZE, constants_1.c.POKEBALL_SIZE);
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
            this.ctx.drawImage(this.playerPokemonSprite, this.playerPokemon.xSource + 2 * constants_1.c.POKEMON_SIZE + constants_1.c.POKEMON_ALTERNATIVE_OFFSET, this.playerPokemon.ySource, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, (0.5 * (constants_1.c.BATTLE_SCENE_WIDTH - constants_1.c.POKEMON_SIZE) + 0.5 * (constants_1.c.POKEMON_SIZE - constants_1.c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0), (constants_1.c.BATTLE_ARENA_HEIGHT - (constants_1.c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0) + 1, (constants_1.c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0, (constants_1.c.POKEMON_SIZE * (xPixelPokeball - 35) / 35) << 0);
        }
        if (xPixelPokeball >= 70) {
            // Calculate the opacity for the appearing pokemon
            const opacity = (this.pokemonAlternativeOpacity > 0) ? this.pokemonAlternativeOpacity : 0;
            this.ctx.globalAlpha = 1 - opacity;
            // Draw appearing pokemon
            this.ctx.drawImage(this.playerPokemonSprite, this.playerPokemon.xSource + 2 * constants_1.c.POKEMON_SIZE, this.playerPokemon.ySource, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, 0.5 * (constants_1.c.BATTLE_SCENE_WIDTH - constants_1.c.POKEMON_SIZE), constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE);
            // Update variable
            this.pokemonAlternativeOpacity -= delta * 8;
            // Draw player health
            this.drawPlayerHealth(delta, true);
        }
        this.ctx.globalAlpha = 1;
        // Player slide out animation
        this.ctx.drawImage(this.avatarAssets, constants_1.c.AVATAR_BATTLE_OFFSET, assetOffset, constants_1.c.AVATAR_BATTLE_WIDTH, constants_1.c.AVATAR_BATTLE_HEIGHT, 0.5 * constants_1.c.BATTLE_SCENE_WIDTH + xPixel, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.AVATAR_BATTLE_HEIGHT, constants_1.c.AVATAR_BATTLE_WIDTH, constants_1.c.AVATAR_BATTLE_HEIGHT);
        return xPixel;
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
    writeTextToBattleBox(text, fontsize, fontColor, delta, delayAfter, textLine) {
        const speed = 304;
        const yText = 121 + 16 * textLine;
        const i = ((this.X_writeTextToBattleBox + delta * speed) / 6) << 0;
        const textToDisplay = text.slice(0, i);
        // Draw the text
        (0, helper_1.drawText)(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
        // If text writing is finished
        if (i < text.length + delayAfter * speed / 6) {
            this.X_writeTextToBattleBox += delta * speed;
        }
        return i;
    }
    drawPlayerBattleGrounds(xPixel) {
        // Draw battle grounds player pokemon
        this.ctx.drawImage(this.battleAssets, this.encounterMethod % 3 * constants_1.c.BATTLE_SCENE_WIDTH, ((0.5 + this.encounterMethod / 3) << 0) * constants_1.c.BATTLE_SCENE_HEIGHT + 3 * constants_1.c.BATTLE_ARENA_HEIGHT + constants_1.c.ACTION_BOX_HEIGHT, constants_1.c.BATTLE_SCENE_WIDTH, constants_1.c.BATTLE_SCENE_HEIGHT, xPixel, 100, constants_1.c.BATTLE_SCENE_WIDTH, constants_1.c.BATTLE_SCENE_HEIGHT);
    }
    drawPlayerHealth(delta, slideIn) {
        const speedHealth = 224;
        // Calculate x for the player health box
        let xPixelPlayerHealth = (this.X_slidePlayerHealth - delta * speedHealth + constants_1.c.GAME_WIDTH) << 0;
        // Maximize the xPixel to 127
        if (xPixelPlayerHealth < 127)
            xPixelPlayerHealth = 127;
        // Draw player health box
        this.ctx.drawImage(this.battleAssets, 0, constants_1.c.ASSETS_HEALTH_OFFSET, constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT, xPixelPlayerHealth, 75, constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT);
        // Calculate variables for drawing the health bar
        const healthFrac = this.playerPokemon.health / this.playerPokemon.stats.hp;
        const healthbarOffset = (healthFrac < 0.2) ? 4 : (healthFrac < 0.5) ? 2 : 0;
        const healthbarWidth = (healthFrac * 48) << 0;
        // Draw enemy health bar
        this.ctx.drawImage(this.battleAssets, constants_1.c.ASSETS_ENEMY_HEALTH_WIDTH + constants_1.c.ASSETS_PLAYER_HEALTH_WIDTH, constants_1.c.ASSETS_HEALTH_OFFSET + healthbarOffset, healthbarWidth, 2, xPixelPlayerHealth + 47, 75 + 17, healthbarWidth, 2);
        // Draw the pokemon name, gender, and level
        const nameText = this.playerPokemon.pokemonName.toUpperCase() + ((this.playerPokemon.gender) ? '#' : '^');
        const healthText = this.playerPokemon.health.toString().padStart(3, '_') + '/' + this.playerPokemon.stats.hp.toString().padStart(3, '_');
        (0, helper_1.drawText)(this.ctx, this.font, nameText, 1, 0, xPixelPlayerHealth + 14, 74 + 6);
        (0, helper_1.drawText)(this.ctx, this.font, this.playerPokemon.level.toString(), 1, 0, xPixelPlayerHealth + 84, 75 + 6);
        (0, helper_1.drawText)(this.ctx, this.font, healthText, 1, 0, xPixelPlayerHealth + 59, 75 + 22);
        // Update variable
        if (slideIn) {
            this.X_slidePlayerHealth -= delta * speedHealth;
        }
    }
    drawBattleArena() {
        // Draw the battle scene background
        this.ctx.drawImage(this.battleAssets, this.encounterMethod % 4 * constants_1.c.GAME_WIDTH, ((0.5 + this.encounterMethod / 4) << 0) * constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.BATTLE_ARENA_HEIGHT, 0, 0, constants_1.c.GAME_WIDTH, constants_1.c.BATTLE_ARENA_HEIGHT);
    }
    drawActionBox(actionChoice) {
        // Draw the battle dialogue box
        this.ctx.drawImage(this.battleAssets, 0, 3 * constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.ACTION_BOX_HEIGHT, 0, constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.ACTION_BOX_HEIGHT);
        // Draw the player action choice box
        if (actionChoice) {
            this.ctx.drawImage(this.battleAssets, constants_1.c.GAME_WIDTH, 3 * constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.ACTION_BOX_WIDTH, constants_1.c.ACTION_BOX_HEIGHT, constants_1.c.GAME_WIDTH - constants_1.c.ACTION_BOX_WIDTH, constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.ACTION_BOX_WIDTH, constants_1.c.ACTION_BOX_HEIGHT);
        }
    }
    drawMoveSelectionBox() {
        // Draw the move selection box
        this.ctx.drawImage(this.battleAssets, 0, 3 * constants_1.c.BATTLE_ARENA_HEIGHT + 4 * constants_1.c.BATTLE_SCENE_HEIGHT + constants_1.c.ACTION_BOX_HEIGHT + constants_1.c.ASSETS_PLAYER_HEALTH_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.ACTION_BOX_HEIGHT, 0, constants_1.c.BATTLE_ARENA_HEIGHT, constants_1.c.GAME_WIDTH, constants_1.c.ACTION_BOX_HEIGHT);
    }
    drawPokemonAttack(delta, isPlayer) {
        const speed = 128;
        this.X_pokemonAttack = this.X_pokemonAttack + speed * delta;
        const xPixelOffset = (this.X_pokemonAttack < 10) ? this.X_pokemonAttack : (this.X_pokemonAttack < 30) ? 30 - this.X_pokemonAttack : 0;
        // Draw battle grounds player pokemon
        this.drawPlayerBattleGrounds(0);
        // Draw player health
        this.drawPlayerHealth(delta, false);
        this.ctx.drawImage(this.playerPokemonSprite, this.playerPokemon.xSource + 2 * constants_1.c.POKEMON_SIZE, this.playerPokemon.ySource, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, 0.5 * (constants_1.c.BATTLE_SCENE_WIDTH - constants_1.c.POKEMON_SIZE) + xPixelOffset, constants_1.c.BATTLE_ARENA_HEIGHT - constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE, constants_1.c.POKEMON_SIZE);
        return xPixelOffset;
    }
}
exports.PokemonBattle = PokemonBattle;
//# sourceMappingURL=pokemon_battle.js.map