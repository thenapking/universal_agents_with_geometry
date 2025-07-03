
////////////////////////////////////////////////////////////////
// SCENE CREATION

let template;
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
    this.centres = [];
    this.offscreen_points = [];
    this.offscreen_lines = [];
    this.minor_points = []; 
    this.roads = [];
    this.graph = new Graph(edges, nodes);
    this.create_foci();
    this.create_roads();
    // this.roads = this.graph.to_polygons();
    // this.road_lines = this.graph.to_polylines();
    this.farms = []
    // this.unioned_roads = unionPolygons(this.roads);
    this.create_lines();
    
    this.create_lots();

    this.subdivide_lots();

    this.create_coffers()
  }

  create_foci(){
    let a = this.graph.nodes[28]
    let b = this.graph.nodes[440]
    let c = this.graph.nodes[1146]
    let d = this.graph.nodes[73]
    let e = this.graph.nodes[178]
    let f = this.graph.nodes[452]
    let g = this.graph.nodes[1413]

    this.centres.push(a);
    this.centres.push(b);
    this.centres.push(c);
    this.centres.push(d);
    this.centres.push(e);
    this.centres.push(f);
    this.centres.push(g);
  }

  create_roads(){
    let a = this.centres[0];
    let b = this.centres[1];
    let c = this.centres[2];
    let d = this.centres[3];
    let e = this.centres[4];
    let f = this.centres[5];
    let g = this.centres[6];

    let r1 = this.graph.shortest(b, a)
    let r2 = this.graph.shortest(a, c);
    let r3 = this.graph.shortest(d, a);
    let r4 = this.graph.shortest(a, e);
    let r3f = this.find_intersections(r2, r3);
    this.r1 = this.route_to_points(r1);
    this.r2 = this.route_to_points(r2);
    this.r3 = this.route_to_points(r3);
    this.r4 = this.route_to_points(r4);
    this.r3f = this.route_to_points(r3f[0]);

    this.create_road([r1,r2]);
    this.create_road([r3f[0]]);
    this.create_road([r4]);
  }

  route_to_points(route){
    let points = [];
    for(let node of route){
      let p = node.id;
      points.push(p)
    }
    return points;
  }

  find_intersections(a,b){
    //a,b are two routes of ids
    let ia = [];
    let ib = []
    let points = []
    for(let i = 0; i < a.length; i++){
      let node = a[i];
      for(let j = 0; j < b.length; j++){
        let other = b[j];
        if(node === other){
          points.push(node);
          ia.push(i);
          ib.push(j);
        }
      }
    }
    ia = ia.sort((x, y) => x - y);
    ib = ib.sort((x, y) => x - y);
    let highest_index = 0;
    let subsequences = [];
    let previous_idx = 0;
    for(let k = 0; k < ib.length - 1; k++){
      if(k < highest_index) { continue }
      let current = ib[k];
      let next = ib[k + 1];
      let found = false
      if(current + 1 === next){
        // found a matching index
        found = true;
        let subsequence_start_idx = k;
        let subsequence_end_idx = k + 1;
        
        let sa_idx = k;
        let sb_idx = k + 1;
        let subsequence_a = ib[sa_idx];
        let subsequence_b = ib[sb_idx];
        while(subsequence_a + 1 === subsequence_b && sb_idx < ib.length - 1){
          sa_idx++;
          sb_idx++;
          subsequence_a = ib[sa_idx];
          subsequence_b = ib[sb_idx];
          subsequence_end_idx = sb_idx;
        }

        highest_index = max(highest_index, subsequence_end_idx);
        console.log(previous_idx)
        subsequences.push([previous_idx, ib[subsequence_start_idx]]);

        subsequences.push([ib[subsequence_start_idx], ib[subsequence_end_idx]]);
        previous_idx = ib[subsequence_end_idx];
      }
    }

    if(previous_idx < ib.length){
      subsequences.push([previous_idx, ib.length]);
    }

    let results = []
    for(let i = 0; i < subsequences.length; i++){
      let indices = subsequences[i];
      let start = indices[0];
      let end = indices[1];
      let new_route = b.slice(start, end + 1);
      results.push(new_route);
    }


    console.log(ia);
    console.log(ib);
    console.log(points)
    console.log(subsequences)
    return results;
  }

  create_road(routes){
    console.log(routes)
    let points = [];
    for(let route of routes){
      for(let node of route){
        let p = node.position;
        points.push(p)
      }
    }
    let polyline = new Polyline(points).to_bezier(60).to_polygon(INTERCITY_ROAD, 'road');
    this.roads.push(polyline);
  }

  create_lots(){
    let top_left = createVector(BW + MBW, BW + MBW);
    let bottom_right = createVector(W + BW + MBW, H + BW + MBW);
    let top_right = createVector(W + BW + MBW, BW + MBW);
    let bottom_left = createVector(BW + MBW, H + BW + MBW);
    let points = [top_left, top_right, bottom_right, bottom_left];
    let bg = new MultiPolygon(points, 'countryside');
    
    // let farms = this.subdivide(bg, 35000);
    this.farms = [bg];
    let unioned_roads = unionPolygons(this.roads);
    let new_bg = bg.difference(unioned_roads);
    this.polycircles = new_bg
    // let new_bg2 = new_bg[0].difference(this.roads[1]);
    // let new_bg3 = new_bg[1].difference(this.roads[1]);
    // this.polycircles = new_bg2.concat(new_bg3);
    // let new_new_bg = new_bg.difference(this.roads[1])[0];
    // this.polycircles.push(new_new_bg);
    // let remainder = new MultiPolygon(points, 'countryside');
    // for(let pC of this.polycircles){
    //   let rC = remainder.difference(pC);
    //   if(rC.length > 0){
    //     remainder = rC[0];
    //   }
    // }
    // this.polycircles.push(remainder);
    // console.log("Remaining countryside area after coffers:", remainder);
    
  }

  create_coffers(){
    let results = []
    for(let p of this.potential_coffers){
      let centroid = p.centroid();
      let nearest = null;
      let nearest_dist = Infinity;
      for(let c of this.roads) { 
        let d = p5.Vector.dist(c.centroid(), centroid);
        if(d < nearest_dist) { 
          nearest = c; 
          nearest_dist = d
        }
      }
      if(nearest){
        let intersection = p.intersection(nearest);
        if(intersection && intersection.length > 0){ continue }
          
        results.push(p);
      }
    }

    for(let p of results){
      let centroid = p.centroid();
      let nearest = this.foci[0];
      let nearest_dist = Infinity;
      for (let f of this.foci) {
        let d = p5.Vector.dist(centroid, f);
        if (d < nearest_dist) {
          nearest_dist = d;
          nearest = f;
        }
      }
      let coffer = new Coffer(p, nearest)
      
      coffers.push(coffer);
    }
  }

  subdivide_lots(){
    let results = [];
    let counter = 0;
    for(let p of this.polycircles){
      
      let r = this.subdivide(p, 300);
      for(let rr of r){
        results.push(rr);
      }
      counter++;

    }
    this.potential_coffers = results;
  }

  subdivide(polygon, min_area, counter = 0, previous_area) {
    let area = polygon.area()
    let centroid = polygon.centroid();
    let nearest = null;
    let nearest_dist = Infinity;
    for (let f of this.foci) {
      let d = p5.Vector.dist(centroid, f);
      if (d < nearest_dist) {
        nearest_dist = d;
        nearest = f;
      }
    }
    let d = nearest_dist;
    let max_area = 20000
    let max_dist = 200
    let scale = map(d, 0, max_dist, 0, 1);
    let inv = pow(scale, 2);
    let threshold = min_area + (max_area - min_area) * inv;
    threshold *= 0.1

    if (area < threshold || area < min_area) {
      return [polygon];
    }

    if(area > PARK  && random(1) < 0.03 && counter > 0){
      return [polygon]
    }

    if(area > CIVIC && random(1) < 0.07 && counter > 0){
      return [polygon]
    }

    let stroke_width = area > BLOCK ? MAJOR_ROAD : MINOR_ROAD;
    if(counter === 0) { stroke_width = INTERCITY_ROAD; }

    let edge = polygon.find_longest_edge();
    if (!edge) {
      console.warn("No edges found for subdivision");
      return [polygon];
    }

    let p1 = edge.start
    let p2 = edge.end;
    let midpoint = p5.Vector.add(p1, p2).mult(0.5);

    // Compute the unit‐vector direction of the longest edge,
    // then rotate by 90° to get a perpendicular direction
    let parallel = p5.Vector.sub(p2, p1).normalize();
    // Rotating (x,y) → (−y, x) is a 90° CCW rotation:
    let perpendicular = createVector(-parallel.y, parallel.x);

    const [minX, minY, maxX, maxY] = polygon.bounds();
    let w = maxX - minX;
    let h = maxY - minY;
    let diagonal = 2 * Math.sqrt(w * w + h * h);

    // 5) Build two endpoints A, B for our infinite (sampled) cutting line:
    let A = p5.Vector.add(midpoint, p5.Vector.mult(perpendicular, diagonal));
    let B = p5.Vector.sub(midpoint, p5.Vector.mult(perpendicular, diagonal));

    let new_line = new Polyline([A, B]);
    let new_street = new_line.to_polygon(stroke_width);
    let pieces = polygon.difference(new_street);

    if (pieces.length === 0) { return [polygon]; }
    // 8) Recursively subdivide each piece:
    let result = [];
    for (let piece of pieces) {
      let pieces = this.subdivide(piece, min_area, counter++, area);
      result.push(...pieces);
    }
    return result;
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



  create_lines(){
    let offset = createVector(BW + MBW, BW + MBW)
    // this.add_full_line(this.foci[0], this.offscreen_foci[0], offset);
    let p1 = createVector(W/3, 0)
    let p2 = createVector(W/3, H)
    this.add_full_line(p1, p2, offset);
    
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

  draw(){
    push();
      noFill();
      let light_pen = color(0,0,0,20);
      stroke(light_pen);
      rectMode(CENTER)

      // full outer box
      rect(FW/2, FH/2, FW, FH);

      draw_grid(DPI/4);


      translate(BW + MBW, BW + MBW);
      rect(W/2, H/2, W, H);
      circle(this.foci[0].x, this.foci[0].y, 20); 


    pop();
  }

  
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

function split_polygons_by_multiple(polygons, polylines){
  let results = polygons;
  for(let polyline of polylines){
    console.log("Splitting polygons by polyline");
    results = split_polygons(results, polyline);
  }
  return results;
}

function split_polygons(polygons, polyline){
  let new_polygons = [];
  for(let polygon of polygons){
    let results = polygon.split(polyline);

    for(let result of results){
      new_polygons.push(result);
    }
  }
    
  return new_polygons;
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
  console.log("Concentric circle")

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
