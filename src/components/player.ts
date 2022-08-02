import * as pokedex from '../pokedex.json';

import { getLocalStorage, setLocalStorage, generatePokemon } from '../utils/helper';

import { PokedexType, PlayerDataType } from '../utils/types';

export class Player {
  public playerData!: PlayerDataType;
  private pokedex: PokedexType;

  constructor() {
    // Get playerData from localStorage
    this.playerData = getLocalStorage('playerData');
    this.pokedex = pokedex;
  }

  getPlayerData() {
    // Return playerData
    return this.playerData;
  }

  getStoredPlayerData(key: string) {
    // Get key from localStorage
    return getLocalStorage(key);
  }

  setPlayerPosition(location: string, x: number, y: number) {
    // Update the player position to the supplied
    this.playerData.location = location;
    this.playerData.position.x = x;
    this.playerData.position.y = y;
  }

  addPokemon(pokemonId: number, levelRange: number[]) {
    // Generate new pokemon from supplied 
    const pokemon = generatePokemon(this.pokedex[pokemonId.toString()], levelRange, pokemonId, 2);
    // Push new pokemon to playerData
    this.playerData.pokemon.push(pokemon);

    console.log(this.playerData.pokemon);
  }

  createNewPlayer(male: boolean): PlayerDataType {
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
    }

    // Create the accountData object
    const accountData = {
      avatar: avatar,
    }

    // Set the playerData and accountData objects in localStorage
    setLocalStorage('playerData', this.playerData);
    setLocalStorage('accountData', accountData);

    // Return playerData
    return this.playerData;
  }
}