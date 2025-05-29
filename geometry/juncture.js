class Juncture {
  constructor(point, polyline, polygon) {
    this.point = point;
    this.polyline = polyline; // these are both edges
    this.polygon = polygon;

    this.visits = 0;
  }

  increment() {
    this.visits += 1;
  }
}




