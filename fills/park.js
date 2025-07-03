class Park {
  constructor(polygon, density = 0.2, randomness = 3) {
    this.polygon = polygon;
    this.inner_polygon = polygon.scale(0.7)
    this.points = []
    this.lines =[]
    this.density = density; // Density of points to create
    this.randomness = randomness
    
  }
  
  construct(){
    this.create_points();
    this.create_lines();
  }

  create_points(){
    let input = this.inner_polygon.outer
    let n = input.length;

    // for shapes with curved edges, we need to pick a sensible number of points
    let perimeter = this.inner_polygon.perimeter();
    let sides = int(random(4, 8))
    let step = perimeter/ sides ; 
    let travelled = 0;
    for(let i = 0; i < n; i++) {
      
      let a = input[i];
      let b = input[(i + 1) % n];
      let d = p5.Vector.dist(a, b);
      travelled += d;
      if(travelled < step) continue; 
      let mid = p5.Vector.add(a, b).mult(0.5);
      this.points.push(a);
      travelled = 0; 
      this.points.push(mid);
    }

    let centroid = this.polygon.bounds_centroid();

    if(random() < this.density) {
      this.points.push(centroid);
    }

    
  }

  create_lines(){
    let lines = []
    for(let i = 0; i < this.points.length; i++) {
      let p = this.points[i];

      for(let j = i + 1; j < this.points.length; j++) {
        if(i===j) continue;
        let q = this.points[j];
        let pts = this.create_line(p, q);
        let outside = false;
        for(let point of pts) {
          if(!this.polygon.contains(point)) {
            outside = true;
            break;
          }
        }
        let l = new Polyline(pts)
        let intersects = false;
        for(let other of lines) {
          if(l.intersects(other)) {
            intersects = true;
            break;
          }
        }
        if(intersects) continue; // Skip if it intersects with existing lines
        lines.push(l);
      }
    }

    for(let finished_line of lines) {
      this.lines.push(finished_line.to_bezier(40));
    }
  }

  create_line(start, end) {
    let path = [start];
    let segments = int(random(3, 6)); 
    for (let i = 1; i < segments; i++) {
      let t = i / segments;
      let x = lerp(start.x, end.x, t) + random(-this.randomness, this.randomness);
      let y = lerp(start.y, end.y, t) + random(-this.randomness, this.randomness);
      path.push(createVector(x, y));
    }

    path.push(end); // Add the end point
    return path;
  }

  

  draw(){
    push()
      noFill();
      this.inner_polygon.draw();
      for(let l of this.lines){
        l.draw();
      }
    pop();

  }
}
