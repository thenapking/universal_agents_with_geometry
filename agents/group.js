class Group {
  constructor(n, center, radius, boundary) {
    this.center = center.copy();
    this.radius = radius;
    this.n = n;
    this.agents = [];
    this.boundary = boundary;
    this.active = true;
    this.polygons = [];
  }
  
  initialize() {
    for (let i = 0; i < this.n; i++) {
      this.agents.push(new Agent(this.center.copy()));
    }
  }

  draw(debug){
    push();
      if(debug){
        for (let boundary of this.boundary) {
          boundary.draw();
        }
      }

      if(this.polygons.length > 0){
        for (let polygon of this.polygons) {
          polygon.draw();
        }
      } else {
        for (let agent of this.agents){
          agent.draw();
        }
      }
    pop();
  }

  create_polygons(){
    if(this.active) { return []; }
    console.log("Creating polygons from agents");
    this.polygons = [];

    for(let agent of this.agents){
      let polygon = agent.polygon;
      let clipped = this.boundary.intersection(polygon)
      if(clipped && clipped.length > 0) { this.polygons.push(clipped[0]) };
    }
  }
}
