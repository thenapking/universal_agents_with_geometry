class RegularPolygon extends Polygon{
  constructor(x, y, w, h, sides) {
    let points = [];
    for (let i = 0; i < sides; i++) {
      let angle = TWO_PI / sides * i;
      let px = x + w * cos(angle);
      let py = y + h * sin(angle);
      points.push(createVector(px, py));
    }
    super(points);
  }

}
