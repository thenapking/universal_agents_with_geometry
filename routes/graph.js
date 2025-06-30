// Rewrite Scene, so that we find the principal coffer by centrality
// Identify the other coffers by communities
// Add in the code to draw convert the graph as polylines, and draw it
// See if we can refactor in the stuff from coffers.
class Graph {
  constructor(nodes = [], edges = []) {
    this.nodes = [];
    this.node_ids = [];
    this.edges = []
    this.degrees = new Map(); 
    this.weighted_degrees = new Map();
    this.weight = 0;
    this.community_weight = []; // total links weight
    this.internal_weight = []
    this.chains = [];
    this.adjacency = new Map();
    this.communities = [];
    this.initialize(edges);
  }

  initialize(edges = []) {
    // Initialize the adjacency list for each node
    for (let edge of edges) {
      this.add_edge(edge);
    }
  }

  add_node(a){
    if(!this.adjacency.has(a.id)){
      this.adjacency.set(a.id, []);
      this.nodes.push(a);
      this.node_ids.push(a.id);
      this.degrees.set(a.id, 0);
    }
  }

  add_edge(edge){
    if(edge.start.position === edge.end.position) { return; } // Prevent self-loops

    this.add_node(edge.start);
    this.add_node(edge.end);

    this.edges.push(edge);

    this.adjacency.get(edge.start.id).push(edge);
    this.adjacency.get(edge.end.id).push(edge);

    this.degrees.set(edge.start.id, this.adjacency.get(edge.start.id).length);
    this.degrees.set(edge.end.id, this.adjacency.get(edge.end.id).length);

    this.weight += edge.weight;
  }


  find(id){
    return this.nodes.find(node => node.id === id);
  }

  // NOT REQUIRED:
  degree(node){
    if (!this.adjacency.has(node.id)) return 0;
    return this.adjacency.get(node.id).length;
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

  dfsCycleForest(root) {
    const visited = new Set();
    const parent = {};
    const nontreeEdges = [];
    const stack = [root];
    const dfsNodes = [];

    while (stack.length) {
      const node = stack.pop();
      if (!visited.has(node.id)) {
        visited.add(node.id);
        dfsNodes.push(node);
        for (const edge of this.adjacency.get(node.id)) {
          const neighbor = (edge.start_id === node.id) ? edge.end : edge.start;

          if (!visited.has(neighbor.id)) {
            parent[neighbor.id] = node;
            stack.push(neighbor);
          } else if (parent[node.id] !== neighbor.id) {
            // Non-tree edge (cycle edge)
            nontreeEdges.push([node.id, neighbor.id].sort().join(","));
          }
        }
      }
    }
    console.log(nontreeEdges)
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

    // Loop over all nodes to make sure we process each component
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        const { parent, nontreeEdges, dfsNodes } = this.dfsCycleForest(node);

        // For each node and its non-tree edges, generate the chains
        for (const other of dfsNodes) {
          visited.add(other.id);
          for (const edge of nontreeEdges) {
            const [u, v] = edge.split(",").map(Number);
            if (u === other.id || v === other.id) {
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

  // Use depth-first search to find cycles in the forest of the graph
  find_cycles(root) {
    const visited = new Set();
    const parent = {};
    const cycles = [];
    const stack = [root];
    const dfs_nodes = [];

    while (stack.length) {
      const node = stack.pop();
      // console.log("Visiting node: ", node.id);
      if (!visited.has(node.id)) {
        visited.add(node.id);
        dfs_nodes.push(node);

        let edges = this.adjacency.get(node.id)
        for (let edge of edges) {
          const neighbour = edge.grab(node.id)
          // console.log("Checking neighbour: ", neighbour.id);
          if (!visited.has(neighbour.id)) {
            // console.log("Visiting neighbour: ", neighbour.id);
            parent[neighbour.id] = node;
            stack.push(neighbour);
          } else if (parent[node.id] !== neighbour.id) {
            // console.log("Found cycle edge: ", edge);
            cycles.push(edge);
          }
        }
      }
    }
    console.log("Cycles found: ", cycles.length);
    console.log(cycles);
    console.log(nodes);
    return { parent, cycles, dfs_nodes };
  }


  decompose() {
    this.chains = [];
    const visited = new Set();

    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        const { parent, cycles, dfs_nodes } = this.find_cycles(node);
        console.log("Decomposing node: ", node.id);
        
        // For each node and its non-tree edges, generate the chains
        for (const other of dfs_nodes) {
          visited.add(other.id);
          console.log("Processing node: ", other.id);
          for (const edge of cycles) {
            let start = edge.start;
            let end = edge.end;
            if (start.id === other.id || end.id === other.id) {
              if(start.id === end.id) {console.log("-------- EQUAL")}
              console.log("Found non-tree edge: ", edge);
              // Create the cycle or cycle prefix starting with the non-tree edge
              const chain = this.create_chain(parent, start, end, visited);
              if(chain.length > 0) {
                console.log("Created chain: ", chain);

                this.chains.push(chain);
              }
            }
          }
        }
      }
    }
  }



  create_chain(parent, start, end, visited) {
    const chain = [start];  
    visited.add(start.id);
    let current = end;  // Start from the parent of the start node
    // Move forwards through the chain using the parent map
    while (current.id !== start.id && !visited.has(current.id)) {
      chain.push(current);
      visited.add(current.id);
      current = parent[current.id]; 
    }

    if (!current || current.id !== start.id) {
      return []; // incomplete path, bail
    }
  
  
    return chain;  // Return the chain of nodes
  }

  buildChain(G, u, v, visited) {
    const chain = [];
    while (!visited.has(v)) {
      chain.push([u, v]);
      visited.add(v);
      u = v;
      if(u === undefined) { break; }
      // console.log("Visiting node: ", u);
      v = G[u.id];
    }
    chain.push([u, v]);
    return chain;
  }


  to_polygon(){
    let decomposition = this.decompose();
    let polylines = [];
    for(let chain of decomposition) {
      // Skip chains with less than 2 connections
      // Theses all seem to be duplicates
      if(chain.length < 3) continue; 
      let points = []
      for(let node of chain) {
        points.push(node.position);
      }
      let last_node = chain[chain.length - 1];
      points.push(last_node.position); 
      console.log(points)
      let polyline = new Polyline(points).to_bezier(60).to_polygon(5, 'road');
      polylines.push(polyline);
    }
    return polylines;
  }

  modularity() {
    let result = 0;
    for(let i = 0; i < this.nodes.length; i++) {
      // i is community id
      if(this.community_weight[i] === 0) continue; // no links in this community
      let dw = this.community_weight[i] / this.weight;
      let iw = this.internal_weight[i] / this.weight; 
      result += (iw) - (dw * dw);
    }

    return result;
    
  }

  modularity_gain(shared_weight, community_id, weighted_degree) {
    let dw = this.community_weight[community_id] / this.weight;
    let gain = shared_weight - weighted_degree * dw;
    return gain;
  }


  basic_communities(){
    this.weighted_degrees = new Map(); 
    this.community_weight = new Map(); // total links weight

    for (let community_id = 0; community_id < this.nodes.length; community_id++) {
      let node = this.nodes[community_id];
      

      let weighted_degree = 0;
      let neighbours = this.adjacency.get(node.id)

      for(let edge of neighbours) {
        weighted_degree += edge.weight;
      }

      this.weighted_degrees.set(node.id, weighted_degree);
      node.community_id = community_id; // Assign community ID to the node
      this.community_weight[community_id] =  weighted_degree;
      this.internal_weight[community_id] = 0; 
    }
  }

  // one pass of Louvain algorithm
  create_communities(){
    this.basic_communities();

    let delta = Infinity;
    let score = this.modularity();
    let tolerance = 1e-6;
    let node_ids = shuffle(this.node_ids);  
    let moves = 1;

    for(let i = 0; i < 100; i++) {
      if(delta < tolerance) { break; }
      if(moves === 0) { break; }

      moves = 0;

      node_ids = shuffle(node_ids);
      for(let node_id of node_ids) {
        let node = this.find(node_id);
        let community_id = node.community_id;
        let neighbourhood = this.neighbourhood(node);
        let shared_weight = neighbourhood.get(community_id) || 0;

        this.remove_node_from_community(node, community_id, shared_weight);

        let best_community_id = community_id;
        let best_gain = 0;
        let weighted_degree = this.weighted_degrees.get(node_id) || 0;
        for(let [other_community_id, weight] of neighbourhood) {
          if(other_community_id === community_id) continue; // skip current community
          let gain = this.modularity_gain(weight, other_community_id, weighted_degree);
          if(gain > best_gain) {
            best_gain = gain;
            best_community_id = other_community_id;
          }
        }

        let best_shared_weight = neighbourhood.get(best_community_id) || 0;
        this.add_node_to_community(node, best_community_id, best_shared_weight);
        if(best_community_id !== community_id) { moves++; }
      }



      let new_score = this.modularity();  
      delta = new_score - score;
      score = new_score;
    }

    // After the loop, we can finalize the communities
    this.communities = [];
    for (let i = 0; i < this.nodes.length; i++) {
      let node = this.nodes[i];
      let community_id = node.community_id;
      
      if (community_id >= 0) {
        if(this.communities[community_id] === undefined) {
          this.communities[community_id] = [];
        }

        this.communities[community_id].push(this.nodes[i]);
      }
    }
  }

  create_graph_from_communities() {
    let counter = 0;
    let new_nodes = []
    let new_edges = []
    for(let i = 0; i < this.communities.length; i++) {
      let community = this.communities[i];
      let centroid = createVector(0, 0);
      counter++;
      if(community === undefined || community.length === 0) continue;
      for(let node of community) {
        centroid.add(node.position);
      }
      centroid.div(community.length);

      let community_node = new Node(centroid.x, centroid.y); 
      community_node.members = community.map(n => n.members || [n]).flat();
      community_node.calculate_radius();
      new_nodes[i] = community_node;
    } 

    for(let edge of this.edges) {
      let start_community_id = edge.start.community_id;
      let end_community_id = edge.end.community_id;
      if(start_community_id === end_community_id) { continue; }

      let start_community = new_nodes[start_community_id];
      let end_community = new_nodes[end_community_id];
      let new_edge = new Edge(start_community, end_community, 1);

      new_edges.push(new_edge);
    }

    let new_graph = new Graph(new_nodes, new_edges);


    return new_graph;
  }
  
  add_node_to_community(node, community_id, shared_links_weight = 0) {
    node.community_id = community_id;
    let weighted_degree = this.weighted_degrees.get(node.id) || 0;
    this.community_weight[community_id] += weighted_degree;
    this.internal_weight[community_id] += 2 * shared_links_weight;

  }

  remove_node_from_community(node, community_id, shared_links_weight = 0) {
    node.community_id = -1; 
    let weighted_degree = this.weighted_degrees.get(node.id) || 0;
    this.community_weight[community_id] -= weighted_degree;
    this.internal_weight[community_id] -= 2 * shared_links_weight;
  }
  
  neighbourhood(node) {
    let neighbours = this.adjacency.get(node.id);

    let nmap = new Map();
    let community_id = node.community_id;
    nmap.set(community_id, 0);
    
    for (let edge of neighbours) {
      // neighbours is a collection of Edges
      let other_node = edge.grab(node.id);
      let other_community_id = other_node.community_id;
      let current = nmap.get(other_community_id) || 0;
      
      nmap.set(other_community_id, current + edge.weight);
    }
    
    return nmap
  }

  louvain(n = 2){
    let current = this;
    for(let i = 0; i < n; i++) {
      current.create_communities();
      const nc = current.communities.filter(c => c).length;
      if(nc === current.nodes.length) { break }
      current = current.create_graph_from_communities();
    }

    return current;
  }

  // Katz centrality algorithm
  // Works better with weighted edges
  centrality({ alpha = 0.01, beta = 1, guard = 1000, tol = 1e-6 } = {}) {
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

  draw(){
    push();
      for (let node of this.nodes) {
        node.draw();
      }
    pop();
  }
}
