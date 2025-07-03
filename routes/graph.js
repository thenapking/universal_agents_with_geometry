class Graph {
  constructor(edges = [], nodes = []) {
    this.graphlib = new graphlib.Graph({directed: false});
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
    this.initialize(edges, nodes);
  }

  initialize(edges, nodes) {
    // Initialize the adjacency list for each node
    for(let node of nodes) {
      this.add_node(node);
    }
    for (let edge of edges) {
      this.add_edge(edge);
    }

  }

  add_node(a){
    this.graphlib.setNode(a.id)
    this.nodes.push(a);
    this.node_ids.push(a.id);
  }

  add_edge(edge){
    if(edge.start.position === edge.end.position) { return; } // Prevent self-loops


    this.edges.push(edge);
    this.graphlib.setEdge(edge.start.id, edge.end.id)

  }


  find(id){
    return this.nodes.find(node => node.id === id);
  }

  find_edge(from_id, to_id) {
    for(let edge of this.edges) {
      if(edge.start.id === from_id && edge.end.id === to_id) {
        return edge;
      } else if(edge.start.id === to_id && edge.end.id === from_id) {
        return edge
      }
    }
    return null;
  }

  find_edges(node_id) {
    let edges = [];
    for(let edge of this.edges) {
      if(edge.start.id === node_id || edge.end.id === node_id) {
        edges.push(edge);
      }
    }
    return edges;
  }

  find_chain(start, end, maxDepth = Infinity) {
    // return new graphologyLibrary.simplePath.allSimplePaths(this.graphologyGraph, start.id, end.id, { maxDepth });
  }

 

  find_chain_from_node(start_id, visited) {
    let chain = [start_id];
    let current_id = start_id;
    let neighbors = this.graphlib.neighbors(current_id);

    while (neighbors.length > 0) {
      let next_id = neighbors[0]
      if (visited.has(next_id)) { break; } // Stop if we revisit a node
      chain.push(int(next_id));
      visited.add(next_id);
      current_id = next_id;
      neighbors = this.graphlib.neighbors(current_id);
    }



    return chain;
  }

  find_all_chains() {
    this.chains = [];
    let visited = new Set();
    
    for (let node of this.nodes) {
      if (!visited.has(node.id)) {
        visited.add(node.id);
        let chain = this.find_chain_from_node(node.id, visited);
        if (chain.length > 1) {
          this.chains.push(chain);
        }
      }
    }
  }


  components() {
    let chains =  graphlib.alg.components(this.graphlib);
    for(let chain of chains){
      let new_chain = [];
      for(let id of chain) {
        new_chain.push(int(id));
      }
      this.chains.push(new_chain);
    }
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
      let edge_ids = this.graphlib.neighbors(current_id);
      for (let edge_id of edge_ids) {
        let edge = this.find_edge(current_id, int(edge_id));
        const next_edge_id = edge.grab(current_id).id

        const distance = distances[current_id] + edge.distance;

        if (distance < distances[next_edge_id]) {
          distances[next_edge_id] = distance;
          previous[next_edge_id] = current_id;
        }
      }
    }

    return null;
  }

  split(a, b){
    // a and b are two arrays of node_ids
    
    let overlaps = []
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        if (a[i] === b[j]) {
          let overlapStart = i;
          let overlapEnd = null;
          let new_start = i;
          let new_end = j;
          
          // Check for contiguous matching nodes
          while (new_start < a.length && new_end < b.length && a[new_start] === b[new_end]) {
            new_start++;
            new_end++;
          }
          
          if (new_end - j > 1) { // If overlap length is greater than 1
            overlapStart = i;
            overlapEnd = new_end - 1;
          }

          let overlap = [];
          for(let k = overlapStart; k <= overlapEnd; k++) {
            overlap.push(b[k]);
          }
          overlaps.push(overlap);
          j = new_end; // Skip to the end of the overlap
        }
      }
    }
    return overlaps;
  }



  draw_route(arr){
    stroke(255,0,0)
    for(let i = 0; i < arr.length - 1; i++) {
      let start = arr[i]
      let end = arr[i + 1]
      line(start.position.x, start.position.y, end.position.x, end.position.y);
    }
    stroke(0)
  }


  draw_chain(id){
    let chain = this.chains[id];
    textSize(10);
    beginShape();
    let previous = null;
    for(let node_id of chain) {
      let node = this.find(node_id);
      if(node) {
        circle(node.position.x, node.position.y, 5);
        fill(0)
        text(node.id, node.position.x + 5, node.position.y + 5);
        noFill();
        vertex(node.position.x, node.position.y);
      }
      if(previous) {
        let edge = this.find_edge(previous.id, node.id);
        if(!edge) {
          console.log(`No edge found between ${previous.id} and ${node.id}`);
        }
      }

      previous = node;
    }
    endShape();

   
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
    this.components();
    let polylines = [];
    for(let chain of this.chains) {
      
      if(chain.length < 2) continue;
      let points = []

      for(let id of chain) {
        let node = this.find(id);
        
        points.push(node.position);
      }
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

  sorted_neighbors(node) {
    if (!this.adjacency.has(node.id)) return [];
    const neighbors = this.adjacency.get(node.id);
    return neighbors.sort((a, b) => a.id - b.id);
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
