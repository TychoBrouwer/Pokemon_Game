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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const pokedex = __importStar(require("../pokedex.json"));
const helper_1 = require("../utils/helper");
class Player {
    constructor() {
        // Get playerData from localStorage
        this.playerData = (0, helper_1.getLocalStorage)('playerData');
        this.pokedex = pokedex;
    }
    getPlayerData() {
        // Return playerData
        return this.playerData;
    }
    getStoredPlayerData(key) {
        // Get key from localStorage
        return (0, helper_1.getLocalStorage)(key);
    }
    setPlayerPosition(location, x, y) {
        // Update the player position to the supplied
        this.playerData.location = location;
        this.playerData.position.x = x;
        this.playerData.position.y = y;
    }
    addPokemon(pokemonId, levelRange) {
        // Generate new pokemon from supplied 
        const pokemon = (0, helper_1.generatePokemon)(this.pokedex[pokemonId.toString()], levelRange, pokemonId, 2);
        // Push new pokemon to playerData
        this.playerData.pokemon.push(pokemon);
        console.log(this.playerData.pokemon);
    }
    createNewPlayer(male) {
        // Set the avatar name
        const avatar = male ? 'Brendan' : 'May';
        // Create the default playerData object
        this.playerData = {
            position: {
                x: 100,
                y: 420,
            },
            location: 'littleroot town',
            pokemon: [],
            currentPokemon: 0,
        };
        // Create the accountData object
        const accountData = {
            avatar: avatar,
        };
        // Set the playerData and accountData objects in localStorage
        (0, helper_1.setLocalStorage)('playerData', this.playerData);
        (0, helper_1.setLocalStorage)('accountData', accountData);
        // Return playerData
        return this.playerData;
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map