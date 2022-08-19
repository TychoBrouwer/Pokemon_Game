export interface PlayerDataType {
  location: string;
  position: {
    x: number;
    y: number;
  };
  pokemon: PokemonDataType[];
  inventory: {
    [itemCategory: number]: {
      itemId: string;
      amount: number;
    }[];
  };
  currentPokemon: number;
}

export interface PokemonDataType {
  pokemonId: number;
  generation: number;
  pokemonName: string;
  xp: number;
  xpCurLevel: number;
  xpNextLevel: number;
  xpBase: number;
  growth_rate: string;
  capture_rate: number;
  base_happiness: number;
  level: number;
  health: number;
  gender: number;
  ability: {
    ability: string;
    is_hidden: boolean;
    slot: number;
  };
  moves: {
    move: string;
    type: string;
    pp: number;
    ppMax: number;
  }[];
  shininess: boolean;
  size: number;
  height: number;
  pokeball: number,
  personality: number;
  nature: PokemonStatsType;
  EV: PokemonStatsType;
  IV: PokemonStatsType;
  baseStats: {
    base_stat: number;
    effort: number;
    stat: string;
  }[];
  stats: PokemonStatsType;
  types: {
    slot: number;
    type: string;
  }[];
  xSource: number;
  ySource: number;
}

interface PokemonStatsType {
  hp: number;
  attack: number;
  defense: number;
  specialDefense: number;
  specialAttack: number;
  speed: number;
}

export interface MapType {
  COLS: number;
  ROWS: number;

  layers: number[][];
}

export interface MapsType {
  [mapName: string] : MapType;
}

export interface AddMapReturnType {
  currentMap: MapType;
  diff: number[]
}

export interface MapLocation {
  [coordinate: string]: number;
}

export interface Keyboard {
  LEFT: string;
  RIGHT: string;
  UP: string;
  DOWN: string;
  ENTER: string;

  keys: Keys;
  listenForEvents: (keys: string[]) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onKeyUp: (event: KeyboardEvent) => void;
  isDown: (keyCode: string) => boolean;
}

export interface Keys {
  a: boolean;
  d: boolean;
  w: boolean;
  s: boolean;
  enter: boolean;
}

export interface EncounterTableType {
  [route: string]: {
    [encounterMethod: string]: {
      [id: number]: {
        rate: number;
        level: number[];
      }
    }
  }
}

export interface SizeTableType {
  [maxSize: number]: {
    x: number;
    y: number;
    z: number;
  }
}

export interface PokemonInfoType {
  id: number;
  name: string;
  order: number;
  species: string;
  game_index: number;
  weight: number;
  height: number;
  base_experience: number;
  is_default: boolean;
  growth_rate: string;
  color: string;
  capture_rate: number;
  base_happiness: number;
  forms: string[];
  stats: {
    base_stat: number;
    effort: number;
    stat: string;
  }[]
  abilities: {
    ability: string;
    is_hidden: boolean;
    slot: number;
  }[];
  held_items: {
    item: string;
  }[];
  moves: {
    move: string;
    version_group_details: {
      move_learn_method: string;
      level_learned_at: number;
    }[]
  }[];
  types: {
    slot: number;
    type: string;
  }[];
}

export interface PokedexType { 
  [id_string: string]: PokemonInfoType;
}

export interface MoveType {
  accuracy: number | null;
  contest_combos: {
    normal: {
      use_after: {
        name: string;
      }[] | null;
      use_before: {
          name: string;
      }[] | null;
    };
    super: {
      use_after: {
        name: string;
      }[] | null;
      use_before: {
        name: string;
      }[] | null;
    };
  } | null;
  contest_effect: number;
  contest_type: string;
  damage_class: string;
  effect_chance: number | null;
  effect_entries: {
    effect: string;
    short_effect: string;
  }[];
  flavor_text_entries: {
    flavor_text: string;
  }[];
  id: number;
  // "machines": [],
  meta: {
    ailment: string;
    ailment_chance: number;
    category: string;
    crit_rate: number;
    drain: number;
    flinch_chance: number;
    healing: number;
    max_hits: number | null;
    max_turns: number | null;
    min_hits: number | null;
    min_turns: number | null;
    stat_chance: number;
  },
  name: string;
  power: number | null;
  pp: number;
  priority: number;
  super_contest_effect: number;
  target: string;
  stat_changes: {
    change: number;
    stat: string;
  }[];
  type: string;
}

export interface MoveIndexType {
  [moveName: string]: MoveType;
}

export interface ItemType {
  attributes: string[];
  baby_trigger_for: string | null;
  category: string;
  cost: number;
  fling_effect: string | null;
  fling_power: number | null;
  held_by_pokemon: {
    pokemon: string;
    rarity: number;
  }[];
  id: number;
  name: string;
  game_index: number;
  flavour_text_entry: string;
  effect: string;
  short_effect: string;
}

export interface ItemIndexType {
  [itemId: string]: ItemType;
}

export interface LevelsType {
  [name: string]: {
    [level: number]: number;
  }
}

export interface AccountDataType {
  playerName: string;
  avatar: string;
  male: boolean;
}