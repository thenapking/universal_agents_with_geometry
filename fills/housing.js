class Housing {
  constructor(polygon) {
    this.polygon = polygon;
    this.bounds = this.polygon.bounds();
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
    this.houses = []
  }

  construct(){
    let hW = random(3, 5)
    let hD = hW * 1.8;
    let n = this.polygon.outer.length;
    for(let i = 0; i < n; i++){
      
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
      let to = floor(edgeLen / hW);
      let offset = (edgeLen - to * hW) / 2;

      for (let j = from; j < to; j++) {
        let start = a.copy().add(p5.Vector.mult(dir, offset + j * hW));
        let end = start.copy().add(p5.Vector.mult(dir, hW));
        let hd = random(hD - 1, hD + 2)
        let innerStart = start.copy().add(p5.Vector.mult(inward, hd));
        let innerEnd = end.copy().add(p5.Vector.mult(inward, hd));
  
        let p1 = createVector(start.x, start.y);
        let p2 = createVector(end.x, end.y);
        let p3 = createVector(innerEnd.x, innerEnd.y);
        let p4 = createVector(innerStart.x, innerStart.y);
        let points = [p1, p2, p3, p4];
        let house = new MultiPolygon(points);
        this.houses.push(house);
      }
    }
  }

  draw() {
    push();
    for (let house of this.houses) {
      house.draw();
    }
    pop();
  } 
  
}
