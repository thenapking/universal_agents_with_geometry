class CircularGroup extends Group {
  constructor(n, center, radius, boundary, options) {
    super(n, center, radius, boundary);
    this.noiseScale = options.noiseScale;
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 10;
  }
  
  initialize() {
    for (let i = 0; i < this.n; i++) {
      this.agents.push(new CircularAgent(this.center.copy(), this));
    }
  }

  update(){
    if (!this.active) return 0;

    let active = 0;
    for (let agent of this.agents) {
      agent.set_size();
      let sep = agent.separation(this.agents);
      agent.applyForce(sep);
      agent.update();
      if (agent.active) active++;
      if( agent.outside()) {
        this.agents.splice(this.agents.indexOf(agent), 1);
      }
    }

    if (active < 1) {
      this.active = false; 
      this.create_polygons();
    }

    return active;
  }
}

class CircularAgent extends Agent {
  constructor(position, group) {
    super(position, group);
    this.set_size();
  }

  set_size() {
    let nz = noise(this.position.x * this.group.noiseScale, this.position.y * this.group.noiseScale);
    this.size = lerp(this.group.minSize, this.group.maxSize, nz);
    this.w = this.size;
    this.h = this.size;
  }
  
  draw() {
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle);
    ellipse(0, 0, this.size, this.size);
    pop();
  }
}

function createCircularGroups(polygon) {
  let boundary = polygon;
  let center = polygon.centroid();

  const [minX, minY, maxX, maxY] = polygon.bounds();

  let wd = maxX - minX;
  let hd = maxY - minY;
  let area = wd * hd;
  let minSize = int(random(2, 5))
  let maxSize = minSize*4
  let avgSize = (minSize + maxSize) / 2;
  let n = 2 * floor(area / (avgSize * avgSize));

  const OPTIONS = {
    noiseScale: 0.01,
    minSize: minSize,
    maxSize: maxSize
  };

  let group = new CircularGroup(n, center, 100, boundary, OPTIONS);
  group.initialize();
  groups.push(group);

}


