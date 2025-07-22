ELLIPSE_DETAIL = 20;

class SuperEllipseGroup extends Group {
  constructor(n, center, radius, boundary, options) {
    super(n, center, radius, boundary);
    this.noiseScale = options.noiseScale || 0.05;
    this.a = options.a || 18;
    this.sf = options.sf || 0.5;
    this.squareness = options.squareness || 0.5;
    this.outer = this.boundary.scale(1.5)
    this.counter = 0;
  }
  
  initialize() {
    const [minX, minY, maxX, maxY] = this.boundary.bounds();
    let wdth = maxX - minX;
    let hght = maxY - minY;

    for (let i = 0; i < this.n; i++) {
      let x = random(0.25,0.75) * wdth + minX;
      let y = random(0.05,0.95) * hght + minY;
      this.agents.push(new SuperEllipseAgent(createVector(x,y), this, this.a, this.sf, this.squareness));
    }
  }

  update(){
    if (!this.active) return 0;

    // applying each interaction separately makes this work
    // also repelling only works if applied once to the group as a whole
    let active = 0;
    for (let agent of this.agents) {
      agent.set_size();
    }

    for (let agent of this.agents) {
      agent.move(this.center)
    }

    for (let agent of this.agents) {
      agent.set_shape()
    }

    this.intersection_count = 0;
    for (let agent of this.agents) {
      for (let other of this.agents) {
        if( agent === other) continue;
        if (agent.polygon.intersects_bounds(other.polygon)) {
          let result = agent.polygon.intersection(other.polygon);
          if (result.length > 0) {
            this.intersection_count++;
            agent.repel(other);
            other.repel(agent);
          }
        }
      }
    }
    
    for (let agent of this.agents) {
      if (agent.active) active++;
      if (agent.outside()) {
        this.agents.splice(this.agents.indexOf(agent), 1);
      }
    }

    this.counter++;
    if (this.counter > 150 || this.intersection_count < this.agents.length * 0.15) {
      this.active = false; 
      this.create_polygons();
    }
    return active;
  }
}

class SuperEllipseAgent {
  constructor(position, group, a = 18, sf = random(0.33, 0.5), squareness = 0.5) {
    this.position = position;
    this.group = group;
    this.noiseScale = group.noiseScale;
    this.sf = sf
    this.base = a;
    this.a = a; 
    this.b = a * sf; 
    this.angle = 0; 
    this.polygon = null;
    this.squareness = squareness
    this.active = true;
    this.set_size();
    this.set_shape();
  }

  set_shape() {
    this.polygon = new SuperEllipse(
      this.position.x, this.position.y,
      this.a, this.b, this.squareness,
      ELLIPSE_DETAIL, 
      null, null,
      this.angle
    );
  }

  set_size() {
    let n = noise(this.position.x * this.noiseScale, this.position.y * this.noiseScale);
    this.a = this.base/2 + this.base * n;
    this.b = this.a * this.sf
    this.angle = noise(this.position.y * 0.005, this.position.x * 0.005) * TWO_PI;
  }

  outside(){
    return !this.group.outer.bounds_contains(this.position);
  }

  move(target) {
    let dir = p5.Vector.sub(target, this.position).setMag(0.05);
    this.position.add(dir);
  }

  repel(other) {
    let d = p5.Vector.dist(this.position, other.position);
    if (d === 0) return;

    let minSep = this.a + other.a;
    if (d < minSep) {
      let repel = p5.Vector.sub(this.position, other.position).setMag(0.9);
      this.position.add(repel);
    }
  }

  draw() {
    this.polygon.draw();
  }
}
