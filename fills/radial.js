class Radial{
  constructor(polygon, centre, divisions, outer_r, inner_r = 0) {
    this.polygon = polygon;
    this.divisions = divisions;
    this.centre = centre;
    this.outer_r = outer_r;
    this.inner_r = inner_r;
    this.lines = []
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
