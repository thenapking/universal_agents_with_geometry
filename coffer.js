// PLAN

// IMPROVEMENTS / BUG FIXES
// Hatching missing lines bug


// Set the fill type of each polygon based on its area
let SMALL =  [ 'solid', 'blank', 'downwards', 'upwards', 'housing', 'vertical', 'dots' ]
let MEDIUM = [ 'solid', 'blank', 'downwards', 'upwards',   'dots' ] //'circles',
let LARGE =  [ 'blank', 'large-dots', 'dots', 'crosses' ];  
let COUNTRY = [ 'blank', 'large-dots', 'downwards', 'upwards', 'vertical-dashes', 'horizontal-dashes',  'dots', 'crosses', 'solid' ];
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

    if(d > 300 || area > 3000){ this.fill_type = random['blank', 'dots']}

    if(this.fill_type == 'houses'){
      this.fill_object = new Housing(this.polygon);
      this.fill_object.construct();
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




