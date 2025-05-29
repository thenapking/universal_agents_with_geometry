class EllipseGroup extends Group {
  constructor(n, center, radius, boundaries, options) {
    super(n, center, radius, boundaries);
    this.noiseScale = options.noiseScale;
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 10;
  }
  
  initialize() {
    for (let i = 0; i < this.n; i++) {
      this.agents.push(new EllipseAgent(this.center.copy(), this));
    }
  }

  update(){
    if (!this.active) return 0;

    let active = 0;
    for (let agent of this.agents) {
      let sep = agent.separation(this.agents);
      let aliDelta = agent.align(this.agents);
      let radialDelta = agent.radialAlignment(this.center); 
      let align = aliDelta + radialDelta;
      agent.applyForce(sep);
      agent.applyAlignment(align);
      agent.update();
      if (agent.active) active++;
    }

    if (active < 1) {
      this.active = false; 
    }
    return active;
  }
}

class EllipseAgent extends Agent {
  constructor(pos, group) {
    super(pos, group);
    this.size = random(this.group.minSize, this.group.maxSize);
    this.w = this.size;
    this.h = this.size * 0.5; 
    this.angle = random(TWO_PI);
    this.alignmentFactor = 0.05;
    this.radialAlignmentFactor = 1;
  }
  
  applyAlignment(delta) {
    this.angle += delta;
    this.angle = constrain(this.angle, -PI, PI);
  }
  
  align(agents) {
    let neighborDist = 100;
    let sumAngle = 0;
    let count = 0;
    for (let other of agents) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d < neighborDist) {
          sumAngle += other.angle;
          count++;
        }
      }
    }
    if (count > 0) {
      let desired = sumAngle / count;
      let dAngle = desired - this.angle;
      return this.alignmentFactor * dAngle;
    }
    return 0;
  }
  
  radialAlignment(center) {
    let desired = p5.Vector.sub(this.pos, center).heading();
    let dAngle = desired - this.angle;
    return this.radialAlignmentFactor * dAngle;
  }
  
  draw() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    ellipse(0, 0, this.size, this.size * 0.5);
    pop();
  }
}

function createEllipseGroups(polygon) {
  let boundaries = [polygon];
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

  let group = new EllipseGroup(n, center, 100, boundaries, OPTIONS);
  group.initialize();
  groups.push(group);

}


