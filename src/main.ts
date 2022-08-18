import { Game } from './components/game'

window.onload = function () {
  const gameCanvas = (document.getElementById('mainGameCanvas') as HTMLCanvasElement);
  const gameContext = gameCanvas.getContext('2d');

  const battleCanvas = (document.getElementById('battleCanvas') as HTMLCanvasElement);
  const battleContext = battleCanvas.getContext('2d');

  const overlayCanvas = (document.getElementById('overlayCanvas') as HTMLCanvasElement);
  const overlayContext = overlayCanvas.getContext('2d');

  if (gameContext && battleContext && overlayContext) {
    const game = new Game(gameContext, battleContext, overlayContext);

    gameCanvas.height = game.c.GAME_HEIGHT;
    gameCanvas.width = game.c.GAME_WIDTH;
    battleCanvas.height = game.c.GAME_HEIGHT;
    battleCanvas.width = game.c.GAME_WIDTH;
    overlayCanvas.height = game.c.GAME_HEIGHT;
    overlayCanvas.width = game.c.GAME_WIDTH;
  }
};