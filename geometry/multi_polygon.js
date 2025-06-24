let bc = 1;
class MultiPolygon {
  constructor(points) {
    // points is an array of raw vectors
    if(this.is_contour_array(points)) {
      console.log("Polygon: is_contour_array");
      this.contours = this.find_contours(points);
      this.outer = this.contours[0]
    } else {
      this.outer = this.convert_to_vectors(points);
      this.outer = this.order();
      this.contours = [this.outer];
    }

    this.segments = [];
    this.edges = [];

    for(let i = 0; i < this.contours.length; i++) {
      let points = this.contours[i];
      let segments = this.find_segments(points, i);
      this.segments[i] = segments;  
      this.edges[i] = this.find_edges(segments);
    }
  }

  is_raw_array(points) {
    return Array.isArray(points[0]) && points[0].length === 2
  }

  is_contour_array(points) {
    return Array.isArray(points[0]) && points[0].length > 2
  }

  convert_to_vectors(points) {
    if(this.is_raw_array(points)) {
      let new_points = [];
      for(let v of points){
        new_points.push(createVector(v[0], v[1]));
      }
      return new_points;
    }

    return points
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

  to_a(points){
    let arr = [];
    for(let v of points){
      arr.push([v.x, v.y]);
    }
    return arr;
  }

  area(points, signed = false) {
    let n = points.length;
    if (n < 3) return 0;

    let A = 0;
    for (let i = 0; i < n; i++) {
      let j = (i + 1) % n;
      A += points[i].x * points[j].y - points[j].x * points[i].y;
    }

    let fA = A * 0.5
    return signed ? fA : Math.abs(fA);
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

  find_contours(points){
    if(!Array.isArray(points[0])){
      return [points];
    }

    let contours = [];
    for(let i = 0; i < points.length; i++){
      let contour = points[i];

      if(contour.length < 3) continue; // skip degenerate contours
      contour = this.convert_to_vectors(contour);
      let clockwise = i == 0
      contour = this.order(contour, clockwise);
      contours.push(contour);
    }

    console.log("Found contours:", contours);
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
    previous.next = segment;
    segment.previous = previous;

    return segments;
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

  // Boolean operations using Martinez algorithm
  intersection(other){
    return this.operation(other, 'intersection');
  }

  xor(other){
    return this.operation(other, 'xor');
  }

  union(other){
    return this.operation(other, 'union');
  }

  difference(other){
    return this.operation(other, 'difference');
  }

  operation(other, op) {
    let this_points = [];
    for(let contour of this.contours) {
      this_points.push(this.to_a(contour));
    }

    let other_points = [];
    for(let contour of other.contours) {
      other_points.push(other.to_a(contour));
    }

    let result;
    switch(op) {
      case 'union':
        result = martinez.union(this_points, other_points);
        break;
      case 'difference':
        result = martinez.diff(this_points, other_points);
        break;
      case 'intersection':
        result = martinez.intersection(this_points, other_points);
        break;
      case 'xor':
        result = martinez.xor(this_points, other_points);
        break;
      default:
        console.error("Unknown operation:", op);
        return;
    }

    if (!result?.[0]?.[0]?.length) {
      return 
    }
    console.log("Operation result:", result);
    let results = []
    for(let r of result) {
      if (r.length > 0) {
        results.push(new MultiPolygon(r));
      }
    }
    return results
  }

  contains(point) {
    let inside = this.contour_contains(point, this.outer);
    if (!inside) { return false; }
    
    for(let i = 1; i < this.contours.length; i++) {
      let inner = this.contours[i];
      let in_a_hole = this.contour_contains(point, inner);
      if (in_a_hole) { return false }
    }

    return true;    
  }

  contour_contains(point, points) {
    let n = points.length;

    let inside = false;
    let x = point.x, y = point.y;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      let xi = points[i].x, yi = points[i].y;
      let xj = points[j].x, yj = points[j].y;

      let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
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
    console.log("--------------")

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
      console.log("-------NEW PIECE-----")
      current.increment() // not used
      let piece = [];
      pieces.push(piece);

      let next_juncture = this.walk(current, piece)
      next = next_juncture;
      console.log("Juncture contour ", next_juncture.contour_id, "visits:", next_juncture.visits);

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
      
      let new_polygon = new MultiPolygon([piece]);
      let final = [piece]
      for(let missing of missing_contours) {
        let centroid = missing.centroid();
        if(new_polygon.contains(centroid)) {
          final.push(missing.points)
          
        } 

      }
      let final_polygon = new MultiPolygon(final);
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
      console.log("Multiple on contour. Contour: ", next_juncture.countour_id, "visits:", next_juncture.visits);
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
    fill(255, 255, 255);
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


