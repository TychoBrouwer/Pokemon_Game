"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAPS = exports.CHAR_IN_FONT = exports.SEAWEED_ENCOUNTER_RATE = exports.WATER_ENCOUNTER_RATE = exports.CAVES_ENCOUNTER_RATE = exports.GRASS_ENCOUNTER_RATE = exports.AVATAR_SPEED_WALK = exports.AVATAR_BATTLE_WIDTH = exports.AVATAR_BATTLE_HEIGHT = exports.AVATAR_WIDTH = exports.AVATAR_HEIGHT = exports.FONT_WIDTH = exports.FONT_HEIGHT = exports.CAMERA_WIDTH = exports.CAMERA_HEIGHT = exports.TILE_SIZE = exports.GAME_WIDTH = exports.GAME_HEIGHT = void 0;
const littleroot_town_1 = require("../data/maps/littleroot_town");
const route_101_1 = require("../data/maps/route_101");
const oldale_town_1 = require("../data/maps/oldale_town");
const route_102_1 = require("../data/maps/route_102");
exports.GAME_HEIGHT = 160;
exports.GAME_WIDTH = 240;
exports.TILE_SIZE = 16;
exports.CAMERA_HEIGHT = 10 * exports.TILE_SIZE;
exports.CAMERA_WIDTH = 15 * exports.TILE_SIZE;
exports.FONT_HEIGHT = [14, 8];
exports.FONT_WIDTH = [6, 5];
exports.AVATAR_HEIGHT = 21;
exports.AVATAR_WIDTH = 14;
exports.AVATAR_BATTLE_HEIGHT = 52;
exports.AVATAR_BATTLE_WIDTH = 80;
exports.AVATAR_SPEED_WALK = 4 * exports.TILE_SIZE;
exports.GRASS_ENCOUNTER_RATE = 320;
exports.CAVES_ENCOUNTER_RATE = 160;
exports.WATER_ENCOUNTER_RATE = 320;
exports.SEAWEED_ENCOUNTER_RATE = 320;
exports.CHAR_IN_FONT = [
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
exports.MAPS = {
    'littleroot town': littleroot_town_1.littleroot_town,
    'route 101': route_101_1.route_101,
    'oldale town': oldale_town_1.oldale_town,
    'route 102': route_102_1.route_102,
};
//# sourceMappingURL=game_constants.js.map