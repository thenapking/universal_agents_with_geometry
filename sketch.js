
let DPI= 96;
let wi = 7;
let hi = 10.25;
let bwi = 0.5;
let mbwi = 0.75
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

let RIVER = 80;
let INTERCITY_ROAD = 24
let MAJOR_ROAD = 16;
let MINOR_ROAD = 8;
let SIDE_ROAD = 4;
let SMALL_HATCH = 4
let MEDIUM_HATCH = 6;
let LARGE_HATCH = 10;


let PHI;
let exporting = false;

let coffers = [];

let groups = [];
let active_group_id = 0;

let scene;

let seed; 

function preload() {
  load_data(10)
}

function setup(){
  set_seeds()
  process_data();

  createCanvas(FW, FH);
  pixelDensity(4);

  setup_svg();

  process_data();
  frameRate(30);

  scene = new Scene()
  // scene.draw();
  // draw_edges();
}

let ctx = 0;
function draw(){
  // test_draw(scene.roads, ctx);
  final_draw();
}

function draw_edges(){
  scene.graph.draw_edges()
  scene.secondary_graph.draw_edges()
}

function test_draw(collection){
  let p = collection[ctx]
  if(p){
    p.draw();
    ctx++

  } else{
    console.log("Done with circles");
    
    noLoop();
  }

}

function final_draw(){
  if(exporting){ 
    let file_name = `output_${seed}.svg`;
    console.log("Exporting to: ", file_name);
    beginRecordSVG(this, file_name); 
  }

  push()
    default_setup()
    if(!exporting) { scene.draw(); }

    draw_coffers();
    draw_lots();
    draw_road_lines()

  pop()

  draw_borders();

  if(exporting) alignment_guide();
  
  noLoop();

  if(exporting){ endRecordSVG(this); }
  console.log("Finished drawing all groups");
}

function draw_lots(){
  push();
    stroke(palette.black);
    noFill();
    for(let lot of scene.lots){
      lot.draw();
    }
  pop();
}

function draw_coffers(){
  push();
    stroke(palette.black);
    for(let coffer of coffers){
      coffer.fill();
    }
  pop();
}

function draw_roads(){
  for(let r of scene.roads){
    r.draw();
  }
}

function draw_road_lines(){
  push()
    noFill();
    stroke(palette.white);
    for(let r of scene.minor_road_lines){
      r.draw()
    }
    strokeWeight(4);
    for(let r of scene.major_road_lines){
      r.draw()
    }
  pop();
}

function default_setup(){
  background(palette.background);
  stroke(palette.black);
  strokeWeight(1);
  fill(palette.background);
}
    
function draw_borders(){
  push();
    noStroke();
    fill(palette.background);
    rectMode(CORNERS);
    rect(0, 0, FW, MBW + BW);
    rect(0, 0, MBW + BW, FH);
    rect(FW - MBW - BW, 0, FW, FH);
    rect(0, FH - MBW - BW, FW, FH);
  pop()
  push();
    stroke(palette.black);
    noFill();
    rectMode(CENTER)
    rect(MBW + BW + W/2, MBW + BW + H/2, VW - 1.5*BW, VH - 1.5*BW); 
    rect(MBW + BW + W/2, MBW + BW + H/2, VW - 1.5*BW + 10, VH - 1.5*BW + 10); 

  pop();
}

function alignment_guide(){
  push();
    stroke(palette.black);
    noFill();
    let sz = 20;
    target(MBW, MBW, sz)
    target(FW - MBW, MBW, sz);
    target(MBW, FH - MBW, sz);
    target(FW - MBW, FH - MBW, sz);
  pop();
}

function target(x, y, r){
  circle(x, y, r);
  line(x - r, y, x + r, y);
  line(x, y - r, x, y + r);
}
