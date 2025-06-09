const EPSILON = 1e-9

// p5.js cross product is written for 3D vectors
// For reasons I don't understand, using those functions won't work with the original source code

function cross(a, b) {
  return (a.x * b.y) - (a.y * b.x)
}


class Segment {
  constructor(start, end, index) {
    this.start = start;
    this.end = end

    this.index = index;
    this.next = null;
    this.previous = null;

    this.junctures = [];
  }

  bounds() {
    let minX = Math.min(this.start.x, this.end.x);
    let minY = Math.min(this.start.y, this.end.y);

    let maxX = Math.max(this.start.x, this.end.x);
    let maxY = Math.max(this.start.y, this.end.y);

    return [minX, minY, maxX, maxY];
  }

  to_v(){
    return p5.Vector.sub(this.end, this.start);
  }

  normal() {
    const v = this.to_v();
    return createVector(-v.y, v.x).normalize();
  }

  length() {  
    return this.start.dist(this.end);
  }

  intersection(other, endpoints_touch) {
    const va = this.end.copy().sub(this.start);  
    const vb = other.end.copy().sub(other.start); 
    const e = other.start.copy().sub(this.start);  
  
    const kross = cross(va, vb);  
    const sqrKross = kross * kross;
    const sqrLenA = va.dot(va);
  
    if (sqrKross > 0) {  // If the edges are not parallel
      const s = cross(e, vb) / kross;  
      const t = cross(e, va) / kross;  
      
      if (s < 0 || s > 1) return [];  // s is out of bounds
      if (t < 0 || t > 1) return [];  // t is out of bounds
      
      // console.log("Intersection found at s:", s, "t:", t);

      // === is required to handle case where s or t is -0
      if (s === 0 || s === 1) {
        return endpoints_touch ? [this.start.copy().add(va.copy().mult(s))] : []; 
      }
      if (t === 0 || t === 1) {
        return endpoints_touch ? [other.start.copy().add(vb.copy().mult(t))] : [];
      }

      return [this.start.copy().add(va.copy().mult(s))];  
    }
  
    // Handle the case when edges are parallel
    const sqrLenE = e.dot(e);
    const kross2 =  cross(e, va);  
    const sqrKross2 = kross2 * kross2;
    
    // co-linear check
    if (sqrKross2 > EPSILON * sqrLenA * sqrLenE) return [];  
  
    const sa = va.dot(e) / sqrLenA;
    const sb = sa + va.dot(vb) / sqrLenA;
    const smin = Math.min(sa, sb);
    const smax = Math.max(sa, sb);
  
    if (smin <= 1 && smax >= 0) {
      let smin_clamped = smin > 0 ? smin : 0;
      let smax_clamped = smax < 1 ? smax : 1;
      const intersection1 = this.start.copy().add(va.copy().mult(smin_clamped));
      const intersection2 = this.start.copy().add(va.copy().mult(smax_clamped));
  
      if (smin == 1) return endpoints_touch ? [intersection1] : [];
      if (smax == 0) return endpoints_touch ? [intersection2] : [];
      if (!endpoints_touch && smin == 0 && smax == 1) return [];
  
      return [intersection1, intersection2];
    }
  
    return [];
  }

  intersects(bounds){
    const [minX, minY, maxX, maxY] = bounds;
    const edgeBounds = this.bounds();

    return !(edgeBounds[2] < minX || edgeBounds[0] > maxX || 
             edgeBounds[3] < minY || edgeBounds[1] > maxY);
  }

  adjacent(other) {
    const tolerance = 1e-6
    let d1 = p5.Vector.sub(this.end, this.start);
    let d2 = p5.Vector.sub(other.end, other.start);

    if (Math.abs(cross(d1, d2)) > tolerance) return false;

    let axis = Math.abs(d1.x) > Math.abs(d1.y) ? 'x' : 'y';

    let a_start = this.start[axis];
    let a_end = this.end[axis];
    let b_start = other.start[axis];
    let b_end = other.end[axis];

    let rangeA = [a_start, a_end].sort((a, b) => a - b);
    let rangeB = [b_start, b_end].sort((a, b) => a - b);

    let check = rangeA[1] >= rangeB[0] - tolerance && rangeB[1] >= rangeA[0] - tolerance;
    if (!check) return false;
    // console.log("Adjacent segments found:", this, other);
    let cr = random(colours)
    // strokeWeight(2);  
    // this.draw(cr);
    // other.draw(cr);

    return true
  }

  distance(point) {
    const v = p5.Vector.sub(this.end, this.start);
    const w = p5.Vector.sub(point, this.start);

    const c1 = w.dot(v);
    if (c1 <= 0) return p5.Vector.dist(point, this.start);

    const c2 = v.dot(v);
    if (c2 <= c1) return p5.Vector.dist(point, this.end);

    const b = c1 / c2;
    const pb = this.start.copy().add(v.copy().mult(b));

    return p5.Vector.dist(point, pb);
  }

  sort() {
    this.junctures.sort((a, b) => {
      const distanceA = p5.Vector.dist(a.point, this.start);
      const distanceB = p5.Vector.dist(b.point, this.start);
      return distanceA - distanceB;
    });
  }

  draw(colour) {
    stroke(colour);
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}



