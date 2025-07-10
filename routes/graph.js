class Graph {
  constructor(edges = [], nodes = []) {
    this.nodes = [];
    this.node_ids = [];
    this.edges = []
    this.degrees = new Map(); 
    this.weighted_degrees = new Map();
    this.neighbours = new Map();
    this.weight = 0;
    this.community_weight = []; // total links weight
    this.internal_weight = []
    this.chains = [];
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
    if(!a) { return;}
    if(!this.neighbours.has(a.id)) {
      this.nodes.push(a);
      this.node_ids.push(a.id);
      this.neighbours.set(a.id, []);
    }
  }

  add_edge(edge){
    if(edge.start.position === edge.end.position) { return; } // Prevent self-loops

    this.add_node(edge.start);
    this.add_node(edge.end);  
    this.edges.push(edge);
    this.neighbours.get(edge.start.id).push(edge.end.id);
    this.neighbours.get(edge.end.id).push(edge.start.id);
    edge.start.degree++;
    edge.end.degree++;

  }

  find(id){
    return this.nodes.find(node => node.id === id);
  }

  find_node_by_position(position) {
    let nearest = null;
    let nearest_distance = Infinity;
    for (let node of this.nodes) {
      let distance = p5.Vector.dist(node.position, position);
      if (distance < nearest_distance) {
        nearest_distance = distance;
        nearest = node;
      }
      if(nearest_distance < 1e-6) { // If very close, return immediately
        return nearest;
      }
    }
    return nearest;
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

  sorted_neighbours(node) {
    if (!this.neighbours.has(node.id)) return [];
    const neighbours = this.neighbours.get(node.id);
    return neighbours.sort((a, b) => a.id - b.id);
  }


  kruskal() {
    let sortedEdges = [...this.edges].sort((a, b) => a.weight - b.weight);

    let ds = new DisjointSet(this.node_ids);
    let mstEdges = [];

    for (let edge of sortedEdges) {
      let u = edge.start.id;
      let v = edge.end.id;

      if (ds.union(u, v)) {
        mstEdges.push(edge);
      }
    }

    return mstEdges;
  }
  
  // Dijkstra
  shortest(a, b) {
    // console.log("Finding shortest path from", a.id, "to", b.id);
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

        if(path.length < 2) { return }
        
        return path
      }

      // Explore the connected edges
      let edge_ids = this.neighbours.get(current_id);
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
  
  to_polygons(){
    let polylines = this.to_polylines();
    let polygons = [];
    for(let polyline of polylines) {
      let polygon = polyline.to_polygon(INTERCITY_ROAD);
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

  // consider removing all this.
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
        const incoming = this.neighbours.get(node.id);

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

  
  draw_route(arr){
    stroke(255,0,0)
    for(let i = 0; i < arr.length - 1; i++) {
      let start = arr[i]
      let end = arr[i + 1]
      line(start.position.x, start.position.y, end.position.x, end.position.y);
    }
    stroke(0)
  }

  draw(){
    push();
      for (let node of this.nodes) {
        node.draw();
      }
    pop();
  }

  draw_edges(){
    push();
      for(let edge of this.edges) {
        edge.draw();
        // fill(0);
        // textSize(10);
        // text(edge.start.id, edge.start.position.x + 5, edge.start.position.y + 5);
        // noFill()
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
