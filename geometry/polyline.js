const TOLERANCE = 0.0625;
class Polyline {
  constructor(points, tolerance = TOLERANCE) {
    this.points = points;
    this.clean(tolerance);
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

  to_polygon(stroke_width) {
    let sw = stroke_width/2
    let tops = [];
    let bottoms = [];

    for(let segment of this.segments){
      let normal = segment.normal().mult(sw);
      let top = segment.start.copy().add(normal);
      let bottom = segment.start.copy().sub(normal);

      tops.push(top);
      bottoms.push(bottom);
    }

    let last_segment = this.segments[this.segments.length - 1];
    let last_normal = last_segment.normal().mult(sw);
    let last_top = last_segment.end.copy().add(last_normal);
    let last_bottom = last_segment.end.copy().sub(last_normal);
    tops.push(last_top);
    bottoms.push(last_bottom);


    let points = tops.concat(bottoms.reverse());
    return new MultiPolygon([points]);
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
    console.log("!---- Juncture winding:", direction, "Current index:", idx, "Next index:", next_idx);
    // need some logic to check whether at last or first juncture
    let next_juncture = segment.junctures[next_idx];
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

