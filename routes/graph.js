class Graph {
  constructor(edges = []) {
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

  // TO DO REFACTOR THESE UGLY, BUT WORKING METHODS
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
            parent[neighbor.id] = node.id;
            stack.push(neighbor);
          } else if (parent[node.id] !== neighbor.id) {
            // Non-tree edge (cycle edge)
            nontreeEdges.push([node.id, neighbor.id].sort().join(","));
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

    // Loop over all nodes to make sure we process each component
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        // console.log("Processing node: ", node.id);
        const { parent, nontreeEdges, dfsNodes } = this.dfsCycleForest(node);

        // For each node and its non-tree edges, generate the chains
        for (const other of dfsNodes) {
          
          visited.add(other.id);
          for (const edge of nontreeEdges) {
            const [u, v] = edge.split(",").map(Number);
            if (u === other.id || v === other.id) {
              // console.log("Found non-tree edge: ", edge, other.id);
              // Create the cycle or cycle prefix starting with the non-tree edge
              const chain = this.buildChain(parent, u, v, visited);
              this.chains.push(chain);
            }
          }
        }
      }
    }
  }

  




  to_polygons(){
    let polylines = this.to_polylines();
    let polygons = [];
    for(let polyline of polylines) {
      let polygon = polyline.to_polygon(INTERCITY_ROAD, 'road');
      polygons.push(polygon);
    }
    return polygons;
  }

  to_polylines(){
    this.chainDecomposition();
    let polylines = [];
    for(let chain of this.chains) {
      
      // TODO
      // There's a bug in the chain decomposition algorithm
      // For this data, chains of less than 5 in length, are not really loops.
      // This causes the "pinched" polygons.  
      // They are lines which then erroneously have their first point added in again, pulling them back to the start
      if(chain.length < 5) continue;
      let points = []
      for(let pair of chain) {
        let id = pair[0]
        let node = this.find(id);
        points.push(node.position);
      }
      let last_node_id = chain[chain.length-1][1];
      let last_node= this.find(last_node_id);
      points.push(last_node.position); 
      let polyline = new Polyline(points, false).to_bezier(60)
    
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
    let node_ids = deterministic_shuffle(this.node_ids);  
    let moves = 1;

    for(let i = 0; i < 100; i++) {
      if(delta < tolerance) { break; }
      if(moves === 0) { break; }

      moves = 0;

      node_ids = deterministic_shuffle(node_ids);
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

    let new_graph = new Graph(new_edges);


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

  draw_polygons(){
    push();
      let polygons = this.to_polygon();
      for(let poly of polygons) {
        poly.draw();
      }
    pop();
  }
}
