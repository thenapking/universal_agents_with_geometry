class DisjointSet {
  constructor(elements) {
    this.parent = new Map();
    for (let e of elements) {
      this.parent.set(e, e);
    }
  }

  find(e) {
    if (this.parent.get(e) !== e) {
      this.parent.set(e, this.find(this.parent.get(e))); // Path compression
    }
    return this.parent.get(e);
  }

  union(a, b) {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
      return true; // Union was successful
    }
    return false; // Already connected
  }
}
