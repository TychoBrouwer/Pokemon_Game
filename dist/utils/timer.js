export class Timer {
    constructor() {
        this.timers = {};
    }
    startTimer(delta, id, delay) {
        if (id in this.timers) {
            this.timers[id] = 0;
        }
        this.timers[id] = +delta;
        if (this.timers[id] >= delay) {
            return true;
        }
        return false;
    }
    resetTimer(id) {
        delete this.timers[id];
    }
    getTimer(id) {
        return this.timers[id];
    }
}
//# sourceMappingURL=timer.js.map