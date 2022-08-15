import { Game } from './components/game'

window.onload = function () {
  const gameCanvas = (document.getElementById('mainGameCanvas') as HTMLCanvasElement);
  const gameContext = gameCanvas.getContext('2d');

  const battleCanvas = (document.getElementById('battleCanvas') as HTMLCanvasElement);
  const battleContext = battleCanvas.getContext('2d');

  const overlayCanvas = (document.getElementById('overlayCanvas') as HTMLCanvasElement);
  const overlayContext = overlayCanvas.getContext('2d');

  if (gameContext && battleContext && overlayContext) {
    new Game(gameContext, battleContext, overlayContext);

    gameCanvas.height = Game.GAME_HEIGHT;
    gameCanvas.width = Game.GAME_WIDTH;
    battleCanvas.height = Game.GAME_HEIGHT;
    battleCanvas.width = Game.GAME_WIDTH;
    overlayCanvas.height = Game.GAME_HEIGHT;
    overlayCanvas.width = Game.GAME_WIDTH;
  }
};