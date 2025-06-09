let DPI= 96;
let wi = 7;
let hi = 7;
let bwi = 0;
let W = wi * DPI;
let H = hi * DPI;
let BW = bwi * DPI;
let MARGIN = 1;
let BORDER_MARGIN = 5;
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
  // seed = 814009
  // Noise seed: 672470
  // seed =  71751
  // seed =  476141
  // seed =  867664
  // seed =  630821
  // seed =  613094
  // seed = 938214
  // seed =  274152
  // seed =  289768
  // seed =  124826
  // seed =  690352
  seed =  210054
  console.log("seed = ", seed);
  randomSeed(seed);
  noiseSeed(seed);
  
  pixelDensity(1);

  setup_svg();

  
  create_noise_field()
 

  create_polygons();
  create_coffers();
}

function draw(){
  // let active = update_groups();


  // if(active > 0){
  //   default_setup()

  //   draw_scene();
  //   draw_groups();
  // } else {
  //   let file_name = `output_${seed}.svg`;
  //   console.log("Exporting to: ", file_name);
  //   if(exporting){ beginRecordSVG(this, file_name); }
  //   default_setup()

  //   draw_scene();
  //   final_draw();

    
  //   noLoop();
  //   if(exporting){ endRecordSVG(this); }
  // }
}

function draw_scene(){
  for(let coffer of coffers){
    coffer.draw();
  }
}

function default_setup(){
  translate(BW, BW);
  background(240);
  stroke(0,0,0);
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
    
