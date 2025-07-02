// PLAN

// IMPROVEMENTS / BUG FIXES
// Hatching missing lines bug


// Set the fill type of each polygon based on its area
let SMALL =  [ 'blank', 'downwards', 'upwards', 'dots' ]
let TOWN = [ 'blank', 'dots'] 
let LARGE =  [ 'blank', 'large-dots', 'dots'];  
let COUNTRY = [ 'blank', 'large-dots', 'vertical-dashes', 'horizontal-dashes',  'dots', ];
let colours = ['brown', 'yellow', 'grey', 'pink', 'orange'] 
let extended_colours = ['blue', 'red', 'green', 'purple',  'cyan', 'magenta'];
let all_colours = [...colours, ...extended_colours];

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
    this.fill_type = 'houses'

    if(d > 300 || area > 3000){ this.fill_type = random(COUNTRY)}
    if(d < 300 && area > CIVIC){ this.fill_type = random(TOWN)}

    if(area < 100) { this.fill_type = 'blank'}
    if(area > 40000) { this.fill_type = random(LARGE) }

    if(this.fill_type == 'houses'){
      this.fill_object = new Housing(this.polygon);
      this.fill_object.construct();
    }

    if(this.fill_type == 'dots' || 
       this.fill_type == 'vertical-dashes' || 
       this.fill_type == 'horizontal-dashes') {
      this.fill_object = new Regular(this.polygon, 5, this.fill_type, true);
      this.fill_object.find_points();
    }


    if(this.fill_type == 'large-dots') {
      this.fill_object = new Regular(this.polygon, 7, this.fill_type, true);
      this.fill_object.find_points();
    }

    if(this.fill_type == 'downwards' || this.fill_type == 'upwards') {
      this.fill_object = new Hatching(this.polygon, 5, this.fill_type);
      this.fill_object.hatch(this.fill_type);
    }
  }

  draw() {
    this.polygon.draw();
    
    if(this.fill_object) {
      this.fill_object.draw();
    }
  }
}

let coffers = [];




