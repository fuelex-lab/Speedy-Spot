export class PlaybackCoordinator {
  constructor() {
    this.guildLocks = new Set();
    this.guildState = new Map();
  }

  acquire(guildId) {
    if (this.guildLocks.has(guildId)) {
      return false;
    }

    this.guildLocks.add(guildId);
    return true;
  }

  release(guildId) {
    this.guildLocks.delete(guildId);
  }

  setState(guildId, state) {
    this.guildState.set(guildId, state);
  }

  mergeState(guildId, patch) {
    const existing = this.getState(guildId) ?? {};
    this.guildState.set(guildId, {
      ...existing,
      ...patch
    });
  }

  getState(guildId) {
    return this.guildState.get(guildId) ?? null;
  }
}
