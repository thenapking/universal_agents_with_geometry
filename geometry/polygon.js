const ERROR = 0.001
const ANGLE = 3.141/24;
const AREA = 200;
const PARK = 3000;
const CIVIC = 1000;
const BLOCK = 2000;

const LARGE_SW = 10;
const MEDIUM_SW = 8;
const SMALL_SW = 3;
class Polygon {
  constructor(points) {
    this.points = points;

    if(Array.isArray(points[0])){
      let new_points = [];
      for(let v of points){
        new_points.push(createVector(v[0], v[1]));
      }
      this.points = new_points;
    }

    this.order();

    this.find_segments();
    this.find_edges();
  }

  count() {
    return this.points.length;
  }

  order() {
    let sum = 0;
    for (let i = 0; i < this.count(); i++) {
      const j = (i + 1) % this.count(); // Next vertex, wrap around
      sum += (this.points[j].x - this.points[i].x) * (this.points[j].y + this.points[i].y);
    }

    if (sum < 0) {
      this.points.reverse();
    }
  }

  to_a(){
    let arr = [];
    for(let v of this.points){
      arr.push([v.x, v.y]);
    }
    return arr;
  }

  area() {
    let n = this.count();
    if (n < 3) return 0;

    let A = 0;
    for (let i = 0; i < n; i++) {
      let j = (i + 1) % n;
      A += this.points[i].x * this.points[j].y - this.points[j].x * this.points[i].y;
    }
    return Math.abs(A * 0.5);
  }

  centroid(){
    if (this.count() === 0) return createVector(0, 0);
    
    let x = 0, y = 0;
    for(let v of this.points){
      x += v.x;
      y += v.y;
    }
    return createVector(x / this.count(), y / this.count());
  }

  bounds(){
    if (this.count() === 0) return [0, 0, 0, 0];
    
    let minX = this.points[0].x;
    let minY = this.points[0].y;
    let maxX = this.points[0].x;
    let maxY = this.points[0].y;

    for(let v of this.points){
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    }
    return [minX, minY, maxX, maxY];
  }

  find_segments() {
    this.segments = [];

    let previous;
    for (let i = 0; i < this.count() - 1; i++) {
      const start = this.points[i];
      const end = this.points[i + 1];

      const segment = new Segment(start, end, i, null);
      this.segments.push(segment);

      if(previous) { 
        previous.next = segment; 
        segment.previous = previous;
      }
      previous = segment;
    }

    // Create the final segment connecting the last vertex to the first
    const start = this.points[this.count() - 1];
    const end = this.points[0];  
    const segment = new Segment(start, end, this.count(), null);
    this.segments.push(segment);
    const first = this.segments[0];

    first.previous = segment;
    segment.next = first;
    previous.next = segment;
    segment.previous = previous;
  }

  

  find_edges(){
    this.edges = [];
    let current = [this.segments[0]];

    for(let i = 1; i < this.segments.length; i++){
      const segment = this.segments[i];
      const next_segment = segment.next.to_v();
      let angle = segment.to_v().angleBetween(next_segment);

      if(Math.abs(angle) < ANGLE){
        current.push(segment);
      } else {
        this.edges.push(current);
        current = [segment];
      }
    }
  }

  find_longest_edge() {
    let longest;
    let max_length = 0;
    for(let edge of this.edges){
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

  // Adjacency
  adjacent(other) {
    for (let segment of this.segments) {
      for (let other_segment of other.segments) {
        if(segment.adjacent(other_segment)) {
          stroke(0, 255, 0);
          segment.draw();
          other_segment.draw();
          return true;
        }
      }
    }
    return false
  }

  // Boolean operations using Martinez algorithm
  intersection(other){
    let this_points = [this.to_a()];
    let other_points = [other.to_a()];

    let result = martinez.intersection(this_points, other_points);
    if (!result?.[0]?.[0]?.length) {
      return;
    }
    return new Polygon(result.flat(1).flat(1));
  }

  xor(other){
    let this_points = [this.to_a()];
    let other_points = [other.to_a()];
    let result = martinez.xor(this_points, other_points);
    return new Polygon(result.flat(1).flat(1));
  }

  union(other){
    let this_points = [this.to_a()];
    let other_points = [other.to_a()];
    
    let result = martinez.union(this_points, other_points);
    return new Polygon(result.flat(1).flat(1));
  }

  difference(other){
    let this_points = [this.to_a()];
    let other_points = [other.to_a()];

    let result = martinez.diff(this_points, other_points);
    if (!result?.[0]?.[0]?.length) {
      return 
    }
    console.log("DIFF", result)
    if(result[0].length > 1) {
      return new MultiPolygon(result[0]);
    } else {
      return new Polygon(result[0].flat(1));  
    }
  }

  // Housing fill works well with this, but not martinez difference
  difference_greiner(other){
    let this_points = this.to_a();
    let other_points = other.to_a();
    let result = greinerHormann.diff(this_points, other_points);
    if(result === null) return;
    let results = [];
    for(let r of result){
      results.push(new Polygon(r));
    }
    return results;
  }

  intersection_greiner(other){
    let this_points = this.to_a();
    let other_points = other.to_a();
    let result = greinerHormann.intersection(this_points, other_points);
    if(result === null) return;
    
    return new Polygon(result[0]);
  }




  subdivide(threshold = AREA, counter = 0) {
    let area = this.area();
    if (area < threshold) {
      return [this];
    }

    if(area > PARK && random(1) < 0.03){
      // make a park 
      return [this]
    }

    if(area > CIVIC && random(1) < 0.07){
      // make a hatched area
      return [this]
    }

    let stroke_width = area > BLOCK ? MEDIUM_SW : SMALL_SW;

    // console.log(stroke_width)
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
    let pieces = this.difference_greiner(new_street);
    // console.log("pieces after DIFF", pieces);  

    // 8) Recursively subdivide each piece:
    let result = [];
    for (let piece of pieces) {
      let pieces = piece.subdivide(threshold, counter++);
      // console.log("pieces after subdivide", pieces);
      result.push(...pieces);
    }
    // console.log("result after subdivide", result);
    return result;
  }

  // Intersections methods
  intersect_polyline(polyline) {
    let junctures = [];
    const polyline_bounds = polyline.bounds();
    for (let polyline_segment of polyline.segments) {
      for (let polygon_segment of this.segments) {
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

    let sorted_junctures = []
    for(let polyline_segment of polyline.segments) { 
      polyline_segment.sort();
      sorted_junctures.push(...polyline_segment.junctures);
    }
    for(let polygon_segment of this.segments) { polygon_segment.sort(); }
    
    return sorted_junctures;
  }

  // TODO - in progress, needs to be tested
  split(input_polyline) {
    // Duplicate the polyline to avoid double counting junctures
    let polyline = new Polyline(input_polyline.points);
    // Find the junctures
    let junctures = this.intersect_polyline(polyline);
    if (junctures.length === 0) return [this];

    let first = polyline.first();
    let results = [];
    let current = first;
    let next = { visits: 1};

    // Traverse the junctures
    for(let i = 0; i < junctures.length * 2; i++) {
      current.visits++; // not used

      let result = [];
      results.push(result);

      let next_juncture = this.walk_polygon_forwards(current, result, junctures)
      next = next_juncture;
      
      while(next_juncture !== current && next_juncture) { 
        next_juncture = polyline.walk_forwards(next_juncture, result) 
        if(next_juncture !== current ) {
          next_juncture = this.walk_polygon_forwards(next_juncture, result, junctures);
        }
      }

      if(next == first) { break; }

      current = next;
    }

    let new_polygons = [];

    for(let result of results) {
      let new_polygon = new Polygon(result);
      new_polygons.push(new_polygon);
    }

    return new_polygons;
  }

  walk_polygon_forwards(juncture, result, junctures) {
    let next = juncture.polygon;
    if (next.junctures.length > 1) {
      return this.walk_multiple_junctures(next, juncture, result);
    }

    return this.walk_to_end_of_edge(next, juncture, result);
  }

  walk_multiple_junctures(next_segment, juncture, result) {
    if(!next_segment) { return  }
    const last = next_segment.junctures[next_segment.junctures.length - 1];
    if (last !== juncture) {
      let idx = next_segment.junctures.findIndex(j => j === juncture);
      let next_juncture = next_segment.junctures[idx + 1];
      result.push(next_juncture.point);
      next_juncture.increment();
      return next_juncture;
    }
  }

  walk_to_end_of_edge(segment, juncture, result) {
    let counter = 0;
    while (segment && counter < 1000) {
      counter++;
      result.push(segment.end);  
      segment = segment.next;  

      if (!segment) { return juncture;}  // TODO is this guard required?

      if (segment.junctures.length > 0) {
        const next_juncture = segment.junctures[0];
        console.log("Incrementing juncture by walking to end of edge", next_juncture.visits, next_juncture);
        next_juncture.increment();  
        result.push(next_juncture.point);  
        return next_juncture;  
      }
    }

    return juncture;  
  }

  // TODO - this was auto-generated and needs to be tested
  contains(point) {
    if (this.count() < 3) return false;

    let inside = false;
    let x = point.x, y = point.y;

    for (let i = 0, j = this.count() - 1; i < this.count(); j = i++) {
      let xi = this.points[i].x, yi = this.points[i].y;
      let xj = this.points[j].x, yj = this.points[j].y;

      let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

 
  hatch(spacing, direction = 'horizontal') {
    let hatching = new Hatching(this, spacing);
    hatching.hatch(direction);
    hatching.draw();
  }

  draw(){
    if (this.count() < 3) return;
    push();
      beginShape();
      for(let v of this.points){
        vertex(v.x, v.y);
      }
      endShape(CLOSE);
    pop();
  }
}

function disjoint(polygons, greinerHormann = false) {
  let n = polygons.length;
  let pieces = [];

  

  for (let i = 1; i < (1 << n); i++) {
    if(i > 1000 ) { break; }
    // console.log("i = ", i);
    // bitmask representing which polygons are included in this combination
    let included = [];
    let excluded = [];

    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) included.push(polygons[j]);
      else excluded.push(polygons[j]);
    }


    // compute the piece
    let piece = included[0];
    for (let i = 1; i < included.length && piece; i++) {
      if(greinerHormann) {
        piece = piece.intersection_greiner(included[i]);
        if(piece) { piece = piece[0]; } 
      } else {
        // the intersection should return only one piece, but it will be in an array
        piece = piece.intersection(included[i]);
        if(piece) { piece = piece[0]; } 
      }
    }

    if (piece) {
      console.log("FOUND PIECE", piece);
      for (let poly of excluded) {
        console.log("EXCLUDED", poly);
        console.log("PIECE", piece)
        if(greinerHormann) {
          piece = piece.difference_greiner(poly);

        } else {
          piece = piece.difference(poly);
        }
        if (!piece) break; // empty piece
        // difference will return two pieces.  We can discard anything but the first.
        piece = piece[0]
        console.log("piece after DIFF", piece);

      }
      console.log("piece after EXCLUDED", piece);
      if (piece) pieces.push(piece);
    }
  }

  return pieces;
}



