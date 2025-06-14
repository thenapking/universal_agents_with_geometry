const ERROR_THRESHOLD = 0.001
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

    this.segments = [];
    this.find_segments();
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

  // Boolean operations using Greiner-Hormann algorithm

  intersection(other){
    let this_points = this.to_a();
    let other_points = other.to_a();
    let result = greinerHormann.intersection(this_points, other_points);
    if(result === null) return;
    return new Polygon(result[0]);
  }

  union(other){
    let this_points = this.to_a();
    let other_points = other.to_a();
    let result = greinerHormann.union(this_points, other_points);
    if(result === null) return;
    return new Polygon(result[0]);
  }

  difference(other){
    let this_points = this.to_a();
    let other_points = other.to_a();
    let result = greinerHormann.diff(this_points, other_points);
    console.log(result)
    if(result === null) return;
    let results = [];
    for(let p of result){
      results.push(new Polygon(p));
    }
    return results;
  }

  // Intersections methods
  intersect_polyline(polyline) {
    let junctures = [];
    const polyline_bounds = polyline.bounds();
    // console.log("polyline bounds", polyline_bounds);
    // console.log("polygon bounds", this.bounds());
    for (let polyline_segment of polyline.segments) {
      // console.log("polyline segment", polyline_segment);
      for (let polygon_segment of this.segments) {
        // console.log("---------------")
        // console.log("polygon segment", polygon_segment.start.x, polygon_segment.start.y, polygon_segment.end.x, polygon_segment.end.y);  

        if (!polygon_segment.intersects(polyline_bounds)) { 
          // console.log("polygon segment does not intersect polyline bounds");
          continue 
        };
  
        const points = polyline_segment.intersection(polygon_segment, true); 
  
        if (points.length < 1) { 
          // console.log("no intersection points found");
          continue 
        }

        // console.log("intersection points found", points);
  
        for (let point of points) {
          let direction = orient2d(polygon_segment.start, polygon_segment.end, polyline_segment.start);
          let juncture = new Juncture(point, polyline_segment, polygon_segment, direction > 0);
         

          
          let duplicate = false;
          for(let other of junctures) {
            let dx = Math.abs(other.point.x - juncture.point.x);
            let dy = Math.abs(other.point.y - juncture.point.y);
            if (dx <= ERROR_THRESHOLD && dy <= ERROR_THRESHOLD) {
              duplicate = true;
            }
          }
          if (duplicate) continue;
          
          // console.log("found juncture at", juncture.point.x, juncture.point.y);
          polygon_segment.junctures.push(juncture);
          polyline_segment.junctures.push(juncture);
          junctures.push(juncture);

        }
      }
    }
    // console.log(("polyline_segment start", polyline.segments[0].start.x, polyline.segments[0].start.y));

    let sorted_junctures = []
    for(let polyline_segment of polyline.segments) { 
      polyline_segment.sort();
      sorted_junctures.push(...polyline_segment.junctures);
    }
    for(let polygon_segment of this.segments) { polygon_segment.sort(); }
    
    return sorted_junctures;
  }

  // TODO - in progress, needs to be tested
  split(polyline) {
    let junctures = this.intersect_polyline(polyline);
    // console.log("junctures found:", junctures);
    if (junctures.length === 0) return [this];

    let first_polygon_start;
    for(let polyline_segment of polyline.segments) {
      if (polyline_segment.junctures.length > 0) {
        first_polygon_start = polyline_segment.junctures[0];
        break;
      }
    }

    let results = [];
    let current = first_polygon_start;
    let next = { visits: 1};

    let counter = 0;

    while(next !== first_polygon_start && counter < junctures.length * 2) {
      counter++;
      current.visits++;

      // console.log("current juncture", current.point.x, current.point.y, "visits:", current.visits);

      let result = [];
      results.push(result);

      let next_juncture = this.walk_polygon_forwards(current, result, junctures)
      next = next_juncture;
      //Note that checking presence of next_juncture prevents an infinite loop
      while(next_juncture !== current  && next_juncture) { 
        console.log("Looping")
        console.log("Before ", result)
        next_juncture = polyline.walk(next_juncture, result);
        console.log("After ", result)
        if(next_juncture !== current ) {
          next_juncture = this.walk_polygon_forwards(next_juncture, result, junctures);
        }
      }

      current = next;
    }

    let new_polygons = [];
    console.log("Final2", results);

    for(let result of results) {
      let new_polygon = new Polygon(result);
      new_polygons.push(new_polygon);
    }

    return new_polygons;
  }

  walk_polygon_forwards(juncture, result, junctures) {
    console.log("juncture", juncture)
    let next = juncture.polygon;
    // circle(juncture.point.x, juncture.point.y, 10);
    // circle(next.start.x, next.start.y, 10);
    if (next.junctures.length > 1) {
      return this.walk_multiple_junctures(next, juncture, result);
    }

    console.log("only one juncture")
    return this.walk_to_end_of_edge(next, juncture, result);
  }

  // something is up here
  walk_multiple_junctures(segment, juncture, result) {
    if(!next) { return  }
    const last = next.junctures[next.junctures.length - 1];
    if (last !== juncture) {
      let idx = next.junctures.findIndex(j => j === juncture);
      let next_juncture = next.junctures[idx + 1];
      result.push(next_juncture.point);
      next_juncture.increment();
      return next_juncture;
    }
  }

  walk_to_end_of_edge(segment, juncture, result) {
    let counter = 0;
    while (segment && counter < 1000) {
      counter++;
      // console.log("segment end", segment.end.x, segment.end.y);
      result.push(segment.end);  
      // console.log("results are", result);
      segment = segment.next;  
      // console.log("next segment", segment);

      if (!segment) { return juncture;}  

      
      if (segment.junctures.length > 0) {
        // console.log("found juncture on segment", segment.junctures[0]);
        const next_juncture = segment.junctures[0];
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
      noFill();
      beginShape();
      for(let v of this.points){
        vertex(v.x, v.y);
      }
      endShape(CLOSE);
    pop();
  }
}

function orient2d(a, b, c) {
  const x1 = a.x, y1 = a.y;
  const x2 = b.x, y2 = b.y;
  const x3 = c.x, y3 = c.y;
  return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
}


