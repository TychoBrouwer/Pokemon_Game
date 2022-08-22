import { Game } from './components/game'

import { GAME_HEIGHT, GAME_WIDTH } from './constants/game_constants'

window.onload = function () {
  const gameCanvas = (document.getElementById('mainGameCanvas') as HTMLCanvasElement);
  const gameContext = gameCanvas.getContext('2d');

  const battleCanvas = (document.getElementById('battleCanvas') as HTMLCanvasElement);
  const battleContext = battleCanvas.getContext('2d');

  const overlayCanvas = (document.getElementById('overlayCanvas') as HTMLCanvasElement);
  const overlayContext = overlayCanvas.getContext('2d');

  if (gameContext && battleContext && overlayContext) {
    new Game(gameContext, battleContext, overlayContext);

    gameCanvas.height = GAME_HEIGHT;
    gameCanvas.width = GAME_WIDTH;
    battleCanvas.height = GAME_HEIGHT;
    battleCanvas.width = GAME_WIDTH;
    overlayCanvas.height = GAME_HEIGHT;
    overlayCanvas.width = GAME_WIDTH;
  }
};