class Juncture {
  constructor(point, polyline, polygon, direction) {
    this.point = point;
    this.polyline = polyline; // these are both edges
    this.polygon = polygon;
    this.direction = direction; 

    this.visits = 0;
  }

  increment() {
    this.visits += 1;
  }
}



