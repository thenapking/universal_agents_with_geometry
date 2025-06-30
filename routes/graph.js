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

  find_communities({ resolution = 1, threshold = 1e-7, maxLevel = 2, seed = Math.random } = {}) {
    const levels = [];
    let communities = this.base_communitys(); // initial: each node its own community
    let mod = this.modularity(communities);
  
    let level = 0;
    let improvement = true;
  
    while (improvement && (maxLevel === null || level < maxLevel)) {
      const { newCommunities, improved } = this._louvainOneLevel(communities, resolution, seed);
      const newMod = this.modularity(newCommunities);
      console.log(`Level ${level}: Modularity = ${newMod}, Improvement = ${improved}`);
      levels.push(newCommunities);
  
      if (!improved || (newMod - mod < threshold)) {
        break;
      }
  
      communities = newCommunities;
      mod = newMod;
      level += 1;
    }
  
    return 
  }

  // THIS JUNK METHOD JUST DOESN@T WORK
  // WE NEED TO BE VERY CAREFUL AND GO BACK TO THE NETWORK X CODE.
  // THE PREVIOUS FIND COMMUNITIES METHOD FROM NETWORK X WAS ALSO EXTREMELY SLOW
  // WE'RE ADDING A LOT OF CONCEPTUAL OVERHEAD HERE
  _louvainOneLevel(communities, resolution, seed = Math.random) {
    const node2com = new Map();
    communities.forEach((group, index) => {
      for (const node of group) {
        node2com.set(node.id, index);
      }
    });

    console.time("community lookup test");

    for (let u of this.nodes) {
      const neighbors = this.adjacency.get(u.id);
      for (let edge of neighbors) {
        const v = edge.start.id === u.id ? edge.end : edge.start;
        // simulate community lookup
        const vCommunity = node2com.get(v.id);  // pretend you have a Map
      }
    }
    
    console.timeEnd("community lookup test");
  
    const communityMap = communities.map(group => new Set(group.map(n => n.id)));
    const degrees = this.degrees;
    const m2 = this.edges.size * 2;
  
    let improvement = false;
    let nbMoves = 1;
    const shuffledNodes = shuffle(this.nodes);
    
  
    while (nbMoves > 0) {
      nbMoves = 0;
  
      for (const node of shuffledNodes) {
        const nodeId = node.id;
        const currentCom = node2com.get(nodeId);
        const degree = degrees.get(nodeId);
  
        // Track connection weights to each community
        const neighComWeights = new Map();
        const edges = this.adjacency.get(nodeId);
        for (const edge of edges) {
          const neighbor = edge.grab(nodeId);
          const neighborCom = node2com.get(neighbor.id);
          const weight = 1;
          neighComWeights.set(neighborCom, (neighComWeights.get(neighborCom) || 0) + weight);
        }
  
        let bestCom = currentCom;
        let bestGain = 0;
  
        const totalInCurrent = this._communityDegreeSum(communityMap[currentCom], degrees);
        const removeCost = -(neighComWeights.get(currentCom) || 0) / m2 +
          resolution * ((totalInCurrent - degree) * degree) / (m2 * m2);
  
        for (const [neighborCom, kiIn] of neighComWeights.entries()) {
          if (neighborCom === currentCom) continue;
          const totalInNeighbor = this._communityDegreeSum(communityMap[neighborCom], degrees);
          const gain = removeCost + (kiIn / m2) -
            resolution * (totalInNeighbor * degree) / (m2 * m2);
  
          if (gain > bestGain) {
            bestGain = gain;
            bestCom = neighborCom;
          }
        }
  
        if (bestCom !== currentCom) {
          // console.log(`Node ${nodeId} moved from community ${currentCom} to ${bestCom} with gain ${bestGain}`);
          communityMap[currentCom].delete(nodeId);
          communityMap[bestCom].add(nodeId);
          node2com.set(nodeId, bestCom);
          nbMoves++;
          improvement = true;
        }
      }
    }
  
    // Reconstruct new communities
    const newCommunities = [];
    const newComMap = new Map();
    for (const [nodeId, com] of node2com.entries()) {
      if (!newComMap.has(com)) newComMap.set(com, []);
      newComMap.get(com).push(this.find(nodeId));
    }
    for (const group of newComMap.values()) {
      newCommunities.push(group);
    }
    
    console.log(`Louvain level completed with ${newCommunities.length} communities and ${nbMoves} moves.`);
    return { newCommunities, improved: improvement };
  }

  _communityDegreeSum(communitySet, degreeMap) {
    let sum = 0;
    for (const id of communitySet) {
      sum += degreeMap.get(id);
    }
    return sum;
  }
  

  // Katz centrality algorithm
  // Works better with weighted edges
  centrality({ alpha = 0.1, beta = 1, guard = 1000, tol = 1e-6 } = {}) {
    const results = {};
    const previous = {};
  
    for (const node of this.nodes) {
      results[node.id] = 1;
    }
  
    for (let i = 0; i < guard; i++) {
      let maximum = 0;
  
      for (const id in results) {
        previous[id] = results[id];
      }
  
      for (const node of this.nodes) {
        let sum = 0;
        const incoming = this.adjacency.get(node.id);

        for (const edge of incoming) {
          sum += edge.weight * previous[edge.end.id];
        }
  
        results[node.id] = beta + alpha * sum;
  
        const change = Math.abs(results[node.id] - previous[node.id]);
        if (change > maximum) maximum = change;
      }
  
      if (maximum < tol) {
        break;
      }
    }
  
    return results;
  }
  
  
}
