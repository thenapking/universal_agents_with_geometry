class Graph {
  constructor(nodes = [], edges = []) {
    this.nodes = [];
    this.edges = [];
    this.chains = [];
    this.adjacency = new Map();
    this.initialize(nodes, edges);
  }

  initialize(nodes = [], edges = []) {
    // Initialize the adjacency list for each node
    for (let node of nodes) {
      this.add_node(node);
    }
    for (let edge of edges) {
      this.add_edge(edge);
    }
  }

  add_node(a){
    if(!this.adjacency.has(a.id)){
      this.adjacency.set(a.id, []);
      this.nodes.push(a);
    }
  }

  add_edge(edge){
    this.add_node(edge.start);
    this.add_node(edge.end);

    this.edges.push(edge);

    this.adjacency.get(edge.start.id).push(edge);
    this.adjacency.get(edge.end.id).push(edge);
  }

  find(id){
    return this.nodes.find(node => node.id === id);
  }

  degree(node){
    if (!this.adjacency.has(node)) return 0;
    return this.adjacency.get(node).length;
  }

  has_edge(a, b) {
    if (!this.adjacency.has(a) || !this.adjacency.has(b)) return false;
    return this.adjacency.get(a).some(edge => edge.grab(a) === b);
  }

  // Dijkstra
  shortest(a, b) {
    const distances = {};
    const previous = {};
    const queue = [];

    for (let node of this.nodes) {
      distances[node.id] = Infinity;
      previous[node.id] = null;
      queue.push(node.id);
    }

    distances[a.id] = 0;

    while (queue.length > 0) {
      // Remove the node with the smallest distance from the queue
      let current_id = queue[0];
      for (let i = 1; i < queue.length; i++) {
        let id = queue[i];
        if (distances[id] < distances[current_id]) {
          current_id = id;
        }
      }
      queue.splice(queue.indexOf(current_id), 1);

      // If we've reached the end node, reconstruct the path
      if (current_id === b.id) {
        const path = [];
        let previous_id = b.id;

        while (previous_id !== null) {
          let previous_node = this.find(previous_id);
          path.unshift(previous_node);
          previous_id = previous[previous_id];
        }

        return path;
      }

      // Explore the connected edges
      let edges = this.adjacency.get(current_id)
      for (let edge of edges) {
        const edge_id = edge.grab(current_id)

        const distance = distances[current_id] + edge.distance;

        if (distance < distances[edge_id]) {
          distances[edge_id] = distance;
          previous[edge_id] = current_id;
        }
      }
    }

    return null;
  }

  // Use depth-first search to find cycles in the forest of the graph
  cycles(root) {
    const visited = new Set();
    const parent = {};
    const cycles = [];
    const stack = [root];
    const nodes = [];

    while (stack.length) {
      const node = stack.pop();
      if (!visited.has(node.id)) {
        visited.add(node.id);
        nodes.push(node);

        let edges = this.adjacency.get(node.id)
        for (let edge of edges) {
          const neighbour = edge.grab(node.id)

          if (!visited.has(neighbour.id)) {
            parent[neighbour.id] = node.id;
            stack.push(neighbour);
          } else if (parent[node.id] !== neighbour.id) {
            cycles.push(edge);
          }
        }
      }
    }

    return { parent, cycles, nodes };
  }

  decompose() {
    const chains = [];
    const visited = new Set();

    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        const { parent, cycles, nodes } = this.cycles(node);
        
        // For each node and its non-tree edges, generate the chains
        for (const other of nodes) {
          visited.add(other.id);
          for (const edge of cycles) {
            let start = edge.start;
            let end = edge.end;
            if (start.id === node.id || end.id === node.id) {
              // Create the cycle or cycle prefix starting with the non-tree edge
              const chain = this.create_chain(parent, start, end, visited);
              chains.push(chain);
            }
          }
        }
      }
    }
    return chains;
  }

  create_chain(parent, start, end, visited) {
    console.log("Creating chain from", start, "to", end, "with parent map:", parent);
    const chain = [start];  
    visited.add(start);
  
    // Move forwards through the chain using the parent map
    while (end !== start && !visited.has(end)) {
      chain.push(end);
      visited.add(end);
      
      if (parent[end.id] === undefined) {
        break;  // Exit if parent is missing
      }

      end = parent[end.id]; 
    }
  
    if (start !== end) {
      chain.push(start);
    }
  
    return chain;  // Return the chain of nodes
  }

  modularity(communities) {
    const m = this.edges.length;
    let Q = 0;
  
    for (let community of communities) {
      for(let node of community){
        for(let other of community){
          const A = this.has_edge(node, other) ? 1 : 0;
          const dN = this.degree(node);
          const dO = this.degree(other);
          Q += A - (dN * dO) / (2 * m);
        }
      }
    }
  
    return Q / (2 * m);
  }

  // I think this doesn't halt
  find_communities() {
    let communities = [];
    for (let node of this.nodes) {
      communities.push([node]);
    }

    let highest = this.modularity(communities);
    let improvement = true;
  
    while (improvement) {
      improvement = false;
      let best_i = null;
      let best_j = null;
      let best_delta = 0;
  
      for (let i = 0; i < communities.length; i++) {
        for (let j = i + 1; j < communities.length; j++) {
          const merged = [...communities[i], ...communities[j]];
          
          const trial = [...communities];  
          trial[i] = merged;  
          trial.splice(j, 1);  
  
          const modularity = this.modularity(trial);
          const delta = modularity - highest;
  
          if (delta > best_delta) {
            best_delta = delta;
            best_i = i;
            best_j = j;
            improvement = true;
          }
        }
      }
  
      if (best_i) {
        communities[best_i] = [...communities[best_i], ...communities[best_j]];
        communities.splice(j, 1);
        highest += best_delta;
      }
    }
  
    return communities;
  }

  // Katz centrality algorithm
  // Requires edges to be weighted
  centrality({ alpha = 0.1, beta = 1, maxIter = 100, tol = 1e-6 } = {}) {
    const centrality = {};
    const lastCentrality = {};
  
    // Initialize centrality scores
    for (const node of this.nodes) {
      centrality[node.id] = 1;
    }
  
    
  
    // Power iteration
    for (let iter = 0; iter < maxIter; iter++) {
      let maxChange = 0;
  
      // Copy previous values
      for (const id in centrality) {
        lastCentrality[id] = centrality[id];
      }
  
      for (const node of this.nodes) {
        let sum = 0;
        const incoming = this.adjacency.get(node.id);
        for (const edge of incoming) {
          sum += edge.weight * lastCentrality[edge.from];
        }
  
        centrality[node.id] = beta + alpha * sum;
  
        const change = Math.abs(centrality[node.id] - lastCentrality[node.id]);
        if (change > maxChange) maxChange = change;
      }
  
      if (maxChange < tol) {
        console.log(`Katz converged in ${iter + 1} iterations`);
        break;
      }
    }
  
    return centrality;
  }
  
  
}
