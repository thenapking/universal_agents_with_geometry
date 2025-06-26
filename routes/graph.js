class Graph {
  constructor(hotspots = [], connections = []) {
    this.hotspots = hotspots;
    this.connections = connections;
    this.adjacencyList = new Map();
    this.initialize();
  }

  initialize() {
    for(let hotspot of this.hotspots) {
      this.adjacencyList.set(hotspot.id, []);
    }
    for(let connection of this.connections) {
      this.adjacencyList.get(connection.from_id).push(connection);
      this.adjacencyList.get(connection.to_id).push(connection);
    }
  }

  distance(a, b) {
    return p5.Vector.dist(a.position, b.position);
  }

  // Dijkstra's algorithm to find the shortest path
  shortest(start_id, end_id) {
    const distances = {};
    const previous = {};
    const queue = [];

    // Initialize distances for all hotspots as infinity, except for the start hotspot
    for (let hotspot of this.hotspots) {
      distances[hotspot.id] = Infinity;
      previous[hotspot.id] = null;
      queue.push(hotspot.id);
    }
    distances[start_id] = 0;

    // While there are hotspots to explore
    while (queue.length > 0) {
      // Get the hotspot with the smallest distance
      let currentId = queue.reduce((minId, id) => distances[id] < distances[minId] ? id : minId, queue[0]);
      queue.splice(queue.indexOf(currentId), 1);

      // If we've reached the end hotspot, we can reconstruct the path
      if (currentId === end_id) {
        const path = [];
        let previous_id = end_id;
        while (previous_id !== null) {
          path.unshift(this.hotspots.find(hotspot => hotspot.id === previous_id));
          previous_id = previous[previous_id];
        }
        // TODO remove scaling
        return path.map(hotspot => createVector(hotspot.position.x, hotspot.position.y).mult(0.5));
      }

      // Explore the neighbors (connected hotspots)
      for (let connection of this.adjacencyList.get(currentId)) {
        const neighborId = (connection.from_id === currentId) ? connection.to_id : connection.from_id;
        //TODO update connection model to have distance, not dist
        const newDist = distances[currentId] + connection.dist;

        if (newDist < distances[neighborId]) {
          distances[neighborId] = newDist;
          previous[neighborId] = currentId;
        }
      }
    }

    // If no path was found
    return null;
  }
}
