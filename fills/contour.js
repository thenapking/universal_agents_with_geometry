class Contour {
  constructor(polygon, direction = 'downwards', spacing = 10, sf = 0.01, angle_range = PI / 4) {
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
    console.log("----------")
    this.trace();
    this.distance();
    this.lines = [];
    this.trace();
  }

  trace(){
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
      if(clipped_polylines.length > 0) {
        this.lines.push(clipped_polylines[0])
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
      if(clipped_polylines.length > 0) {
        this.lines.push(clipped_polylines[0])
      }
    }

  }

  distance(){
    let total_min_dist = 0;
    let count = 0;
    for(let i = 0; i < this.lines.length - 1; i++){
      let l1 = this.lines[i];
      let l2 = this.lines[i + 1];
      for(let j = 0; j < l1.points.length; j++){
        let p1 = l1.points[j];
        let p2 = l2.points[j];
        if(!p1 || !p2) continue; // Skip if points are undefined
        let min_dist = p5.Vector.dist(p1, p2);
        total_min_dist += min_dist;
        count++;
      }
    }

    console.log(("Desired spacing", this.spacing));

    let avg_spacing = total_min_dist / count;
    let scale_factor = this.spacing / avg_spacing;
    this.spacing = this.spacing * scale_factor;

    console.log(`Average spacing: ${avg_spacing}, Adjusted spacing: ${this.spacing}`);
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
