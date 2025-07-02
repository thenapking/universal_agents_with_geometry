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


let groups = [];
let active_group_id = 0;

let scene;

let seed; 

function preload() {
  load_data(4)
}

function setup(){
  createCanvas(FW, FH);

  seed = Math.floor(Math.random() * 1000000);
  console.log("seed = ", seed);
  // seed = 1; // for testing
  // seed = 68658
  // seed =  10273
  // seed =  29003
  // seed =  276306
  randomSeed(seed);
  noiseSeed(seed);
  
  pixelDensity(4);

  setup_svg();

  
  create_noise_field()
 

  process_data();
  frameRate(10);
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

  default_setup()
  scene.draw();
  draw_roads()
  polyCircleA = new RegularPolygon(
    W/2, H/2,
    300, 300, 4, 'city'
  ); 
}

let ctx = 0;
function draw(){
  
  // polyCircleA.draw();
  // let h = new Housing(polyCircleA);
  // h.divide();
  // h.draw();
  // noLoop();
  animation_draw();
  // noFill();
  // let p = coffers[ctx]
  // if(p){
  //   p.draw();
  //   ctx++

  // } else{
  //   console.log("Done with circles");
  //   noLoop();
  // }
  // noLoop();
}

function animation_draw(){
  let active = update_groups();

  if(active > 0){
    push()
      default_setup()
      scene.draw();

      draw_coffers();
      draw_groups();
      draw_roads()
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
      if(!exporting) { scene.draw(); }

      draw_coffers();
      final_draw();
      draw_roads()
    pop()

    draw_borders();
    
    noLoop();

    if(exporting){ endRecordSVG(this); }
    console.log("Finished drawing all groups");
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

function draw_roads(){
  fill(0)
  for(let r of scene.roads){
    r.draw();
  }
  noFill();
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
  pop();
}
