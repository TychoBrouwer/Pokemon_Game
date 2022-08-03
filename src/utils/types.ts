export interface PlayerDataType {
  location: string;
  position: {
    x: number;
    y: number;
  };
  pokemon: PokemonDataType[];
  currentPokemon: number;
}

// move: "cut"
// version_group_details: Array(1)
// 0:
// level_learned_at: 0
// move_learn_method: "machine

export interface PokemonDataType {
  pokemonId: number;
  generation: number;
  pokemonName: string;
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

export interface AssetsLocationTilesType {
  [location: string]: {
    width: number;
    height: number;
  }
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

  _keys: Keys;
  listenForEvents: (keys: string[]) => void;
  _onKeyDown: (event: KeyboardEvent) => void;
  _onKeyUp: (event: KeyboardEvent) => void;
  isDown: (keyCode: string) => boolean;
}

export interface Keys {
  a: boolean;
  d: boolean;
  w: boolean;
  s: boolean;
  enter: boolean;
}

export interface PokemonType {
  rate: number;
  level: number[];
}

export interface EncounterTableType {
  [route: string]: {
    [encounterMethod: string]: {
      [id: number]: PokemonType;
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
  // "meta": {
  //   "ailment": "none",
  //   "ailment_chance": 0,
  //   "category": "damage",
  //   "crit_rate": 0,
  //   "drain": 0,
  //   "flinch_chance": 0,
  //   "healing": 0,
  //   "max_hits": null,
  //   "max_turns": null,
  //   "min_hits": null,
  //   "min_turns": null,
  //   "stat_chance": 0
  // },
  name: string;
  power: number | null;
  pp: number;
  priority: number;
  // "stat_changes": [],
  super_contest_effect: number;
  target: string;
  type: string;
}

export interface MoveIndexType {
  [moveName: string]: MoveType;
}
