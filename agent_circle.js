class CircularGroup extends Group {
  constructor(n, center, radius, boundaries, options) {
    super(n, center, radius, boundaries);
    this.noiseScale = options.noiseScale;
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 10;
  }

  initialize() {
    for (let i = 0; i < this.n; i++) {
      let x = this.center.x + random(-10, 10);
      let y = this.center.y + random(-10, 10);
      this.agents.push(new CircularAgent(createVector(x, y), this));
    }
  }

  update(){
    let active = 0;
    for (let agent of this.agents) {
      let sep = agent.separation(this.agents);
      agent.set_size();
      agent.applyForce(sep);
      agent.update();
      if (agent.active) active++;
    }
    return active;
  }
}

class CircularAgent extends Agent {
  constructor(pos, group) {
    super(pos, group);
  }

  set_size() {
    let nz = noise(this.pos.x * this.group.noiseScale, this.pos.y * this.group.noiseScale);
    this.size = lerp(this.group.minSize, this.group.maxSize, nz);
  }

  draw() {
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

let circular_group;

function createCircularGroup(boundary, n = 800, minSize = 5, maxSize = 20) {
  let boundaries = [boundary];
  let center = boundary.centroid();
  const OPTIONS = {
    noiseScale: 0.01,
    minSize: minSize,
    maxSize: maxSize
  };
  let circular_group = new CircularGroup(n, center, 100, boundaries, OPTIONS) // new CircularGroup(10, center, 0, []);
  circular_group.initialize();
  groups.push(circular_group);
}

