const HOUSE_MIN = 2;
const HOUSE_MAX = 4;
const HOUSE_MIN_DIV = 8;
const HOUSE_MAX_DIV = 10;
class Housing {
  constructor(polygon) {
    this.polygon = polygon;
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

    let is_small = this.area < 400;
    let hW = random(HOUSE_MIN, HOUSE_MAX);
    let hD = hW * 1.8;

    let divs = int(random(HOUSE_MIN_DIV, HOUSE_MAX_DIV));

    if(is_small) {
      hW = lc > lb ? lc : lb ;
      hW /= divs;
      hD = lc > lb ? lc : lb;
      hD /= 2
    }

    hW = constrain(hW, 2, 10);
    
    for(let i = 0; i < n; i++){
      if(is_small && (i % 2=== lidx)) { continue }
      let a = this.polygon.outer[i];
      let b = this.polygon.outer[(i + 1) % n];
      let edge = p5.Vector.sub(b, a);
      let edgeLen = edge.mag();
      let dir = edge.copy().normalize();

      let midpoint = p5.Vector.add(a, b).div(2);
      let toCentroid = p5.Vector.sub(this.centroid, midpoint).normalize();
      let inward = createVector(-dir.y, dir.x);
      if (inward.dot(toCentroid) < 0) inward.mult(-1);

      let from = 0
      let to = is_small ? divs : floor(edgeLen / hW);
      let offset = is_small ? 0 : (edgeLen - to * hW) / 2;

      for (let j = from; j < to; j++) {
        let start = a.copy().add(p5.Vector.mult(dir, offset + j * hW));
        let end = start.copy().add(p5.Vector.mult(dir, hW));
        
        let hd = is_small ? hD : random(hD - 1, hD + 2)
        hd = constrain(hd, 2, 10);
        let innerStart = start.copy().add(p5.Vector.mult(inward, hd));
        let innerEnd = end.copy().add(p5.Vector.mult(inward, hd));
  
        let p1 = createVector(start.x, start.y);
        let p2 = createVector(end.x, end.y);
        let p3 = createVector(innerEnd.x, innerEnd.y);
        let p4 = createVector(innerStart.x, innerStart.y);
        let points = [p1, p2, p3, p4];
        let house = new MultiPolygon(points);
        let final_plot = house.intersection(this.polygon);
        if(final_plot && final_plot.length > 0) {
          this.houses.push(final_plot[0]);
        }
      }
    }

    if(!is_small 
      && this.garden_polygon.outer.length < 6 
      && this.garden_polygon.area() < 3000 
      ) {
      this.garden = new Trees(this.garden_polygon);
      this.garden.construct();
    }
  }

  draw() {
    push();
      for (let house of this.houses) {
        house.draw();
      }
      if(this.garden) {
        this.garden.draw(false);
      }
    pop();
  } 
  
}
