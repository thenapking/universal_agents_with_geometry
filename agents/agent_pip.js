class PipGroup extends Group {
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
      this.agents.push(new PipAgent(createVector(x, y), this));
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

class PipAgent extends Agent {
  constructor(pos, group) {
    super(pos, group);
    this.angle = random(TWO_PI);  
  }

  set_size() {
    let nz = noise(this.pos.x * this.group.noiseScale, this.pos.y * this.group.noiseScale);
    this.size = lerp(this.group.minSize, this.group.maxSize, nz);
    this.w = this.size*0.925;
    this.h = this.size*0.60; 
    this.angle = lerp(0, TWO_PI, nz);
  }

  draw() {
    push()
      translate(this.pos.x, this.pos.y);
      rotate(this.angle);
      ellipse(0,0, this.w, this.h);
    pop();
  }
}




function createPipGroup(polygon) {
  let boundaries = [polygon];

  const [minX, minY, maxX, maxY] = polygon.bounds();

  let wd = maxX - minX;
  let hd = maxY - minY;

  let center = createVector(
    minX + wd / 2,
    minY + hd / 2
  );

  let area = wd * hd;
  let minSize = 3
  let maxSize = 6
  let avgSize = (minSize + maxSize) / 2;
  let n = floor(area / (avgSize * avgSize));
  n = constrain(n, 400, 1000);

  const OPTIONS = {
    noiseScale: 0.003,
    minSize: minSize,
    maxSize: maxSize
  };
  // TO DO remove radius = 100
  let group = new PipGroup(n, center, 100, boundaries, OPTIONS) 
  group.initialize();
  groups.push(group);
}

