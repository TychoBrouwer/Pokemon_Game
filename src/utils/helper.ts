import * as moveIndex from '../move_index.json';

import { C } from '../utils/constants';

import { PokemonDataType, PokemonInfoType } from '../utils/types';

export function randomFromArray(propbabilityArray: any[]) {
  // Get random from array
  return propbabilityArray[Math.floor(Math.random() * propbabilityArray.length)];
}

export function randomFromMinMax(min: number, max: number): number {
  // Get random from min and max, if max = -1 return min
  return (max !== -1) ? Math.floor(Math.random() * (max - min + 1)) + min : min;
}

export function setLocalStorage(key: string, data: object): void {
  // Set item in localStorage
  if (data) {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

export function getLocalStorage(key: string) {
  // Get item from localStorage
  const data = localStorage.getItem(key);

  // Return empty object if not found
  if (!data) {
    return {};
  }

  // returned parsed data
  return JSON.parse(data);
}

export function drawText(c: C, ctx: CanvasRenderingContext2D, font: HTMLCanvasElement, text: string, fontsize: number, fontColor: number, posX: number, posY: number) {
  // Loop through the text to Draw
  for (let i = 0; i < text.length; i++) {
    // Set default width
    let width = c.FONT_WIDTH[fontsize];
    if (fontsize === 0) {
      // characters that are seven pixels wide
      if (text[i] === '|') {
        width = 7;
      }
      // characters that are three pixels wide
      if (text[i] === ' ' || text[i] === 'l' || text[i] === '.') {
        width = 3;
      }
      // characters that are four pixels wide
      if (text[i] === 'i' || text[i] === '!') {
        width = 5;
      }
      // characters that are five pixels wide
      if (text[i] === 'r') {
        width = 5;
      }
      // characters that are one pixels wide
      if (text[i] === '*') {
        width = 1;
      }
    }

    // Get the positions of the letter to draw
    const positions = {
      posX: c.CHAR_IN_FONT.indexOf(text[i]) % 40 * c.FONT_WIDTH[fontsize],
      posY: ((c.CHAR_IN_FONT.indexOf(text[i]) / 40) << 0) * c.FONT_HEIGHT[fontsize],
    }
    // Get the yOffset for the font type (fontSize and fontColor)
    const yOffset = (fontsize === 0) ? fontColor * 2 * c.FONT_HEIGHT[fontsize] : 3 * 2 * c.FONT_HEIGHT[0] + fontColor * 2 * c.FONT_HEIGHT[fontsize];

    if (text[i] === '_' || text[i] === '*') {
      positions.posX = -10;
    }

    // Draw the letter
    ctx.drawImage(
      font,
      positions.posX,
      positions.posY + yOffset,
      width,
      c.FONT_HEIGHT[fontsize],
      posX + c.FONT_WIDTH[fontsize] * i
        - 3 * (text.substring(0, i).match(/ |l|\./g)||[]).length
        - 2 * (text.substring(0, i).match(/i|!/g)||[]).length
        - 1 * (text.substring(0, i).match(/r/g)||[]).length
        - 5 * (text.substring(0, i).match(/\*/g)||[]).length,
      posY,
      width,
      c.FONT_HEIGHT[fontsize]
    );
  }
}

export function generatePokemon(c: C, pokedexEntry: PokemonInfoType, levelRange: number[], pokemonId: number, pokeball: number): PokemonDataType {
  // Get random level from the supplied range
  const level = randomFromMinMax(levelRange[0], levelRange[1]);

  // Get the moves the pokemon starts with
  const moveCandidates = []
  // Loop through all pokemon's moves
  for (let i = 0; i < pokedexEntry.moves.length; i++) {
    const move = pokedexEntry.moves[i];
    const moveDetails = moveIndex[move.move as keyof typeof moveIndex];

    // Loop through the group details
    for (let j = 0; j < move.version_group_details.length; j++) {
      const details = move.version_group_details[j];
      // If method is level-up and level is sufficiently high
      if (details.move_learn_method === 'level-up' && details.level_learned_at <= level) {
        // Push move to move candidates
        moveCandidates.push({
          move: move.move,
          type: moveDetails.type,
          pp: moveDetails.pp,
          ppMax: moveDetails.pp,
        });
      }
    }
  }
  // Get last four moves from move candidates
  const moves = moveCandidates.slice(-4);

  // Get random personality (0-24 inclusive)
  const personality = randomFromMinMax(0, 24);
  // Set nature for every category
  const nature = {
    hp: 1,
    attack: (c.POKEMON_PERSONALITIES.increase.attack.includes(personality)) ? 1.1 : 
            (c.POKEMON_PERSONALITIES.decrease.attack.includes(personality)) ? 0.9 :
            1,
    defense:  (c.POKEMON_PERSONALITIES.increase.defense.includes(personality)) ? 1.1 : 
              (c.POKEMON_PERSONALITIES.decrease.defense.includes(personality)) ? 0.9 :
              1,
    specialDefense: (c.POKEMON_PERSONALITIES.increase.specialDefense.includes(personality)) ? 1.1 : 
                    (c.POKEMON_PERSONALITIES.decrease.specialDefense.includes(personality)) ? 0.9 :
                    1,
    specialAttack:  (c.POKEMON_PERSONALITIES.increase.specialAttack.includes(personality)) ? 1.1 : 
                    (c.POKEMON_PERSONALITIES.decrease.specialAttack.includes(personality)) ? 0.9 :
                    1,
    speed:  (c.POKEMON_PERSONALITIES.increase.speed.includes(personality)) ? 1.1 : 
            (c.POKEMON_PERSONALITIES.decrease.speed.includes(personality)) ? 0.9 :
            1,
  };
  // Get random individual value (0-31 inclusive)
  const IV = {
    hp: randomFromMinMax(0, 31),
    attack: randomFromMinMax(0, 31),
    defense: randomFromMinMax(0, 31),
    specialDefense: randomFromMinMax(0, 31),
    specialAttack: randomFromMinMax(0, 31),
    speed: randomFromMinMax(0, 31),
  };
  // Retrieve effort value for every category
  const EV = {
    hp: pokedexEntry.stats[0].effort,
    attack: pokedexEntry.stats[1].effort,
    defense: pokedexEntry.stats[2].effort,
    specialAttack: pokedexEntry.stats[3].effort,
    specialDefense: pokedexEntry.stats[4].effort,
    speed: pokedexEntry.stats[5].effort,
  };

  // Calculate max health
  const health = Math.floor((2 * pokedexEntry.stats[0].base_stat + IV.hp + Math.floor(EV.hp / 4)) * level / 100) + level + 10;
  // Determine generation
  const generation = (pokemonId <= 151) ? 0 : (pokemonId < 251) ? 1 : 2;

  // Get random size (0-65535 inclusive)
  const size = randomFromMinMax(0, 65535);
  // Compute height from size
  let height = 0;
  for (const [maxSize, values] of Object.entries(c.SIZE_TABLE)) {
    if (size <= parseInt(maxSize)) {
      height = Math.floor(pokedexEntry.height * Math.floor((size - values.z) / values.y + values.x) / 10)

      break;
    }
  } 

  // Set pokemonData object with calculated stats
  const pokemonData = {
    pokemonId: pokemonId,
    generation: generation,
    pokemonName: pokedexEntry.name,
    xp: c.LEVELS[pokedexEntry.growth_rate][level],
    xpCurLevel: c.LEVELS[pokedexEntry.growth_rate][level],
    xpNextLevel: c.LEVELS[pokedexEntry.growth_rate][level + 1],
    xpBase: pokedexEntry.base_experience,
    growth_rate: pokedexEntry.growth_rate,
    level: level,
    health: health,
    gender: randomFromMinMax(0, 1),
    ability: pokedexEntry.abilities[randomFromMinMax(0, 1)],
    moves: moves,
    shininess: (randomFromMinMax(1, 8192) === 1) ? true : false,
    size: size,
    height: height,
    pokeball: pokeball,
    personality: personality,
    nature: nature,
    EV: EV,
    IV: IV,
    baseStats: pokedexEntry.stats,
    stats: {
      hp: health,
      attack: Math.floor((Math.floor((2 * pokedexEntry.stats[1].base_stat + IV.attack + Math.floor(EV.attack / 4)) * level / 100) + 5) * nature.hp),
      defense: Math.floor((Math.floor((2 * pokedexEntry.stats[2].base_stat + IV.defense + Math.floor(EV.defense / 4)) * level / 100) + 5) * nature.defense),
      specialAttack: Math.floor((Math.floor((2 * pokedexEntry.stats[3].base_stat + IV.specialAttack + Math.floor(EV.specialAttack / 4)) * level / 100) + 5) * nature.specialAttack),
      specialDefense: Math.floor((Math.floor((2 * pokedexEntry.stats[4].base_stat + IV.specialDefense + Math.floor(EV.specialDefense / 4)) * level / 100) + 5) * nature.specialDefense),
      speed: Math.floor((Math.floor((2 * pokedexEntry.stats[5].base_stat + IV.speed + Math.floor(EV.speed / 4)) * level / 100) + 5) * nature.speed),
    },
    types: pokedexEntry.types,
    xSource: (pokemonId - c.ASSETS_GENERATION_OFFSET[generation] - 1) % 3 * c.POKEMON_SPRITE_WIDTH,
    ySource: (((pokemonId - c.ASSETS_GENERATION_OFFSET[generation] - 1) / 3) << 0) * c.POKEMON_SIZE,
  }

  // Return pokemonData object
  return pokemonData;
}
