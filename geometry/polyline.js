const TOLERANCE = 0.0625;
class Polyline {
  constructor(points, clean = true, tolerance = TOLERANCE) {
    this.points = points;
    if(clean) { this.clean(tolerance) }
    this.find_segments();
  }

  clean(tolerance = 0.001) {
    this.points = simplify(this.points, tolerance, false);
  }

  simplify(tolerance) {
    let points = simplify(this.points, tolerance, false);
    return new Polyline(points);
  }

  to_a(){
    let arr = [];
    for(let v of this.points){
      arr.push([v.x, v.y]);
    }
    return arr;
  }

  count(){
    return this.points.length;
  }

  bounds(){
    if (this.points.length === 0) return [0, 0, 0, 0];

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
    for (let i = 0; i < this.points.length - 1; i++) {
      const start = this.points[i];
      const end = this.points[i + 1];

      const segment = new Segment(start, end, i, null);
      this.segments.push(segment);

      if(previous) { 
        previous.next = segment; 
        segment.previous = previous;
      }
      previous = segment
    }
  }

  to_polygon(stroke_width, type, min_curvature = 1, smoothing = 20) {
    let tops = [];
    let bottoms = [];
    let normals = [];

    for (let i = 0; i < this.segments.length; i++) {
      let segment = this.segments[i];
      
      let curvature_factor  = 1;
      if (i < this.segments.length - 1) {
        let current = segment.to_v();
        let next_segment = this.segments[i + 1];
        let next = next_segment.to_v();
        let angle = current.angleBetween(next);
        curvature_factor = Math.pow(1 - Math.abs(angle) / Math.PI, 2)
      }

      curvature_factor = Math.max(curvature_factor, min_curvature); 
      // Ensure curvature factor is not too small
      let sw = stroke_width * curvature_factor / 2;
      let normal = segment.normal().mult(sw);
      normals.push(normal);
      
    }
  
    let last_segment = this.segments[this.segments.length - 1];
    let last_normal = last_segment.normal().mult(stroke_width / 2);
    normals.push(last_normal);

    let smoothed_normals = smoothing > 3 ? moving_average(normals, smoothing) : normals;
    for(let i = 0; i < this.segments.length; i++) {
      let segment = this.segments[i];
      let normal = smoothed_normals[i];
      let top = segment.start.copy().add(normal);
      let bottom = segment.start.copy().sub(normal);
  
      tops.push(top);
      bottoms.push(bottom); 
    }

    // Concatenate tops and bottoms to form the polygon
    let points = tops.concat(bottoms.reverse());
    return new MultiPolygon(points, type);
  }

  to_bezier(detail = 10, curviness = 0.5) {
    let points = [this.points[0]];
  
    for (let i = 1; i < this.points.length - 1; i++) {
      let previous = this.points[i - 1];
      let current = this.points[i];
      let next = this.points[i + 1];

      let direction1 = p5.Vector.sub(current, previous).normalize();
      let direction2 = p5.Vector.sub(next, current).normalize();
      let offset1 = direction1.mult(current.dist(previous) * curviness);
      let offset2 = direction2.mult(current.dist(next) * curviness);

  
      let tangent1 = current.copy().add(offset1);
      let tangent2 = next.copy().sub(offset2);
  
      // Interpolate Bezier curve between the points
      for (let j = 0; j <= detail; j++) {
        let t = j / detail;
        let point = calculate_bezier(current, tangent1, tangent2, next, t);
        points.push(point);
      }
    }
  
    // Add the last point
    points.push(this.points[this.points.length - 1]);
  
    return new Polyline(points);
  }

  // apply a moving average filter 
  filter(windowSize) {
    let points = moving_average(this.points, windowSize);

    return new Polyline(points);
  }

  intersects(other){
    for (let segment of this.segments) {
      for (let other_segment of other.segments) {
        let intersection = segment.intersection(other_segment, false);
        if (intersection.length > 0) {
          return true;
        }
      }
    }
    return false
  }

  intersection(other) {
    let intersections = [];
    for (let segment of this.segments) {
      for (let other_segment of other.segments) {
        let intersection = segment.intersection(other_segment, false);
        if (intersection.length > 0) {
          intersections.push(...intersection);
        }
      }
    }
    return intersections;
  }


  walk(juncture, piece, direction) {
    let next = juncture.polyline;

    if (next.junctures.length > 1) {
      return this.walk_to_next_juncture(next, juncture, piece, direction);
    } 

    return this.walk_to_end_of_edge(next, juncture, piece);
  }

  walk_to_next_juncture(segment, juncture, piece, direction) {
    if(!segment) { return  }

    let idx = segment.junctures.findIndex(j => j === juncture);
    let next_idx = direction === 'with' ? idx + 1 : idx - 1;
    let next_juncture = segment.junctures[next_idx];
    if(!next_juncture) { return }
    piece.push(next_juncture.point);
    next_juncture.increment();
    return next_juncture;
  }


  walk_to_end_of_edge(segment, juncture, piece) {
    let counter = 0;
    while (segment && counter < 1000) {
      counter++;
      piece.push(segment.end); 

      if (!segment) { return juncture; }

      if (segment.junctures.length > 0) {
        const next_juncture = segment.junctures[0];
        next_juncture.increment();  
        piece.push(next_juncture.point);
        return next_juncture;  
      }
    }

    return juncture;
  }

  first(){
    let found;
    for(let segment of this.segments){
      if (segment.junctures.length > 0) {
        found = segment.junctures[0];
        break;
      }
    }
    return found;
  }

  draw(){
    if (this.points.length < 2) return;
    beginShape();
    for(let v of this.points){
      vertex(v.x, v.y);
    }
    endShape();
  }
}

