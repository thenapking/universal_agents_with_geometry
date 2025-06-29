// TODO finish off Katz Centrality and Communities and Test
// Rewrite Scene, so that we find the principal coffer by centrality
// Identify the other coffers by communities
// Add in the code to draw convert the graph as polylines, and draw it
// See if we can refactor in the stuff from coffers.
class Graph {
  constructor(nodes = [], edges = []) {
    this.nodes = [];
    this.edges = new Set();
    this.degrees = new Map(); 
    this.chains = [];
    this.adjacency = new Map();
    this._modularity = new Map(); // cache 
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
      this.degrees.set(a.id, 0);
    }
  }

  add_edge(edge){
    this.add_node(edge.start);
    this.add_node(edge.end);

    this.edges.add(edge.key())

    this.adjacency.get(edge.start.id).push(edge);
    this.adjacency.get(edge.end.id).push(edge);

    this.degrees.set(edge.start.id, this.degrees.get(edge.start.id) + 1);
    this.degrees.set(edge.end.id, this.degrees.get(edge.end.id) + 1);
  }

  find(id){
    return this.nodes.find(node => node.id === id);
  }

  degree(node){
    if (!this.adjacency.has(node.id)) return 0;
    return this.adjacency.get(node.id).length;
  }

  has_edge(a, b) {
    return this.edges.has(Edge.key(a, b));
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
    if (!this._modularity) this._modularity = new Map();

    const key = this.keyForCommunities(communities);
    if (this._modularity.has(key)) {
      return this._modularity.get(key);
    }

    const m = this.edges.size; // edges is a set
    let Q = 0;
    
    for(let community of communities) {
      for (let i = 0; i < community.length; i++) {
        const node = community[i];
        for (let j = i + 1; j < community.length; j++) {
          const other = community[j];
          
          const A = this.has_edge(node, other) ? 1 : 0;
          const dN = this.degrees.get(node.id);
          const dO = this.degrees.get(other.id);
          
          Q += A - (dN * dO) / (2 * m);
        }
      }
    }
    let result = Q / (2 * m);
    this._modularity.set(key, result);
    return result;
  }

  keyForCommunities(communities) {
    return communities
      .map(comm => comm.map(n => n.id).sort((a, b) => a - b).join("-"))
      .sort()  // to make key order-invariant
      .join("_");
  }

  base_communitys(){
    let communities = [];
    for (let node of this.nodes) {
      communities.push([node]);
    }
    return communities;
  }

  // I think this doesn't halt
  find_communities() {
    let communities = this.base_communitys();

    let highest = this.modularity(communities);
    console.log(`Initial modularity: ${highest}`);
    let improvement = true;
    let guard = 0
    while (improvement && guard < 100) {
      // console.log(`Iteration ${guard}: Current highest modularity: ${highest}`);
      guard++;
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
            console.log(`Found better community merge: ${i} + ${j} with delta ${delta}`);
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
  centrality({ alpha = 0.1, beta = 1, guard = 100, tol = 1e-6 } = {}) {
    const results = {};
    const previous = {};
  
    // Initialize centrality scores
    for (const node of this.nodes) {
      results[node.id] = 1;
    }
  
    for (let i = 0; i < guard; i++) {
      let maximum = 0;
  
      // Copy previous values
      for (const id in results) {
        previous[id] = results[id];
      }
  
      for (const node of this.nodes) {
        let sum = 0;
        const incoming = this.adjacency.get(node.id);

        for (const edge of incoming) {
          sum += edge.weight * previous[edge.from];
        }
  
        results[node.id] = beta + alpha * sum;
  
        const change = Math.abs(results[node.id] - previous[node.id]);
        if (change > maximum) maximum = change;
      }
  
      if (maximum < tol) {
        console.log(`Katz converged in ${i + 1} iterations`);
        break;
      }
    }
  
    return results;
  }
  
  
}
