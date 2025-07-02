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
    this.area = this.polygon.area();
    this.houses = []
  }

  construct(){
    
    this.outside();
  }

  goldenDivide(x, y, w, h, vertical, count = 0) {
    PHI = (1 + Math.sqrt(5)) / 2; // WHY THIS CAN'T GET DEFINED IN SETUP I DON'T KNOW

    const PADDING = 1;
    x += PADDING;
    y += PADDING;
    w -= 2 * PADDING;
    h -= 2 * PADDING;

    if ((min(w, h) < 40 || count > 10 || random(1) < 0.5) && count > 1) {
      this.add_houses(x, y, w, h);
      return;
    }
  
    if (vertical) {
      let sw = w / PHI;

      this.goldenDivide(x, y, sw, h, !vertical, count + 1);
      this.goldenDivide(x + sw + 2, y, w - sw - 2, h, !vertical, count + 1);
  
    } else {
      let sh = h / PHI;
  
      this.goldenDivide(x, y, w, sh, !vertical, count + 1);
      this.goldenDivide(x, y + sh + 2, w, h - sh - 2, !vertical, count + 1);
  
    }
  }

  add_houses(x, y, w, h) {
    let cols, rows;
    let padding = 2
  
    if (w < h) {
      // vertical houses
      cols = 2
      rows = floor(h / 10);
  
    } else {
  
      // horizontal houses
      rows = 2;
      cols = floor(w / 10);
  
    }
  
    let houseW = w / cols;
    let houseH = h / rows;
  
    for (let i = 0; i < cols; i++) {
  
      for (let j = 0; j < rows; j++) {
  
        let hx = x + i * houseW + padding;
        let hy = y + j * houseH + padding;
  
        let hw = houseW - 2 * padding;
        let hh = houseH - 2 * padding;
        
        let house = new Oblong(hx, hy, hw, hh);
        this.houses.push(house);
        // let final_plot = house.intersection(this.polygon);
        // if(final_plot && final_plot.length > 0) {
        //   this.houses.push(final_plot[0]);
        // }
      }
  
    }
  }

  divide(){
    let longest = this.polygon.find_longest_edge();
    let houseWidth = 6; // example width for each rectangle

    // Calculate the number of houses that fit along the longest edge
    let edgeLength = p5.Vector.dist(longest.start, longest.end);
    let numHouses = Math.floor(edgeLength / houseWidth);

    let direction = p5.Vector.sub(longest.end, longest.start).normalize();
    let perpendicular = createVector(-direction.y, direction.x);

    for (let i = 0; i < numHouses; i++) {
      let start = p5.Vector.add(longest.start, direction.copy().mult(i * houseWidth));
      let end = p5.Vector.add(start, direction.copy().mult(houseWidth));

      let topLeft = start.copy().add(perpendicular.copy().mult(houseWidth / 2));
      let topRight = end.copy().add(perpendicular.copy().mult(houseWidth / 2));
      let bottomLeft = start.copy().sub(perpendicular.copy().mult(houseWidth / 2));
      let bottomRight = end.copy().sub(perpendicular.copy().mult(houseWidth / 2));
      let points = [topLeft, topRight, bottomRight, bottomLeft];
      let house = new MultiPolygon(points);
      this.houses.push(house);
    }
  }

  outside(){
    let hW = random(3, 5)
    let hD = hW * 1.8;
    let n = this.polygon.outer.length;
    for(let i = 0; i < n; i++){
      if(this.area < 500 && i%2===0) { continue }
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
        let final_plot = house.intersection(this.polygon);
        if(final_plot && final_plot.length > 0) {
          this.houses.push(final_plot[0]);
        }
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
