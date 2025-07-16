class Trees{
  constructor(polygon, inner = true) {
    this.polygon = polygon;
    this.inner_polygon = this.polygon.scale(0.65);
    this.outer_polygon = polygon.difference(this.inner_polygon)[0];
    this.inner = inner;
    this.circles = [];
    this.bounds = this.polygon.bounds();
    const [minX, minY, maxX, maxY] = this.bounds;
    const size = Math.max(width, height);
    this.minX = minX;
    this.minY = minY;
    this.maxX = minX + size;
    this.maxY = minY + size;
  }

  construct(){
    let rad = random(3, 6)
    let trees = []
    let dropped =0;
    for(let i = 0; i < 1000000; i++){
      if(dropped > 100) { break; }
      let x = random(this.minX, this.maxX);
      let y = random(this.minY, this.maxY);
      let p = createVector(x, y);
      let intersects = false
      for(let q of trees){
        if(p5.Vector.dist(p, q) < rad){
          intersects = true;
          dropped++;
          break;
        }
      }
      let condition = this.inner ? 
        this.inner_polygon.contains(p) : 
        this.outer_polygon.contains(p);

      if(!intersects && condition){
        dropped = 0;
        trees.push(p);
        this.circles.push({x: p.x, y: p.y, r: rad});
      }
    }
  }

  draw(border = true){
    push();
      if(border) { this.polygon.draw(); }
      for(let c of this.circles){
        circle(c.x, c.y, c.r);
      }
    pop();
  }
}
