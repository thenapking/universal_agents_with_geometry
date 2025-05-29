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
    if (!this.active) return 0;

    let active = 0;
    for (let agent of this.agents) {
      let sep = agent.separation(this.agents);
      agent.set_size();
      agent.applyForce(sep);
      agent.update();
      if (agent.active) active++;
    }

    if (active < 1) {
      this.active = false; 
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
    this.w = this.size;
    this.h = this.size;
  }

  draw() {
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}


function createCircularGroup(polygon) {
  let boundaries = [polygon];

  const [minX, minY, maxX, maxY] = polygon.bounds();

  let wd = maxX - minX;
  let hd = maxY - minY;
  let center = createVector(
    minX + wd / 2,
    minY + hd / 2
  );
  let area = wd * hd;
  let minSize = int(random(2, 20))
  let maxSize = minSize*4
  let avgSize = (minSize + maxSize) / 2;
  let n = 2.5 * floor(area / (avgSize * avgSize));

  const OPTIONS = {
    noiseScale: 0.01,
    minSize: minSize,
    maxSize: maxSize
  };
  // TO DO remove radius = 100
  let group = new CircularGroup(n, center, 100, boundaries, OPTIONS) // new CircularGroup(10, center, 0, []);
  group.initialize();
  groups.push(group);
}


