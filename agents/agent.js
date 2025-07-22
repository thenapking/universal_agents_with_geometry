class Agent {
  constructor(position, group) {
    this.position = position.copy();
    this.vel = p5.Vector.random2D();
    this.acc = createVector(0, 0);
    this.maxSpeed = 2;
    this.maxForce = 0.0125;
    this.active = true;
    this.size = 0;
    this.group = group;
    this.w = this.size;
    this.h = this.size;
    this.sf = 0.49
    this.angle = random(TWO_PI);
    this.alignmentFactor = 0;
    this.cohesionFactor = 1;
  }

  outside(){
    return !this.group.boundary.bounds_contains(this.position);
  }
  
  applyForce(force, m = 1) {
    this.acc.add(force.mult(m));
  }

  applyAlignment(delta) {
    this.angle += delta;
    this.angle = constrain(this.angle, -PI, PI);
  }
  
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.position.add(this.vel);
    this.acc.mult(0);
    this.vel.mult(0.95);
    if (this.vel.mag() < 0.001) {
      this.active = false;
      this.vel.mult(0);
    }
  }
  
  separation(agents) {
    let steer = createVector(0, 0);
    let count = 0;
    for (let other of agents) {
      if (other !== this) {
        let d = p5.Vector.dist(this.position, other.position);
        if (d> 0 && d < (this.size + other.size)*this.sf) {
          let diff = p5.Vector.sub(this.position, other.position);
          diff.normalize();
          diff.div(d);
          steer.add(diff);
          count++;
        }
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

  cohesion(agents) {
    let neighborDist = 100;
    let steer = createVector(0, 0);
    let count = 0;
    for (let other of agents) {
      if (other !== this) {
        let d = p5.Vector.dist(this.position, other.position);
        if (d < neighborDist) {
          steer.add(other.position);
          count++;
        }
      }
    }
    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }
    
  align(agents) {
    let neighborDist = 50;
    let sumAngle = 0;
    let count = 0;
    for (let other of agents) {
      if (other !== this) {
        let d = p5.Vector.dist(this.position, other.position);
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

  target(position) {
    let desired = p5.Vector.sub(position, this.position);
    let d = desired.mag();
    if (d > 0) {
      desired.normalize();
      desired.mult(this.maxSpeed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    return createVector(0, 0);
  }
}

