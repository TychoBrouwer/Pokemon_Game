export class Timer {
  private timers: {
    [id: string]: number;
  };
  
  constructor() {
    this.timers = {}
  }

  startTimer(delta: number, id: string, delay: number) {
    if (!(id in this.timers)) {
      this.timers[id] = 0;
    }

    this.timers[id] += delta;

    if (this.timers[id] >= delay) {
      return true;
    }

    return false;
  }

  resetTimer(id: string) {
    delete this.timers[id];
  }

  getTimer(id: string) {
    return this.timers[id];
  }
}