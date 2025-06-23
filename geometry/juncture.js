class Juncture {
  constructor(point, polyline_segment, polygon_segment) {
    this.point = point;
    this.polyline = polyline_segment; 
    this.polygon = polygon_segment;
    this.direction = this.orient2d(polygon_segment.start, polygon_segment.end, polyline_segment.start);

    this.visits = 0;
    console.log("New juncture created at:", this.point, "Visits", this.visits, "Direction:", this.direction);
  }

  increment() {
    this.visits += 1;
  }

  orient2d(a, b, c) {
    const x1 = a.x, y1 = a.y;
    const x2 = b.x, y2 = b.y;
    const x3 = c.x, y3 = c.y;
    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  }
}



