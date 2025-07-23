class Pips {
  constructor(polygon) {
    this.polygon = polygon;
    this.segments = []
    this.noise_scale = 0.005;
    this.dist_scale = 0.018
    this.dash_length = 4

    this.min = this.dash_length * 0.7;
    this.max = random(50, 70) 
    this.set_bounds();

    this.max_count = 20
    this.count = 0
    this.active = true;
  }

  set_bounds() {
    this.bounds = this.polygon.bounds();
    const [minX, minY, maxX, maxY] = this.bounds;
    this.minX = minX;
    this.minY = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
    
    // Make the bounding box square, large enough to fit the polygon
    const size = Math.max(this.width, this.height);
    this.maxX = minX + size;
    this.maxY = minY + size;

    // Center the square bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.minX = centerX - size / 2;
    this.minY = centerY - size / 2;
  }

  construct(){
    // do nothing
  }

  update(){
    if( !this.active ) { return  }
    if (this.count >= this.max_count) {
      this.active = false;
      return 0;
    }
    
    this.add_batch();
    return this.count + 1;
  }

  add_batch(){
    let added = 0;

    for (let i = 0; i < 800; i++) {
      let x = random(this.minX, this.maxX);
      let y = random(this.minY, this.maxY);
      let v = createVector(x, y);

      let a = this.angle(v);
      let dx = cos(a) * this.dash_length / 2;
      let dy = sin(a) * this.dash_length / 2;

      let u0 = createVector(x-dx, y - dy);
      let u1 = createVector(x+dx, y + dy);
      if(!this.polygon.contains(u0)) { continue; }
      if(!this.polygon.contains(u1)) { continue; }

      let valid = true;

      for (let segment of this.segments) {
        let m = segment.midpoint;
        let d = p5.Vector.dist(v, m);
        let local_min = this.min_dist(m)
        if (d < local_min) {
          valid = false;
          break;
        }
      }

      if (!valid) { continue; }
      
      let segment = new Segment(u0, u1);  
      this.segments.push(segment);
      added++;
    }

    if (added === 0) {
      this.count++;
    } else {
      this.count = 0;
    }

    return added;
  }

  angle(position) {
    let nz =  noise(position.x * this.noise_scale, position.y * this.noise_scale)
    return  nz * TWO_PI * 4;
  }
  
  min_dist(position) {
    let nz = noise(position.x * this.dist_scale, position.y * this.dist_scale);
    return lerp(this.min, this.max,  pow(nz, 3));
  }
  

  draw(){
    push()
      for(let segment of this.segments){
        segment.draw()
      }
    pop()
  }

}
