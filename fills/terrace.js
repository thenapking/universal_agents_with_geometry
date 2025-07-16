class Terrace {
  constructor(polygon) {
    this.set_back = polygon.area() > 600 && (random() < 0.2); 
    this.polygon = this.set_back ? polygon.scale(0.5) : polygon; 
    this.outer_polygon = this.set_back ? polygon.difference(this.polygon)[0] : polygon;
    this.bounds = this.polygon.bounds();
    this.centroid = this.polygon.centroid(); 

    this.lines = []

    
  }

  construct(){
    let edge = this.polygon.find_longest_edge();  
    let p1 = edge[0].start;
    let p2 = edge[edge.length - 1].end;
    let dir = p5.Vector.sub(p2, p1).normalize();
    let perp = createVector(-dir.y, dir.x); // perpendicular direction

    let center = this.polygon.centroid(); 

    let line_half_length = FW;
    let a = p5.Vector.sub(center, p5.Vector.mult(dir, line_half_length));
    let b = p5.Vector.add(center, p5.Vector.mult(dir, line_half_length));
    let pl = new Polyline([a, b]).clip(this.polygon);
    let centre_line = pl[0]
    this.lines.push(centre_line)

    let n = this.divisions(centre_line.length());

    for(let i = 1; i < n; i++){
      let start = centre_line.points[0].copy()
      let end = centre_line.points[centre_line.points.length - 1].copy()
      let pos = start.lerp(end, i/n); 
      let c = p5.Vector.add(pos, p5.Vector.mult(perp, line_half_length));
      let d = p5.Vector.sub(pos, p5.Vector.mult(perp, line_half_length));
      let pl2 = new Polyline([c, d])
      pl2 = pl2.clip(this.polygon);
      this.lines.push(pl2[0]);
    }

    // Create the garden polygon
    if(this.set_back) {
      this.garden = new Trees(this.outer_polygon, false);
      this.garden.construct();
    }
  }

  divisions(len){
    let n_min = Math.ceil(len / HOUSE_MAX);
    let n_max = Math.floor(len / HOUSE_MIN);
    return (n_min <= n_max) ? n_max : 1;
  }

  draw(){
    push()
      if(this.set_back) { 
        this.polygon.draw(); 
        this.garden.draw(false)
      }
      for (let l of this.lines) {
        l.draw();
      }
    pop()
  }
}
