"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./components/game");
window.onload = function () {
    const gameCanvas = document.getElementById('mainGameCanvas');
    const gameContext = gameCanvas.getContext('2d');
    const battleCanvas = document.getElementById('battleCanvas');
    const battleContext = battleCanvas.getContext('2d');
    const overlayCanvas = document.getElementById('overlayCanvas');
    const overlayContext = overlayCanvas.getContext('2d');
    if (gameContext && battleContext && overlayContext) {
        new game_1.Game(gameContext, battleContext, overlayContext);
        gameCanvas.height = game_1.Game.GAME_HEIGHT;
        gameCanvas.width = game_1.Game.GAME_WIDTH;
        battleCanvas.height = game_1.Game.GAME_HEIGHT;
        battleCanvas.width = game_1.Game.GAME_WIDTH;
        overlayCanvas.height = game_1.Game.GAME_HEIGHT;
        overlayCanvas.width = game_1.Game.GAME_WIDTH;
    }
};
//# sourceMappingURL=main.js.map