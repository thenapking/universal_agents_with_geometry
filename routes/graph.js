class Graph {
  constructor(hotspots = [], connections = []) {
    this.hotspots = hotspots;
    this.connections = connections;
    this.adjacencyList = new Map();
    this.bezierAdjacencyList = new Map();
    this.bezierConnections = [];
    this.bezierHotspots = []; 
    this.createBezierConnections();
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

    for(let bezierHotspot of this.bezierHotspots) {
      this.bezierAdjacencyList.set(bezierHotspot.id, []);
    }

    for(let connection of this.bezierConnections) {
      this.bezierAdjacencyList.get(connection.from_id).push(connection);
      this.bezierAdjacencyList.get(connection.to_id).push(connection);
    }
    
  }

  distance(a, b) {
    return p5.Vector.dist(a.position, b.position);
  }

  createBezierConnections() {
    const visited = new Set();
    let counter = 0;
    for (let connection of this.connections) {
      if (visited.has(connection)) continue;

      let current = connection;
      //TODO: when connections model added in this can be refactored
      let path = [createVector(current.from.position.x, current.from.position.y)];
      let ids = [current.from_id]
      const bezierHotspot = {id: counter, position: path[0]}
      this.bezierHotspots.push(bezierHotspot);

      while (current) {
        visited.add(current.from_id);
        // console.log("Current connection:", current);

        path.push(createVector(current.to.position.x, current.to.position.y));
        ids.push(current.to_id);
        current = this.next_connection(current.to);
        if (current && visited.has(current.from_id)) {
          break;  // Avoid cycles
        }
      }

      // Step 3: Apply Bezier interpolation to the path
      // console.log("Path for Bezier interpolation:", path);
      const polyline = new Polyline(path);
      const bezierCurve = polyline.to_bezier(40).points;
      // console.log("Bezier curve points:", bezierCurve);
      for (let i = 0; i < bezierCurve.length - 1; i++) {
        const newConnection = {from: {position: bezierCurve[i]}, 
                               to: {position: bezierCurve[i + 1]}, 
                               dist: p5.Vector.dist(bezierCurve[i], bezierCurve[i + 1]),
                               from_id: counter,
                               to_id: counter+1 ,
                               };
        const bezierHotspot = {id: counter + 1, position: bezierCurve[i + 1]}
        this.bezierHotspots.push(bezierHotspot);
        this.bezierConnections.push(newConnection);
        counter++;
      }
      counter++;
    }

    
  }

  next_connection(point) {
    for (let connection of this.connections) {
      if (connection.from.position.x === point.position.x &&
          connection.from.position.y === point.position.y) {
        return connection;
      }
    }
    return null;  
  }

  // Dijkstra
  shortest(start, end, original = true) {
    const distances = {};
    const previous = {};
    const queue = [];
    const hotspots = original ? this.hotspots : this.bezierHotspots;
    const adjacencyList = original ? this.adjacencyList : this.bezierAdjacencyList;
    const start_id = original ? start : this.find_nearest_bezier_hotspot(start);
    const end_id = original ? end : this.find_nearest_bezier_hotspot(end);

    // Initialize distances for all hotspots as infinity, except for the start hotspot
    for (let hotspot of hotspots) {
      distances[hotspot.id] = Infinity;
      previous[hotspot.id] = null;
      queue.push(hotspot.id);
    }
    distances[start_id] = 0;

    while (queue.length > 0) {
      let currentId = queue.reduce((minId, id) => distances[id] < distances[minId] ? id : minId, queue[0]);
      queue.splice(queue.indexOf(currentId), 1);

      // If we've reached the end hotspot, we can reconstruct the path
      if (currentId === end_id) {
        const path = [];
        let previous_id = end_id;
        while (previous_id !== null) {
          path.unshift(hotspots.find(hotspot => hotspot.id === previous_id));
          previous_id = previous[previous_id];
        }
        
        return path.map(hotspot => createVector(hotspot.position.x, hotspot.position.y));
      }

      for (let connection of adjacencyList.get(currentId)) {
        const neighborId = (connection.from_id === currentId) ? connection.to_id : connection.from_id;
        const newDist = distances[currentId] + connection.dist;

        if (newDist < distances[neighborId]) {
          distances[neighborId] = newDist;
          previous[neighborId] = currentId;
        }
      }
    }

    return null;
  }

  find_nearest_bezier_hotspot(hotspot){
    let nearest = null;
    let min_dist = Infinity;
    let hotspot_position = createVector(hotspot.position.x, hotspot.position.y);  

    for(let bezierHotspot of this.bezierHotspots){
      let position = createVector(bezierHotspot.position.x, bezierHotspot.position.y);
      let d = p5.Vector.dist(hotspot_position, position);
      if(d < min_dist){
        min_dist = d;
        nearest = bezierHotspot;
      }
    }

    console.log("Nearest bezier hotspot found:", nearest, "to", hotspot);

    return nearest.id;
  }
}
