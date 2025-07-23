// PLAN

// IMPROVEMENTS / BUG FIXES
// Hatching missing lines bug


// Set the fill type of each polygon based on its area
let SMALL =  [ 'downwards', 'upwards', 'dots', 'large-dots', 'large-vertical-dashes', 'large-horizontal-dashes', 'trees', 'park' ]
let TOWN = [ 'terraces', 'park', 'civic', 'trees'] 
let TOWN_WEIGHTS = [100, 1, 20, 3];
let LARGE =  [  'pips', 'large-dots', 'contour-upwards', 'contour-downwards' ];  
let COUNTRY = [ 'large-dots', 'contour-upwards', 'contour-downwards', 'boustrophedon', 'vertical-dashes', 'horizontal-dashes', 'dots'];
let COUNTRY_WEIGHTS = [1, 100, 100, 20, 50, 50, 10,];
let colours = ['brown', 'yellow', 'grey', 'orange', 'blue', 'red', 'green', 'purple',  'cyan', 'magenta', 'white', 'lightblue', 'lightgreen', 'lightgrey', 'lightyellow', 'lightorange', 'lightpurple', 'lightcyan', 'lightmagenta']; 
let extended_colours = ['blue', 'red', 'green', 'purple',  'cyan', 'magenta'];
let all_colours = [...colours, ...extended_colours];
let MAX_CIVIC = 20;
let MAX_AGENTS = 5;
let CENTRE_DIST = 100;
let total_civic_count = 0;  
let total_agent_count = 0;
let civil_statistics = {
  blank: 0, downwards: 0, upwards: 0, dots: 0, 
  'large-dots': 0, 'vertical-dashes': 0, 'horizontal-dashes': 0, 
  'large-vertical-dashes': 0, 'large-horizontal-dashes': 0,
  trees: 0, park: 0, civic: 0, houses: 0  
}

let coffer_grid = new Grid()

class Coffer {
  static id = 0;
  constructor(polygon, focus, type) {
    this.id = Coffer.id++;
    this.polygon = polygon;
    this.focus = focus;
    this.ancestor_ids = polygon.ancestor_ids || [];
    this.fill_type = null;
    this.type = type || 'countryside'
    this.fill_object = null;
    this.colour = null;
    this.active = true;
    this.position = this.polygon.bounds_centroid(); 
    this.col = Math.floor(this.position.x / CELL_SIZE);
    this.row = Math.floor(this.position.y / CELL_SIZE);
    this.error_message = null;  
    this.area = this.polygon.area();
    this.centroid = this.polygon.bounds_centroid();
  }

  neighbours() {
    return coffer_grid.neighbours(this.col, this.row);
  }

  create_fill_object(){
    if(!this.polygon || !this.focus || !this.colour) { return; } 

    let area = this.polygon.area();
    if(!this.error_message) { this.fill_type = 'radial'; }

    if(this.type == 'countryside') {
      if(area > 20000) {
        if (this.colour == 'brown') {
          this.fill_type = 'pips' 
        } else if (this.colour == 'yellow') {
          this.fill_type = 'contour-upwards';  
        } else if (this.colour == 'pink') {
          this.fill_type = 'contour-downwards';
        } else if (this.colour == 'grey') {
          this.fill_type = 'radial';
        } else if (this.colour == 'orange') {
          this.fill_type = 'concentric';
        }
      } else if (area > 2000) {
        if (this.colour == 'brown') {
          this.fill_type = 'radial'
        } else if (this.colour == 'yellow') {
            this.fill_type = 'pips';  
        } else if (this.colour == 'pink') {
          this.fill_type = 'radial';
         } else if (this.colour == 'grey') {
          if(total_agent_count < MAX_AGENTS) {this.fill_type = 'agent-beans'}
         } else if (this.colour == 'orange') {
          if(total_agent_count < MAX_AGENTS) { this.fill_type = 'agent-circular' }
        } else if (this.colour == 'blue') {
          this.fill_type = 'concentric';
        }
      } else { 
        if (this.colour == 'brown') {
          this.fill_type = 'downwards' 
        } else if (this.colour == 'yellow') {
          // this.fill_type = 'large-vertical-dashes';  
        } else if (this.colour == 'grey') {
          this.fill_type = 'upwards';
        } 
      }
    } else {
      if (this.colour == 'brown') {
        this.fill_type = 'downwards'
      } else if (this.colour == 'yellow') {
        this.fill_type = 'large-vertical-dashes';  
      } else if (this.colour == 'grey') {
        this.fill_type = 'upwards';
      } else if (this.colour == 'pink'){
        this.fill_type = 'radial'
      }
    }

    // let centroid = this.polygon.centroid();
    // let d = p5.Vector.dist(centroid, this.focus);
    // let near_centre = random() < 1 - (d / CENTRE_DIST)
    // let longest_edge = this.polygon.find_longest_edge()[0];  
    // let le_dir = p5.Vector.sub(longest_edge.end, longest_edge.start).heading();

    // this.fill_type = 'blank'; // Default fill type
    // if(this.type == 'countryside') {
    //   this.fill_type = this.weighted_random(COUNTRY, COUNTRY_WEIGHTS);
    // } else if(this.type == 'town') {
    //   this.fill_type = this.weighted_random(TOWN, TOWN_WEIGHTS);
    // }

    // // if(d < CENTRE_DIST / 2 && this.is_trapezoid()) { this.fill_type = 'terraces'}
    // if(d < CENTRE_DIST && near_centre && this.is_trapezoid()) { this.fill_type = 'terraces'}
    // if(area > 1500 && this.fill_type == 'terraces') { this.fill_type = 'civic' }
    // if(d < CENTRE_DIST && area > CIVIC && this.is_trapezoid() && this.fill_type == 'blank'){ this.fill_type = random(TOWN)}
    // if(d < CENTRE_DIST && area > CIVIC && this.is_not_curved() && this.fill_type == 'blank' && total_civic_count < MAX_CIVIC){ this.fill_type = 'civic'}
    // if(this.fill_type == 'civic') { total_civic_count++ }


    // if(d > CENTRE_DIST * 1.5|| area > MAX_LOT_SIZE){ this.fill_type = this.weighted_random(COUNTRY, COUNTRY_WEIGHTS)}
    // if(d < 200 && near_centre ){ this.fill_type = 'houses'}
    // if(area < 200 && random() < 0.1) { this.fill_type = random(SMALL) }

    // if(this.fill_type == 'civic' && this.polygon.outer.length != 4) { this.fill_type = 'houses' }
    // if(this.fill_type == 'park' &&  this.polygon.outer.length != 4) { this.fill_type = 'houses'}
    // if(this.fill_type == 'trees' && this.polygon.outer.length != 4) { this.fill_type = 'houses' }

    // if(this.fill_type == 'trees' && area > 3000) { this.fill_type = 'houses' }

    // if(this.fill_type == 'civic' && (area < 500)) { this.fill_type = 'houses' }
    // if(this.fill_type == 'civic' && total_civic_count >= MAX_CIVIC) { this.fill_type = 'houses' }
    // if(this.fill_type == 'civic') { total_civic_count++ }

    // if(area < 100) { this.fill_type = 'downwards'}
    if(this.is_thin()) { this.fill_type = 'blank' }
    if(this.error_message == "No neighbours") { this.fill_type = 'blank' }
    // if(this.is_triangular()) { this.fill_type = this.set_triangular_hatch()}

    if(this.fill_type == 'boustrophedon'){
      if (abs(le_dir) < 0) {
        this.fill_type = 'blank'
      } else if (abs(le_dir - PI) < 0 || abs(le_dir + PI) < 0){
        this.fill_type = 'blank'
      }
    }
    
    // if(this.type == 'countryside' && total_agent_count < MAX_AGENTS && area > 12000 && area < 40000) { this.fill_type = 'agent-circular' }
    // if(area >= 60000) { this.fill_type = 'pips' }

    if(this.fill_type == 'agent-circular'){
      total_agent_count++;
      let minSize = int(random(7, 15))
      let maxSize = minSize*2
      let avgSize = (minSize + maxSize) / 2;
      let n = floor(this.polygon.bounds_area() / (avgSize * avgSize));
      let options = { noiseScale: 0.005, a: minSize, sf: 0.5, squareness: 0.5 };
      console.log('Creating agent circular fill for polygon', options);

      this.fill_object = new SuperEllipseGroup(n, this.polygon.bounds_centroid(), 10, this.polygon, options);
      this.fill_object.initialize();
    }

    if(this.fill_type == 'agent-beans'){
      total_agent_count++;
      let minSize = int(random(6, 12))
      let maxSize = minSize*2
      let avgSize = (minSize + maxSize) / 2;
      let n = floor(this.polygon.bounds_area() / (avgSize * avgSize));
      let options = { noiseScale: 0.005, a: minSize, sf: 0.8, squareness: 0.9 };
      console.log('Creating BEANS fill for polygon', options);

      this.fill_object = new SuperEllipseGroup(n, this.polygon.bounds_centroid(), 10, this.polygon, options);
      this.fill_object.initialize();
    }

    if(this.fill_type == 'pips') {
      console.log('Creating pips fill for polygon', this.id);
      this.fill_object = new Pips(this.polygon);
      this.fill_object.construct();
    }

    if(this.fill_type == 'radial') {
      console.log('Creating radial fill for polygon', this.id);
      let ndiv = random([48,96,128,128, 192, 256])
      let d = p5.Vector.dist(this.centroid, scene.focus);
      let centre = d < CITY_RADIUS * 4 ? scene.focus :  scene.secondary_foci[0]
      this.fill_object = new Radial(this.polygon, centre, ndiv, CITY_RADIUS * 4, CITY_RADIUS );
      this.fill_object.construct();
      this.active = false;
    }

    if(this.fill_type == 'concentric') {
      console.log('Creating radial fill for polygon', this.id);
      let d = p5.Vector.dist(this.centroid, scene.focus);
      let centre = d < CITY_RADIUS * 4 ? scene.focus :  scene.secondary_foci[0]
      this.fill_object = new Radial(this.polygon, centre, CITY_RADIUS * 4, 10, 10);
      this.fill_object.construct();
      this.active = false;
    }
    

    if(this.fill_type == 'park') {
      this.fill_object = new Park(this.polygon, 0.2, 0);
      this.fill_object.construct();
      this.active = false;
    }

    if(this.fill_type == 'trees') {
      this.fill_object = new Trees(this.polygon);
      this.fill_object.construct();
      this.active = false;
    }
    
    
    if(this.fill_type == 'civic') {
      this.fill_object = new Civic(this.polygon);
      this.fill_object.construct();
      this.active = false;
      
    }

    if(this.fill_type == 'terraces'){
      this.fill_object = new Terrace(this.polygon.scale(0.6));
      this.fill_object.construct();
      this.active = false;
    }

    if(this.fill_type == 'contour-upwards' ||
       this.fill_type == 'contour-downwards') {
      let direction = this.fill_type.split('-')[1];
      if(this.is_triangular()) { direction = this.set_triangular_hatch()}
      let sf = random(0.0075, 0.02)

      this.fill_object = new Contour(this.polygon, direction, sf);
      this.fill_object.construct();
      this.active = false;
    }

    if(this.fill_type == 'boustrophedon') {
      console.log('Boustrophedon fill for polygon', this.id);
      let longest_edge = this.polygon.find_longest_edge()[0];  
      let le_dir = p5.Vector.sub(longest_edge.end, longest_edge.start).heading();
      let direction = 'downwards';
      let tolerance = 0.01;

      if (abs(le_dir - 0) < tolerance) {
        direction = 'vertical';
      } else if (abs(le_dir - PI) < tolerance || abs(le_dir + PI) < tolerance){
        direction = 'horizontal';
      } else if (abs(le_dir - HALF_PI) < tolerance) {
        direction = 'upwards';
      } else if (abs(le_dir + HALF_PI) < tolerance) {
        direction = 'downwards';
      }
      console.log(longest_edge, direction)
      this.fill_object = new Boustrophedon(this.polygon, direction, 7, 0.7);
      this.fill_object.construct();
      this.active = false;
    }

    if(this.fill_type == 'large-vertical-dashes' || 
       this.fill_type == 'large-horizontal-dashes') {
      this.fill_object = new Hatching(this.polygon, 7, 9, 3);
    }

    if(this.fill_type == 'vertical-dashes' || 
      this.fill_type == 'horizontal-dashes') {
      this.fill_object = new Hatching(this.polygon, 5, 5, 3);
    }

    if(this.fill_type == 'vertical-dashes' ||
       this.fill_type == 'large-vertical-dashes'){
      this.fill_object.hatch('vertical');
      this.active = false;
    }

    if(this.fill_type == 'horizontal-dashes' ||
        this.fill_type == 'large-horizontal-dashes'){
      this.fill_object.hatch('horizontal');
      this.active = false;
    }

    if(this.fill_type == 'downwards' || this.fill_type == 'upwards') {
      this.fill_object = new Hatching(this.polygon, 5);
      this.fill_object.hatch(this.fill_type);
      this.active = false;
    }

    if(!this.fill_type || this.fill_type == 'blank') { this.active = false; }

    civil_statistics[this.fill_type]++;
  }

  is_thin(){
    let bounding_box_area = this.polygon.bounds_area();
    let area =  this.polygon.area();
    return area / bounding_box_area < THINNESS_THRESHOLD;
  }

  is_triangular(){
    return this.polygon.simplify().outer.length == 3
  }

  set_triangular_hatch(){
    let edge = this.polygon.find_longest_edge();
    let p1 = edge[0].start;
    let p2 = edge[edge.length - 1].end;
    let dir = p5.Vector.sub(p2, p1).normalize();
    let edge_angle = Math.atan2(dir.y, dir.x);
    if (edge_angle < 0) { edge_angle += TWO_PI; }
    if (edge_angle >= TWO_PI) { edge_angle -= TWO_PI; }

    return ((edge_angle > PI/2 && edge_angle < PI) || edge_angle > PI*1.95) ? 'downwards' : 'upwards';
  }

  is_quadrilateral(){
    return this.polygon.outer.length == 4
  }

  is_not_curved(){
    return this.polygon.outer.length < 10
  }

  is_rectangle(){
    if(!this.is_quadrilateral()) return false;
    let a = this.polygon.outer[0];
    let b = this.polygon.outer[1];
    let c = this.polygon.outer[2];
    let d = this.polygon.outer[3];
    return (a.x + c.x) / 2 == (b.x + d.x) / 2 && (a.y + c.y) / 2 == (b.y + d.y) / 2 &&
           a.angle_to(b) == Math.PI/2 && b.angle_to(c) == Math.PI/2;
  }

  is_trapezoid(tolerance){
    if(!this.is_quadrilateral()) return false;
    let [a, b, c, d] = this.polygon.segments[0];

    return a.parallel(c, tolerance) || b.parallel(d, tolerance) 
  }

  is_parallelogram(tolerance){ 
    if(!this.is_quadrilateral()) return false;
    let [a, b, c, d] = this.polygon.segments[0];

    return a.parallel(c, tolerance) && b.parallel(d, tolerance) 
  }

  is_rhombus(tolerance){ 
    if (!this.is_parallelogram(tolerance)) return false;
    let [a, b, c, d] = this.polygon.segments[0];

    return (a.length() - b.length() < tolerance) 
        && (b.length() - c.length() < tolerance) 
        && (c.length() - d.length() < tolerance)

  }

  is_kite(){
    if(!this.is_quadrilateral()) return false;
    let a = this.polygon.outer[0];
    let b = this.polygon.outer[1];
    let c = this.polygon.outer[2];
    let d = this.polygon.outer[3];
    return (a.x == b.x && c.x == d.x) || (a.y == b.y && c.y == d.y);
  }

  weighted_random(array, weights) {
    let total = weights.reduce((a, b) => a + b, 0);
    let r = random(total);
    for (let i = 0; i < array.length; i++) {
      if (r < weights[i]) return array[i];
      r -= weights[i];
    }
  }

  update(){
    if (!this.active) return 0;

    let active;
    try{ active = this.fill_object.update();} catch(error) { active = 0 }

    if(active < 1) {
      console.log(`Coffer ${this.id} finished with`, this.fill_type);
      this.active = false; 
    }

    return active;
  }
  
  draw() {
    // if(this.active) { fill(palette.background) } else { noFill() };
    push();
      fill(palette.background)
      this.polygon.draw();
      noFill();
      this.fill()
    pop();
  }

  draw_coloured(){
    push();
      if(this.colour && !this.fill_object) {
        fill(this.colour);
      } else { noFill(); }
      this.polygon.draw();
    pop();
  }

  fill(){
    push();
      if(this.fill_object) {
        this.fill_object.draw();
      }
    pop();
  }
}


function create_adjacency_map(coffers){
  let result = [];
  for(let i = 0; i < coffers.length; i++){
    if(result[i] === undefined) { result[i] = []; }
    let coffer = coffers[i];
    if(coffer.polygon.area() < 2) { continue; } 
    let neighbours = coffer.neighbours();
    for(let other of neighbours){
      if(other.polygon.area() < 2) { continue; } 
      let j = coffers.indexOf(other);
      if(j === i) continue; 
      if(!result[i].includes(j) && coffer.polygon.adjacent(other.polygon)){
        result[i].push(j);
        if(result[j] === undefined) { result[j] = []; }
        result[j].push(i); 
      }
    }
    
  }
  return result;
}

function find_shared_vertices(coffers, adjacency_map){
  let result = [];
  let tolerance = 1e-6; // Tolerance for vertex comparison
  for(let i = 0; i < coffers.length; i++){
    result[i] = [];
    let coffer = coffers[i];
    if(coffer.polygon.area() < 2) { continue; } 
    let neighbours = coffer.neighbours();

    for(let other of neighbours){
      if(other.polygon.area() < 2) { continue; } 
      let j = coffers.indexOf(other);
      if(j === i) continue; // Skip self
      if(adjacency_map[i].length == 0) { continue; } 
      if(adjacency_map[i].includes(j)) { continue; }
      let found = false;
      for(let s of coffer.polygon.segments[0]){
        for(let t of other.polygon.segments[0]){
          if(p5.Vector.dist(s.start, t.start) < tolerance || 
             p5.Vector.dist(s.start, t.end)   < tolerance || 
             p5.Vector.dist(s.end, t.start)   < tolerance || 
             p5.Vector.dist(s.end, t.end)     < tolerance){
            result[i].push(j);
            found = true; 
            break;
          }
        }
        if(found) { break; }
      }
    }
  }
  return result;
}

function recursive_colour_map(adjacency_map, shared_map, depth = 0, idx = 0, results = [], input_colours) {
  let early_exit = false;
  let coffer = coffers[idx];
  if (depth > 100) {
    console.log("Recursion depth exceeded for piece", idx);
    coffer.error_message = "Recursion depth exceeded";
    early_exit = true;
  }
  if (input_colours.length == 0) {
    console.log("No input colours available for piece", idx);
    coffer.error_message = "No colours";
    early_exit = true;
  }
  if(coffers[idx].polygon.area() < 2) {
    console.log("Piece", idx, "is too small to colour");
    coffer.error_message = "Too small";
    early_exit = true;
  }

  if (adjacency_map[idx].length == 0) {
    console.log("No neighbours for piece", idx);
    coffer.error_message = "No neighbours"
    early_exit = true;
  }
 

  if (early_exit) {
    results[idx] = 'pink'; // fallback
    return results;
  }

  if (results[idx] === undefined) {
    let neighbours = adjacency_map[idx];
    let unused = [...input_colours];

    for (let n of neighbours) {
      let colour = results[n];
      if (colour !== undefined) {
        unused = unused.filter(c => c !== colour);
      }
    }

    if (shared_map[idx].length > 0) {
      let shared_colours = shared_map[idx].map(s => results[s]).filter(c => c !== undefined);
      if (shared_colours.length > 0) {
        unused = unused.filter(c => !shared_colours.includes(c));
      }
    }

    if (unused.length > 0) {
      results[idx] = unused[0];
    } else {
      console.log("No colours left for", idx, "at depth", depth);
      results[idx] = 'pink'; // fallback
    }
  }

  if (shared_map[idx].length > 0) {
    for (let i of shared_map[idx]) {
      if (results[i] === undefined) {
        recursive_colour_map(adjacency_map, shared_map, depth + 1, i, results, input_colours);
      }
    }
  }

  return results;
}


function full_recursive_colour_map(adjacency_map, shared_map, final) {
  let results = [];
  // prefil some random colours
  // for(let j = 0; j < 10; j++){
  //   let ridx = int(random(final.length));
  //   let rc = random(extended_colours)
  //   console.log("Prefilling colour", ridx, rc);
  //   results[ridx] = rc;
  // }

  // final = final.sort((a, b) => b.polygon.area() - a.polygon.area()); // Ensure final is sorted

  for (let i = 0; i < final.length; i++) {
    if (results[i] === undefined) {
      recursive_colour_map(adjacency_map, shared_map, 0, i, results, colours );
    }
  }

  return results;
}







