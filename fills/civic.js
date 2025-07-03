class Civic {
  constructor(polygon) {
    this.polygon = polygon;
  }

  construct(){
    let a = this.polygon.scale(0.8);
    let b = this.polygon.scale(0.5);
    let points = [this.polygon.to_a(a.outer), this.polygon.to_a(b.outer)]
    this.inner_polygon = new MultiPolygon(points);
    this.hatch = new Hatching(this.inner_polygon, 5, 'upwards');
    this.hatch.hatch('upwards');

  }
 
  draw(){
    noFill();
    this.hatch.draw();
    this.inner_polygon.draw();

  }
}
