export class InMemoryMetrics {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
  }

  increment(key, value = 1) {
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + value);
  }

  setGauge(key, value) {
    this.gauges.set(key, value);
  }

  snapshot() {
    return {
      counters: Object.fromEntries(this.counters.entries()),
      gauges: Object.fromEntries(this.gauges.entries())
    };
  }
}
