const TOLERANCE = 0.0625;
class Polyline {
  constructor(points, clean = true, tolerance = TOLERANCE) {
    this.points = points;
    if(clean) { this.clean(tolerance) }
    this.find_segments();
    this.start = this.points[0];
    this.end = this.points[this.points.length - 1];
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

  length(){
    let total = 0;
    for(let segment of this.segments){
      total += segment.length();
    }
    return total;
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

  to_polygon(stroke_width_start, stroke_width_end) {
    let tops = [];
    let bottoms = [];
    stroke_width_end = stroke_width_end || stroke_width_start;
    let length = 0;
    let total_length = this.length();
    let stroke_width = stroke_width_start;

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

      length += segment.length();
      let ratio = length / total_length;
      stroke_width = lerp(stroke_width_start, stroke_width_end, ratio);
      let sw = stroke_width * curvature_factor / 2;
      let normal = segment.normal().mult(sw);

      
      let top = segment.start.copy().add(normal);
      let bottom = segment.start.copy().sub(normal);
  
      tops.push(top);
      bottoms.push(bottom);
    }
  
    let last_segment = this.segments[this.segments.length - 1];
    let last_normal = last_segment.normal().mult(stroke_width / 2);
    let last_top = last_segment.end.copy().add(last_normal);
    let last_bottom = last_segment.end.copy().sub(last_normal);

    tops.push(last_top);
    bottoms.push(last_bottom);
    
    let topline = new Polyline(tops).remove_self_intersections().simplify(0.001).filter(4);
    let bottomline = new Polyline(bottoms).remove_self_intersections().simplify(0.001).filter(4);
    // Concatenate tops and bottoms to form the polygon
    let points = topline.points.concat(bottomline.points.reverse());
    return new MultiPolygon(points);
  }

  // TODO: do we need to resample the interpolated points to make sure they are even?
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

  clip(polygon) {
    // Duplicate the line so new junctures can be found
    let new_line = new Polyline(this.points);
    const junctures = polygon.intersect_polyline(new_line);

    if (junctures.length === 0) {
      return this.points.every(p => polygon.contains(p)) ? [this] : [];
    }

    if(junctures.length === 1) {
      let inside = polygon.contains(this.points[0]);
      if(inside) {
        let cutoff_index = this.points.indexOf(junctures[0].polyline.start);
        let new_points = this.points.slice(0, cutoff_index + 1);
        return [new Polyline(new_points)];
      } else {
        let cutoff_index = this.points.indexOf(junctures[0].polyline.end);
        let new_points = this.points.slice(cutoff_index);
        return [new Polyline(new_points)];
      }
    }

    let lines = []
    
    let jn = floor(junctures.length/2) * 2
    for(let i = 0; i < jn; i++) {
      let piece = [];
      let start = junctures[i];
      let end = junctures[i + 1];

      if(!start || !end) continue; 
      let midpoint = createVector(
        (start.point.x + end.point.x) / 2,
        (start.point.y + end.point.y) / 2
      );
      let inside = polygon.contains(midpoint)
      if(!inside){ continue }
      piece.push(start.point);
      let segment = start.polyline;
      while(segment && segment.index != end.polyline.index) {
        let next_segment = segment.next;
        if (!next_segment) break;
        piece.push(next_segment.start);
        segment = next_segment;
      }
      piece.push(end.point);

      let new_line = new Polyline(piece);
      lines.push(new_line);
    }


    return lines; 
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

  // TODO: self intersections remain after this
  remove_self_intersections() {
    let new_segments = [];  
    let points = [];
    for (let segment of this.segments) {
      let has_intersection = false;
      for (let other_segment of new_segments) {
        if (segment === other_segment) continue;
        let intersection = segment.intersection(other_segment, false);
        if (intersection.length > 0) {
          // console.warn('Self-intersection found:', segment, other_segment);
          has_intersection = true;
          break;
        }
      }
      if (!has_intersection) {
        points.push(segment.start);
        points.push(segment.end);
        new_segments.push(segment);
      }
    }
    
    return new Polyline(points);
  }

  // FUNCTIONS TO split a polygon by a line
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

  draw_dashed(dash_length, gap_length, drawingDash = true) {
    if (this.points.length < 2 || dash_length <= 0 || gap_length < 0) return;
    
    if(!gap_length) { gap_length = dash_length; }

    let remaining = dash_length; // Length left in the current dash/gap
    let i = 0;
    let start = this.points[0].copy();
  
    while (i < this.points.length - 1) {
      let a = start;
      let b = this.points[i + 1];
      let segment = p5.Vector.sub(b, a);
      let segLength = segment.mag();
  
      if (segLength <= remaining) {
        if (drawingDash) {
          line(a.x, a.y, b.x, b.y);
        }
        remaining -= segLength;
        start = b.copy();
        i++;
      } else {
        let dir = segment.copy().normalize();
        let next = p5.Vector.add(a, dir.mult(remaining));
  
        if (drawingDash) {
          line(a.x, a.y, next.x, next.y);
        }
  
        // Toggle dash/gap and reset remaining
        drawingDash = !drawingDash;
        remaining = drawingDash ? dash_length : gap_length;
        start = next.copy();
        // Stay on same segment
      }
    }
  }
  
  
  

  
}

