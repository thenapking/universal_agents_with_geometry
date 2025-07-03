
////////////////////////////////////////////////////////////////
// SCENE CREATION
const THIN_THRESHOLD = 0.26;
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
    this.farms = []

    this.graph = new Graph(edges, nodes);

    this.create_foci();
    this.create_roads();
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
    let h = this.graph.nodes[262]
    let i = this.graph.nodes[368]
    let j = this.graph.nodes[479]
    let k = this.graph.nodes[309]
    let l = this.graph.nodes[90]
    let m = this.graph.nodes[499]
    let n = this.graph.nodes[305]
    let o = this.graph.nodes[200]

    this.centres.push(a);
    this.centres.push(b);
    this.centres.push(c);
    this.centres.push(d);
    this.centres.push(e);
    this.centres.push(f);
    this.centres.push(g);
    this.centres.push(h);
    this.centres.push(i);
    this.centres.push(j);

    this.foci.push(a.position);
    this.foci.push(c.position);
    // this.foci.push(h.position);
    this.foci.push(n.position);
    // this.centres.push(k);
    // this.centres.push(l);
    // this.centres.push(m);
  }

  create_roads_automatically(){
    let routes = [];
    for(let i = 0; i < 3; i++){
      console.log("---------------")
      let a = this.centres[i];
      let b = this.centres[(i + 1)];
      let r = this.graph.shortest(a, b);
      if(i === 0){  routes = [r]; continue; }
      let reduced = r;
      for(let other of routes){
        console.log("Finding intersections between", reduced, "and", other);
        reduced = this.find_intersections(reduced, other);
      }
      console.log("Reduced route:", reduced);
      for(let remaining of reduced){
        routes.push(remaining);
      }
    }

    console.log("Created routes:", routes);
    return routes

  }

  create_connected_network(){
    let routes = []
    for(let i = 0; i < this.centres.length; i++){
      let centre = this.centres[i];
      for(let j = i + 1; j < this.centres.length; j++){
        let other = this.centres[j];
        let route = this.graph.shortest(centre, other);
        if(route.length > 0){
          console.log("Adding route between", centre.id, "and", other.id);
          routes.push(route);
        }
      }
    }
    return routes
  }

  create_roads(){
    let routes = this.create_connected_network();

    this.split_routes = []
    
    for(let i  = 0; i < routes.length; i++){
      console.log("----------- REAL")
      let ri = routes[i]
      let r0 = routes[0];
      let base = this.find_intersections(r0, ri)
      let previous = base
      console.log(base)
      for(let j = 1; j < i; j++){
        let rj = routes[j]
        let carried = previous[0]
        let current = this.find_intersections(rj, carried)
        previous = current;
      }
      this.split_routes.push(previous);
    }

    
    for(let s of this.split_routes){
      this.create_road(s);
    }


  }

  route_to_points(route){
    let points = [];
    for(let node of route){
      let p = node.id;
      points.push(p)
    }
    return points;
  }

  find_intersections(a, b){
    let forward = this.find_forward_intersections(a, b);
    if(forward.length > 0){ return forward }
    console.log("Reversing b to find intersections with a");
    let reverse_b = b.slice().reverse();
    let reverse = this.find_forward_intersections(a, reverse_b);
    if(reverse.length > 0){
      return reverse;
    }
    return [b]
  }


  find_forward_intersections(a,b){
    //a,b are two routes of ids
    // this splits line b into subsections which are not included in a
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

    // only one intersection
    if(ib.length < 2) { 
      console.log("Only one intersection found, returning original");
      return [b];
    }

    let highest_index = 0;
    let subsequences = [];
    let previous_idx = 0;

    for(let k = 0; k < ib.length - 1; k++){
      if(k < highest_index) { continue }
      let current = ib[k];
      let next = ib[k + 1];
      if(current + 1 === next){
        // found a matching index
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
        console.log("previous increase", previous_idx)
      }
    }

    if(previous_idx < ib.length){
      console.log("Adding last subsequence from", previous_idx, "to", ib.length);
      subsequences.push([previous_idx, ib.length]);
    }

    let results = []
    for(let i = 0; i < subsequences.length; i++){
      let indices = subsequences[i];
      let start = indices[0];
      let end = indices[1];
      let new_route = b.slice(start, end + 1);
      let found = false;
      for(let k = 0; k < ib.length; k++){
        if(ib[k] === start){
          found = true;
          break;
        }
      }
      if(found) { continue; }
      results.push(new_route);
    }


    console.log(ia);
    console.log(ib);
    console.log(points)
    console.log(subsequences)
    console.log("Found intersections:", results);
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
    
    this.farms = [bg];
    let unioned_roads = unionPolygons(this.roads);
    let new_bg = bg.difference(unioned_roads);
    this.polycircles = new_bg
    
    
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
    let centroid = polygon.bounds_centroid();
    
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

    if (area < threshold || area < min_area ) {
      return [polygon];
    }

    if(area > PARK && area < 4000 && random(1) < 0.03 && counter > 0){
      return [polygon]
    }

    if(area > CIVIC && area < 4000 && random(1) < 0.07 && counter > 0){
      return [polygon]
    }

    let stroke_width = area > BLOCK ? MAJOR_ROAD : MINOR_ROAD;
    if(counter === 0) { stroke_width = MAJOR_ROAD; }

    let edge = polygon.find_longest_edge();
    if (!edge) {
      console.warn("No edges found for subdivision");
      return [polygon];
    }

    let p1 = edge[0].start;
    let p2 = edge[edge.length - 1].end;
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
    
    let valid = true;
    for (let piece of pieces) {
      let bounding_box_area = piece.bounds_area();
      let area = piece.area();
      let is_thin = area / bounding_box_area < THIN_THRESHOLD;
      if (is_thin) {
        valid = false;
        break;
      }
    }
    if (!valid) { return [polygon]; }

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
