class Juncture {
  constructor(point, polyline_segment, polygon_segment) {
    this.point = point;
    this.polyline = polyline_segment; 
    this.polygon = polygon_segment;
    this.contour_id = polygon_segment.contour_id;
    this.orientation = this.orient(polygon_segment.start, polygon_segment.end, polyline_segment.start);
    this.winding = this.orientation_is_clockwise() ? 'with' : 'against';

    this.visits = 0;
    console.log("New juncture created at:", this.point, "Visits", this.visits, "Winding:", this.winding);
  }

  increment() {
    this.visits += 1;
  }

  orient(a, b, c) {
    const x1 = a.x, y1 = a.y;
    const x2 = b.x, y2 = b.y;
    const x3 = c.x, y3 = c.y;
    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  }

  orientation_is_clockwise() {
    return this.orientation < 0;
  }
}



