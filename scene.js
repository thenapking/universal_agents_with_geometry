
////////////////////////////////////////////////////////////////
// SCENE CREATION
const THIN_THRESHOLD = 0.26;
let template;
let r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28;
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
    
    this.roads = [];
    this.lots = []

    this.graph = new Graph(edges, nodes);
    this.secondary_graph = new Graph(minor_edges, minor_nodes);
    console.log("--------")
    console.log("Creating roads")

    this.create_foci();
    this.main_paths = this.create_paths(this.centres, this.graph);
    this.main_roads = this.create_roads(this.main_paths, INTERCITY_ROAD);
    this.main_road_lines = this.create_roads(this.main_paths);

    this.minor_paths = this.create_paths(this.secondary_centres, this.secondary_graph);
    this.minor_roads = this.create_roads(this.minor_paths, 8);
    this.minor_road_lines = this.create_roads(this.minor_paths);

    this.roads = this.main_roads.concat(this.minor_roads)
    this.road_lines = this.main_road_lines.concat(this.minor_road_lines)
    // this.create_lines();

    
    console.log("Subdividing Lots")
    this.create_lots();
    this.subdivide_lots();
    console.log("Creating coffers")
    this.create_coffers()
  }

  
  create_foci(){
    for(let i = 0; i < emitters.length; i++){
      let emitter = emitters[i];
      if(!emitter.principal){ continue; }
      let position = createVector(emitter.position.x, emitter.position.y);
      this.foci.push(position);

    }

    
    for(let i = 0; i < this.graph.nodes.length; i++){
      let node = this.graph.nodes[i];
      if(node.degree > 1) {continue; }
      if(this.onscreen(node.position)){ continue; }
      this.centres.push(node);
    }


    for(let i = 0; i < this.foci.length; i++){
      let f = this.foci[i];
      let node = this.secondary_graph.find_node_by_position(f);
      if(node.degree < 2){ continue; }
      for(let other of this.secondary_centres){
        if(other.id === node.id){ continue; }
      }
      this.secondary_centres.push(node);      
    }

    for(let i = 0; i < this.foci.length; i++){
      let f = this.foci[i];
      let node = this.graph.find_node_by_position(f);
      if(node.degree < 2){ continue; }
      this.centres.push(node);      
    }

    for(let i = 0; i < this.secondary_graph.nodes.length; i++){
      let node = this.secondary_graph.nodes[i];
      if(node.degree < 6) {continue; }
      let found = false;
      for(let other of this.secondary_centres){
        if(other.id === node.id){ continue }
        let d = p5.Vector.dist(node.position, other.position);
        if(d < 100){ found = true; break; }
      }
      if(found) { continue; }
        
      this.secondary_centres.push(node);
    }



    
  }

  create_connected_network(points, graph){
    let paths = []
    for(let i = 0; i < points.length; i++){
      let centre = points[i];
      for(let j = i + 1; j < points.length; j++){
        let other = points[j];
        let path = graph.shortest(centre, other);
        if(path) { paths.push(path) };
      }
    }
    return paths
  }

  create_paths(points, graph, min_length = 3){
    let paths = this.create_connected_network(points, graph);
    
    // let a = points[0];
    // let b = points[1];
    // let c = points[2];
    // let d = points[3];

    // r0 = graph.shortest(a, b);
    // r1 = graph.shortest(a, c);
    // r2 = graph.shortest(a, d);
    // r3 = graph.shortest(b, c);
    // r4 = graph.shortest(b, d);
    // r5 = graph.shortest(c, d);

      
    // paths = [r0, r1, r2, r3, r4, r5];

    // Create a connected network of paths, this is all the possible combinations of paths
    // Put these in a queue
    // Pop the first path and push to the finalised paths
    // Pop a path in the queue
    // For each finalised path, if this path doesn't intersect it, find_intersections will return an array with one element
    // If it does intersect, then we shift all the intersections into the top of the queue, and break, starting the queue again
    // If we get to the end of checking this path against the finalised paths, 
    // More work is needed however, because I still see overlaps

    let final = [];
    if(paths.length == 0){ return final; }
    
    let queue = paths
    let r0 = queue[0]
    let r1 = queue[1];
    console.log("Paths", paths)
    let r0r1 = this.find_intersections(r1, r0);

    // if r0r1 length == 1 then add
    final.push(r0r1[0])
    // queue = shuffle(queue);
    console.log("-------------------------------------------------------")
    while(queue.length > 0){
      let current = queue.shift();
      console.log("Picking from queue", current);
      for(let i = 0; i < final.length; i++){
        let other = final[i];
        let intersections = this.find_intersections(other, current);
        console.log("intersections", intersections);
        if(intersections.length == 0){
          // all points in current are in other, so we can skip this path
          console.log("intersections empty");
          current = [];
          break;
        } else if(intersections.length == 1){
          current = intersections[0];
        } else {
          console.log("Found multiple intersections");
          for(let intersection of intersections){
            queue.unshift(intersection)
            break;
          }
        }
      }

      console.log("-------------------------------------------------------")
      console.log("Current path", current);
      if(current.length > min_length){
        console.log("ADDDING", current);
        final.push(current);
      }
    }

    return final;
    
  }

  create_roads(paths, sw = 0, filter = false){
    let roads = []
    console.log(paths)
    for(let path of paths){
      let road = this.create_road(path, filter, sw, sw);
      roads.push(road);
    }
    
    return roads;
  }

  create_road(route, filter, stroke_width_start, stroke_width_end){
    let points = [];
    for(let node of route){
      let p = node.position;
      points.push(p)
    }
    let polyline 

    if(filter){
      polyline = new Polyline(points).to_bezier(60).filter(stroke_width_start*2);
    } else {
      polyline = new Polyline(points).to_bezier(60);
    }

    if(stroke_width_start > 0 && stroke_width_end > 0){
      polyline = polyline.to_polygon(stroke_width_start, stroke_width_end);
    }

    return polyline
  }

  extend_path_to_edge(path){
    let start = path[0].position;
    let end = path[path.length - 1].position;
    let d = p5.Vector.sub(end, start);
    let m = d.mag();
    if(m < 100){ return path; }
    
    let unit = d.copy().normalize();
    let extended_start = p5.Vector.add(start, unit.copy().mult(100));
    let extended_end = p5.Vector.sub(end, unit.copy().mult(100));
    
    return [extended_start, ...path, extended_end];
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
    // all points in b are in a, return empty array
    if(forward === null){ return [] }
    if(forward.length > 0){ return forward }
    // console.log("Reversing b to find intersections with a");
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
    // console.log("--------Finding intersections");
    // console.log(a, b)
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

    // only one intersection
    if(ib.length < 2) { 
      console.log("Only one intersection found, returning original", [b]);
      return [b];
    }

    if(ib.length === b.length){
      console.log("All points in b are in a, returning empty array");
      return null;
    }

    // Sort the indicies in case one route traverses in an opposite direction
    ia = ia.sort((x, y) => x - y);
    ib = ib.sort((x, y) => x - y);

    

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

        if(previous_idx < ib[subsequence_start_idx]){
          console.log("Found subsequence from", previous_idx, "to", ib[subsequence_start_idx]);
          subsequences.push([previous_idx, ib[subsequence_start_idx]]);
        }

        console.log("Subsequence from", ib[subsequence_start_idx], "to", ib[subsequence_end_idx]);
        subsequences.push([ib[subsequence_start_idx], ib[subsequence_end_idx]]);
        previous_idx = ib[subsequence_end_idx];
        console.log("previous increase", previous_idx)
      }
    }

    if(previous_idx < ib.length){
      console.log("Adding last subsequence from", previous_idx, "to", b.length);
      subsequences.push([previous_idx, b.length]);
    }

    
    let results = []
    for(let i = 0; i < subsequences.length; i++){
      let indices = subsequences[i];
      let start = indices[0];
      let end = indices[1];

      let new_route = b.slice(start, end + 1);
      // console.log("potential subsequence", new_route);

      let found_start = false;
      let found_end = false;
      for(let k = 0; k < ib.length; k++){
        if(ib[k] === start){
          found_start = true;
        }
        if(ib[k] === end){
          found_end = true;
        }
      }
      if(found_start && found_end) { continue; }
      results.push(new_route);
    }


    // console.log("ia", ia);
    // console.log("ib", ib);
    // console.log("point", points)
    // console.log("Subseq", subsequences)
    // console.log("Found intersections:", results);
    
    // At this point we know that there is at least one subsequence
    // if we have no results, all subsequences were found in A
    // which means this route is completely contained in A
    if(results.length === 0){ 
      console.log("Route a completely covers b, returning null");
      return null 
    }
    
    return results;
  }

  

  create_lots(){
    let top_left = createVector(BW + MBW, BW + MBW);
    let bottom_right = createVector(W + BW + MBW, H + BW + MBW);
    let top_right = createVector(W + BW + MBW, BW + MBW);
    let bottom_left = createVector(BW + MBW, H + BW + MBW);
    let points = [top_left, top_right, bottom_right, bottom_left];
    let bg = new MultiPolygon(points, 'countryside');
    
    this.lots = [bg];
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

  subdivide(polygon, min_area, counter = 0, hierarchy_counter = 0) {
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

    

    let edge = polygon.find_longest_edge();
    if (!edge) {
      console.warn("No edges found for subdivision");
      return [polygon];
    }



    let p1 = edge[0].start;
    let p2 = edge[edge.length - 1].end;
    let edge_length = p5.Vector.dist(p1, p2);
    let midpoint = p5.Vector.add(p1, p2).mult(0.5);

    let stroke_width;
    let main_road = hierarchy_counter < 3 && edge_length > 300
    if (main_road) {
      stroke_width = MAJOR_ROAD;
      hierarchy_counter++;
    } else if (edge_length > 75) {
      stroke_width = MINOR_ROAD;
    } else {
      stroke_width = SIDE_ROAD;
    }

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

    // 6) If the road is over a certain length we also need the path down it
    if (edge_length > 75) {
      let junctures = polygon.intersect_polyline(new_line);
      for(let j = 0; j < junctures.length-1; j+=2){
        let Ar = junctures[j].point;
        let Br = junctures[j+1].point;
        let fitted_street = new Polyline([Ar, Br])
        if (main_road) {
          this.main_road_lines.push(fitted_street);
        } else {
          this.minor_road_lines.push(fitted_street);
        }
      }
    }

    let result = [];
    for (let piece of pieces) {
      let pieces = this.subdivide(piece, min_area, counter++, hierarchy_counter);
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
