const EPSILON = 1e-9

// p5.js cross product is written for 3D vectors
// For reasons I don't understand, using those functions won't work with the original source code

function cross(a, b) {
  return (a.x * b.y) - (a.y * b.x)
}


class Segment {
  constructor(start, end, index, contour_id) {
    this.start = start;
    this.end = end
    if(Array.isArray(start)){
      console.warn("Segment start should be p5.Vector, not arrays");
    }
    if(Array.isArray(end)){
      console.warn("Segment end should be p5.Vector, not arrays");
    }
    this.index = index;
    this.next = null;
    this.previous = null;

    this.junctures = [];
    this.contour_id = contour_id || 0;
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

  equal(other) {
    return this.start.equals(other.start) && this.end.equals(other.end);
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

    // Check if segments are parallel
    if (Math.abs(cross(d1, d2)) > tolerance) return false;

    // Check if they lie on the same line 
    let offset = p5.Vector.sub(other.start, this.start);
    if (Math.abs(cross(d1, offset)) > tolerance) return false;

    let axis = Math.abs(d1.x) > Math.abs(d1.y) ? 'x' : 'y';

    let a_start = this.start[axis];
    let a_end = this.end[axis];
    let b_start = other.start[axis];
    let b_end = other.end[axis];

    let a = [a_start, a_end].sort((a, b) => a - b);
    let b = [b_start, b_end].sort((a, b) => a - b);
    
    // check if the segment start/ends overlap
    // may not be necessary
    let check = a[1] >= b[0] - tolerance && b[1] >= a[0] - tolerance;
    if (!check) return false;

    // check if the other lap length is more than zero
    let overlap_start = Math.max(a[0], b[0]);
    let overlap_end = Math.min(a[1], b[1]);
    let overlap_length = overlap_end - overlap_start;

    return overlap_length > tolerance;
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

  parallel(other, tolerance = 1e-6) {
    const v1 = this.to_v()
    const v2 = other.to_v()
    return Math.abs(cross(v1, v2)) < tolerance;
  }

  sort() {
    this.junctures.sort((a, b) => {
      const distanceA = p5.Vector.dist(a.point, this.start);
      const distanceB = p5.Vector.dist(b.point, this.start);
      return distanceA - distanceB;
    });
  }

  draw() {
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}



