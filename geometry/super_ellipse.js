// for n = 1 we have an ellipse
// for n = 0.5 we have a nice lozenge shape
// for n = 0.25 we have a rectangle
// To get a squircle, just set w = h and n = 0.5 to 0.75

class SuperEllipse extends MultiPolygon {
  constructor(x, y, w, h, n = 0.5, sides = POLYGONAL_DETAIL, type, parent, rotation = 0) {
    let points = [];
    sides = sides > 20 ? sides + 1 : sides; // improve closure

    for (let i = 0; i < sides + 1; i++) {
      let angle = TWO_PI / sides * i;

      let cosA = cos(angle);
      let sinA = sin(angle);

      let r = pow(pow(abs(cosA), 2 / n) + pow(abs(sinA), 2 / n), -n / 2);

      let px = x + w * r * cosA;
      let py = y + h * r * sinA;

      let dx = px - x;
      let dy = py - y;
      let rx = x + dx * cos(rotation) - dy * sin(rotation);
      let ry = y + dx * sin(rotation) + dy * cos(rotation);

      points.push([rx, ry]);
    }

    super([points], type, parent);
  }
}
