const CONTOUR_MIN_WIDTH = 5;
class Contour {
  constructor(polygon, direction = 'downwards', sf = 0.01, spacing = 5, angle_range = PI / 4) {
    this.polygon = polygon;
    this.spacing = spacing;
    this.sf = sf;
    this.angle_range = angle_range
    this.lines = [];
    this.base_angle = this.set_base_angle(direction);
    this.set_bounds();
  }

  set_base_angle(direction) {
    switch (direction) {
      case 'downwards':
        return PI / 4;
      case 'upwards':
        return 3 * PI / 4;
      case 'horizontal':
        return 0;
      case 'vertical':
        return PI/2;
    }    
  }

  set_bounds() {
    this.bounds = this.polygon.bounds();
    const [minX, minY, maxX, maxY] = this.bounds;
    this.minX = minX;
    this.minY = minY;
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Make the bounding box square, large enough to fit the polygon
    const size = Math.max(width, height);
    this.maxX = minX + size;
    this.maxY = minY + size;

    this.doubleMaxX = this.maxX * 2;
    this.doubleMaxY = this.maxY * 2;
    this.doubleMinX = this.minX /2;
    this.doubleMinY = this.minY /2;

    // Center the square bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.minX = centerX - size / 2;
    this.minY = centerY - size / 2;
  }

  check(x,y){
    return (x >= this.doubleMinX) && (x <= this.doubleMaxX) && (y >= this.minY) && (y <= this.doubleMaxY) 
  }

  construct(){
    for(let x = this.doubleMinX; x < this.doubleMaxX; x += this.spacing) {
      let points = []
      let x0 = x;
      let y0 = this.minY;
      let p = createVector(x0, y0);

      let guard = 0;
      while(this.check(p.x,p.y) && guard < 1000) {
        points.push(p.copy());
        let nz = noise(p.x * this.sf, p.y * this.sf);
        let offset = map(nz, 0, 1, -this.angle_range, this.angle_range);
        let angle = this.base_angle + offset;
        let dir = p5.Vector.fromAngle(angle).mult(this.spacing);
        p.add(dir)
        guard++;

      }

      let clipped_polylines = new Polyline(points).clip(this.polygon);
      if(clipped_polylines.length == 0) { continue; }
      let new_line = clipped_polylines[0];
      
      if(this.lines.length == 0) { 
        console.log("Adding first line");
        this.lines.push(new_line); continue; 
      }

      let valid = true;
      let previous_line = this.lines[this.lines.length - 1];
      let min_dist = 10000000;

      for(let i = 0; i < new_line.points.length; i++){
        for(let j = 0; j < previous_line.points.length; j++){
          let p1 = new_line.points[i];
          let p2 = previous_line.points[j];
          if(!p1 || !p2) continue; // Skip if points are undefined
          let d = p5.Vector.dist(p1, p2);
          if(d < CONTOUR_MIN_WIDTH){ 
            min_dist = d;
            valid = false;
            break;
          }
        }
      }
      if(valid && min_dist <= 10000000){
        this.lines.push(new_line)
      }

    }


    for(let y = this.minY; y < this.doubleMaxY; y += this.spacing) {
      let points = []
      let x0 = this.doubleMinX;
      let y0 = y;
      let p = createVector(x0, y0);

      let guard = 0;
      while(this.check(p.x,p.y) && guard < 1000) {
        points.push(p.copy());
        let nz = noise(p.x * this.sf, p.y * this.sf);
        let offset = map(nz, 0, 1, -this.angle_range, this.angle_range);
        let angle = this.base_angle + offset;
        let dir = p5.Vector.fromAngle(angle).mult(this.spacing);
        p.add(dir)
        guard++

      }


      let clipped_polylines = new Polyline(points).clip(this.polygon);
      if(clipped_polylines.length == 0) { continue; }
      let new_line = clipped_polylines[0];
      
      if(this.lines.length == 0) { 
        console.log("Adding first line");
        this.lines.push(new_line); continue; 
      }

      let valid = true;
      let previous_line = this.lines[this.lines.length - 1];
      let min_dist = 10000000;

      for(let i = 0; i < new_line.points.length; i++){
        for(let j = 0; j < previous_line.points.length; j++){
          let p1 = new_line.points[i];
          let p2 = previous_line.points[j];
          if(!p1 || !p2) continue; // Skip if points are undefined
          let d = p5.Vector.dist(p1, p2);
          if(d < CONTOUR_MIN_WIDTH){ 
            min_dist = d;
            valid = false;
            break;
          }
        }
      }
      console.log(`Distance between lines: ${min_dist}`);
      if(valid && min_dist <= 10000000){
        this.lines.push(new_line)
      }
    }
  }


  draw(){
    push()
    noFill();
    for(let l of this.lines){
      l.draw();
    }
    pop()
  }

}
