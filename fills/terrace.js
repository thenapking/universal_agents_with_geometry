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

    let center = this.polygon.centroid(); // Assume you have this

    // Step 5: Extend line far in both directions
    let line_half_length = 100;
    let a = p5.Vector.sub(center, p5.Vector.mult(dir, line_half_length));
    let b = p5.Vector.add(center, p5.Vector.mult(dir, line_half_length));
    let pl = new Polyline([a, b]).clip(this.polygon);

    this.lines.push(pl[0])
  }

  draw(){
    push()
      for (let l of this.lines) {
        l.draw();
      }
    pop()
  }
}
