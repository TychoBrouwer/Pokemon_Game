import { littleroot_town } from '../data/maps/littleroot_town';
import { route_101 } from '../data/maps/route_101';
import { oldale_town } from '../data/maps/oldale_town';
import { route_102 } from '../data/maps/route_102';
export const GAME_HEIGHT = 160;
export const GAME_WIDTH = 240;
export const TILE_SIZE = 16;
export const CAMERA_HEIGHT = 10 * TILE_SIZE;
export const CAMERA_WIDTH = 15 * TILE_SIZE;
export const FONT_HEIGHT = [14, 8];
export const FONT_WIDTH = [6, 5];
export const AVATAR_HEIGHT = 21;
export const AVATAR_WIDTH = 14;
export const AVATAR_BATTLE_HEIGHT = 52;
export const AVATAR_BATTLE_WIDTH = 80;
export const AVATAR_SPEED_WALK = 4 * TILE_SIZE;
export const GRASS_ENCOUNTER_RATE = 320;
export const CAVES_ENCOUNTER_RATE = 160;
export const WATER_ENCOUNTER_RATE = 320;
export const SEAWEED_ENCOUNTER_RATE = 320;
export const CHAR_IN_FONT = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '.',
    ',',
    'é',
    '|',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    '\'',
    '`',
    '!',
    '?',
    '-',
    '^',
    '#',
    '/',
    ':',
    '“',
    '”',
    '‘',
    '’',
    '&',
    '_', // full letter space
];
export const MAPS = {
    'littleroot town': littleroot_town,
    'route 101': route_101,
    'oldale town': oldale_town,
    'route 102': route_102,
};
//# sourceMappingURL=game_constants.js.map