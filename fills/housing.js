const HOUSE_MIN = 6;
const HOUSE_MAX = 10;
const HOUSE_MIN_DIV = 6;
const HOUSE_MAX_DIV = 8;

//  TODO - some clean up required
class Housing {
  constructor(polygon) {
    this.polygon = polygon.outer.length > 5 ? polygon.simplify(3) : polygon;
    this.bounds = this.polygon.bounds();
    this.garden_polygon = this.polygon.scale(0.6)
    this.garden = null;
    this.houses = [];
 
    const [minX, minY, maxX, maxY] = this.bounds;
    const width = maxX - minX;
    const height = maxY - minY;
    const size = Math.max(width, height);
    this.minX = minX;
    this.minY = minY;
    this.maxX = minX + size;
    this.maxY = minY + size;
    this.centerX = (minX + maxX) / 2;
    this.centerY = (minY + maxY) / 2;
    this.centroid = this.polygon.centroid();
    this.area = this.polygon.area();
    this.houses = []
    this.walls = []
  }


  construct(){
    let n = this.polygon.outer.length;
    let a = this.polygon.outer[0];
    let b = this.polygon.outer[1];
    let c = this.polygon.outer[2];
    let lb = p5.Vector.sub(b, a).mag();
    let lc = p5.Vector.sub(c, a).mag();

    let lidx = 0;
    if(lc < lb) { lidx = 1; }

    let is_thin = lc < 21 || lb < 21
    let is_super_thin = lc < 10 || lb < 10;

    let is_small = this.area < 400;
    let hW = random(HOUSE_MIN, HOUSE_MAX);
    let hD = hW * 1.8;

    let divs = int(random(HOUSE_MIN_DIV, HOUSE_MAX_DIV));
    let reduced = is_small || is_thin || is_super_thin;

    if(reduced) {
      hW = lc > lb ? lc : lb ;
      hW /= divs;
      hD = lc > lb ? lb : lc;
      hD /= is_super_thin ? 1 : 2;
    }


    hW = constrain(hW, 2, 10);
    
    for(let i = 0; i < n; i++){
      if(reduced && (i % 2=== lidx)) { continue }
      let a = this.polygon.outer[i];
      let b = this.polygon.outer[(i + 1) % n];
      let edge = p5.Vector.sub(b, a);
      let edgeLen = edge.mag();
      if(edgeLen < 5) continue; // skip very short edges
      let dir = edge.copy().normalize();

      let midpoint = p5.Vector.add(a, b).div(2);
      let toCentroid = p5.Vector.sub(this.centroid, midpoint).normalize();
      let inward = createVector(-dir.y, dir.x);
      if (inward.dot(toCentroid) < 0) inward.mult(-1);

      // calculate the number of houses to place along the edge
      // We're going to offset and skip some on alternate sides
      let from = 0
      let to = reduced ? divs : floor(edgeLen / hW);
      to = (i % 2=== lidx) ? to - 4 : to // remove the start and end houses
      let offset = reduced ? 0 : (edgeLen - to * hW) / 2;

      for (let j = from; j < to; j++) {
        let hd = reduced ? hD : random(hD - 1, hD + 1)
        hd = constrain(hd, 2, 10);

        // calculate the corners of the house
        let start = a.copy().add(p5.Vector.mult(dir, offset + j * hW));
        let end = start.copy().add(p5.Vector.mult(dir, hW));
        let innerStart = start.copy().add(p5.Vector.mult(inward, hd));
        let innerEnd = end.copy().add(p5.Vector.mult(inward, hd));
  
        let p1 = createVector(start.x, start.y);
        let p2 = createVector(end.x, end.y);
        let p3 = createVector(innerEnd.x, innerEnd.y);
        let p4 = createVector(innerStart.x, innerStart.y);
        let points = [p1, p2, p3, p4];
        let house = new MultiPolygon(points);
        
        // ensure the house is within the polygon
        let fitted_plot = house.intersection(this.polygon);
        if(!fitted_plot || fitted_plot.length === 0) { continue; }

        // if this is the first house, just add it
        // we also add the walls separately to avoid overlapping segments
        // This sort of works, but not quite
        if(this.houses.length == 0) { 
          this.houses.push(fitted_plot[0]);  

          const outer = fitted_plot[0].outer;

          // Try to find the actual segments from the clipped polygon
          let party_wall = this.findMatchingEdge(outer, p2, p3);
          let back_wall = this.findMatchingEdge(outer, p3, p4);

          if (party_wall) this.walls.push(new Polyline(party_wall));
          if (back_wall)  this.walls.push(new Polyline(back_wall));

          continue;
        }

        // ensure the house does not overlap with existing houses
        let other_houses = unionPolygons(this.houses);
        let final_plot = fitted_plot[0].difference(other_houses);
        if(final_plot && final_plot.length > 0 && final_plot[0].area() > 10) {
          this.houses.push(final_plot[0]);
          const outer = final_plot[0].outer;

          // Try to find the actual segments from the clipped polygon
          let party_wall = (j > from) ? this.findMatchingEdge(outer, p2, p3) : null;
          let back_wall = (j > from + 1) ? this.findMatchingEdge(outer, p3, p4) : null;

          if (party_wall) this.walls.push(new Polyline(party_wall));
          if (back_wall)  this.walls.push(new Polyline(back_wall));
        }

      }
    }

    if(!reduced 
      && this.garden_polygon.outer.length < 6 
      && this.garden_polygon.outer.length > 3 
      && this.garden_polygon.area() < 3000 
      ) {
      this.garden = new Trees(this.garden_polygon);
      this.garden.construct();
    }
  }

  findMatchingEdge(points, refStart, refEnd, opts = {}) {
    const angleTolerance = opts.angleTolerance || PI / 16;
    const lenTolerance = opts.lenTolerance || 3;
    const posTolerance = opts.posTolerance || 3;
  
    const refVec = p5.Vector.sub(refEnd, refStart);
    const refAngle = refVec.heading();
    const refLen = refVec.mag();
  
    for (let i = 0; i < points.length; i++) {
      let a = points[i];
      let b = points[(i + 1) % points.length];
      let edgeVec = p5.Vector.sub(b, a);
      let angle = edgeVec.heading();
      let len = edgeVec.mag();
  
      if (abs(len - refLen) > lenTolerance) continue;
      if (abs(angle - refAngle) > angleTolerance && abs(angle - refAngle + PI) > angleTolerance && abs(angle - refAngle - PI) > angleTolerance) continue;
  
      // check if this edge is spatially near the reference segment (in either direction)
      let distAA = p5.Vector.dist(a, refStart);
      let distBB = p5.Vector.dist(b, refEnd);
      let distAB = p5.Vector.dist(a, refEnd);
      let distBA = p5.Vector.dist(b, refStart);
  
      if ((distAA < posTolerance && distBB < posTolerance) || (distAB < posTolerance && distBA < posTolerance)) {
        return [a.copy(), b.copy()];
      }
    }
  
    return null;
  }
  

  add_garden(){

  }

  draw() {
    if(this.walls.length < 3){ return }

    push();
      noFill();
      for (let wall of this.walls) {
        wall.draw();
      }
      if(this.garden) {
        this.garden.draw(false);
      }
    pop();
  } 
  
}
