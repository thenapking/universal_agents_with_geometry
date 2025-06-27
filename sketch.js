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
let mbwi = 1
let W = wi * DPI;
let H = hi * DPI;
let BW = bwi * DPI;
let MBW = mbwi * DPI;
let FW = W + 2 * BW + 2 * MBW;
let FH = H + 2 * BW + 2 * MBW;
let VW = W + 2 * BW;
let VH = H + 2 * BW;

let MARGIN = 1;
let BORDER_MARGIN = 5;
let POLYGONAL_DETAIL = 360;
let SF = 0.9

let INTERCITY_ROAD = 6
let MAJOR_ROAD = 4.5;
let MINOR_ROAD = 3;
let SMALL_HATCH = 4
let MEDIUM_HATCH = 6;
let LARGE_HATCH = 10;


let PHI;



let exporting = false;


let groups = [];
let active_group_id = 0;

let scene;

let seed; 

function preload() {
  load_data(2)
}

function setup(){
  createCanvas(FW, FH);

  seed = Math.floor(Math.random() * 1000000);
  console.log("seed = ", seed);
  randomSeed(seed);
  noiseSeed(seed);
  
  pixelDensity(1);

  setup_svg();

  
  create_noise_field()
 

  process_data();
  // test_slime();
  frameRate(30);
  template = {
    foci: [
      createVector(W/2, H/2)
    ], 
    offscreen_foci: [
      // createVector(W + 2*BW + 2*MBW, 0),
      createVector(0, 0),
      createVector(W + 2*BW + 2*MBW, H/4 + BW + MBW),
      createVector(W + 2*BW + 2*MBW, 3*H/4 + BW + MBW),
      // createVector(W/4 + BW + MBW, 0),
      // createVector(3*W/4 + BW + MBW, 0),
    ]};
  scene = new Scene(template)
}

let ctx = 0;
function draw(){
  default_setup()
  
  // animation_draw();
  
  scene.draw();

  for(let c of connections){
    let from = createVector(c.from.position.x, c.from.position.y).sub(MBW, 3*MBW); 
    let to = createVector(c.to.position.x, c.to.position.y).sub(MBW, 3*MBW); 
    
    let pl = new Polyline([from, to])
    let poly = pl.to_polygon(5);
    push();
      translate(BW, BW-2*MBW)
      // poly.draw();
    pop();
  }

  fill(0,255,0)
  for(let h of minor_hotspots){
    let x = h.position.x - MBW;
    let y = h.position.y - 3*MBW;
    // circle(x,y, 10);
  }
  noLoop();

}

function animation_draw(){
  let active = update_groups();

  if(active > 0){
    push()
      default_setup()

      draw_coffers();
      draw_groups();
    pop()


    draw_borders();

  } else {
    
    if(exporting){ 
      let file_name = `output_${seed}.svg`;
      console.log("Exporting to: ", file_name);
      beginRecordSVG(this, file_name); 
    }

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
// For each group, create the polygons and draw them
function final_draw(){
  push();
  for(group of groups){
    let results = group.create_polygons();
    push();
      group.boundaries[0].draw();
      push();
      for(let poly of results){
        poly.draw();
      }
      pop();
    pop();
  }
  pop();
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
