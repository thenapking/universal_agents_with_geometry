
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

let INTERCITY_ROAD = 6
let MAJOR_ROAD = 4.5;
let MINOR_ROAD = 3;
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
  load_data(1)
}

function setup(){
  set_seeds()
  process_data();

  createCanvas(FW, FH);
  pixelDensity(4);

  setup_svg();

  process_data();
  frameRate(60);
  
  template = {
    foci: [
      createVector(W/2, H/2)
    ], 
    offscreen_foci: [
      createVector(0, 0),
      createVector(W + 2*BW + 2*MBW, H/4 + BW + MBW),
      createVector(W + 2*BW + 2*MBW, 3*H/4 + BW + MBW),
    ]};
  scene = new Scene(template)
  scene.draw();

}

let ctx = 0;
function draw(){
  // let points = [[[100,100],[100,200],[200,200],[200,100]]];
  // polyCircleA = new MultiPolygon(points);
  // polyCircleA.draw();
  // polyCircleB = new Regular(polyCircleA, 7, 'vertical-dashes', true);
  // polyCircleB.construct();
  // polyCircleB.draw()
  // noLoop()

  
  // noLoop();

  // let p = scene.potential_coffers[ctx]
  // if(p){
  //   p.draw();
  //   ctx++

  // } else{
  //   console.log("Done with circles");
    
  //   noLoop();
  // }

  if(exporting){ 
    let file_name = `output_${seed}.svg`;
    console.log("Exporting to: ", file_name);
    beginRecordSVG(this, file_name); 
  }

  push()
    default_setup()
    if(!exporting) { scene.draw(); }

    draw_coffers();
  pop()

  draw_borders();

  if(exporting) alignment_guide();
  
  noLoop();

  if(exporting){ endRecordSVG(this); }
  console.log("Finished drawing all groups");
  
}

function draw_coffers(){
  push();
    stroke(palette.black);
    for(let coffer of coffers){
      coffer.fill();
    }
  pop();

  push()
    stroke(palette.white);
    for(let coffer of coffers){
      coffer.draw();
    }
  pop()
  
}

function draw_roads(){
  for(let r of scene.roads){
    r.draw();
  }
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
