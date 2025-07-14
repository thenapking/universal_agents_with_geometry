class Terrace {
  constructor(polygon) {
    this.polygon = polygon.outer.length > 5 ? polygon.simplify(3) : polygon;
    this.bounds = this.polygon.bounds();
    this.centroid = this.polygon.centroid(); // your class should define this

    this.lines = []
  }

  construct(){
    let edge = this.polygon.find_longest_edge();  
    let p1 = edge[0].start;
    let p2 = edge[edge.length - 1].end;
    let dir = p5.Vector.sub(p2, p1).normalize();
    let perp = createVector(-dir.y, dir.x); // perpendicular direction

    let center = this.polygon.centroid(); // Assume you have this

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
      let pos = start.lerp(end, i/n); // midpoint of the line
      let c = p5.Vector.add(pos, p5.Vector.mult(perp, line_half_length));
      let d = p5.Vector.sub(pos, p5.Vector.mult(perp, line_half_length));
      let pl2 = new Polyline([c, d])
      pl2 = pl2.clip(this.polygon);
      this.lines.push(pl2[0]);
    }
  }

  divisions(len){
    let n_min = Math.ceil(len / HOUSE_MAX);
    let n_max = Math.floor(len / HOUSE_MIN);
    return (n_min <= n_max) ? n_max : 1;
  }

  draw(){
    push()
      for (let l of this.lines) {
        l.draw();
      }
    pop()
  }
}
