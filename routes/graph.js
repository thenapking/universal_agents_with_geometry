class Graph {
  constructor(edges = [], nodes = []) {
    this.nodes = [];
    this.node_ids = [];
    this.edges = []
    this.neighbours = new Map();
    this.chains = [];
    this.history = new Map();
    this.polygons = [];
    this.polylines = [];
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
    if (this.find_edge(edge.start.id, edge.end.id)) { return; }
     
    this.edges.push(edge);
    this.neighbours.get(edge.start.id).push(edge.end.id);
    this.neighbours.get(edge.end.id).push(edge.start.id);

  }

  remove_edge(edge) {
    if (!this.find_edge(edge.start.id, edge.end.id)) { return; }
    
    this.edges = this.edges.filter(e => e !== edge);
    this.neighbours.get(edge.start.id).splice(this.neighbours.get(edge.start.id).indexOf(edge.end.id), 1);
    this.neighbours.get(edge.end.id).splice(this.neighbours.get(edge.end.id).indexOf(edge.start.id), 1);
  }

  visit(a, b) {
    if (!this.history.has(a.id)) this.history.set(a.id, new Set());
    if (!this.history.has(b.id)) this.history.set(b.id, new Set());
    this.history.get(a.id).add(b.id);
    this.history.get(b.id).add(a.id);
  }

  visited(a, b) {
    return this.history.get(a.id).has(b.id) || this.history.get(b.id).has(a.id);
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

  find_chains(node){
    let found = [];
    for(let chain of this.chains){
      for(let other of chain){
        if(other.id === node.id) {
          found.push(chain);
          break;
        }
      }
    }
    return found;
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

  longest_edge() {
    let sorted_edges = [...this.edges].sort((a, b) => b.distance - a.distance);
    if(sorted_edges.length === 0) return null;
    return sorted_edges[0];
  }

  sorted_neighbours(node) {
    if (!this.neighbours.has(node.id)) return [];
    const neighbours = this.neighbours.get(node.id);
    return neighbours.sort((a, b) => a.id - b.id);
  }

  relative_neighbours(){
    let new_edges = [];
    for(let i = 0; i < this.nodes.length; i++) {
      for(let j = 0; j < this.nodes.length; j++) {
        let a = this.nodes[i];
        let b = this.nodes[j];
        if(a.id === b.id) continue;
        let shortest = true;
        for(let k = 0; k < this.nodes.length; k++) {
          let c = this.nodes[k];
          if(c.id === a.id || c.id === b.id) continue;
          let AC = p5.Vector.dist(a.position, c.position);
          let BC = p5.Vector.dist(b.position, c.position);
          let AB = p5.Vector.dist(a.position, b.position);
          if(AC < AB && BC < AB) {  
            shortest = false;
            break;
          }
        }

        if(shortest){
          new_edges.push(new Edge(a, b));
        }
      }
    }

    return new Graph(new_edges, this.nodes);
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
        
        return new Path(path);
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

  create_chains(){
    this.history = new Map();
    this.chains = [];

    for (let node of this.nodes) {
      this.history.set(node.id, new Set());
    }

    for(let edge of this.edges){
      let a = edge.start;
      let b = edge.end;

      if (this.visited(a, b)) continue;

      let dA = this.neighbours.get(a.id).length;
      let dB = this.neighbours.get(b.id).length;

      // if(dA !==2 || dB !== 2) {
        let chain = this.create_bidirectional_chain(a, b);
        if(chain.length > 1) {
          this.chains.push(chain);
        }
      // }
    }
  }

  create_bidirectional_chain(a, b) {
    let chain = [a];
    this.visit(a, b);
    chain.push(b);
  
    // Extend forwards from b
    let prev = a;
    let current = b;
    while (true) {
      let neighbours = this.neighbours.get(current.id).filter(id => id !== prev.id);
      if (neighbours.length !== 1) break;
      let next = this.find(neighbours[0]);
      if (this.visited(current, next)) break;
      this.visit(current, next);
      chain.push(next);
      prev = current;
      current = next;
    }
  
    // Extend backwards from a
    prev = b;
    current = a;
    while (true) {
      let neighbours = this.neighbours.get(current.id).filter(id => id !== prev.id);
      if (neighbours.length !== 1) break;
      let next = this.find(neighbours[0]);
      if (this.visited(current, next)) break;
      this.visit(current, next);
      chain.unshift(next);
      prev = current;
      current = next;
    }
  
    return chain;
  }
  

  create_chain(a, b){
    let chain = [a]
    let previous = a;
    let current = b;

    while(true){
      chain.push(current);
      this.visit(previous, current);
      let neighbours = this.neighbours.get(current.id);
      neighbours = neighbours.filter(id => id !== previous.id);

      if (neighbours.length !== 1) { break; }
      let next = this.find(neighbours[0]);
      if (this.visited(current, next)) { break; }

      previous = current;
      current = next;
    }

    return chain;
  }

  order_chains() {
    if (this.chains.length === 0) return [];
  
    let remaining = [...this.chains];
    let ordered = [];
  
    // Start with a random chain
    let index = floor(random(remaining.length));
    let first = remaining.splice(index, 1)[0];
    ordered.push(first);
  
    // Set of visited node IDs
    let seen = new Set(first.map(node => node.id));
  
    let changed = true;
  
    while (changed && remaining.length > 0) {
      changed = false;
  
      for (let i = remaining.length - 1; i >= 0; i--) {
        let chain = remaining[i];
        let connected = chain.some(node => seen.has(node.id));
  
        if (connected) {
          ordered.push(chain);
          remaining.splice(i, 1);
          for (let node of chain) {
            seen.add(node.id);
          }
          changed = true;
        }
      }
    }
  
    // Optionally: warn if not all chains were connected
    if (remaining.length > 0) {
      console.warn("Some chains are not connected to the rest.");
      // You could return multiple groups, or keep going
      for (let chain of remaining) {
        ordered.push(chain);
      }
    }
  
    return ordered;
  }
  

  
  to_polygons(wd = INTERCITY_ROAD){
    this.polygons = [];
    for(let polyline of this.polylines) {
      let polygon = polyline.to_polygon(wd);
      this.polygons.push(polygon);
    }
  }

  to_polylines(){
    this.polylines = [];
    for(let chain of this.chains) {
      
      if(chain.length < 2) continue;
      let points = []

      for(let node of chain) {
        points.push(node.position);
      }
      
      let polyline = new Polyline(points, false).to_bezier(60)
    
      this.polylines.push(polyline);
    }
  }

  draw_chains(){
    push();
      stroke(0);
      strokeWeight(1);
      for(let chain of this.chains) {
        this.draw_chain(chain);
      }
    pop();
  }
  
  draw_chain(chain){
    for(let i = 0; i < chain.length - 1; i++) {
      let start = chain[i]
      let end = chain[i + 1]
      line(start.position.x, start.position.y, end.position.x, end.position.y);
    }
  }



  draw_nodes(){
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

  draw(){
    this.draw_edges();
    this.draw_nodes();
  }
}
