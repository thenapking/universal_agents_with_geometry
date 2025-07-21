
////////////////////////////////////////////////////////////////
// SCENE CREATION
const THINNESS_THRESHOLD = 0.26;
const SECONDARY_DENSITY = 4;
const CITY_DENSITY = 2;
const CITY_RADIUS = 150;
const RSF = 0.001
const RM = 10
const RD = 60
class Scene {
  constructor(){
    this.bounding_box = new Oblong(MBW+BW, MBW+BW, W, H)
    this.foci =  [];
    this.secondary_foci = [];
    this.offscreen_foci = [];
    this.focus = this.foci[0] 
    this.points = [];
    this.polylines = [];
    this.sectors = [];
    this.potential_coffers = [];

    this.intercity_points = [];
    this.major_points = [];
    this.minor_points = [];  

    this.intercity_road_lines = [];
    this.major_road_lines = [];
    this.minor_road_lines = [];
    this.street_road_lines = []

    this.intercity_roads = [];
    this.major_roads = [];
    this.minor_roads = [];
    this.street_roads = [];

    this.offscreen_points = [];
    this.offscreen_lines = [];
    
    this.roads = [];
    this.lots = []

  }

  initialize(){
    console.log("-----------------------------")
    
    this.set_city_limits()
    this.create_foci();
    this.create_graph();
    this.create_roads_in_order();
    



    this.create_lots();
    this.subdivide_lots();

    this.create_coffers()
  }

  onscreen(position){
    let bwt = BW + MBW
    return position.x > bwt && position.x < (FW - bwt) &&
    position.y > bwt && position.y < (FH - bwt)
  }

  offscreen(position){
    return !this.onscreen(position);
  }
  
  create_foci(){
    console.log("Finding foci")

    this.focus = createVector(FW/2, FH/2);
    this.foci.push(this.focus);
    
    let a = createVector(FW/2, 0);
    let b = createVector(FW/2, FH);
    let c = createVector(0, FH/2);
    let d = createVector(FW, FH/2);

    this.offscreen_foci.push(a);
    this.offscreen_foci.push(b);
    this.offscreen_foci.push(c);
    this.offscreen_foci.push(d);

    this.foci.push(a);
    this.foci.push(b);
    this.foci.push(c);
    this.foci.push(d);

    let ra = createVector(0,0);
    let rb = createVector(FW, 0);
    let rc = createVector(0, FH);
    let rd = createVector(FW, FH);

    this.secondary_foci.push(ra);
    this.secondary_foci.push(rb);
    this.secondary_foci.push(rc);
    this.secondary_foci.push(rd);

    for(let i = 0; i < SECONDARY_DENSITY; i++){
      let rra = createVector(random(W) + BW + MBW, random(H) + BW + MBW);
      this.secondary_foci.push(rra);
    }

    this.city_points = []; 

    let city_density = random(CITY_DENSITY*2)
    for(let i = 0; i < city_density; i++){
      let x = randomGaussian(this.focus.x, CITY_RADIUS/2);
      let y = randomGaussian(this.focus.y, CITY_RADIUS/2);
      this.city_points.push(createVector(x, y));
    }

    for(let f of this.secondary_foci){
      if(this.offscreen(f)){ continue; }
      city_density = random(10, CITY_DENSITY)
      for(let i = 0; i < city_density; i++){
        let x = randomGaussian(f.x, CITY_RADIUS/2);
        let y = randomGaussian(f.y, CITY_RADIUS/2);
        this.city_points.push(createVector(x, y));
      }
    }
  }

  create_graph(){
    let intercity_nodes = []; 
    for(let i = 0; i < this.foci.length; i++){
      let f = this.foci[i];
      let node = new Node(f.x, f.y, i);
      intercity_nodes.push(node);
    }
    this.graph = new Graph([], intercity_nodes).relative_neighbours();
    this.major_roads = this.graph.find_chains()

    
    this.add_points()
    
  }

  add_points(){
    let points = this.secondary_foci.slice()
    while(points.length > 0){  
      let pt = points.pop()
      console.log("Adding point", pt.x, pt.y, "Points left:", points.length);
      let new_node = new Node(pt.x, pt.y);
      this.graph.add_node(new_node);
      this.graph = this.graph.relative_neighbours();

      this.refine_roads();

    }

    while(this.city_points.length > 0){  
      for(let i = 0; i < CITY_DENSITY; i++){
        let pt = this.city_points.pop()
        if(!pt) { continue; }
        let new_node = new Node(pt.x, pt.y);
        this.graph.add_node(new_node);
      }
      console.log("Adding city points", "Points left:", this.city_points.length);
      this.graph = this.graph.relative_neighbours();

      this.refine_roads();
    }
  }

  refine_roads(){
    while(true){
      let longest_edge = this.graph.longest_edge();
      if(!longest_edge || longest_edge.distance < RD) { break; }
      let a = longest_edge.start;
      let b = longest_edge.end;

      let perc = random(0.3, 0.7);
      let mid = p5.Vector.lerp(a.position, b.position, perc);


      let noiseAngle = noise(mid.x * RSF, mid.y * RSF) * TWO_PI;
      let curvedOffset = p5.Vector.fromAngle(noiseAngle).mult(RM);
      mid.add(curvedOffset);

      let new_node = new Node(mid.x, mid.y);
      this.graph.remove_edge(longest_edge);
      this.graph.add_edge(new Edge(a, new_node));
      this.graph.add_edge(new Edge(new_node, b));
      this.graph = this.graph.relative_neighbours();
    }
  }

  create_roads_in_order(){
    this.graph.create_chains()
    this.road_lines = []; 
    this.roads = [];
    let potential_roads = this.graph.order_chains()
    this.unioned_roads = [];

    for(let chain of potential_roads){
      // remove dangling roads
      let start = chain[0];
      let end = chain[chain.length - 1];
      let start_connections = this.graph.find_edges(start.id).length
      let end_connections = this.graph.find_edges(end.id).length
      let start_onscreen = this.onscreen(start.position); 
      let end_onscreen = this.onscreen(end.position);
      if(start_onscreen && start_connections < 2 ) { continue; }
      if(end_onscreen && end_connections < 2 ) { continue; }
      
      let points = []

      for(let node of chain) {
        points.push(node.position);
      }
      
      let polyline = new Polyline(points, false).to_bezier(60)
      let clipped_polyline = polyline.clip(this.city_limits)
      if(!clipped_polyline || clipped_polyline.length < 1) { continue; }
      let final_line = clipped_polyline[0];
      if(final_line.points.length < 2) { 
        console.warn("Final line has less than 2 points, skipping", polyline);
        final_line = polyline;
      }
      // clipped_polyline = clipped_polyline[0]
      console.log("Creating road with", final_line, "points");

      this.road_lines.push(final_line);
      this.minor_road_lines.push(final_line);

      let road = final_line.to_polygon(MINOR_ROAD);
      this.roads.push(road);
      this.minor_roads.push(road);

      if(this.roads.length === 1){
        this.unioned_roads = road;
      } else if(this.roads.length > 1){
        this.unioned_roads = this.unioned_roads.union(road)[0];
      }

    }
  }


  set_city_limits(){
    let top_left = createVector(BW + MBW, BW + MBW);
    let bottom_right = createVector(W + BW + MBW, H + BW + MBW);
    let top_right = createVector(W + BW + MBW, BW + MBW);
    let bottom_left = createVector(BW + MBW, H + BW + MBW);
    let points = [top_left, top_right, bottom_right, bottom_left];
    this.city_limits = new MultiPolygon(points, 'countryside');
  }
    
  create_lots(){
    this.sectors = this.city_limits.difference(this.unioned_roads);
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

    results = shuffle(results)
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
   
    if(area > CIVIC && area < MAX_LOT_SIZE && random(1) < CIVIC_PROBABILITY && counter > 0){
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

    if (!this.test_thinness(pieces)) { return [polygon]; }

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
      } else if(edge_length > MINOR_ROAD_LENGTH) {
        this.minor_road_lines.push(fitted_street);
      } else {
        this.street_road_lines.push(fitted_street);
      }
    }
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

  test_thinness(pieces){
    if (pieces.length === 0) { return false }
    
    let valid = true;
    for (let piece of pieces) {
      let bounding_box_area = piece.bounds_area();
      let area = piece.area();
      let is_thin = area / bounding_box_area < THINNESS_THRESHOLD;
      if (is_thin) {
        valid = false;
        break;
      }
    }
    return valid
  }

  draw(){
    push();
      noFill();
      let light_pen = color(0,0,0,20);
      stroke(light_pen);
      rectMode(CENTER)

      rect(FW/2, FH/2, FW, FH);
      draw_grid(DPI/4);

      // fill(255,0,0)
      // for(let f of this.foci){
      //   circle(f.x, f.y, 10);
      // }

      noFill();
      stroke(0,0,255)

      // circle(this.focus.x, this.focus.y, CITY_RADIUS * 2);
      // for(let f of this.secondary_foci){
      //   circle(f.x, f.y, CITY_RADIUS);
      // }

      stroke(255)

      noFill();
      this.bounding_box.draw();
      // this.graph.draw();
      noFill();
      stroke(0)
      // this.graph.draw_edges();
      // this.graph.draw_chains();
      // this.graph.draw_nodes();

      // for(let r of this.unioned_roads){
      //   r.draw();
      // }

      
    pop();
  }

  
}








