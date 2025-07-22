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
      let target = agent.target(this.boundary.bounds_centroid())
      // let align = agent.align(this.agents);
      // let cohesion = agent.cohesion(this.agents);
      agent.set_size();
      agent.applyForce(sep);
      agent.applyForce(target, 0.9);
      // agent.applyForce(cohesion);
      // agent.applyAlignment(align);
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

class PipAgent extends Agent {
  constructor(position, group) {
    super(position, group);
    this.angle = random(TWO_PI);  
    this.alignmentFactor = 0.0005;
    this.set_size();
  }

  set_size() {
    let nz = noise(this.position.x * this.group.noiseScale, this.position.y * this.group.noiseScale);
    this.size = lerp(this.group.minSize, this.group.maxSize, nz);
    this.w = this.size * 0.3;
    this.h = this.size //*0.9; 
    this.angle = lerp(0, TWO_PI, nz);
    this.set_axes()
  }

  set_axes() {
    // Major axis
    let sf = 1
    let dxW = Math.cos(this.angle) * this.w * sf;
    let dyW = Math.sin(this.angle) * this.w * sf;
    let startW = createVector(this.position.x - dxW, this.position.y - dyW);
    let endW   = createVector(this.position.x + dxW, this.position.y + dyW);
    this.major = new Segment(startW, endW);

    // Minor axis (perpendicular)
    let dxH = Math.cos(this.angle + HALF_PI) * this.h * sf;
    let dyH = Math.sin(this.angle + HALF_PI) * this.h * sf;
    let startH = createVector(this.position.x - dxH, this.position.y - dyH);
    let endH   = createVector(this.position.x + dxH, this.position.y + dyH);
    this.minor = new Segment(startH, endH);

    this.axes = [this.major, this.minor];
  }

  separation(agents) {
    let steer = createVector(0, 0);
    let count = 0;
    for (let other of agents) {
      if (other == this) { continue; }

      let intersects = false;
      for (let a of this.axes) {
        for (let b of other.axes) {
          if (a.intersection(b, true).length > 0) {
            intersects = true;
            break;
          }
        }
        if (intersects) break;
      }

      if (intersects) {
        let d = p5.Vector.dist(this.position, other.position);
        let diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
      return steer;
    } else {
      let stop = this.vel.copy().mult(-1);
      stop.limit(this.maxForce);
      return stop;
    }
  }
  


  draw() {
    push()
      translate(this.position.x, this.position.y);
      // rotate(this.angle);
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

