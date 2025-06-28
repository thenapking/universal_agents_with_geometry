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

  dfsCycleForest(root) {
    const visited = new Set();
    const parent = {};
    const nontreeEdges = [];
    const stack = [root];
    const dfsNodes = [];

    while (stack.length) {
      const node = stack.pop();
      if (!visited.has(node)) {
        visited.add(node);
        dfsNodes.push(node);

        for (const connection of this.adjacencyList.get(node)) {
          const neighbor = (connection.from_id === node) ? connection.to_id : connection.from_id;

          if (!visited.has(neighbor)) {
            parent[neighbor] = node;
            stack.push(neighbor);
          } else if (parent[node] !== neighbor) {
            // Non-tree edge (cycle edge)
            nontreeEdges.push([node, neighbor].sort().join(","));
          }
        }
      }
    }

    return { parent, nontreeEdges, dfsNodes };
  }

  buildChain(G, u, v, visited) {
    const chain = [];
    while (!visited.has(v)) {
      chain.push([u, v]);
      visited.add(v);
      u = v;
      v = G[u];
    }
    chain.push([u, v]);
    return chain;
  }

  chainDecomposition() {
    const chains = [];
    const visited = new Set();

    // Loop over all hotspots to make sure we process each component
    for (const hotspot of this.hotspots) {
      if (!visited.has(hotspot.id)) {
        const { parent, nontreeEdges, dfsNodes } = this.dfsCycleForest(hotspot.id);

        // For each hotspot and its non-tree edges, generate the chains
        for (const node of dfsNodes) {
          visited.add(node);
          for (const edge of nontreeEdges) {
            const [u, v] = edge.split(",").map(Number);
            if (u === node || v === node) {
              // Create the cycle or cycle prefix starting with the non-tree edge
              const chain = this.buildChain(parent, u, v, visited);
              chains.push(chain);
            }
          }
        }
      }
    }
    return chains;
  }

  to_polygon(){
    let decomposition = this.chainDecomposition();
    let polylines = [];
    for(let chain of decomposition) {
      // Skip chains with less than 2 connections
      // Theses all seem to be duplicates
      if(chain.length < 3) continue; 
      let points = []
      for(let [from_id, to_id] of chain) {
        let from = this.hotspots.find(h => h.id === from_id);
        points.push(createVector(from.position.x, from.position.y));
      }
      let last = chain[chain.length - 1];
      let last_hotspot = this.hotspots.find(h => h.id === last[1]);
      points.push(createVector(last_hotspot.position.x, last_hotspot.position.y));
      let polyline = new Polyline(points).to_bezier(60).to_polygon(5, 'road');
      polylines.push(polyline);
    }
    return polylines;
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
        return path.map(hotspot => createVector(hotspot.position.x, hotspot.position.y));
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
