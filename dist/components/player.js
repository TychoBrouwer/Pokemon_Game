import * as pokedex from '../data/pokedex.json';
import { getLocalStorage, setLocalStorage, generatePokemon } from '../utils/helper';
export class Player {
    constructor() {
        // Get playerData from localStorage
        this.playerData = getLocalStorage('playerData');
        this.accountData = getLocalStorage('accountData');
        this.pokedex = pokedex;
    }
    getPlayerData() {
        // Return playerData
        return this.playerData;
    }
    getAccountData() {
        // Return playerData
        return this.accountData;
    }
    getStoredPlayerData(key) {
        // Get key from localStorage
        return getLocalStorage(key);
    }
    setPlayerPosition(location, x, y) {
        // Update the player position to the supplied
        this.playerData.location = location;
        this.playerData.position.x = x;
        this.playerData.position.y = y;
    }
    generatePokemon(pokemonId, levelRange) {
        // Generate new pokemon from supplied 
        const pokemon = generatePokemon(this.pokedex[pokemonId.toString()], levelRange, pokemonId, 2);
        // Push new pokemon to playerData
        this.playerData.pokemon.push(pokemon);
        console.log(this.playerData.pokemon);
    }
    addPokemon(pokemonData) {
        this.playerData.pokemon.push(pokemonData);
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
            inventory: {
                0: [
                    {
                        itemId: 'potion',
                        amount: 5,
                    },
                    {
                        itemId: 'soda-pop',
                        amount: 10,
                    },
                ],
                1: [
                    {
                        itemId: 'poke-ball',
                        amount: 99,
                    },
                    {
                        itemId: 'poke-ball',
                        amount: 99,
                    },
                    {
                        itemId: 'poke-ball',
                        amount: 10,
                    },
                ],
                2: [],
                3: [],
                4: [],
            },
            currentPokemon: 0,
        };
        // Create the accountData object
        this.accountData = {
            playerName: 'playerName',
            avatar: avatar,
            male: male,
        };
        // Set the playerData and accountData objects in localStorage
        setLocalStorage('playerData', this.playerData);
        setLocalStorage('accountData', this.accountData);
        // Return playerData
        return this.playerData;
    }
}
//# sourceMappingURL=player.js.map