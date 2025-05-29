class Hatching {
  constructor(polygon, spacing){
    this.polygon = polygon;
    this.spacing = spacing || 10; // Default spacing of 10
    this.polylines = []
    this.junctures = [];
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

  hatch(direction){
    switch(direction){
      case 'horizontal':
        this.horizontal();
        break;
      case 'vertical':
        this.vertical();
        break;
      case 'downwards':
        this.downwards();
        break;
      case 'upwards':
        this.upwards();
        break;
    }
    this.find_junctures();
  }

  find_junctures() {  
    console.log('Finding junctures');
    for(let polyline of this.polylines){
      let junctures = this.polygon.intersect_polyline(polyline);

      console.log(junctures);
      if(junctures.length < 2) continue;
      let jn = floor(junctures.length/2) * 2
      for(let i = 0; i < jn; i++) {
        let start = junctures[i];
        let end = junctures[i + 1];
        if(!start || !end) continue; 
        let midpoint = createVector(
          (start.point.x + end.point.x) / 2,
          (start.point.y + end.point.y) / 2
        );
        if(this.polygon.contains(midpoint)){
          this.junctures.push(junctures[i]);
          this.junctures.push(junctures[i + 1]);
        }
      }
    }
  }

  horizontal() {
    for (let y = this.minY + this.spacing; y < this.maxY; y += this.spacing) {
      this.polylines.push(new Polyline([createVector(this.minX, y), createVector(this.maxX, y)]));
    }
    
  }

  vertical() {
    for (let x = this.minX + this.spacing; x < this.maxX; x += this.spacing) {
      this.polylines.push(new Polyline([createVector(x, this.minY), createVector(x, this.maxY)]));
    }
  }

  downwards() {
    let cw = this.maxX/this.spacing
    for(let i = -cw; i < cw; i++) {
      let sp = this.spacing * i;
      this.polylines.push(new Polyline([createVector(this.minX + sp, this.minY), createVector(this.maxX + sp, this.maxY)]));
    }
  }
  upwards() {
    let cw = this.maxY/this.spacing
    for(let i = -cw; i < cw; i++) {
      let sp = this.spacing * i;
      this.polylines.push(new Polyline([createVector(this.minX, this.maxY - sp), createVector(this.maxX, this.minY - sp)]));
    }

  }

  draw(debug = false) {
    if(debug){
      stroke(255, 0, 0)
      noFill(); 
      rectMode(CORNERS);
      rect(this.minX, this.minY, this.maxX, this.maxY);
      for(let polyline of this.polylines){
        polyline.draw();
      }
    }

    for(let j = 0; j < this.junctures.length; j+=2){
      let start = this.junctures[j].point;
      let end = this.junctures[j + 1].point;
      line(start.x, start.y, end.x, end.y);
    }
  }
}
