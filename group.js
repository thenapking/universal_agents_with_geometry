class Group {
    constructor(n, center, radius, boundaries) {
      this.center = center.copy();
      this.radius = radius;
      this.n = n;
      this.agents = [];
      this.boundaries = boundaries || [];
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
}

function create_polys_from_group(group){
  if(group.active) { return []; }
  let polys = [];
  for (let agent of group.agents) {
    let poly = new RegularPolygon(
      agent.pos.x, agent.pos.y,
      agent.size/2, agent.size/2, 100
    );
    polys.push(poly);
  }
  return polys;
}
