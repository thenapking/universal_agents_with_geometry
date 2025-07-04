// TODO:

// fix circle filling
// eliminate vertical / horizontal fill?
// fix diagonal shading
// Intersection - is it just resolution / circle vertices?
// fix + identify bugs

// new:
// add dashed lines
// add grid lines
// add network lines

// fills:
// test filling logic
// countour fill
// dots/lines parallel to roads
// dahsed lines for paths


let DPI= 96;
let wi = 7;
let hi = 10;
let bwi = 0.25;
let W = wi * DPI;
let H = hi * DPI;
let BW = bwi * DPI;
let MARGIN = 1;
let BORDER_MARGIN = 5;
let POLYGONAL_DETAIL = 360;
let SF = 0.9

let PHI;

let polygonA, polygonB, polylineA, polylineB, polyCircle;
let intersection, union, diff, split;

let exporting = false;

let polyOuter, polyInner;
let test_polyline, test_poly;

let results = [];


let groups = [];
let active_group_id = 0;

let road, road_points, reverse_points;
let seed; 
function setup(){
  createCanvas(W + 2* BW, H + 2 * BW);

  seed = Math.floor(Math.random() * 1000000);
  console.log("seed = ", seed);
  randomSeed(seed);
  noiseSeed(seed);
  
  pixelDensity(1);

  setup_svg();

  
  create_noise_field()
 

  test_clipper();
  default_setup()

}

function draw(){
  draw_scene();
  
  

}

function draw_scene(){
  let active = update_groups();

  if(active > 0){
    push()
    default_setup()

    draw_coffers();
    draw_groups();
    pop()


    draw_borders();

  } else {
    let file_name = `output_${seed}.svg`;
    console.log("Exporting to: ", file_name);
    if(exporting){ beginRecordSVG(this, file_name); }
    push()
      default_setup()

      draw_coffers();
      final_draw();
    pop()
    draw_borders();
    
    noLoop();
    if(exporting){ endRecordSVG(this); }
  }
}

function draw_coffers(){
  for(let coffer of coffers){
    coffer.draw();
  }
}


function draw_groups(){
  push();
    for (let group of groups) {
      group.draw();
    }
  pop();
}

function update_groups(){
  if(groups.length === 0) { return 0; }
  let active_group = groups[active_group_id];
  active_group.update();

  if(!active_group.active) {
    active_group_id++;
    if(active_group_id >= groups.length) {
      return 0;
    } else {
      active_group = groups[active_group_id];
    }
  }
  
  return 1
}

function default_setup(){
  translate(BW, BW);
  background(240);
  stroke(0,0,0);
}
    
function draw_borders(){
  push();
    noStroke();
    fill(240);
    rect(0, 0, width, BW);
    rect(0, 0, BW, height);
    rect(width - BW, 0, BW, height);
    rect(0, height - BW, width, BW);
  pop();
}
