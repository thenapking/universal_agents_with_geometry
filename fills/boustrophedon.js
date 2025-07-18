class Boustrophedon{
  constructor(polygon, direction = 'downwards', spacing = 10, sf = 0.8) {
    this.polygon = polygon;
    this.inner_polygon = this.polygon.scale(sf)
    this.spacing = spacing;
    this.direction = direction;
    this.set_bounds();
    this.lines = []
    this.points = []
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

  construct(){
    let hatching = new Hatching(this.inner_polygon, this.spacing);
    hatching.hatch(this.direction);
    let potential_lines = hatching.lines;
    if(potential_lines.length < 2) {
      console.warn("Not enough lines to create boustrophedon fill");
      return;
    }
    this.points.push(potential_lines[0].end);
    for(let i = 0; i < potential_lines.length - 1; i++){
      let l1 = potential_lines[i];
      let l2 = potential_lines[(i + 1) % potential_lines.length];
      let curve_direction = i % 2 == 0
      let p1 = curve_direction ? l1.start : l1.end;
      let p2 = curve_direction ? l2.start : l2.end;
      // Ensure lines are within bounds
      this.curve_connector(p1, p2, curve_direction, this.spacing / 2, 10);
    }

    this.points.push(potential_lines[potential_lines.length - 1].start);
    this.points.push(potential_lines[potential_lines.length - 1].end);
    let new_line= new Polyline(this.points);
    this.lines.push(new_line);
  }


  // This needs improving to draw a curved then straight section but this will do for now
  curve_connector(p1, p2, curve_direction) {
    let mp_sz =  curve_direction ? -3 : 3;
    if(this.direction == 'horizontal'){ mp_sz *= -1; }
    let normal = p5.Vector.sub(p2, p1).rotate(HALF_PI).normalize()

    let q1 = p5.Vector.add(p1, p2).mult(0.5).add(normal.mult(mp_sz))

    this.points.push(p1);
    this.points.push(q1);
    this.points.push(p2)

  }


  draw(){
    push();
      for(let line of this.lines){
        line.draw();
      }
    pop();
  }
}
