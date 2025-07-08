
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
    this.river_points = [];
    this.secondary_centres = [];  

    this.offscreen_points = [];
    this.offscreen_lines = [];
    this.minor_points = []; 
    this.roads = [];
    this.farms = []

    this.graph = new Graph(edges, nodes);
    this.secondary_graph = new Graph(minor_edges, minor_nodes);
    console.log("--------")
    console.log("Creating roads")
    this.split_routes = []

    this.create_foci();
    this.river_outer = this.create_paths(this.river_points, this.graph, true, 64, 80);
    // this.river_inner = this.create_paths(this.river_points, true, 51, 60);
    this.main_roads = this.create_paths(this.centres, this.graph, true, 20);
    // console.log("Main roads created", this.main_roads.length, "paths");
    this.minor_roads = this.create_paths(this.secondary_centres, this.secondary_graph, true, 12, 10);
    this.roads = this.minor_roads //.concat(this.main_roads) //.concat(this.river_outer)
    // // this.manually_create_routes();
    // this.create_lines();
    // console.log("Subdividing Lots")
    // this.create_lots();
    // this.subdivide_lots();
    // console.log("Creating coffers")
    // this.create_coffers()
  }

  
  create_foci(){
    for(let i = 0; i < emitters.length; i++){
      let emitter = emitters[i];
      if(!emitter.principal){ continue; }
      let position = createVector(emitter.position.x, emitter.position.y);
      this.foci.push(position);

    }

    let q = this.graph.find(728)
    let p = this.graph.find(700)
    let r = this.graph.find(723)
    let s = this.graph.find(714)
    let t = this.graph.find(754)

    let a = this.secondary_graph.find(911)
    let b = this.secondary_graph.find(1111)
    let c = this.secondary_graph.find(936)
    let d = this.secondary_graph.find(980)
    let e = this.secondary_graph.find(916)
    let f = this.secondary_graph.find(1108)
    let g = this.secondary_graph.find(1089)
    let h = this.secondary_graph.find(1099)
    let i = this.secondary_graph.find(1102)
    let j = this.secondary_graph.find(1058)



    this.river_points.push(p);
    this.river_points.push(q);
    this.river_points.push(r);

    // this.centres.push(q);
    // this.centres.push(p);
    // this.centres.push(r);
    // this.centres.push(s);
    // this.centres.push(t);
    // this.centres.push(potential_centres[8]);
    // this.centres.push(potential_centres[7]);
    // this.centres.push(d);
    this.secondary_centres.push(a);
    // this.secondary_centres.push(b);
    this.secondary_centres.push(c);
    // this.secondary_centres.push(d);
    this.secondary_centres.push(e);
    this.secondary_centres.push(f);
    // this.secondary_centres.push(g);
    // this.secondary_centres.push(h);
    // this.secondary_centres.push(i);
    // this.secondary_centres.push(j);

    

    // this.foci.push(a.position);
    // this.foci.push(n.position);
  }

  create_connected_network(points, graph){
    let routes = []
    for(let i = 0; i < points.length; i++){
      let centre = points[i];
      for(let j = i + 1; j < points.length; j++){
        let other = points[j];
        let route = graph.shortest(centre, other);
        if(route.length > 0){
          routes.push(route);
        }
      }
    }
    return routes
  }

  create_paths(points, graph, filter, stroke_width_start, stroke_width_end){
    console.log(points)
    let routes = this.create_connected_network(points, graph);

    let paths = []
    let split_routes = [];
    for(let i  = 0; i < routes.length; i++){
      let ri = routes[i]
      let r0 = routes[0];
      let base = this.find_intersections(r0, ri)
      let previous = base
      console.log(i,0)
      for(let j = 1; j < i; j++){
        console.log(i,j)
        let rj = routes[j]
        let carried = previous[0]
        let current = this.find_intersections(rj, carried)
        previous = current;
      }

      split_routes.push(previous);
    }

    
    for(let s of split_routes){
      let path = this.create_road(s, filter, stroke_width_start, stroke_width_end);
      paths.push(path);
    }

    return paths;
  }

  manually_create_routes(){
    let routes = this.create_connected_network(this.secondary_centres);
    let r0 = routes[0];
    let r1 = routes[1];
    let r2 = routes[2];
    let r3 = routes[3];
    
    let r0r1 = this.find_intersections(r0, r1);
    // let r0r2 = this.find_intersections(r0, r2);
    let r0r3 = this.find_intersections(r0, r3);
    console.log("THIS SHOUD")
    let help = this.find_intersections(r0r3[0], r0r1[0]);

    // let r1r2 = this.find_intersections(r1, r2);
    // let r1r3 = this.find_intersections(r1, r3);

    // let r2r3 = this.find_intersections(r2, r3);

    // let potential = [r0r1[0], r0r2[0], r0r3[0], r1r2[0], r1r3[0], r2r3[0]];
    // let final = []

    // for(let i = 0; i < potential.length; i++){  
    //   let found = false
    //   let p = potential[i];
    //   for(let j = 0; j < final.length; j++){
    //     let other = final[j];
    //     console.log(i,j)
    //     if( this.fully_equal_routes(p, other)){
    //       console.log("Found equal routes", i, j);
    //       found = true;
    //       break;
    //     }
    //   }
    //   if(!found){
    //     console.log("Adding route", i);
    //     final.push(p);
    //   }
    // }

    // console.log(final)

    // for(let r of final){
    //   this.create_road([r], false, 10);
    // }
  

  }

  fully_equal_routes(a, b){
    if(a.length !== b.length){ return false; }
    return this.equal_routes(a, b) || this.equal_routes(b, a);
  }


  equal_routes(a, b){
    if(a.length !== b.length){ return false; }
    for(let i = 0; i < a.length; i++){
      if(a[i].id !== b[i].id){ return false; }
    }
    return true;
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
      return reverse 
    }
    return [b]
  }


  find_forward_intersections(a,b){
    // a,b are two routes of ids
    // this splits line b into subsections which are not included in a

    // ia is list of indices of intersections in a
    // ib is list of indices of intersections in b
    console.log("--------Finding intersections");
    console.log(a, b)
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

    // NOT SURE WHY WE SORT
    // ia = ia.sort((x, y) => x - y);
    // ib = ib.sort((x, y) => x - y);

    // only one intersection
    if(ib.length < 2) { 
      console.log("Only one intersection found, returning original", [b]);
      return [b];
    }

    let highest_index = 0;
    let subsequences = [];
    let previous_idx = 0;

    console.log("Found intersections at indices:", ia, ib);
    // now we find subsequences between the intersection points
    for(let k = 0; k < ib.length - 1; k++){
      if(k < highest_index) { continue }
      let current = ib[k];
      let next = ib[k + 1];
      if(current + 1 === next){
        // found a matching index
        console.log("Found matching indices", current, next);
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

        console.log("Found subsequence from", previous_idx, "to", ib[subsequence_start_idx]);
        console.log("Subsequence from", ib[subsequence_start_idx], "to", ib[subsequence_end_idx]);

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
      console.log("potential subsequence", new_route);

      let found = false;
      for(let k = 0; k < ib.length; k++){
        // if ib[k] already contains this index then this isn't new ???
        if(ib[k] === start){
          console.log("Found existing subsequence in ib at", k);
          found = true;
          break;
        }
      }
      if(found) { continue; }
      results.push(new_route);
    }


    console.log("ia", ia);
    console.log("ib", ib);
    console.log("point", points)
    console.log("Subseq", subsequences)
    console.log("Found intersections:", results);
    return results;
  }

  create_road(routes, filter, stroke_width_start, stroke_width_end){
    let points = [];
    for(let route of routes){
      for(let node of route){
        let p = node.position;
        points.push(p)
      }
    }
    let polyline 
    if(filter){
      polyline = new Polyline(points).to_bezier(60).filter(stroke_width_start*2).to_polygon(stroke_width_start, stroke_width_end);
    } else {
      polyline = new Polyline(points).to_bezier(60).to_polygon(stroke_width_start, stroke_width_end);
    }

    return polyline
  }

  create_lots(){
    let top_left = createVector(BW + MBW, BW + MBW);
    let bottom_right = createVector(W + BW + MBW, H + BW + MBW);
    let top_right = createVector(W + BW + MBW, BW + MBW);
    let bottom_left = createVector(BW + MBW, H + BW + MBW);
    let points = [top_left, top_right, bottom_right, bottom_left];
    let bg = new MultiPolygon(points, 'countryside');
    
    this.farms = [bg];
    let unioned_roads = unionPolygons(this.roads)
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

    console.log("Created", coffers.length, "coffers");
    console.log(civil_statistics)
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
    threshold *= 0.05

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








////////////////////////////////////////////////////////////////
let polylines = []
let poly_road;
let polygonA, polygonB, polylineA, polylineB, polyCircle;
let polyOuter, polyInner;





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
