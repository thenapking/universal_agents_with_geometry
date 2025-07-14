// PLAN

// IMPROVEMENTS / BUG FIXES
// Hatching missing lines bug


// Set the fill type of each polygon based on its area
let SMALL =  [ 'blank', 'downwards', 'upwards', 'dots', 'large-dots', 'large-vertical-dashes', 'large-horizontal-dashes', 'trees', 'park' ]
let TOWN = [ 'blank', 'park', 'civic', 'trees'] 
let LARGE =  [ 'blank', 'large-dots', 'large-vertical-dashes', 'large-horizontal-dashes' ];  
let COUNTRY = [ 'blank', 'large-dots', 'vertical-dashes', 'horizontal-dashes',  'dots'];
let colours = ['brown', 'yellow', 'grey', 'pink', 'orange'] 
let extended_colours = ['blue', 'red', 'green', 'purple',  'cyan', 'magenta'];
let all_colours = [...colours, ...extended_colours];
let MAX_CIVIC = 20;
let total_civic_count = 0;  
let civil_statistics = {
  blank: 0, downwards: 0, upwards: 0, dots: 0, 
  'large-dots': 0, 'vertical-dashes': 0, 'horizontal-dashes': 0, 
  'large-vertical-dashes': 0, 'large-horizontal-dashes': 0,
  trees: 0, park: 0, civic: 0, houses: 0  
}
class Coffer {
  static id = 0;
  constructor(polygon, focus, colour) {
    this.id = Coffer.id++;
    this.polygon = polygon;
    this.focus = focus;
    this.ancestor_ids = polygon.ancestor_ids || [];
    this.fill_type = null;
    this.colour = colour
    this.fill_object = null;
    this.create_fill_object();
  }

  create_fill_object(){
    let centroid = this.polygon.centroid();
    let area = this.polygon.area();
    let d = p5.Vector.dist(centroid, this.focus);
    let near_centre = random() < 1 - (d / 200)

    this.fill_type = 'blank'
    if(d < 100 && this.is_trapezoid()) { this.fill_type = 'houses'}
    if(d < 200 && near_centre && this.is_trapezoid()) { this.fill_type = 'houses'}
    if(d < 200 && area > CIVIC && this.is_trapezoid() && this.fill_type == 'blank'){ this.fill_type = random(TOWN)}
    if(d < 200 && area > CIVIC && this.is_not_curved() && this.fill_type == 'blank' && total_civic_count < MAX_CIVIC){ this.fill_type = 'civic'}
    if(this.fill_type == 'civic') { total_civic_count++ }

    // if(this.is_triangular()) { this.fill_type = this.set_triangular_hatch()}

    // if(d > 300 || area > MAX_LOT_SIZE){ this.fill_type = random(COUNTRY)}
    // if(d < 200 && near_centre ){ this.fill_type = 'houses'}
    if(area < 200 && random() < 0.1) { this.fill_type = random(SMALL) }

    // if(this.fill_type == 'civic' && this.polygon.outer.length != 4) { this.fill_type = 'houses' }
    // if(this.fill_type == 'park' &&  this.polygon.outer.length != 4) { this.fill_type = 'houses'}
    // if(this.fill_type == 'trees' && this.polygon.outer.length != 4) { this.fill_type = 'houses' }

    // if(this.fill_type == 'trees' && area > 3000) { this.fill_type = 'houses' }

    // if(this.fill_type == 'civic' && (area < 500)) { this.fill_type = 'houses' }
    // if(this.fill_type == 'civic' && total_civic_count >= MAX_CIVIC) { this.fill_type = 'houses' }
    // if(this.fill_type == 'civic') { total_civic_count++ }

    if(area < 100) { this.fill_type = 'blank'}
    if(area > MAX_LOT_SIZE) { this.fill_type = random(LARGE) }

    if(this.fill_type == 'park') {
      this.fill_object = new Park(this.polygon, 0.2, 0);
      this.fill_object.construct();
    }

    if(this.fill_type == 'trees') {
      this.fill_object = new Trees(this.polygon);
      this.fill_object.construct();
    }
    
    
    if(this.fill_type == 'civic') {
      this.fill_object = new Civic(this.polygon);
      this.fill_object.construct();
    }

    if(this.fill_type == 'houses'){
      this.fill_object = new Housing(this.polygon);
      this.fill_object.construct();
    }

    if(this.fill_type == 'dots' ) {
      this.fill_object = new Regular(this.polygon, 5, this.fill_type, true);
      this.fill_object.construct();
    }

    if(this.fill_type == 'large-vertical-dashes' || 
       this.fill_type == 'large-horizontal-dashes') {
      this.fill_object = new Regular(this.polygon, 12, this.fill_type, true);
      this.fill_object.construct();
    }


    if(this.fill_type == 'large-dots' || 
      this.fill_type == 'vertical-dashes' || 
      this.fill_type == 'horizontal-dashes') {
      this.fill_object = new Regular(this.polygon, 7, this.fill_type, true);
      this.fill_object.construct();
    }

    if(this.fill_type == 'downwards' || this.fill_type == 'upwards') {
      this.fill_object = new Hatching(this.polygon, 5, this.fill_type);
      this.fill_object.hatch(this.fill_type);
    }

    civil_statistics[this.fill_type]++;
  }

  is_triangular(){
    return this.polygon.outer.length == 3
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


  draw() {
    noFill();
    this.polygon.draw();
  }

  fill(){
    if(this.fill_object) {
      this.fill_object.draw();
    }
    noFill()
    // circle(this.focus.x, this.focus.y, 200);


  }
}





