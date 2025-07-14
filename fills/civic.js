class Civic {
  constructor(polygon) {
    this.polygon = polygon;
  }

  construct(){
    if(random() < 0.5){
      this.hatched_fill()
    } else {
      this.outline_fill()
    }
  }

  outline_fill(){
    this.inner_polygon = this.polygon.scale(random(0.6, 0.7));
  }

  hatched_fill(){
    let a = this.polygon.scale(0.8);
    let b = this.polygon.scale(random(0.3, 0.5));
    let points = [this.polygon.to_a(a.outer), this.polygon.to_a(b.outer)]
    this.inner_polygon = new MultiPolygon(points);
    this.hatch = new Hatching(this.inner_polygon, 5, 'upwards');
    this.hatch.hatch('upwards');
  }
 
  draw(){
    push();
    noFill();
    if(this.hatch) { this.hatch.draw(); }
    this.inner_polygon.draw();
    pop();
  }
}
