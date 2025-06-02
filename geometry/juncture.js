class Juncture {
  constructor(point, polyline_segment, polygon_segment, direction) {
    this.point = point;
    this.polyline = polyline_segment; 
    this.polygon = polygon_segment;
    this.direction = direction; 

    this.visits = 0;
  }

  increment() {
    this.visits += 1;
  }
}



