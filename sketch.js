
let DPI= 96;
let wi = 6.42;
let hi = 9;
let bwi = 0.5;
let mbwi = 0.25
let W = wi * DPI;
let H = hi * DPI;
let BW = bwi * DPI;
let MBW = mbwi * DPI;
let FW = W + 2 * BW + 2 * MBW;
let FH = H + 2 * BW + 2 * MBW;
let VW = W + 2 * BW;
let VH = H + 2 * BW;
let CELL_SIZE = DPI/2

let MARGIN = 1;
let BORDER_MARGIN = 5;
let POLYGONAL_DETAIL = 360;
let SF = 1

let RIVER = 80;
let MIN_LOT_SIZE = 200;
let MAX_LOT_SIZE = 4000;
let COUNTRYSIZE_SIZE = 15000

let INTERCITY_ROAD = 18
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

function setup(){
  set_seeds()

  createCanvas(FW, FH);
  pixelDensity(4);

  setup_svg();

  frameRate(10);

  scene = new Scene()
  scene.initialize()
  // setup_debug_agents()
  // debug_fills();

}

let ctx = 0;
function draw(){
  // debug_agents()
  // test_draw(scene.lots, ctx);
  accumulative_draw();
  // final_draw();
  
}

function draw_edges(){
  scene.graph.draw_edges()
  scene.secondary_graph.draw_edges()
}


function setup_debug_agents(){
  polyCircleA = new RegularPolygon(W/4, H/6, 100,100, 100);  
  let minSize = int(random(15, 20))
  let maxSize = minSize*2
  let avgSize = (minSize + maxSize) / 2;
  let n =  floor(polyCircleA.bounds_area() / (avgSize ** 2));
  // n = 30
  let options = { noiseScale: 0.005, minSize: minSize, maxSize: maxSize };
  fill_object = new SuperEllipseGroup(n, polyCircleA.bounds_centroid(), 10, polyCircleA, options);
  fill_object.initialize();
}

function debug_agents(){
  let active = fill_object.update();
  stroke(255,0,0)
  polyCircleA.draw();
  stroke(0)
  fill_object.draw();
  if(active < 1) { 
    console.log("No more active agents"); 
    default_setup();
    // fill_object.boundary.draw();
    fill_object.draw();
    
    noLoop(); }
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
  polyCircleA = new MultiPolygon(new_points);
  // polyCircleA = new Oblong(W/4, H/6, 20, 10);
  polyCircleA = new RegularPolygon(W/3, H/3, 100,200, 100);  
  // fill_object = new Hatching(polyCircleA, 7, 9, 3);
  // fill_object.hatch('vertical');

  // fill_object = new Contour(polyCircleA, 'upwards', 0.025);
  fill_object = new Concentric(polyCircleA, polyCircleA.bounds_centroid(), 200, 20, 12);
  // fill_object = new Boustrophedon(polyCircleA, 'upwards');

  stroke(255,0,0)
  polyCircleA.draw();
  stroke(0)
  fill_object.construct();
  fill_object.draw();
  // noLoop();
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

function accumulative_draw(){
  if(scene.state < SCENE_UPDATE_COFFERS){
    default_setup()
    scene.construct();
    scene.draw();
  } else if(scene.state == SCENE_COMPLETE) {
    final_draw();
  } else if(scene.state == SCENE_UPDATE_COFFERS){
    scene.construct();

    let idx = scene.current_coffer_id;
    coffers[idx].draw();
    coffers[idx].fill();
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
    // draw_roads();
  pop()

  draw_borders();

  if(exporting) alignment_guide();
  
  noLoop();

  if(exporting){ endRecordSVG(this); }
  console.log("Finished drawing all groups");
  noLoop();
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
      coffer.draw();
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
