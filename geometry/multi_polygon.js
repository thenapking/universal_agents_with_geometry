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

  draw(){
    fill(255, 255, 255);
    push();
      beginShape();
      for(let v of this.contours[0]){
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


