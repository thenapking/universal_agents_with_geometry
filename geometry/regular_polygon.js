class RegularPolygon extends MultiPolygon {
  constructor(x, y, w, h, sides, rotation = 0) {
    let points = [];

    // Martinez clipping is a bit funny.  For circles (n>20) adding the end point does help close the circle neatly
    // Note that for regular n-agons, for small n, Martinez will give odd results if subtracting the insides.
    sides = sides > 20 ? sides + 1 : sides;
    for (let i = 0; i < sides + 1; i++) {
      let angle = TWO_PI / sides * i;
      
      let px = x + w * cos(angle);
      let py = y + h * sin(angle);
      
      // Apply the rotation around the center (x, y)
      let dx = px - x; 
      let dy = py - y;
      let rx = x + dx * cos(rotation) - dy * sin(rotation);
      let ry = y + dx * sin(rotation) + dy * cos(rotation);

      points.push([rx, ry]);
    }
    super([points]);
  }
}
