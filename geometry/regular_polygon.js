class RegularPolygon extends Polygon {
  constructor(x, y, w, h, sides, rotation = 0) {
    let points = [];
    for (let i = 0; i < sides; i++) {
      let angle = TWO_PI / sides * i;
      
      let px = x + w * cos(angle);
      let py = y + h * sin(angle);
      
      // Apply the rotation around the center (x, y)
      let dx = px - x; 
      let dy = py - y;
      let rx = x + dx * cos(rotation) - dy * sin(rotation);
      let ry = y + dx * sin(rotation) + dy * cos(rotation);

      points.push(createVector(rx, ry));
    }
    super(points);
  }
}
