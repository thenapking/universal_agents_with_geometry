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
    this.inner_polygon = this.polygon.scale(random(0.65, 0.8));
    this.hatch = new Hatching(this.inner_polygon, 5);
    this.hatch.hatch('downwards');
  }

  hatched_fill(){
    let a = this.polygon.scale(0.8);
    let b = this.polygon.scale(random(0.3, 0.5));
    let points = [this.polygon.to_a(a.outer), this.polygon.to_a(b.outer)]
    this.inner_polygon = new MultiPolygon(points);
    this.hatch = new Hatching(this.inner_polygon, 5,);
    this.hatch.hatch('upwards');

    if(this.inner_polygon.area() > 600 && random() < 0.5) {
      this.garden_polygon = this.inner_polygon.scale(0.6)
      this.garden = new Trees(this.garden_polygon);
      this.garden.construct();
    }
  }
 
  draw(){
    push();
    noFill();
    if(this.hatch) { this.hatch.draw(); }
    this.inner_polygon.draw();
    if(this.garden) {
      this.garden.draw();
    }
    pop();
  }
}
