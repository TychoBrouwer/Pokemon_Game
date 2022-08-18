import * as pokedex from '../pokedex.json';

import { C } from '../utils/constants';

import { getLocalStorage, setLocalStorage, generatePokemon } from '../utils/helper';

import { PokedexType, PlayerDataType, AccountDataType } from '../utils/types';


export class Player {
  private c: C;

  public playerData!: PlayerDataType;
  private pokedex: PokedexType;
  private accountData: AccountDataType;

  constructor(c: C) {
    this.c = c;

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
    const pokemon = generatePokemon(this.c, this.pokedex[pokemonId.toString()], levelRange, pokemonId, 2);
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
      inventory: {
        0: {},
        1: {
          'Poké Ball': 10,
        },
        2: {},
        3: {},
        4: {},
      },
      currentPokemon: 0,
    }

    // Create the accountData object
    this.accountData = {
      avatar: avatar,
      male: male,
    }

    // Set the playerData and accountData objects in localStorage
    setLocalStorage('playerData', this.playerData);
    setLocalStorage('accountData', this.accountData);

    // Return playerData
    return this.playerData;
  }
}