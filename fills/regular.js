class Regular {
  constructor(polygon, spacing, type, offset = false){
    this.polygon = polygon;
    this.spacing = spacing || 10; 
    this.offset = offset;
    this.type = type || 'dots'; 
    this.points = [];
    this.bounds = this.polygon.bounds();
    this.set_bounds();
  }


  set_bounds() {
    const [minX, minY, maxX, maxY] = this.bounds;
    this.minX = minX;
    this.minY = minY;
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Make the bounding box square, large enough to fit the polygon
    const size = Math.max(width, height);
    this.maxX = minX + size;
    this.maxY = minY + size;

    // Center the square bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.minX = centerX - size / 2;
    this.minY = centerY - size / 2;
  }

  construct(){
    this.points = [];
    let row = 0;
    for (let y = this.minY; y <= this.maxY; y += this.spacing) {
      let loff = (this.offset && row % 2 === 0) ? this.spacing / 2 : 0;

      for (let x = this.minX; x <= this.maxX; x += this.spacing) {
        let p = createVector(x + loff, y);
        let end;
        switch(this.type){
          case 'vertical-dashes':
            end = createVector(x + loff, y + this.spacing * 0.5);
            break;
          case 'horizontal-dashes':
            end = createVector(x + loff + this.spacing * 0.5, y);
            break;
          default:
            end = createVector(x + loff, y);
        }
          
        if (this.polygon.contains(p) && this.polygon.contains(end)) {
          this.points.push(p);
        }
      }

      row++;
    }
  }

  draw() {
    push();
    for(let p of this.points){
      this.draw_individual(p.x, p.y)
    }
    pop();
  }

  draw_individual(x, y){
    switch(this.type){
      case 'dots':
        point(x, y);
        break;
      case 'vertical-dashes':
        line(x, y, x, y + this.spacing * 0.5);
        break;
      case 'horizontal-dashes':
        line(x, y, x + this.spacing * 0.5, y);
        break;
      default:
        fill(100);
    }
  }

}
