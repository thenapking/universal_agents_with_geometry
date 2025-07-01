const SCALE = 10000000; // precision scale factor for integer coords

class MultiPolygon {
  static next_id = 1;
  constructor(points, type, parent) {
    // points is an array of raw vectors
    this.id = MultiPolygon.next_id++;
    this.parent = parent;
    this.type = parent ? parent.type : type;
    
    this.ancestor_ids = [this.id];
    if(parent) {
      this.ancestor_ids = [...parent.ancestor_ids, this.id];
    }

    if(this.is_contour_array(points)) {
      this.contours = this.find_contours(points);
    } else {
      // console.log("MultiPolygon: points is not a contour array, assuming raw array");
      this.contours = [this.order(points)];
    }

    this.segments = [];
    this.edges = [];

    for(let i = 0; i < this.contours.length; i++) {
      let points = this.contours[i];
      this.segments[i] = this.find_segments(points, i);
      // let clean_points = this.clean_segments(segments);
      // this.contours[i] = this.to_vectors(clean_points);
      // this.segments[i] = this.find_segments(clean_points, i);
      this.edges[i] = this.find_edges(this.segments[i]);
    }

    this.outer = this.contours[0];
  }

  is_raw_array(points) {
    return Array.isArray(points[0]) && points[0].length === 2
  }

  is_contour_array(points) {
    return Array.isArray(points[0]) && points[0].length > 2
  }

  
  count() {
    return this.outer.length;
  }

  order(points, clockwise = true) {
    let n = points.length;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n; 
      sum += (points[j].x - points[i].x) * (points[j].y + points[i].y);
    }

    const is_clockwise = sum < 0;
    if (is_clockwise !== clockwise) {
      points.reverse();
    }

    return points
  }

  to_vectors(points) {
    if(this.is_raw_array(points)) {
      let new_points = [];
      for(let v of points){
        new_points.push(createVector(v[0], v[1]));
      }
      return new_points;
    }

    return points
  }

  to_a(points){
    let arr = [];
    for(let v of points){
      arr.push([v.x, v.y]);
    }
    return arr;
  }

  to_clipper_paths() {
    let results = [];
    for(let contour of this.contours) {
      if (contour.length < 3) continue; // skip degenerate contours
      let path = []
      for(let point of contour) {
        let p = { X: point.x * SCALE, Y: point.y * SCALE }
        path.push(p);
      }
      results.push(path);
    }

    return results;
  }

  max_diameter(points = this.outer) {
    let max_dist = 0;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        let dx = points[i].x - points[j].x;
        let dy = points[i].y - points[j].y;
        let distSq = dx * dx + dy * dy;
        if (distSq > max_dist) {
          max_dist = distSq;
        }
      }
    }
    return Math.sqrt(max_dist);
  }

  min_diameter(points = this.outer) {
    let minWidth = Infinity;
  
    for (let i = 0; i < points.length; i++) {
      let a = points[i];
      let b = points[(i + 1) % points.length];
  
      let edge = {x: b.x - a.x, y: b.y - a.y};
      let length = Math.sqrt(edge.x ** 2 + edge.y ** 2);
      if (length === 0) continue;
  
      // Normalize perpendicular vector
      let normal = {x: -edge.y / length, y: edge.x / length};
  
      // Project all points onto this normal
      let minProj = Infinity;
      let maxProj = -Infinity;
      for (let p of points) {
        let projection = p.x * normal.x + p.y * normal.y;
        minProj = Math.min(minProj, projection);
        maxProj = Math.max(maxProj, projection);
      }
  
      let width = maxProj - minProj;
      minWidth = Math.min(minWidth, width);
    }
  
    return minWidth;
  }

  area(signed = false) {
    return area(this.outer, signed);
  }

  is_zero_area() {
    let A = 0;
    for(let contour of this.contours) {
      A += area(contour, true);
    }
    return Math.abs(A) < 1e-6;
  }

  centroid(){
    let n = this.count();
    if (n === 0) return createVector(0, 0);
    
    let x = 0, y = 0;
    for(let v of this.outer){
      x += v.x;
      y += v.y;
    }
    return createVector(x / n, y / n);
  }

  bounds(){
    if (this.count() === 0) return [0, 0, 0, 0];
    
    let minX = this.outer[0].x;
    let minY = this.outer[0].y;
    let maxX = this.outer[0].x;
    let maxY = this.outer[0].y;

    for(let v of this.outer){
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    }
    return [minX, minY, maxX, maxY];
  }

  intersects_bounds(other){
    const [minX, minY, maxX, maxY] = this.bounds();
    const [otherMinX, otherMinY, otherMaxX, otherMaxY] = other.bounds();

    return !(maxX < otherMinX || minX > otherMaxX || maxY < otherMinY || minY > otherMaxY);
  }

  find_contours(points){
    if(!Array.isArray(points[0])){
      return [points];
    }

    let contours = [];
    for(let i = 0; i < points.length; i++){
      let contour = points[i];

      if(contour.length < 3) continue; // skip degenerate contours
      contour = this.to_vectors(contour);
      let clockwise = i == 0
      contour = this.order(contour, clockwise);
      contours.push(contour);
    }

    return contours
  }

  find_segments(points, contour_id = 0) {
    let segments = [];
    let n = points.length;
    let previous;
    for (let i = 0; i < n - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      const segment = new Segment(start, end, i, contour_id);
      segments.push(segment);

      if(previous) { 
        previous.next = segment; 
        segment.previous = previous;
      }
      previous = segment;
    }

    // Create the final segment connecting the last vertex to the first
    const start = points[n - 1];
    const end = points[0];  
    const segment = new Segment(start, end, n, contour_id);
    segments.push(segment);
    const first = segments[0];

    first.previous = segment;
    segment.next = first;
    
    if(previous){
      previous.next = segment;
      segment.previous = previous;
    }

    return segments;
  }

  //TODO: This cleaning method is not fully working
  clean_segments(segments) {
    let points = [];
  
    // Loop through each segment
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i];

      points.push(segment.start);
      
      for (let j = 1; j < i - 1; j++) { 
        let other = segments[j];
  
        let intersections = segment.intersection(other, true);
  
        // If an intersection is found
        if (intersections.length > 0) {
          console.log("Intersection found between segments", segment.index, "and", other.index);
          
          let intersection_point = intersections[0];
          for(let k = j; k < i; k++) {
            points[k] = null;
          }
          points.push(intersection_point);
          
          break;
        }
      }
    }

  
    return points.filter(p => p !== null);  
  }

  find_edges(segments) {
    let edges = [];
    let current = [segments[0]];

    for(let i = 1; i < segments.length; i++){
      const segment = segments[i];
      const next_segment = segment.next.to_v();
      let angle = segment.to_v().angleBetween(next_segment);

      if(Math.abs(angle) < ANGLE){
        current.push(segment);
      } else {
        edges.push(current);
        current = [segment];
      }
    }

    return edges;
  }

  find_longest_edge() {
    let longest;
    let max_length = 0;
    for(let edge of this.edges[0]){
      let length = 0
      for(let segment of edge){
        length += segment.length();
      }
      if(length > max_length){
        max_length = length;
        longest = edge;
      }
    }
    return longest;
  }

  // Boolean operations using Martinez algorithm
  intersection(other){
    return clipper(this, other, 'intersection');
  }

  xor(other){
    return clipper(this, other, 'xor');
  }

  union(other){
    return clipper(this, other, 'union');
  }

  difference(other){
    return clipper(this, other, 'difference');
  }


  contains(point) {
    let inside = contains(point, this.outer);
    if (!inside) { return false; }
    
    for(let i = 1; i < this.contours.length; i++) {
      let inner = this.contours[i];
      let in_a_hole = contains(point, inner);
      if (in_a_hole) { return false }
    }

    return true;    
  }

  contains_polygon(other) {
    for(let other_point of other.outer) {
      if (!this.contains(other_point)) {
        return false;
      }
    }
    return true;
  }

   // Adjacency
   adjacent(other) {
    for (let segment of this.segments[0]) {
      for (let other_segment of other.segments[0]) {
        if(segment.adjacent(other_segment)) {
          // stroke(0, 255, 0);
          // segment.draw();
          // other_segment.draw();
          return true;
        }
      }
    }
    return false
  }

  subdivide(threshold = AREA, counter = 0) {
    let area = this.area()
    if (area < threshold) {
      return [this];
    }

    if(area > PARK && random(1) < 0.03 && counter > 0){
      return [this]
    }

    if(area > CIVIC && random(1) < 0.07 && counter > 0){
      return [this]
    }

    let stroke_width = area > BLOCK ? MAJOR_ROAD : MINOR_ROAD;
    if(counter === 0) { stroke_width = INTERCITY_ROAD; }

    let edge = this.find_longest_edge();
    if (!edge) {
      console.warn("No edges found for subdivision");
      return [this];
    }

    let p1 = edge[0].start
    let p2 = edge[edge.length - 1].end;
    let midpoint = p5.Vector.add(p1, p2).mult(0.5);

    // Compute the unit‐vector direction of the longest edge,
    // then rotate by 90° to get a perpendicular direction
    let parallel = p5.Vector.sub(p2, p1).normalize();
    // Rotating (x,y) → (−y, x) is a 90° CCW rotation:
    let perpendicular = createVector(-parallel.y, parallel.x);

    const [minX, minY, maxX, maxY] = this.bounds();
    let w = maxX - minX;
    let h = maxY - minY;
    let diagonal = 2 * Math.sqrt(w * w + h * h);

    // 5) Build two endpoints A, B for our infinite (sampled) cutting line:
    let A = p5.Vector.add(midpoint, p5.Vector.mult(perpendicular, diagonal));
    let B = p5.Vector.sub(midpoint, p5.Vector.mult(perpendicular, diagonal));

    let new_line = new Polyline([A, B]);
    let new_street = new_line.to_polygon(stroke_width);
    let pieces = this.difference(new_street);

    if (pieces.length === 0) { return [this]; }
    // 8) Recursively subdivide each piece:
    let result = [];
    for (let piece of pieces) {
      let pieces = piece.subdivide(threshold, counter++);
      result.push(...pieces);
    }
    return result;
  }


  // Intersections methods
  intersect_polyline(polyline) {
    let junctures = [];
    const polyline_bounds = polyline.bounds();
    for (let polyline_segment of polyline.segments) {
      for(let contour_segments of this.segments){
        for (let polygon_segment of contour_segments) {
          if (!polygon_segment.intersects(polyline_bounds)) { 
            continue 
          };
    
          const points = polyline_segment.intersection(polygon_segment, true); 
    
          if (points.length < 1) { 
            continue 
          }
    
          for (let point of points) {
            let juncture = new Juncture(point, polyline_segment, polygon_segment);
            
            let duplicate = false;
            for(let other of junctures) {
              let dx = Math.abs(other.point.x - juncture.point.x);
              let dy = Math.abs(other.point.y - juncture.point.y);
              if (dx <= ERROR && dy <= ERROR) {
                duplicate = true;
              }
            }
            if (duplicate) continue;
            
            polygon_segment.junctures.push(juncture);
            polyline_segment.junctures.push(juncture);
            junctures.push(juncture);

          }
        }
      }
    }

    let sorted_junctures = []
    for(let polyline_segment of polyline.segments) { 
      polyline_segment.sort();
      sorted_junctures.push(...polyline_segment.junctures);
    }
    for (let contour_segments of this.segments) {
      for (let polygon_segment of contour_segments) {
        polygon_segment.sort(); 
      }
    }
    
    return sorted_junctures;
  }

  
  split(input_polyline) {
    // Duplicate the polyline to avoid double counting junctures
    let polyline = new Polyline(input_polyline.points);
    let junctures = this.intersect_polyline(polyline);
    if (junctures.length === 0) return [this];

    let pieces = this.split_into_pieces(polyline, junctures);
    let new_polygons = this.process_split_pieces(pieces, junctures);
    
    return new_polygons;
  }

  split_into_pieces(polyline, junctures) {
    let first = polyline.first();
    let pieces = [];
    let current = first;
    let next = { visits: 1};
   
    // Traverse the junctures
    for(let i = 0; i < junctures.length * 2; i++) {
      current.increment() // not used
      let piece = [];
      pieces.push(piece);

      let next_juncture = this.walk(current, piece)
      next = next_juncture;
      // console.log("Juncture contour ", next_juncture.contour_id, "visits:", next_juncture.visits);

      while(next_juncture && next_juncture !== current && next_juncture.visits < 1000) { 
        // I am not sure why this works... really
        // Well we've split it one way, then we need to go back down the line the other way....
        let direction = i % 2 === 1 ? 'with' : 'against';
        next_juncture = polyline.walk(next_juncture, piece, direction) 
        if(next_juncture !== current ) {
          next_juncture = this.walk(next_juncture, piece);
        }
      }

      if(next == first) { break; }

      current = next;
    }
    
    return pieces;
  }

  process_split_pieces(pieces, junctures){
    // Now add back in any holes which weren't intersected
    let junctures_counter = [];
    for(let i = 0; i < this.contours.length; i++) {
      junctures_counter[i] = 0;
    }

    for(let juncture of junctures) {
      let contour_id = juncture.contour_id;
      junctures_counter[contour_id]++;
    }

    let missing_contours = [];
    for(let i = 0; i < this.contours.length; i++) {
      if(junctures_counter[i] === 0) {
        missing_contours.push(new Polygon(this.contours[i]));
      }
    }

    let new_polygons = [];
    for(let piece of pieces) {
      
      let new_polygon = new MultiPolygon([piece], this.type, this.parent);
      let final = [piece]
      for(let missing of missing_contours) {
        let centroid = missing.centroid();
        if(new_polygon.contains(centroid)) {
          final.push(missing.points)
          
        } 

      }
      let final_polygon = new MultiPolygon(final, this.type, this.parent);
      new_polygons.push(final_polygon);
    }

    return new_polygons;

  }
  // traverse the junctures clockwise or anti-clockwise depending on the already sorted direction
  walk(juncture, piece, direction) {
    let next = juncture.polygon;

    if (next.junctures.length > 1) {
      return this.walk_to_next_juncture(next, juncture, piece, direction);
    }

    return this.walk_to_end_of_edge(next, juncture, piece);
  }

  walk_to_next_juncture(segment, juncture, piece, direction) {
    if(!segment) { return  }
    const last = segment.junctures[segment.junctures.length - 1];
    if (last !== juncture) {
      let idx = segment.junctures.findIndex(j => j === juncture);
      let next_juncture = segment.junctures[idx + 1];
      piece.push(next_juncture.point);
      next_juncture.increment();
      console.log("Multiple on contour. Contour: ", next_juncture.contour_id, "visits:", next_juncture.visits);
      return next_juncture;
    }
  }

  // traverse multiple segments until you meet the next juncture
  walk_to_end_of_edge(segment, juncture, piece) {
    let counter = 0;
    while (segment && counter < 1000) {
      counter++;
      piece.push(segment.end);  
      segment = segment.next;  

      if (!segment) { return juncture;}  

      if (segment.junctures.length > 0) {
        const next_juncture = segment.junctures[0];
        next_juncture.increment();  
        piece.push(next_juncture.point);  
        return next_juncture;  
      }
    }

    return juncture;  
  }


  // DRAWING METHODS

  hatch(spacing, direction = 'horizontal') {
    let hatching = new Hatching(this, spacing);
    hatching.hatch(direction);
    hatching.draw();
  }

  draw(){
    push();
      beginShape();
      for(let i = 0; i < this.outer.length; i++){
        let v = this.outer[i];

        vertex(v.x, v.y);
      }
      for(let i = 1; i < this.contours.length; i++){
        beginContour()
        for(let v of this.contours[i]){
          vertex(v.x, v.y);
        }
        endContour();
      }
      endShape(CLOSE);
    pop();
  }
}


function multi_disjoint(polygons) {
  const n = polygons.length;
  const pieces = [];
  const piece_cache = new Map();
  

  for (let i = 1; i < (1 << n); i++) {
    const k = lowest_index(i);
    const j = i & ~(1 << k);

    let cached_fragments = j === 0 ? [polygons[k]] : piece_cache.get(j);
    if (!cached_fragments || cached_fragments.length === 0) continue;

    let new_fragments = [];

    const polygon = polygons[k];

    for (let fragment of cached_fragments) {
      if (!polygon.intersects_bounds(fragment)) continue;

      const result = fragment.intersection(polygon);
      if (result) new_fragments.push(...result);
    }

    if (new_fragments.length > 0) {
      piece_cache.set(i, new_fragments);

      // subtract excluded polygons
      let excluded = [];
      for (let m = 0; m < n; m++) {
        if ((i & (1 << m)) === 0) excluded.push(polygons[m]);
      }

      for (let piece of excluded) {
        const differences = [];
        for (let fragment of new_fragments) {
          if (!piece.intersects_bounds(fragment)) {
            differences.push(fragment);
            continue;
          }
          const diff = fragment.difference(piece);
          if (diff) differences.push(...diff);
        }
        new_fragments = differences;
      }

      pieces.push(...new_fragments.filter(f => !f.is_zero_area?.()));
    }
  }

  return pieces;
}



function lowest_index(mask) {
  return Math.log2(mask & -mask); // gets position of least significant 1
}

