class Housing {
  constructor(polygon) {
    this.polygon = polygon;
    this.bounds = this.polygon.bounds();
    this.houses = [];
  }

  construct(){
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
    
    this.goldenDivide(this.minX, this.minY, maxX - minX, maxY - minY, true);
  }

  goldenDivide(x, y, w, h, vertical, count = 0) {
    PHI = (1 + Math.sqrt(5)) / 2; // WHY THIS CAN'T GET DEFINED IN SETUP I DON'T KNOW

    if ((min(w, h) < 40 || count > 10 || random(1) < 0.5) && count > 1) {
      this.drawHouses(x, y, w, h);
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

  drawHouses(x, y, w, h) {
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
        let final_plot = house.intersection(this.polygon);
        if(final_plot){
          this.houses.push(final_plot);
        }
      }
  
    }
  
  }

  draw() {
    for (let house of this.houses) {
      house.draw();
    }
  }
}
