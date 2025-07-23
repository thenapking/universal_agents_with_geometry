class Radial{
  constructor(polygon, centre, divisions, outer_r, inner_r = 0) {
    this.polygon = polygon;
    this.divisions = divisions;
    this.centre = centre;
    this.outer_r = outer_r;
    this.inner_r = inner_r;
    this.set_bounds();
    this.lines = []
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
    let x = this.centre.x;
    let y = this.centre.y;
    let r0 = this.outer_r;
    let r1 = this.inner_r;
    for(let i = 0; i < this.divisions; i++){
      let angle = i * TWO_PI / this.divisions;  
      let x1 = x + r0 * cos(angle);
      let y1 = y + r0 * sin(angle);
      let x2 = x + r1 * cos(angle);
      let y2 = y + r1 * sin(angle);
      let u = createVector(x1, y1);
      let v = createVector(x2, y2);
      let polyline = new Polyline([u, v]);

      let results = polyline.clip(this.polygon);
      for(let result of results){
        this.lines.push(result);
      }
    }


  }

  draw(){
    push()
      for(let l of this.lines){
        l.draw();
      }
    pop()
  }

}
