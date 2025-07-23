
////////////////////////////////////////////////////////////////
// SCENE CREATION
const THINNESS_THRESHOLD = 0.26;
const SECONDARY_DENSITY = 13;
const CITY_DENSITY = 5;
const CITY_RADIUS = 100;
const RSF = 0.001
const RM = 9
const RD = 40
const RFOCI = 50

const SCENE_INIT = 0;
const SCENE_ADDING_CITIES = 10;
const SCENE_GROWING_CITIES = 20;
const SCENE_CREATE_ROADS = 30;
const SCENE_CREATE_LOTS = 40;
const SCENE_SUBDIVIDE_LOTS = 50;
const SCENE_PREPARE_COFFERS = 60;
const SCENE_CREATE_COFFERS = 70;
const SCENE_COLOUR_COFFERS = 71;
const SCENE_UPDATE_COFFERS = 80;
const SCENE_COMPLETE = 90;

class Scene {
  constructor(){
    this.bounding_box = new Oblong(MBW+BW, MBW+BW, W, H)
    this.foci =  [];
    this.secondary_foci = [];
    this.offscreen_foci = [];
    this.focus = this.foci[0] 
    this.points = [];
    this.polylines = [];
    this.lines = []
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
    this.farms = [];
    this.state = SCENE_INIT;
    this.current_coffer_id = 0;
  }

  initialize(){
    if(this.state != SCENE_INIT){ return; }
    console.log("-----------------------------")
    
    this.set_city_limits()
    this.create_foci();
    this.create_graph();

    this.state = SCENE_ADDING_CITIES;
    console.log("Points to add:", this.points_to_add.length);
    console.log("Points to grow:", this.points_to_grow.length);
    console.log("-----------------------------")
    console.log("STARTING CALC")

  } 

  construct(){
    this.initialize()
    this.add_points()
    this.grow_cities();
    this.create_roads_in_order();
    this.create_lots();
    this.subdivide_lots();
    this.prepare_coffers();
    this.create_coffers();
    this.colour_coffers();
    this.update_coffers();
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
    
    let a = createVector(FW/2 + random(-RFOCI, RFOCI), 0);
    let b = createVector(FW/2 + random(-RFOCI, RFOCI), FH);
    let c = createVector(0, FH/2 + random(-RFOCI, RFOCI));
    let d = createVector(FW, FH/2 + random(-RFOCI, RFOCI));

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

    this.offscreen_foci.push(ra);
    this.offscreen_foci.push(rb);
    this.offscreen_foci.push(rc);
    this.offscreen_foci.push(rd);

    this.foci.push(ra);
    this.foci.push(ra);
    this.foci.push(ra);
    this.foci.push(ra);

    // this.secondary_density  = random(3, SECONDARY_DENSITY);
    this.secondary_density = SECONDARY_DENSITY;
    
    while(this.secondary_foci.length < this.secondary_density){
      let rra = createVector(random(W) + BW + MBW, random(H) + BW + MBW);
      let valid = true
      let all_points = this.foci.concat(this.offscreen_foci).concat(this.secondary_foci);
      for(let f of all_points){
        let d = p5.Vector.dist(rra, f);
        if(d < CITY_RADIUS + 20){
          valid = false;
          break;
        }
      }
      if(valid){ 
        this.secondary_foci.push(rra);
      }
    }

    this.city_points = []; 

    let city_density = random(CITY_DENSITY*4)
    let cities_added = 0;
    while(cities_added < city_density){
      let x = randomGaussian(this.focus.x, CITY_RADIUS/2);
      let y = randomGaussian(this.focus.y, CITY_RADIUS/2);
      let p = createVector(x, y);
      let valid = true;
      
      for(let other of this.city_points){
        let d = p5.Vector.dist(p, other)
        if(d < RD/2){
          valid = false;
          break;
        }
      }
      if(valid){ 
        this.city_points.push(p);
        cities_added++;
      }
      
    }

    for(let f of this.secondary_foci){
      if(this.offscreen(f)){ continue; }
      city_density = random(1, CITY_DENSITY)
      let cities_added = 0
      while(cities_added < city_density){
        let x = randomGaussian(f.x, CITY_RADIUS/2);
        let y = randomGaussian(f.y, CITY_RADIUS/2);
        let p = createVector(x, y);
        let valid = true;

        for(let other of this.city_points){
          let d = p5.Vector.dist(p, other)
          if(d < 20){
            valid = false;
            break;
          }
        }
        if(valid){ 
          this.city_points.push(p);
          cities_added++;
        }
      }
    }

    this.points_to_add = this.secondary_foci.slice();
    this.points_to_grow = this.city_points.slice();

    console.log("Cities:", this.points_to_add.length);
    console.log("City points:", this.points_to_grow.length);
  }

  create_graph(){
    console.log("Creating graph")
    let intercity_nodes = []; 
    for(let i = 0; i < this.foci.length; i++){
      let f = this.foci[i];
      let node = new Node(f.x, f.y, i);
      intercity_nodes.push(node);
    }
    this.graph = new Graph([], intercity_nodes).relative_neighbours();
    this.major_roads = this.graph.find_chains()
    
    
  }

  add_points(){
    if(this.state != SCENE_ADDING_CITIES){ return }
    if(this.points_to_add.length == 0){ 
      console.log("Finished adding points to graph");
      this.state = SCENE_GROWING_CITIES;  
      return 
    }

    let pt = this.points_to_add.pop()
    let new_node = new Node(pt.x, pt.y);
    this.graph.add_node(new_node);
    this.graph = this.graph.relative_neighbours();

    this.refine_roads();
  }

  add_full_line(a, b, at = createVector(0, 0), bt = createVector(0, 0)){
    let l = this.full_line(a.copy().add(at), b.copy().add(bt));
    this.offscreen_lines.push(l);
  }
  
  full_line(a, b){
    // y = mx + c, m = dy / dx
    let d = p5.Vector.sub(b, a);
  
    if(d.x === 0) { 
      // console.warn("Vertical line detected, using x-coordinate for line.");
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

  concentric_circle(v, r, w, n){
    let pieces = [];
    console.log("Concentric circle")
  
    for(let i = 0; i <= n; i++){
      let dA = i * w
      if(dA >= r) { break;}
      let type = i < n ? 'decoration' : 'town';
  
      let polyCircle = new RegularPolygon(
        v.x, v.y,
        r - dA, r - dA, 100, type
      );

      
      let trimmed_circle = polyCircle.intersection(this.city_limits);
      if(trimmed_circle.length == 0){ continue; }
      let final = trimmed_circle[0]
      final.type = type;
      final.parent = null;
      final.ancestor_ids = [];
      pieces.push(final);
    }
  
    return pieces
  }

  grow_cities(){
    if(this.state != SCENE_GROWING_CITIES){ return }
    if(this.points_to_grow.length == 0){ 
      console.log("Finished growing cities");
      this.state = SCENE_CREATE_ROADS; 
      return 
    }

    for(let i = 0; i < CITY_DENSITY; i++){
      let pt = this.points_to_grow.pop()
      if(!pt) { continue; }
      let new_node = new Node(pt.x, pt.y);
      this.graph.add_node(new_node);
    }
    this.graph = this.graph.relative_neighbours();

    this.refine_roads();
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
    if(this.state != SCENE_CREATE_ROADS){ return }
    console.log("Creating roads in order")
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
   

      this.road_lines.push(polyline);
      this.minor_road_lines.push(polyline);

      let road = polyline.to_polygon(MINOR_ROAD, MINOR_ROAD, 'road');
      this.roads.push(road);
      this.minor_roads.push(road);

      if(this.roads.length === 1){
        this.unioned_roads = road;
      } else if(this.roads.length > 1){
        this.unioned_roads = this.unioned_roads.first_union(road);
      }

    }

    this.state = SCENE_CREATE_LOTS;
  }

  set_city_limits(){
    let top_left = createVector(BW + MBW, BW + MBW);
    let bottom_right = createVector(W + BW + MBW, H + BW + MBW);
    let top_right = createVector(W + BW + MBW, BW + MBW);
    let bottom_left = createVector(BW + MBW, H + BW + MBW);
    let points = [top_left, top_right, bottom_right, bottom_left];
    this.city_limits = new MultiPolygon(points, 'countryside');
  }

  divide_city_limits(){
    this.regions = [];
    let bottom_half_right = createVector(W/2 + BW + MBW, H + BW + MBW);
    let top_half_right = createVector(W/2 + BW + MBW, BW + MBW);
    
    let l1 =  this.full_line(top_half_right, bottom_half_right);
    let l2 = this.full_line(this.secondary_foci[0], this.secondary_foci[1]);
    let l3 = this.full_line(this.secondary_foci[2], this.secondary_foci[3]);
    let l4 = this.full_line(this.secondary_foci[4], this.secondary_foci[5]);
    let l5 = this.full_line(this.focus, this.secondary_foci[0]);
    let l6 = this.full_line(this.focus, this.secondary_foci[2]);
    let l7 = this.full_line(this.focus, this.secondary_foci[4]);
    this.lines = [l1, l2,  l3, l4, l5, l6, l7];

    let pieces = [this.city_limits]
    for(let l of this.lines){
      let new_pieces = [];

      for(let piece of pieces){
        let results = piece.split(l);
        for(let r of results){
          new_pieces.push(r);
        }
      }
      pieces = new_pieces;
    }

    this.regions = pieces;

  }

  create_villages(){
    this.villages = []

    // First punch out the villages from the city limits
    // This helps to reduce the size of the bitmask for disjointing

    for(let i = 1; i < SECONDARY_DENSITY; i++){
      let v = this.secondary_foci[i];
      let type = 'city'
      let r = CITY_RADIUS * random(0.5, 1);
      let village = new RegularPolygon(
        v.x, v.y,
        r, r, 100, type
      );
      let trimmed_village = village.intersection(this.city_limits);
      if(trimmed_village.length == 0){ continue; }
      this.villages.push(trimmed_village[0]);
    }

    this.unioned_villages = this.villages[0]

    for(let v of this.villages){
      this.unioned_villages = this.unioned_villages.first_union(v);
    }
  }
    
  create_lots(){
    if(this.state != SCENE_CREATE_LOTS){ return }
    console.log("Creating lots")

    this.sectors = [];

    this.divide_city_limits()
    this.create_villages()

    let city = this.concentric_circle(this.focus, CITY_RADIUS*2.5, 30, 6);

    let town = this.concentric_circle(this.secondary_foci[0], CITY_RADIUS*1.5, 30, 3);
    let village = this.concentric_circle(this.secondary_foci[1], CITY_RADIUS, 30, 2);
    // let village2 = this.concentric_circle(this.secondary_foci[2], CITY_RADIUS*2, 20, 4);

    for(let region of this.regions){
      let trimed_region = region;
      for(let village of this.villages){
        let new_trimed_region = trimed_region.difference(village);
        if(new_trimed_region.length == 0){ continue; }
        trimed_region = new_trimed_region[0];
      
      }

      trimed_region = trimed_region.difference(this.unioned_roads);
    
      let new_city = []
      for(let ring of city){
        let rg_diff = region.difference(ring)
        if(rg_diff.length == 0){ continue; }
        let new_ring = rg_diff[0];
        let diff = new_ring.difference(this.unioned_villages);
        for(let d of diff){
          new_city.push(d);
        }
      }
      
      let sectors = trimed_region.concat(new_city)
      // Some combinatins will result in a very large bitmask for disjointin.  Ensure that this mask will be under 26
      if(sectors.length + town.length < 20) { sectors = sectors.concat(town)}
      if(sectors.length + village.length < 20) { sectors = sectors.concat(village)}
      // if(sectors.length + village2.length < 20) { sectors = sectors.concat(village2)}

      let pieces = multi_disjoint(sectors);

      this.sectors.push(...pieces);
    }

    
    // Now the villages back in
    let final_villages = []
    for(let v of this.villages){
      let diff = v.difference(this.unioned_roads);
      for(let d of diff){
        final_villages.push(d)
      }
    }

    this.villages = final_villages;


    this.state = SCENE_SUBDIVIDE_LOTS;
    console.log("Subdividing lots")

  }


  subdivide_lots(){
    if(this.state != SCENE_SUBDIVIDE_LOTS){ return }
    if(this.sectors.length == 0){ this.state = SCENE_PREPARE_COFFERS; return; }


    while(this.sectors.length > 0){
      let p = this.sectors.pop();
    
      this.add_coffer(p);
      
    }

    while(this.villages.length > 0){
      let p = this.villages.pop();
    
      let centroid = p.bounds_centroid();
      let nearest = this.foci[0];
      let nearest_dist = Infinity;
      for (let f of this.secondary_foci) {
        let d = p5.Vector.dist(centroid, f);
        if (d < nearest_dist) {
          nearest_dist = d;
          nearest = f;
        }
      }

      let type = 'town';
      if(p.area() > COUNTRYSIZE_SIZE || (nearest_dist > CITY_RADIUS/2)) { 
        type = 'countryside';
      } 

      if(type == 'countryside'){
        this.add_coffer(p, type);
      } else {
        let results = this.subdivide(p, MIN_LOT_SIZE);
        for(let r of results){
          this.lots.push(r);
        }
      }
    }


  }
  

  add_coffer(polygon, type) {
    if(polygon.area() < 10) { return;}
    for(let other of coffers){
      if(other.polygon.has_same_points(polygon)){ return; }
    }

    let centroid = polygon.bounds_centroid();
    let nearest = this.foci[0];
    let nearest_dist = Infinity;
    for (let f of this.secondary_foci) {
      let d = p5.Vector.dist(centroid, f);
      if (d < nearest_dist) {
        nearest_dist = d;
        nearest = f;
      }
    }

    let final_type = 'town';
    if(polygon.area() > COUNTRYSIZE_SIZE || (nearest_dist > CITY_RADIUS/2)) { 
      final_type = 'countryside';
    } 

    if(!type) { type = final_type; }

    let coffer = new Coffer(polygon, nearest, type);
    coffer_grid.add(coffer);
    coffers.push(coffer);
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

  
  prepare_coffers(){
    if(this.state != SCENE_PREPARE_COFFERS){ return }
    console.log("Preparing coffers")
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

    this.potential_coffers = shuffle(results)
    console.log("Potential coffers:", this.potential_coffers.length);
    this.state = SCENE_CREATE_COFFERS;
  }

  create_coffers(){
    if(this.state != SCENE_CREATE_COFFERS){ return }

    while(this.potential_coffers.length > 0){
      let p = this.potential_coffers.pop();
      
      let centroid = p.centroid();
      let nearest = this.foci[0];
      let nearest_dist = Infinity;
      for (let f of this.secondary_foci) {
        let d = p5.Vector.dist(centroid, f);
        if (d < nearest_dist) {
          nearest_dist = d;
          nearest = f;
        }
      }
      this.add_coffer(p, 'town');
    }

    console.log("Finished creating coffers");
    console.log("Updating coffers")
    this.state = SCENE_COLOUR_COFFERS; 
    return; 
  }

  colour_coffers(){
    if(this.state != SCENE_COLOUR_COFFERS){ return } 

    console.log("Colouring coffers", coffers.length);
    let adjacency_map = create_adjacency_map(coffers)
    console.log("Adjacency map created", adjacency_map);
    let shared_map = find_shared_vertices(coffers, adjacency_map);
    console.log("Shared vertices map created", shared_map);
    let colour_map = full_recursive_colour_map(adjacency_map, shared_map, coffers);
    console.log("Colour map created", colour_map);

    for(let i = 0; i < colour_map.length; i++){
      let coffer = coffers[i];
      let colour = colour_map[i];
      if(!colour){ continue; }
      coffer.colour = colour
      coffer.create_fill_object();

    }

    console.log("Coffers coloured", coffers.length);
    this.state = SCENE_UPDATE_COFFERS;

  }

  update_coffers(){
    if(this.state != SCENE_UPDATE_COFFERS){ return }

    let coffer = coffers[this.current_coffer_id];
    
    let active = coffer.update();
    let active_coffers = coffers.filter(c => c.active); 

    if(active < 1){ 
      
      for(let c of active_coffers){
        if(c.id > this.current_coffer_id){
          this.current_coffer_id = c.id;
          console.log("Updating coffer", this.current_coffer_id, "active:", active);

          break;
        }
      }
    }
    
    if(active_coffers.length == 0 || this.current_coffer_id >= coffers.length){
      console.log("Finished updating coffers");
      this.state = SCENE_COMPLETE; 
    }
  }

  draw(){
    push();
      noFill();
      let light_pen = color(0,0,0,20);
      stroke(light_pen);
      rectMode(CENTER)

      rect(FW/2, FH/2, FW, FH);
      draw_grid(DPI/4);

      noFill();
      this.bounding_box.draw();

      if(this.state <= SCENE_SUBDIVIDE_LOTS ){
        this.graph.draw_edges();
        this.graph.draw_chains();
        this.graph.draw_nodes();

        for(let f of this.foci){
          circle(f.x, f.y, 10);
        }


        circle(this.focus.x, this.focus.y, CITY_RADIUS * 2);
        for(let f of this.secondary_foci){
          circle(f.x, f.y, CITY_RADIUS);
        }

        
        for(let l of this.lines){
          l.draw();
        }

      }


      stroke(palette.black);

      for(let sector of this.sectors){
        let centroid = sector.bounds_centroid();
        circle(centroid.x, centroid.y, 5);
        sector.draw();
      }

      for(let lot of this.lots){
        lot.draw();
      }

      for(let farm of this.farms){
        farm.draw();
      }

      for(let coffer of coffers){
        // coffer.draw_coloured()
        coffer.draw();
      }

      strokeWeight(2);
      for(let r of scene.minor_road_lines){
        r.draw()
      }
      strokeWeight(6);
      for(let r of scene.major_road_lines){
        r.draw()
      }
      strokeWeight(10);
      for(let r of scene.intercity_road_lines){
        r.draw()
    }

      
    pop();
  }

  
}








