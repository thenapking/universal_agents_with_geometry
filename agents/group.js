class Group {
  constructor(n, center, radius, boundaries) {
    this.center = center.copy();
    this.radius = radius;
    this.n = n;
    this.agents = [];
    this.boundaries = boundaries || [];
    this.active = true;
  }
  
  initialize() {
    for (let i = 0; i < this.n; i++) {
      this.agents.push(new Agent(this.center.copy()));
    }
  }

  draw(){
    push();
      for (let boundary of this.boundaries) {
        boundary.draw();
      }
      for (let agent of this.agents){
        agent.draw();
      }
    pop();
  }

  create_polygons(){
    if(this.active) { return []; }
    let polygons = [];

    for (let agent of this.agents) {
      let polygon = new RegularPolygon(
        agent.pos.x, agent.pos.y,
        agent.w/2, agent.h/2, POLYGONAL_DETAIL, 
        agent.angle
      );
      polygons.push(polygon);
    }

    let results = [];
    for(let polygon of polygons){
      let clipped = this.boundaries[0].intersection(polygon)
      if(clipped) { results.push(clipped) };
    }
    return results;
  }
}
