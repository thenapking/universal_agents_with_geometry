
////////////////////////////////////////////////////////////////
// SCENE CREATION
// Create the scene by splitting the polygons with the polylines

let template;
// {foci: [createVector(W/2, H/2)], offscreen_foci: [createVector(W + 2*BW + 2*MBW, 0)]};
class Scene {
  constructor(template){
    this.foci = template.foci || [];
    this.focus = this.foci[0] 
    this.sizes = [100, 100, 100, 75, 75]
    this.points = [];
    this.polylines = [];
    this.polycircles = [];
    this.potential_coffers = [];
    this.offscreen_foci = template.offscreen_foci || [];
    this.offscreen_points = [];
    this.offscreen_lines = [];
    
    this.graph = new Graph(edges);
    this.c_graph = this.graph.louvain(3)
    this.roads = this.graph.to_polygon()
    this.city_centres =  this.c_graph.nodes.sort((a, b) => b.radius - a.radius)

    this.create_onscreen_foci()
    this.create_lines();
    
    this.create_scene();
  }

  create_scene(){
    let potential_circles = this.onscreen_foci
    this.split_circles = []
    let p = potential_circles[0];
    this.polycircles = concentric_circle(p.position.x, p.position.y, p.radius/2, 30, 3);

    for(let i = 1; i < potential_circles.length; i++){
      let p = potential_circles[i];
      let polyCircle = new RegularPolygon(
        p.position.x, p.position.y,
        p.radius/2, p.radius/2, 300, 'city'
      );


      let valid = true;
      // for(let other of this.polycircles){
      //   if(other.intersection(polyCircle).length > 0){
      //     valid = false;
      //     break;
      //   }
      // }
      if(valid){
        let st = polyCircle.split(this.offscreen_lines[0]);
        let results = [];
        for(let s of st){
          results.push(s);
        }
        for(let r of results){
          let stt = r.split(this.offscreen_lines[1]);
          for(let s of stt){
            this.polycircles.push(s);
          }
        }
      }
    }
    let disjoint_circles = multi_disjoint(this.polycircles);

    this.disjoint_circles = disjoint_circles;
    for(let dC of disjoint_circles){
      let selected_roads = intersect_all(dC, this.roads);
      let unioned_roads = unionPolygons(this.roads);
      let xC = dC.xor(unioned_roads);
      console.log("XOR result:", xC);
      for(let r of xC){
        this.split_circles.push(r);
      }
    }

    create_coffers(this.split_circles);

    // colour_coffers();
    
  }

  best_points(points, centre, k, min_x = DPI/2, min_y = DPI/2) {
    // Step 1: compute angle from centre to each point
    let angle_to_centre = points.map(point => {
      let dx = point.position.x - centre.x;
      let dy = point.position.y - centre.y;
      let angle = atan2(dy, dx);
      return { point, angle };
    });
  
    // Step 3: test all combinations of k points to find max angular spread
    let best = null;
    let bestScore = -Infinity;
  
    // Brute-force: try all k-combinations
    let combos = k_combinations(angle_to_centre, k);
    for (let combo of combos) {
      let valid = true;

      // Check spatial constraints
      for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
          let a = combo[i].point.position;
          let b = combo[j].point.position;
          if (abs(a.x - b.x) < min_x || abs(a.y - b.y) < min_y) {
            console.log("Invalid combination due to spatial constraints:", a, b);
            valid = false;
            break;
          }
        }
        if (!valid) break;
      }

      if (!valid) continue;

      let angles = combo.map(obj => obj.angle);
      angles.sort((a, b) => a - b);
  
      // Make it circular: compute angle differences, including wrap-around
      let diffs = [];
      for (let i = 0; i < angles.length; i++) {
        let a1 = angles[i];
        let a2 = angles[(i + 1) % angles.length];
        let diff = (a2 - a1 + TWO_PI) % TWO_PI;
        diffs.push(diff);
      }
  
      // Score: use minimum angle gap
      let minGap = Math.min(...diffs);
      if (minGap > bestScore) {
        bestScore = minGap;
        best = combo;
      }
    }
    if (!best) {
      console.warn("No valid combination found");
      return null;
    }

    return best.map(obj => obj.point);
  }
  
  onscreen(position){
    let bwt = BW + MBW
    return position.x > bwt && position.x < (FW - bwt) &&
    position.y > bwt && position.y < (FH - bwt)
  }

  offscreen(position){
    return !this.onscreen(position);
  }

  
  create_onscreen_foci(){
    let potential_foci = this.c_graph.nodes.sort((a, b) => b.radius - a.radius).slice();
    potential_foci = potential_foci.filter(p => this.onscreen(p.position))
    let potential_points = [];
    for(let i = 2; i < 6; i++){
      let points = this.best_points(potential_foci, this.focus, i, DPI/2, DPI/2);
      if(points) { potential_points = points}
    }
    this.onscreen_foci = potential_points

    
  }

  create_lines(){
    let best_pair = find_closest_to_angle(this.onscreen_foci, PI/4)
    this.add_full_line(best_pair[0].position, best_pair[1].position);
    let second_best_pair = find_closest_to_angle(this.onscreen_foci, -PI/4)
    this.add_full_line(second_best_pair[0].position, second_best_pair[1].position);

    let offset = createVector(BW + MBW, BW + MBW)
    this.add_full_line(this.foci[0], this.offscreen_foci[0], offset  );
    this.add_star(this.foci[0], 4, offset);
    

    for(let i = 0; i < this.onscreen_foci.length; i++){
      this.add_star(this.onscreen_foci[i].position, 4);
    }

    
  }

  add_full_line(a, b, at = createVector(0, 0), bt = createVector(0, 0)){
    let l = this.full_line(a.copy().add(at), b.copy().add(bt));
    this.offscreen_lines.push(l);
  }

  full_line(a, b){
    // y = mx + c, m = dy / dx
    let d = p5.Vector.sub(b, a);

    if(d.x === 0) { 
      console.warn("Vertical line detected, using x-coordinate for line.");
      return new Polyline([createVector(a.x, 0), createVector(a.x, height)]);
    }
    
    let m = d.y / d.x;
    let c = a.y - m * a.x;
    let x1 = 0;
    let y1 = m * x1 + c;
    let x2 = width;
    let y2 = m * x2 + c;
    return new Polyline([createVector(x1, y1), createVector(x2, y2)]);
  }

  add_crosshairs(a, trans = createVector(0, 0)){
    let a1 = a.copy().add(trans);
    let b1 = a.copy().mult(1,0).add(trans);
    let b2 = a.copy().mult(0,1).add(trans);
    let l1 = this.full_line(a1, b1);
    let l2 = this.full_line(a1, b2);
    this.offscreen_lines.push(l1);
    this.offscreen_lines.push(l2);
    return [l1, l2];
  }

  add_star(a, n, trans = createVector(0, 0)){
    let angle = TWO_PI / n;
    let results = [];
    for(let i = 0; i < n; i++){
      let x = a.x + cos(i * angle) * 200;
      let y = a.y + sin(i * angle) * 200;
      let p = createVector(x, y).add(trans)
      let aa = a.copy().add(trans)
      let l = this.full_line(aa, p);
      l.draw()
      results.push(l);
      this.offscreen_lines.push(l);
    }
    return results
  }




  

  draw(){
    push();
      noFill();
      let light_pen = color(0,0,0,20);
      stroke(light_pen);
      rectMode(CENTER)

      // full outer box
      rect(FW/2, FH/2, FW, FH);

      draw_grid(DPI/4);

      for(let o of this.offscreen_foci){
        circle(o.x, o.y, 10);
      }

      stroke(0,0,0)

      for(let l of this.offscreen_lines){
        l.draw();
      }

      stroke(light_pen)
      draw_connected_network(this.onscreen_foci);

      for(let p of this.polycircles){
        p.draw();
      }

      // stroke(0);
      for(let p of this.roads){
        // noFill();
        // p.draw();
        // fill(0)
        // text(p.id, p.outer[0].x, p.outer[0].y);
      }
 

      translate(BW + MBW, BW + MBW);
      rect(W/2, H/2, W, H);
      circle(this.foci[0].x, this.foci[0].y, 20); 


    pop();
  }

  
}

function recursive_xor(polygons, lines, depth = 0) {
  if(depth > 10 || lines.length === 0) { return polygons; }
  let result = polygons;
  
  for (i = 0; i < lines.length; i++) {
      let l = lines.pop();
      let newResult = [];
      for (let polygon of result) {
          let xorResult = polygon.xor(l);
          if (xorResult.length > 1) {
            for(let newPoly of xorResult) {
              let final = recursive_xor([newPoly], lines, depth + 1);
              console.log(`Depth: ${depth}, Polygons:`, final);
              newResult.push(...final);
            }
          }
      }
      result = newResult;
  }
  
  return result;
}

function unionPolygons(polygons) {
  let current = polygons[0];
  
  for (let i = 1; i < polygons.length; i++) {
      let unionResult = current.union(polygons[i]);
      
      if (unionResult.length === 1) {
          current = unionResult[0];
      } else {
          // If multiple polygons are returned, handle recursively or by iterating
          current = mergeDisjointPolygons(unionResult);
      }
  }
  return current;
}

function mergeDisjointPolygons(polygonArray) {
  let result = polygonArray[0];
  for (let i = 1; i < polygonArray.length; i++) {
      result = result.union(polygonArray[i])[0]; // Merge them into one
  }
  return result;
}

function intersect_all(pcircle, lines){
  let results = [];
  for(let l of lines){
    let intersection = pcircle.intersection(l);
    if(intersection){
      results.push(...intersection);
    }
  }

  return results;
}

////////////////////////////////////////////////////////////////
let polylines = []
let poly_road;
let polygonA, polygonB, polylineA, polylineB, polyCircle;
let polyOuter, polyInner;


function concentric_circle(x, y, r, w, n){
  let pieces = [];

  for(let i = 0; i <= n; i++){
    let dA = i * w
    if(dA >= r) { break;}
    let type = i < n ? 'decoration' : 'city';

    let polyCircle = new RegularPolygon(
      x, y,
      r - dA, r - dA, 100, type
    );
   
    pieces.push(polyCircle);
  }

  return pieces
}

function draw_connected_network(points){
  push();
    noFill();
    for(let p of points){
      for(let q of points){
        if (p === q) continue;
        line(p.position.x, p.position.y, q.position.x, q.position.y);
      }
    }
  pop();
}

function find_closest_to_angle(points, angle){
  let closest = null;
  let closestAngle = Infinity;
  for (let p of points) {
    for(let q of points) {
      if (p === q) continue;
      let cA = p.position.angleBetween(q.position);
      let angleDiff = abs(cA - angle);
      
      if (angleDiff < closestAngle) {
        closestAngle = angleDiff;
        closest = [p,q];
      }
    }
  }
  return closest;
}


////////////////////////////////////////////////////////////////


function k_combinations(arr, k) {
  let result = [];

  function combine(temp = [], start = 0) {
    if (temp.length === k) {
      result.push([...temp]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      temp.push(arr[i]);
      combine(temp, i + 1);
      temp.pop();
    }
  }

  combine();
  return result;
}
