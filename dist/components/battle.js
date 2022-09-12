import * as pokedex from '../data/pokedex.json';
import * as moveIndex from '../data/move_index.json';
import * as itemIndex from '../data/item_index.json';
import * as encounterTable from '../data/encounter_table.json';
import { GameObject } from '../utils/game_object';
import { Battler } from './battler';
import { randomFromArray, generatePokemon, drawText, randomFromMinMax } from '../utils/helper';
import { keyboard } from '../utils/keyboard';
import { ACTION_BOX_HEIGHT, ACTION_BOX_WIDTH, BATTLE_ARENA_HEIGHT, BATTLE_SCENE_HEIGHT, BATTLE_SCENE_WIDTH, NORMAL_STAGES, POKEBALL_SIZE, POKEMON_SIZE, SPECIAL_STAGES } from '../constants/battle_constants';
import { AVATAR_BATTLE_HEIGHT, AVATAR_BATTLE_WIDTH, FONT_HEIGHT, GAME_HEIGHT, GAME_WIDTH } from '../constants/game_constants';
import { BAG_POCKETS } from '../constants/bag_constants';
import { POKE_BALLS } from '../constants/items_constants';
import { TYPES_EFFECTIVENESS, TYPES } from '../constants/mon_constants';
import { ASSET_PLAYER_HEALTH_HEIGHT, ASSET_POKEBALL_OFFSET_X, ASSET_AVATAR_BATTLE_OFFSET, ASSET_POKEBALL_OFFSET_Y, ASSET_BAG_OFFSET, ASSET_BAG_WIDTH, ASSET_BAG_HEIGHT, ASSET_BAG_POK_SIZE, ASSET_BAG_SEL_WIDTH, ASSET_BAG_SEL_HEIGHT, } from '../constants/asset_constants';
export class Battle {
    constructor(context, overlayCtx, loader, player, route, encounterMethod) {
        this.battleAction = 0;
        this.escapeAttempts = 0;
        this.battleMove = 0;
        this.battleMoveName = '';
        this.battleResultWin = false;
        this.turnsPassed = -1;
        this.currentBattler = 0;
        this.currentTarget = 1;
        this.bagSelected = 0;
        this.bagSwitchLeft = false;
        this.bagSelectedItem = 0;
        this.bagSelectedOffset = 0;
        this.selectedConfirm = true;
        this.previousElapsed = 0;
        this.delayStart = -1;
        this.battleStatus = 0;
        this.statusAfterFadeOut = 35 /* FadeIn */;
        this.statusAfterFadeIn = 37 /* Finished */;
        this.keyDown = false;
        this.newHealth = -1;
        this.newXp = -1;
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
        this.battleAssets = this.loader.getImageCanvas('battleAssets');
        this.font = this.loader.getImageCanvas('font');
        this.avatarAssets = this.loader.getImageCanvas('avatar');
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
        this.bagTextCanvas = document.createElement('canvas');
        this.bagTextCanvas.height = FONT_HEIGHT[0];
        this.bagTextCanvas.width = 64;
        this.bagTextCtx = this.bagTextCanvas.getContext('2d');
        this.pokeBallXSource = ASSET_POKEBALL_OFFSET_X + 8 * POKEBALL_SIZE;
        console.log(this.enemyPokemon);
        console.log(this.playerPokemon);
        this.battlers = [];
        this.battlers[0] = new Battler(this.ctx, this.loader, this.playerPokemon, 0, this.encounterMethod, this.genderOffsets);
        this.battlers[1] = new Battler(this.ctx, this.loader, this.enemyPokemon, 1, this.encounterMethod, this.genderOffsets);
    }
    setGenderVariables(male) {
        if (male) {
            this.genderOffsets = {
                ASSET_AVATAR_OFFSET: 4 * AVATAR_BATTLE_HEIGHT,
                ASSET_BAG_BG_OFFSET: GAME_WIDTH,
                ASSET_BAG_OFFSET: ASSET_BAG_HEIGHT,
                ASSET_BAG_SEL_OFFSET: 5 * ASSET_BAG_SEL_HEIGHT,
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
        const pokemonId = randomFromArray(candidateIds);
        // Generate enemy pokemon
        const enemyPokemon = generatePokemon(this.pokedex[pokemonId.toString()], candidates[pokemonId].level, pokemonId, -1);
        // Set the necessary assets
        this.enemyPokemonSprite = this.loader.getImageCanvas('pokemonGeneration' + (enemyPokemon.generation + 1));
        if (enemyPokemon.generation === this.playerPokemon.generation) {
            this.playerPokemonSprite = this.enemyPokemonSprite;
        }
        else {
            this.playerPokemonSprite = this.loader.getImageCanvas('pokemonGeneration' + (this.playerPokemon.generation + 1));
        }
        return enemyPokemon;
    }
    loadGameObjects() {
        this.battleBackground = new GameObject(this.ctx, this.battleAssets, false, this.encounterMethod % 4 * GAME_WIDTH, ((0.5 + this.encounterMethod / 4) << 0) * BATTLE_ARENA_HEIGHT, GAME_WIDTH, BATTLE_ARENA_HEIGHT, 0, 0);
        this.moveSelectorBox = new GameObject(this.ctx, this.battleAssets, false, 0, 3 * BATTLE_ARENA_HEIGHT + 4 * BATTLE_SCENE_HEIGHT + ACTION_BOX_HEIGHT + ASSET_PLAYER_HEALTH_HEIGHT, GAME_WIDTH, ACTION_BOX_HEIGHT, 0, BATTLE_ARENA_HEIGHT);
        this.battleDialogueBox = new GameObject(this.ctx, this.battleAssets, false, 0, 3 * BATTLE_ARENA_HEIGHT, GAME_WIDTH, ACTION_BOX_HEIGHT, 0, BATTLE_ARENA_HEIGHT);
        this.actionSelectorBox = new GameObject(this.ctx, this.battleAssets, false, GAME_WIDTH, 3 * BATTLE_ARENA_HEIGHT, ACTION_BOX_WIDTH, ACTION_BOX_HEIGHT, GAME_WIDTH - ACTION_BOX_WIDTH, BATTLE_ARENA_HEIGHT);
        this.playerPokemonObject = new GameObject(this.ctx, this.playerPokemonSprite, true, this.playerPokemon.xSource + 2 * POKEMON_SIZE, this.playerPokemon.ySource, POKEMON_SIZE, POKEMON_SIZE, (BATTLE_SCENE_WIDTH - POKEMON_SIZE) / 2, BATTLE_ARENA_HEIGHT - POKEMON_SIZE);
        this.playerPokemonObject.setScale(0);
        this.enemyPokemonObject = new GameObject(this.ctx, this.enemyPokemonSprite, true, this.enemyPokemon.xSource, this.enemyPokemon.ySource, POKEMON_SIZE, POKEMON_SIZE, -(BATTLE_SCENE_WIDTH + POKEMON_SIZE) / 2, 22);
        this.playerAvatar = new GameObject(this.ctx, this.avatarAssets, false, ASSET_AVATAR_BATTLE_OFFSET, this.genderOffsets.ASSET_AVATAR_OFFSET, AVATAR_BATTLE_WIDTH, AVATAR_BATTLE_HEIGHT, GAME_WIDTH + BATTLE_SCENE_WIDTH / 2, BATTLE_ARENA_HEIGHT - AVATAR_BATTLE_HEIGHT);
        this.playerAvatar.setAnimation(true, 0, 0, AVATAR_BATTLE_HEIGHT, 4);
        this.pokeball = new GameObject(this.ctx, this.battleAssets, false, ASSET_POKEBALL_OFFSET_X, ASSET_POKEBALL_OFFSET_Y + 32, POKEBALL_SIZE, POKEBALL_SIZE, 25, 70);
        this.pokeball.setAnimation(false, 32, 0, POKEBALL_SIZE, 8);
        this.catchPokeball = new GameObject(this.ctx, this.battleAssets, false, ASSET_POKEBALL_OFFSET_X, ASSET_POKEBALL_OFFSET_Y + 32, POKEBALL_SIZE, POKEBALL_SIZE, 28, 74);
        this.bagBackground = new GameObject(this.ctx, this.battleAssets, false, this.genderOffsets.ASSET_BAG_BG_OFFSET, ASSET_BAG_OFFSET, GAME_WIDTH, GAME_HEIGHT, 0, 0);
        this.bag = new GameObject(this.ctx, this.battleAssets, false, 2 * GAME_WIDTH, ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET, ASSET_BAG_WIDTH, ASSET_BAG_HEIGHT, 30, 6);
        this.bagText = new GameObject(this.ctx, this.bagTextCanvas, false, 0, 0, 64, FONT_HEIGHT[0], 32, 81);
        this.bagSelector = new GameObject(this.ctx, this.battleAssets, false, 2 * GAME_WIDTH + 5 * ASSET_BAG_WIDTH + ASSET_BAG_POK_SIZE, ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_SEL_OFFSET, ASSET_BAG_SEL_WIDTH, ASSET_BAG_SEL_HEIGHT, 42, 75);
        this.bagSwitchPokeball = new GameObject(this.ctx, this.battleAssets, false, 2 * GAME_WIDTH + 6 * ASSET_BAG_WIDTH, ASSET_BAG_OFFSET, ASSET_BAG_POK_SIZE, ASSET_BAG_POK_SIZE, 8, 80);
        this.bagSwitchPokeball.setAnimation(false, 32, 0, ASSET_BAG_POK_SIZE, 7);
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
        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // Return battleData
        return battleData;
    }
    battleFinished() {
        return new Promise((resolve) => {
            // resolve if battle is finished
            if (this.battleStatus === 37 /* Finished */) {
                resolve();
            }
            else {
                // Check every 10 ms for battleFinished
                setTimeout(async () => {
                    await this.battleFinished();
                    resolve();
                }, 10);
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
        this.battlers[0].updateElapsedTime(this.previousElapsed);
        this.battlers[1].updateElapsedTime(this.previousElapsed);
        if (this.battleStatus === 0 /* SlideAvatarIn */) {
            this.battleBackground.render();
            this.battlers[1].drawPokemonSlideIn(delta);
            const isFinished = this.battlers[0].drawAvatarSlideIn(delta);
            this.battleDialogueBox.render();
            if (isFinished) {
                this.nextBattlePhase(1 /* WriteAppearText */);
            }
        }
        else if (this.battleStatus === 1 /* WriteAppearText */) {
            this.battleBackground.render();
            this.battlers[1].drawPokemon();
            this.battlers[0].drawAvatar();
            // Write appear text to dialogue box, with next phase
            const text = 'Wild ' + this.enemyPokemon.pokemonName.toUpperCase() + ' appeared!|';
            const isFinished = this.writeToDialogueBox(delta, 1, text, '', 0, 1);
            this.battlers[1].drawHealthSlideIn(delta);
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
            this.battlers[1].drawPokemon();
            this.battlers[1].drawHealth();
            const isFinished = this.battlers[0].drawAnimatedAvatarSlideOut(delta);
            this.battleDialogueBox.render();
            drawText(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);
            if (isFinished) {
                this.nextBattlePhase(4 /* ThrowPokemon */);
            }
        }
        else if (this.battleStatus === 4 /* ThrowPokemon */) {
            this.battleBackground.render();
            this.battlers[1].drawPokemon();
            this.battlers[1].drawHealth();
            this.battlers[0].drawAvatarSlideOut(delta);
            const isFinished = this.battlers[0].drawPokeballThrow(delta);
            this.battleDialogueBox.render();
            drawText(this.ctx, this.font, 'Go! ' + this.playerPokemon.pokemonName.toUpperCase() + '!', 0, 1, 16, 121);
            if (isFinished) {
                this.nextBattlePhase(5 /* PlayerActionSelect */);
            }
        }
        else if (this.battleStatus === 5 /* PlayerActionSelect */) {
            if (this.statusAfterFadeOut === 5 /* PlayerActionSelect */) {
                this.nextBattlePhase(35 /* FadeIn */);
                this.statusAfterFadeOut = 35 /* FadeIn */;
            }
            else if (this.statusAfterFadeOut === 35 /* FadeIn */) {
                this.statusAfterFadeIn = 37 /* Finished */;
            }
            this.turnsPassed++;
            // Detect keyboard press and increment/ decrement battleAction accordingly
            if (!this.keyDown) {
                if (keyboard.isDown(keyboard.LEFT)) {
                    if (this.battleAction === 1 || this.battleAction === 3) {
                        this.battleAction--;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.RIGHT)) {
                    if (this.battleAction === 0 || this.battleAction === 2) {
                        this.battleAction++;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.UP)) {
                    if (this.battleAction === 2 || this.battleAction === 3) {
                        this.battleAction -= 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.DOWN)) {
                    if (this.battleAction === 0 || this.battleAction === 1) {
                        this.battleAction += 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.ENTER)) {
                    // On enter go to next battle phase
                    if (this.battleAction === 0) {
                        this.nextBattlePhase(20 /* PlayerSelectMove */);
                    }
                    else if (this.battleAction === 1) {
                        this.statusAfterFadeOut = 6 /* PlayerBag */;
                        this.statusAfterFadeIn = 6 /* PlayerBag */;
                        this.nextBattlePhase(34 /* FadeOut */);
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
            drawText(this.ctx, this.font, 'What should ', 0, 1, 16, 121);
            drawText(this.ctx, this.font, this.battlers[this.currentBattler].pokemonData.pokemonName.toUpperCase() + ' do?', 0, 1, 16, 121 + 16);
            // Set the offset and column for the battle action selector
            let xOffset = this.battleAction * 46;
            let yColumn = 0;
            if (this.battleAction === 2 || this.battleAction === 3) {
                xOffset = (this.battleAction - 2) * 46;
                yColumn = 1;
            }
            // Draw the action selector
            this.drawActionSelector(GAME_WIDTH - ACTION_BOX_WIDTH + 8 + xOffset, GAME_WIDTH - ACTION_BOX_WIDTH + 8 + 42 + xOffset, 121, yColumn);
        }
        else if (this.battleStatus === 6 /* PlayerBag */) {
            if (this.statusAfterFadeOut === 6 /* PlayerBag */) {
                this.nextBattlePhase(35 /* FadeIn */);
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
                if (keyboard.isDown(keyboard.LEFT)) {
                    if (this.bagSelected > 0) {
                        this.bagSelected--;
                        this.bagSwitchLeft = true;
                        this.bagSelectedItem = 0;
                        this.bagSelectedOffset = 0;
                        this.nextBattlePhase(7 /* BagSwitch */);
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.RIGHT)) {
                    if (this.bagSelected < 4) {
                        this.bagSelected++;
                        this.bagSwitchLeft = false;
                        this.bagSelectedItem = 0;
                        this.bagSelectedOffset = 0;
                        this.nextBattlePhase(7 /* BagSwitch */);
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.UP)) {
                    if (this.bagSelectedItem > 0) {
                        this.bagSelectedItem--;
                    }
                    else if (this.bagSelectedOffset > 0) {
                        this.bagSelectedOffset--;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.DOWN)) {
                    if (this.bagSelectedItem < itemsToDisplay - 1) {
                        this.bagSelectedItem++;
                    }
                    else if (this.bagSelectedOffset + this.bagSelectedItem < items.length) {
                        this.bagSelectedOffset++;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.ENTER)) {
                    if (this.bagSelectedItem !== itemsToDisplay - 1) {
                        this.nextBattlePhase(8 /* BagConfirmUseItem */);
                    }
                    else {
                        this.nextBattlePhase(34 /* FadeOut */);
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
                text = BAG_POCKETS[this.bagSelected] + BAG_POCKETS[previousSelected];
            }
            else {
                text = BAG_POCKETS[previousSelected] + BAG_POCKETS[this.bagSelected];
                direction = -1;
            }
            this.bagBackground.render();
            this.ctx.fillStyle = '#F8E0A8';
            this.ctx.fillRect(112, 16, 120, Math.abs(this.animationCounter) / limit * 128);
            if (this.animationCounter > -20 && this.animationCounter < 20) {
                this.bag.updateSourcePosition(2 * GAME_WIDTH, ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET);
                this.bag.animate(delta, 128, 0, 1, 30, 6 - direction * this.animationCounter / 6, false, true);
            }
            else {
                this.bag.updateSourcePosition(2 * GAME_WIDTH, ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET);
                this.bag.animate(delta, 128, 0, 1, 30, 6, false, true);
            }
            this.bag.render();
            this.bagSelector.updateSourcePosition(2 * GAME_WIDTH + 6 * ASSET_BAG_WIDTH + 16, ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_SEL_OFFSET + this.bagSelected * ASSET_BAG_SEL_HEIGHT);
            this.bagSelector.render();
            this.bagSwitchPokeball.render(delta);
            if (this.bagTextCtx) {
                this.bagTextCtx.clearRect(0, 0, 64, FONT_HEIGHT[0]);
                const x = (!this.bagSwitchLeft) ? this.animationCounter : this.animationCounter - direction * limit;
                drawText(this.bagTextCtx, this.font, text, 0, 2, (0.5 + x) << 0, 0);
            }
            this.bagText.update(this.bagTextCanvas);
            this.bagText.render();
            const items = this.playerData.inventory[this.bagSelected];
            const currentLine = (Math.abs(this.animationCounter) / limit * 128) / 16 << 0;
            const itemsToDisplay = Math.min(items.length + 1, currentLine);
            for (let i = 0; i < itemsToDisplay; i++) {
                const x = i * 16;
                if (i === items.length) {
                    drawText(this.ctx, this.font, 'CLOSE BAG', 0, 3, 112, 17 + x);
                }
                else {
                    const itemData = this.itemIndex[items[i].itemId];
                    drawText(this.ctx, this.font, itemData.name.toUpperCase(), 0, 3, 112, 17 + x);
                    if (items[i].amount !== -1) {
                        drawText(this.ctx, this.font, 'x' + items[i].amount.toString().padStart(2, '_'), 0, 3, 214, 17 + x);
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
            drawText(this.ctx, this.font, 'What would you', 0, 3, 4, 105);
            drawText(this.ctx, this.font, 'like to do?', 0, 3, 4, 105 + 16);
            // Draw the yes/no conformation box
            this.ctx.drawImage(this.battleAssets, GAME_WIDTH, 3 * BATTLE_ARENA_HEIGHT + 4 * BATTLE_SCENE_HEIGHT + ACTION_BOX_HEIGHT + ASSET_PLAYER_HEALTH_HEIGHT, 54, 46, 57, 57, 54, 46);
            // The offset for the selection box
            const column = (!this.selectedConfirm) ? 1 : 0;
            this.drawActionSelector(64, 105, 64, column);
            // if key is pressed and not yet down, change selectedConfirm accordingly
            if (!this.keyDown) {
                if (keyboard.isDown(keyboard.DOWN) && this.selectedConfirm !== false) {
                    this.selectedConfirm = false;
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.UP) && this.selectedConfirm !== true) {
                    this.selectedConfirm = true;
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.ENTER)) {
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
                            this.nextBattlePhase(34 /* FadeOut */);
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
                this.nextBattlePhase(35 /* FadeIn */);
                this.statusAfterFadeOut = 35 /* FadeIn */;
            }
            else if (this.statusAfterFadeOut === 35 /* FadeIn */) {
                this.statusAfterFadeIn = 37 /* Finished */;
            }
            this.drawCleanBattleScene(delta, true);
            const items = this.playerData.inventory[this.bagSelected];
            const itemId = items[this.bagSelectedItem + this.bagSelectedOffset].itemId;
            const itemName = this.itemIndex[itemId].name;
            const playerName = this.accountData.playerName[0].toUpperCase() + this.accountData.playerName.substring(1);
            if (this.statusAfterFadeIn === 37 /* Finished */) {
                this.pokeBallXSource = ASSET_POKEBALL_OFFSET_X + POKE_BALLS[itemId] * POKEBALL_SIZE;
                this.catchPokeball.updateSourcePosition(this.pokeBallXSource, ASSET_POKEBALL_OFFSET_Y);
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
            drawText(this.ctx, this.font, playerName + ' used', 0, 1, 16, 121);
            drawText(this.ctx, this.font, itemName.toUpperCase() + '!', 0, 1, 16, 121 + 16);
            const isFinished = this.throwCatchPokeBall(delta);
            this.battlers[1].drawHealth();
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
            drawText(this.ctx, this.font, playerName + ' used', 0, 1, 16, 121);
            drawText(this.ctx, this.font, itemName.toUpperCase() + '!', 0, 1, 16, 121 + 16);
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
            drawText(this.ctx, this.font, playerName + ' used', 0, 1, 16, 121);
            drawText(this.ctx, this.font, itemName.toUpperCase() + '!', 0, 1, 16, 121 + 16);
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
                const randomInt = randomFromMinMax(0, 65535);
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
            this.enemyPokemonObject.setPosition(GAME_WIDTH - (BATTLE_SCENE_WIDTH + POKEMON_SIZE) / 2, 22);
            this.enemyPokemonObject.setScale(1);
            this.enemyPokemonObject.resetColor();
            const text1 = 'Pokemon broke free';
            const text2 = '';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.nextBattlePhase(28 /* NextBattlerTurn */);
            }
        }
        else if (this.battleStatus === 14 /* PokemonCaptured */) {
            this.drawCleanBattleScene(delta, true);
            this.catchPokeball.render();
            const text1 = 'Gotcha';
            const text2 = this.enemyPokemon.pokemonName.toUpperCase() + ' was caught!|';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.nextBattlePhase(36 /* AddToPokedex */);
            }
        }
        else if (this.battleStatus === 36 /* AddToPokedex */) {
            this.drawCleanBattleScene(delta, true);
            this.catchPokeball.opacityTo(delta, 8, false, 0);
            const text1 = this.enemyPokemon.pokemonName.toUpperCase() + '\'s data was';
            const text2 = 'added to the POKéDEX.|';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.drawCleanBattleScene(delta, true);
                this.player.addPokemon(this.enemyPokemon);
                this.nextBattlePhase(34 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 18 /* PlayerRun */) {
            this.escapeAttempts++;
            const escapeGuaranteed = this.battlers[this.currentBattler].pokemonData.stats.speed >= this.battlers[this.currentTarget].pokemonData.stats.speed;
            const escapeOdds = (Math.floor(this.battlers[this.currentBattler].pokemonData.stats.speed * 128 / this.battlers[this.currentTarget].pokemonData.stats.speed) + 30 * this.escapeAttempts) % 256;
            const escape = randomFromMinMax(0, 255) < escapeOdds;
            if (escapeGuaranteed || escape) {
                console.log('Escape successfully');
                this.battleResultWin = false;
                this.nextBattlePhase(19 /* PlayerRunText */);
            }
            else {
                console.log('escaped failed');
                this.nextBattlePhase(28 /* NextBattlerTurn */);
            }
        }
        else if (this.battleStatus === 19 /* PlayerRunText */) {
            const text1 = 'Got away safely!|';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, '', 0, 1);
            if (isFinished) {
                this.nextBattlePhase(34 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 20 /* PlayerSelectMove */) {
            // Draw the move selection box
            this.moveSelectorBox.render();
            const moveSelection = this.battlers[this.currentBattler].pokemonData.moves;
            // For every move option
            for (const moveNumber of [0, 1, 2, 3]) {
                // Get move from player
                const move = moveSelection[moveNumber];
                let moveText;
                // If move is not assigned print '-'
                if (moveSelection[moveNumber]) {
                    moveText = move.move;
                }
                else {
                    moveText = '-';
                }
                // Calculate x and y for the text
                const xText = (moveNumber === 1 || moveNumber === 3) ? 8 + 80 : 8;
                const yText = (moveNumber === 2 || moveNumber === 3) ? 121 + 16 : 121;
                // Draw text to action selection box
                drawText(this.ctx, this.font, moveText.toUpperCase(), 0, 0, xText, yText);
            }
            // Current selected move details
            const moveDetails = moveSelection[this.battleMove];
            // Variables for printing move pp text
            const xText = 184;
            const yPpText = 121;
            // Draw move pp text
            const text = 'PP_' + moveDetails.pp.toString().padStart(2, '_') + '/' + moveDetails.ppMax.toString().padStart(2, '_');
            drawText(this.ctx, this.font, text, 0, 0, xText, yPpText);
            // Variable for printing move type text
            const yTypeText = 121 + 16;
            // Draw move type text
            drawText(this.ctx, this.font, moveDetails.type.toUpperCase(), 0, 0, xText, yTypeText);
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
                if (keyboard.isDown(keyboard.LEFT)) {
                    if ((this.battleMove === 1 && moveSelection[0]) || (this.battleMove === 3 && moveSelection[2])) {
                        this.battleMove--;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.RIGHT)) {
                    if ((this.battleMove === 0 && moveSelection[1]) || (this.battleMove === 2 && moveSelection[3])) {
                        this.battleMove++;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.UP)) {
                    if ((this.battleMove === 2 && moveSelection[0]) || (this.battleMove === 3 && moveSelection[1])) {
                        this.battleMove -= 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.DOWN)) {
                    if ((this.battleMove === 0 && moveSelection[2]) || (this.battleMove === 1 && moveSelection[3])) {
                        this.battleMove += 2;
                    }
                    this.keyDown = true;
                }
                else if (keyboard.isDown(keyboard.ENTER)) {
                    this.keyDown = true;
                    this.battleMoveName = moveSelection[this.battleMove].move;
                    moveSelection[this.battleMove].pp--;
                    console.log(this.playerPokemon.pokemonName + ' used ' + this.battleMoveName);
                    this.nextBattlePhase(21 /* BattlerTurn */);
                }
            }
        }
        else if (this.battleStatus === 21 /* BattlerTurn */) {
            console.log(this.currentBattler, this.currentTarget);
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.writeMoveText(delta, moveData);
            if (isFinished) {
                const accuracyBase = moveData.accuracy;
                let isHit = true;
                if (accuracyBase) {
                    const stageAdjust = SPECIAL_STAGES[this.battlers[this.currentBattler].pokemonStages.accuracy -
                        this.battlers[this.currentTarget].pokemonStages.evasion + 6];
                    const modifier = 1;
                    const accuracy = accuracyBase * stageAdjust * modifier;
                    isHit = randomFromMinMax(1, 100) <= accuracy;
                }
                if (isHit) {
                    if (moveData.damage_class === 'status') {
                        this.nextBattlePhase(22 /* StatusMove */);
                    }
                    else if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(26 /* SpecialMove */);
                    }
                    else {
                        this.battlers[this.currentBattler].addAttackAnim(moveData);
                        this.battlers[this.currentTarget].addDamageAnim(moveData);
                        this.nextBattlePhase(24 /* DamageMove */);
                    }
                }
                else {
                    // Move missed
                }
            }
        }
        else if (this.battleStatus === 22 /* StatusMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusMove(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(23 /* StatusEffect */);
            }
        }
        else if (this.battleStatus === 23 /* StatusEffect */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.statusEffect(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(28 /* NextBattlerTurn */);
            }
        }
        else if (this.battleStatus === 24 /* DamageMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const text1 = this.battlers[this.currentBattler].pokemonData.pokemonName.toUpperCase() + ' used';
            const text2 = this.battleMoveName.toUpperCase() + '!';
            this.battleBackground.render();
            const isFinished = this.damageMove(delta, moveData);
            this.battlers[this.currentBattler].drawHealth();
            this.battlers[this.currentTarget].drawHealth();
            this.battleDialogueBox.render();
            drawText(this.ctx, this.font, text1, 0, 1, 16, 121);
            drawText(this.ctx, this.font, text2, 0, 1, 16, 121 + 16);
            if (isFinished) {
                this.nextBattlePhase(25 /* TakeDamage */);
            }
        }
        else if (this.battleStatus === 25 /* TakeDamage */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.battlers[this.currentTarget].animateHealthBar(delta);
            this.battlers[this.currentTarget].drawHealth();
            if (isFinished) {
                this.newHealth = -1;
                if (this.battlers[this.currentTarget].pokemonData.health <= 0) {
                    this.battleResultWin = false;
                    this.nextBattlePhase(27 /* BattlerFainted */);
                }
                else {
                    if (moveData.damage_class === 'special') {
                        this.nextBattlePhase(23 /* StatusEffect */);
                    }
                    else {
                        this.nextBattlePhase(28 /* NextBattlerTurn */);
                    }
                }
            }
        }
        else if (this.battleStatus === 26 /* SpecialMove */) {
            const moveData = this.moveIndex[this.battleMoveName];
            const isFinished = this.specialMove(delta, moveData);
            if (isFinished) {
                this.nextBattlePhase(24 /* DamageMove */);
            }
        }
        else if (this.battleStatus === 27 /* BattlerFainted */) {
            this.battleBackground.render();
            const isFinished = this.battlers[this.currentTarget].drawPokemonSlideDown(delta);
            this.battlers[this.currentBattler].drawPokemon();
            this.battlers[this.currentBattler].drawHealth();
            this.battleDialogueBox.render();
            if (!isFinished) {
                this.battlers[1].drawHealth();
            }
            else {
                const text1 = this.battlers[this.currentTarget].pokemonData.pokemonName.toUpperCase();
                const text2 = 'fainted!|';
                const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
                if (isFinished) {
                    if (this.currentBattler === 0 || this.currentBattler === 2)
                        this.nextBattlePhase(29 /* GainXpText */);
                    if (this.currentBattler === 1 || this.currentBattler === 3)
                        this.nextBattlePhase(34 /* FadeOut */);
                }
            }
        }
        else if (this.battleStatus === 28 /* NextBattlerTurn */) {
            this.currentBattler++;
            if (this.currentBattler === this.battlers.length)
                this.currentBattler = 0;
            this.currentTarget++;
            if (this.currentTarget === this.battlers.length)
                this.currentTarget = 0;
            if (this.currentBattler === 0 || this.currentBattler === 2)
                this.nextBattlePhase(5 /* PlayerActionSelect */);
            if (this.currentBattler === 1 || this.currentBattler === 3)
                this.nextBattlePhase(21 /* BattlerTurn */);
            console.log(this.currentBattler, this.currentTarget);
        }
        else if (this.battleStatus === 29 /* GainXpText */) {
            if (this.newXp === -1) {
                this.newXp = this.calculateXpGained() + this.battlers[this.currentBattler].pokemonData.xp;
            }
            else {
                const text1 = this.battlers[this.currentBattler].pokemonData.pokemonName.toUpperCase() + ' gained';
                const text2 = this.newXp - this.battlers[this.currentBattler].pokemonData.xp + ' EXP. Points!|';
                const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
                if (isFinished) {
                    this.nextBattlePhase(30 /* GainXp */);
                }
            }
        }
        else if (this.battleStatus === 30 /* GainXp */) {
            // Draw action dialogue box
            this.battleDialogueBox.render();
            const isFinished = this.battlers[this.currentBattler].animateXpBar(delta, this.newXp);
            this.battlers[this.currentBattler].drawHealth();
            // level gained detection.........
            if (isFinished) {
                if (this.levelGained) {
                    this.recalculatePlayerStats();
                    this.nextBattlePhase(31 /* LevelGained */);
                }
                else {
                    this.nextBattlePhase(34 /* FadeOut */);
                }
            }
        }
        else if (this.battleStatus === 31 /* LevelGained */) {
            // level gained animation to do!!!
            this.nextBattlePhase(32 /* LevelGainedText */);
        }
        else if (this.battleStatus === 32 /* LevelGainedText */) {
            const text1 = this.battlers[this.currentBattler].pokemonData.pokemonName.toUpperCase() + ' grew to';
            const text2 = 'LV. ' + this.battlers[this.currentBattler].pokemonData.level + '!';
            this.battlers[this.currentBattler].drawHealth();
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                const newMoveAdded = this.addNewLevelMoves();
                if (newMoveAdded) {
                    this.nextBattlePhase(33 /* NewMoveText */);
                }
                else {
                    this.nextBattlePhase(34 /* FadeOut */);
                }
            }
        }
        else if (this.battleStatus === 33 /* NewMoveText */) {
            const text1 = this.battlers[this.currentBattler].pokemonData.pokemonName.toUpperCase() + ' learned';
            const text2 = this.battlers[this.currentBattler].pokemonData.moves[this.battlers[this.currentBattler].pokemonData.moves.length - 1].move.toUpperCase() + '!';
            const isFinished = this.writeToDialogueBox(delta, 1, text1, text2, 0, 1);
            if (isFinished) {
                this.nextBattlePhase(34 /* FadeOut */);
            }
        }
        else if (this.battleStatus === 34 /* FadeOut */) {
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
                    this.overlayCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                    this.overlayCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                    this.overlayCtx.globalAlpha = 1;
                    this.animationCounter += delta * speed;
                }
            }
        }
        else if (this.battleStatus === 35 /* FadeIn */) {
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
                    if (this.statusAfterFadeIn === 37 /* Finished */) {
                        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                    }
                    this.overlayCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                    this.overlayCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
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
        if (this.battleStatus !== 37 /* Finished */) {
            // If battle is not finished request new animation frame
            window.requestAnimationFrame(this.tick.bind(this));
        }
    }
    calculateMoveDamage(moveData) {
        const attacker = this.battlers[this.currentBattler].pokemonData;
        const defender = this.battlers[this.currentTarget].pokemonData;
        const attackerStages = this.battlers[this.currentBattler].pokemonStages;
        const defenderStages = this.battlers[this.currentTarget].pokemonStages;
        let defenseStat, attackStat, attackerStMp, defenderStMp;
        if (moveData.damage_class === 'physical') {
            attackStat = attacker.stats.attack;
            defenseStat = defender.stats.defense;
            attackerStMp = NORMAL_STAGES[attackerStages.attack + 6];
            defenderStMp = NORMAL_STAGES[defenderStages.defense + 6];
        }
        else {
            attackStat = attacker.stats.specialAttack;
            defenseStat = defender.stats.specialDefense;
            attackerStMp = NORMAL_STAGES[attackerStages.specialAttack + 6];
            defenderStMp = NORMAL_STAGES[defenderStages.specialDefense + 6];
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
        const random = randomFromMinMax(85, 100);
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
        const defeatedPokemonData = this.battlers[this.currentTarget].pokemonData;
        const xp = (defeatedPokemonData.xpBase * defeatedPokemonData.level) / (7 * xpShare) * luckyEgg * pokemonOrigin * tradedPokemon;
        return xp;
    }
    recalculatePlayerStats() {
        const pokemon = this.battlers[this.currentBattler].pokemonData;
        const baseStats = pokemon.baseStats;
        const IV = pokemon.IV;
        const EV = pokemon.EV;
        const level = pokemon.level;
        const nature = pokemon.nature;
        const health = Math.floor((2 * baseStats[0].base_stat + IV.hp + Math.floor(EV.hp / 4)) * level / 100) + level + 10;
        pokemon.health += health - pokemon.stats.hp;
        pokemon.stats = {
            hp: health,
            attack: Math.floor((Math.floor((2 * baseStats[1].base_stat + IV.attack + Math.floor(EV.attack / 4)) * level / 100) + 5) * nature.hp),
            defense: Math.floor((Math.floor((2 * baseStats[2].base_stat + IV.defense + Math.floor(EV.defense / 4)) * level / 100) + 5) * nature.defense),
            specialAttack: Math.floor((Math.floor((2 * baseStats[3].base_stat + IV.specialAttack + Math.floor(EV.specialAttack / 4)) * level / 100) + 5) * nature.specialAttack),
            specialDefense: Math.floor((Math.floor((2 * baseStats[4].base_stat + IV.specialDefense + Math.floor(EV.specialDefense / 4)) * level / 100) + 5) * nature.specialDefense),
            speed: Math.floor((Math.floor((2 * baseStats[5].base_stat + IV.speed + Math.floor(EV.speed / 4)) * level / 100) + 5) * nature.speed),
        };
    }
    addNewLevelMoves() {
        const pokemonData = this.battlers[this.currentBattler].pokemonData;
        const pokedexEntry = this.pokedex[pokemonData.pokemonId.toString()];
        for (let i = 0; i < pokedexEntry.moves.length; i++) {
            const move = pokedexEntry.moves[i];
            const moveDetails = moveIndex[move.move];
            const moveSelection = pokemonData.moves;
            // Loop through the group details
            for (let j = 0; j < move.version_group_details.length; j++) {
                const details = move.version_group_details[j];
                // If method is level-up and level is the same level
                if (details.move_learn_method === 'level-up' && details.level_learned_at === pokemonData.level) {
                    // Push new learned move to pokemon moves
                    moveSelection.push({
                        move: move.move,
                        type: moveDetails.type,
                        pp: moveDetails.pp,
                        ppMax: moveDetails.pp,
                    });
                    // Remove extra move if
                    if (moveSelection.length > 4) {
                        moveSelection.shift();
                    }
                    return true;
                }
            }
        }
        return false;
    }
    getTypeEffectiveness(defenderType, moveType) {
        return TYPES_EFFECTIVENESS[18 * ((TYPES.indexOf(moveType) / 18) << 0) + TYPES.indexOf(defenderType)];
    }
    damageMove(delta, moveData) {
        const nextAnim = this.battlers[this.currentBattler].drawAnim(delta);
        let isFinished = false;
        if (nextAnim) {
            isFinished = this.battlers[this.currentTarget].drawAnim(delta);
        }
        this.battlers[0].drawPokemon();
        this.battlers[1].drawPokemon();
        if (this.newHealth === -1) {
            const currentHealth = this.battlers[this.currentTarget].pokemonData.health;
            this.newHealth = Math.max(currentHealth - this.calculateMoveDamage(moveData), 0);
            this.battlers[this.currentTarget].newPokemonHealth = this.newHealth;
            console.log(currentHealth, this.newHealth);
        }
        if (isFinished) {
            this.battlers[0].resetAnimation();
            this.battlers[1].resetAnimation();
        }
        return isFinished;
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
        }
        return isFinished;
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
        }
        return isFinished;
    }
    statusEffect(delta, moveData) {
        let isFinished = false, text1 = '', text2 = '';
        let pokemon = this.battlers[this.currentTarget];
        if (moveData.target === 'selected-pokemon' || moveData.target === 'all-opponents') {
            pokemon = this.battlers[this.currentTarget];
        }
        else if (moveData.target === 'user') {
            pokemon = this.battlers[this.currentBattler];
        }
        const pokemonName = pokemon.pokemonData.pokemonName;
        if (!this.moveEffectApplied) {
            this.moveEffectApplied = true;
            pokemon.pokemonStages[moveData.stat_changes[0].stat] += moveData.stat_changes[0].change;
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
        return isFinished;
    }
    writeMoveText(delta, moveData) {
        const pokemonName = this.battlers[this.currentBattler].pokemonData.pokemonName;
        const text1 = pokemonName.toUpperCase() + ' used';
        const text2 = moveData.name.toUpperCase() + '!';
        const isFinished = this.writeToDialogueBox(delta, 0, text1, text2, 0, 1);
        return isFinished;
    }
    throwCatchPokeBall(delta) {
        const speedPokeball = 192;
        // Calculate the x and y for the pokeball
        const pokeballPosition = this.catchPokeball.getPosition();
        let xPixelPokeball = pokeballPosition.x + delta * speedPokeball;
        let yPixelPokeball = 0.00809 * xPixelPokeball ** 2 - 1.981 * xPixelPokeball + 123;
        let isFinished = false;
        if (xPixelPokeball > 170) {
            this.animationCounter += delta * speedPokeball;
            if (this.animationCounter >= 24) {
                this.catchPokeball.updateSourcePosition(this.pokeBallXSource, ASSET_POKEBALL_OFFSET_Y + 16);
            }
            else {
                this.catchPokeball.updateSourcePosition(this.pokeBallXSource, ASSET_POKEBALL_OFFSET_Y);
            }
            xPixelPokeball = 170;
            yPixelPokeball = 20;
        }
        else {
            this.catchPokeball.updateSourcePosition(this.pokeBallXSource, ASSET_POKEBALL_OFFSET_Y + 32);
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
            this.catchPokeball.updateSourcePosition(this.pokeBallXSource, ASSET_POKEBALL_OFFSET_Y + 32);
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
            this.catchPokeball.updateSourcePosition(this.pokeBallXSource, ASSET_POKEBALL_OFFSET_Y);
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
    drawBag(itemDetails, itemUse) {
        this.bagBackground.render();
        this.ctx.fillStyle = '#F8E0A8';
        this.ctx.fillRect(112, 16, 120, 128);
        this.bagSwitchPokeball.render();
        this.bag.updateSourcePosition(2 * GAME_WIDTH + (this.bagSelected + 1) * ASSET_BAG_WIDTH, ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_OFFSET);
        this.bag.render();
        this.bagSelector.updateSourcePosition(2 * GAME_WIDTH + 6 * ASSET_BAG_WIDTH + 16, ASSET_BAG_OFFSET + this.genderOffsets.ASSET_BAG_SEL_OFFSET + this.bagSelected * ASSET_BAG_SEL_HEIGHT);
        this.bagSelector.render();
        const text = BAG_POCKETS[this.bagSelected];
        drawText(this.ctx, this.font, text, 0, 2, 32, 81);
        const items = this.playerData.inventory[this.bagSelected];
        const itemsToDisplay = Math.min(items.length + 1, 8);
        for (let i = this.bagSelectedOffset; i < itemsToDisplay + this.bagSelectedOffset; i++) {
            const x = (i - this.bagSelectedOffset) * 16;
            let fontColor = 3;
            if (i === this.bagSelectedItem + this.bagSelectedOffset && itemUse) {
                fontColor = 4;
            }
            if (i === items.length) {
                drawText(this.ctx, this.font, 'CLOSE BAG', 0, fontColor, 112, 17 + x);
            }
            else {
                const itemData = this.itemIndex[items[i].itemId];
                drawText(this.ctx, this.font, itemData.name.toUpperCase(), 0, fontColor, 112, 17 + x);
                if (items[i].amount !== -1) {
                    drawText(this.ctx, this.font, 'x' + items[i].amount.toString().padStart(2, '_'), 0, fontColor, 214, 17 + x);
                }
            }
        }
        this.drawActionSelector(112, 233, 17, this.bagSelectedItem);
        if (itemDetails && items[this.bagSelectedItem + this.bagSelectedOffset]) {
            const itemText = this.itemIndex[items[this.bagSelectedItem + this.bagSelectedOffset].itemId].flavour_text_entry.split('\n');
            drawText(this.ctx, this.font, itemText[0], 0, 3, 4, 105);
            drawText(this.ctx, this.font, itemText[1], 0, 3, 4, 105 + 16);
            drawText(this.ctx, this.font, itemText[2], 0, 3, 4, 105 + 32);
        }
    }
    drawCleanBattleScene(delta, drawEnemyHealth) {
        this.battleBackground.render();
        this.battlers[1].drawPokemon();
        if (drawEnemyHealth) {
            this.battlers[1].drawHealth();
        }
        this.battlers[0].drawPokemon();
        this.battlers[0].drawHealth();
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
            drawText(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
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
            drawText(this.ctx, this.font, textCol1, 0, 1, 16, 121);
            drawText(this.ctx, this.font, textToDisplay, fontsize, fontColor, 16, yText);
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
//# sourceMappingURL=battle.js.map