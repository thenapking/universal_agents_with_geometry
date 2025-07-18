
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
let SF = 1

let RIVER = 80;
let MIN_LOT_SIZE = 600;
let MAX_LOT_SIZE = 4000;

let INTERCITY_ROAD = 26
let MAJOR_ROAD = 12;
let MINOR_ROAD = 8;
let SIDE_ROAD = 4;
let ROAD_CURVINESS = 0.35 // between 0.25 and 0.5

let MINOR_ROAD_LENGTH = 75
let MAJOR_ROAD_LENGTH = 300;
let SMALL_HATCH = 4
let MEDIUM_HATCH = 6;
let LARGE_HATCH = 10;

const ERROR = 0.001
const ANGLE = 3.141/24;
const AREA = 200;
const PARK = 3000;
const CIVIC = 1000;
const BLOCK = 2000;

const CIVIC_PROBABILITY = 0.3;


let PHI;
let exporting = false;

let coffers = [];

let groups = [];
let active_group_id = 0;

let scene;
let seed; 

function preload() {
  load_data(16)
}

function setup(){
  set_seeds()
  process_data();

  createCanvas(FW, FH);
  pixelDensity(4);

  setup_svg();

  process_data();
  frameRate(10);

  scene = new Scene()
  scene.initialize()

}

let ctx = 0;
function draw(){
  // debug_fills();
  // test_draw(scene.roads, ctx);
  final_draw();
  
}

function draw_edges(){
  scene.graph.draw_edges()
  scene.secondary_graph.draw_edges()
}

let polyCircleA, fill_object;

function debug_fills(){
  let points = [
    createVector(255.40007714091817, 339.0843547),
    createVector(255.40007714091817, 348.9488567625),
    createVector(233.1200617127345, 348.9488567625),
    createVector(233.1200617127345, 335.4560461),

  ]

  let new_points = [
    new p5.Vector(736.8697802113705, 173.937643275),
    new p5.Vector(689.7395604227411, 173.937643275),
    new p5.Vector(689.7395604227411, 120),
    new p5.Vector(736.8697802113705, 120),
  ];


  console.log("START")
  // polyCircleA = new MultiPolygon(new_points);
  // polyCircleA = new Oblong(W/4, H/6, 20, 10);
  polyCircleA = new RegularPolygon(W/4, H/6, 100,100, 100);  
  fill_object = new Boustrophedon(polyCircleA, 'upwards');
  stroke(255,0,0)
  polyCircleA.draw();
  stroke(0)
  fill_object.construct();
  fill_object.draw();
  noLoop();
}

let lo, lp, lr;
function clip_road_test(i=1){
  lo = scene.bounding_box;
  lp = scene.intercity_road_lines[i]
  lr = lp.clip(lo)
  noFill();
  lr[0].draw();
  console.log(lr)
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

  scale(SF)

  push()
    default_setup()
    if(!exporting) { scene.draw(); }

    draw_coffers();
    draw_lots();
    draw_road_lines()

  pop()

  // draw_borders();

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
    stroke(palette.black);
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

function default_setup(){
  background(palette.background);
  stroke(palette.black);
  strokeCap(SQUARE);
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
    let pz = MBW
    target(pz, pz, sz)
    target(FW - pz, pz, sz);
    target(pz, FH - pz, sz);
    target(FW - pz, FH - pz, sz);
  pop();
}

function target(x, y, r){
  circle(x, y, r);
  line(x - r, y, x + r, y);
  line(x, y - r, x, y + r);
}
