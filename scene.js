
////////////////////////////////////////////////////////////////
// SCENE CREATION
const THIN_THRESHOLD = 0.26;
class Scene {
  constructor(){
    this.foci =  [];
    this.focus = this.foci[0] 
    this.points = [];
    this.polylines = [];
    this.sectors = [];
    this.potential_coffers = [];

    this.centres = [];
    this.secondary_centres = [];  

    this.offscreen_points = [];
    this.offscreen_lines = [];
    
    this.roads = [];
    this.lots = []

    this.graph = new Graph(edges, nodes);
    this.secondary_graph = new Graph(minor_edges, minor_nodes);
    this.initialize();
  }

  initialize(){
    console.log("-----------------------------")
    this.create_foci();
    this.create_roads()

    
    this.create_lots();
    this.subdivide_lots();

    // this.create_coffers()
  }

  
  create_foci(){
    console.log("Finding foci")

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

  create_roads(){
    console.log("Creating major roads")

    this.major_shortest_paths = this.create_shortest_paths(this.centres, this.graph);
    this.major_paths = create_paths(this.major_shortest_paths);
    this.major_roads = this.paths_to_roads(this.major_paths, INTERCITY_ROAD);
    this.major_road_lines = this.paths_to_roads(this.major_paths);

    console.log("Creating minor roads")

    this.minor_shortest_paths = this.create_shortest_paths(this.secondary_centres, this.secondary_graph);
    this.minor_paths = create_paths(this.minor_shortest_paths);
    this.minor_roads = this.paths_to_roads(this.minor_paths, 8);
    this.minor_road_lines = this.paths_to_roads(this.minor_paths);

    this.roads = this.major_roads.concat(this.minor_roads)
    this.road_lines = this.major_road_lines.concat(this.minor_road_lines)
  }

  create_shortest_paths(points, graph){
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

  paths_to_roads(paths, sw = 0, filter = false){
    let roads = []
    for(let path of paths){
      let road = path.to_polygon(sw, filter);
      roads.push(road);
    }
    
    return roads;
  }

  create_lots(){
    let top_left = createVector(BW + MBW, BW + MBW);
    let bottom_right = createVector(W + BW + MBW, H + BW + MBW);
    let top_right = createVector(W + BW + MBW, BW + MBW);
    let bottom_left = createVector(BW + MBW, H + BW + MBW);
    let points = [top_left, top_right, bottom_right, bottom_left];
    let bg = new MultiPolygon(points, 'countryside');
    
    let unioned_roads = unionPolygons(this.roads)
    let new_bg = bg.difference(unioned_roads);
    this.sectors = new_bg
  }

  create_coffers(){
    console.log("Creating coffers")

    let results = []
    for(let p of this.lots){
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
    console.log("Subdividing Lots")

    let results = [];
    let counter = 0;
    for(let p of this.sectors){
      
      let r = this.subdivide(p, MIN_LOT_SIZE);
      for(let rr of r){
        results.push(rr);
      }
      counter++;

    }
    this.lots = results;
  }

  distance_from_lot_to_nearest_foci(polygon) {
    let centroid = polygon.bounds_centroid();
    
    let nearest_dist = Infinity;

    for (let f of this.foci) {
      let d = p5.Vector.dist(centroid, f);
      if (d < nearest_dist) {
        nearest_dist = d;
      }
    }
    return nearest_dist;
  }

  set_road_width(major_road, edge_length){
    let stroke_width;
    
    if (major_road) {
      stroke_width = MAJOR_ROAD;
    } else if (edge_length > MINOR_ROAD_LENGTH) {
      stroke_width = MINOR_ROAD;
    } else {
      stroke_width = SIDE_ROAD;
    }

    return stroke_width;
  }

  validate(pieces){
    if (pieces.length === 0) { return false }
    
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
    return valid
  }

  subdivide(polygon, min_area, counter = 0, hierarchy_counter = 0) {
    // 1) Check whether we should halt
    let area = polygon.area()
    let d = this.distance_from_lot_to_nearest_foci(polygon);

    let max_area = 20000
    let max_dist = 200

    let scale = map(d, 0, max_dist, 0, 1);
    let inv = pow(scale, 2);
    let threshold = min_area + (max_area - min_area) * inv;
    threshold *= 0.05

    if (area < threshold || area < min_area ) {
      return [polygon];
    }
   
    if(area > CIVIC && area < MAX_LOT_SIZE && random(1) < 0.1 && counter > 0){
      return [polygon]
    }

    let edge = polygon.find_longest_edge();
    if (!edge) {
      return [polygon];
    }

    // 2) Find edges
    let p1 = edge[0].start;
    let p2 = edge[edge.length - 1].end;
    let edge_length = p5.Vector.dist(p1, p2);
    let midpoint = p5.Vector.add(p1, p2).mult(0.5);

    // 3) Compute the unit‐vector direction of the longest edge,
    // then rotate by 90° to get a perpendicular direction
    let parallel = p5.Vector.sub(p2, p1).normalize();
    // Rotating (x,y) → (−y, x) is a 90° CCW rotation:
    let perpendicular = createVector(-parallel.y, parallel.x);

    // 4) Compute the bounding box of the polygon to determine the diagonal length
    const [minX, minY, maxX, maxY] = polygon.bounds();
    let w = maxX - minX;
    let h = maxY - minY;
    let diagonal = 2 * Math.sqrt(w * w + h * h);

    // 5) Build two endpoints A, B for our infinite (sampled) cutting line:
    let A = p5.Vector.add(midpoint, p5.Vector.mult(perpendicular, diagonal));
    let B = p5.Vector.sub(midpoint, p5.Vector.mult(perpendicular, diagonal));

    // 6) Calculate the street's width, and create a polyline
    let major_road = hierarchy_counter++ < 3 && edge_length > MAJOR_ROAD_LENGTH
    let stroke_width = this.set_road_width(major_road, edge_length);

    let new_line = new Polyline([A, B]);
    let new_street = new_line.to_polygon(stroke_width);

    // 7) Perform the difference operation on the street polygon, and validate it
    let pieces = polygon.difference(new_street);

    if (!this.validate(pieces)) { return [polygon]; }

    // 8) If the road is over a certain length we also need the path down it
    // We also need to ensure that the road_line joins existing roads
    this.join_dangling_streets(polygon, new_line, edge_length, major_road)

    // 9) Recurse or return
    let result = [];
    for (let piece of pieces) {
      let pieces = this.subdivide(piece, min_area, counter++, hierarchy_counter);
      result.push(...pieces);
    }
    return result;
  }

  join_dangling_streets(polygon, line, edge_length, major_road){
    if (edge_length < 75) { return }
    let junctures = polygon.intersect_polyline(line);

    for(let j = 0; j < junctures.length-1; j+=2){
      let Ar = junctures[j].point;
      let Br = junctures[j+1].point;
      let Bdir = p5.Vector.sub(Br, Ar).normalize().mult(INTERCITY_ROAD);
      let Adir = p5.Vector.sub(Ar, Br).normalize().mult(INTERCITY_ROAD);
      let Ax = p5.Vector.add(Ar, Adir);
      let Bx = p5.Vector.add(Br, Bdir);
      let Aj = Ar;
      let Bj = Br;
      let Aextension  = new Polyline([Ax, Ar]);
      let Bextension = new Polyline([Bx, Br]);


      for(let other of this.road_lines){
        let junctions = Aextension.intersection(other)
        if(junctions.length > 0){
          Aj = junctions[0];
          break;
        }
      }

      for(let other of this.road_lines){
        let junctions = Bextension.intersection(other)
        if(junctions.length > 0){
          Bj = junctions[0];
          break;
        }
      }

      let fitted_street = new Polyline([Aj, Bj])
      this.road_lines.push(fitted_street);
      if (major_road) {
        this.major_road_lines.push(fitted_street);
      } else {
        this.minor_road_lines.push(fitted_street);
      }
    }
  }


  onscreen(position){
    let bwt = BW + MBW
    return position.x > bwt && position.x < (FW - bwt) &&
    position.y > bwt && position.y < (FH - bwt)
  }

  offscreen(position){
    return !this.onscreen(position);
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
