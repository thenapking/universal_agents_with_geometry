let DPI= 96;
let wi = 5;
let hi = 5;
let bwi = 0.5;
let W = wi * DPI;
let H = hi * DPI;
let BW = bwi * DPI;
let MARGIN = 1;
let BORDER_MARGIN = 5;
let SF = 0.9

let polygonA, polygonB, polylineA, polylineB, polyCircle;
let intersection, union, diff, split;

let exporting = true;

let polyOuter, polyInner;
let test_polyline, test_poly;

let colours = ['blue', 'red', 'green', 'black', 'purple', 'orange'];
let seconds = []
let results = [];
let directions = ['horizontal', 'vertical'];

let groups = [];

function setup(){
  createCanvas(W + 2* BW, H + 2 * BW);

  create_polygons();

  create_scene();

  


  // Set important values for our SVG exporting: 
  setSvgResolutionDPI(DPI); // 96 is default
  setSvgPointRadius(0.25); // a "point" is a 0.25 circle by default
  setSvgCoordinatePrecision(4); // how many decimal digits; default is 4
  setSvgTransformPrecision(6); // how many decimal digits; default is 6
  setSvgIndent(SVG_INDENT_SPACES, 2); // or SVG_INDENT_NONE or SVG_INDENT_TABS
  setSvgDefaultStrokeColor('black'); 
  setSvgDefaultStrokeWeight(1); 
  setSvgFlattenTransforms(false); // if true: larger files, closer to original

}

function draw(){
  

  
  let active = update_groups();

  if(active > 0){
    translate(BW, BW);
    background(240);
    stroke(0,0,0);

    draw_scene();
    draw_groups();
  } else {
    if(exporting){ beginRecordSVG(this, 'output.svg'); }
    translate(BW, BW);
    background(240);
    stroke(0,0,0);

    draw_scene();
    for(group of groups){
      do_it(group);
    }
    noLoop();
    if(exporting){ endRecordSVG(this); }

  }

}

function do_it(group){
  let results = []
  let resulting_polys = create_polys_from_group(group)
  for(let poly of resulting_polys){
    let test = group.boundaries[0].intersection(poly);
    if(test){
      results.push(test);
    }
  }

  for(let poly of results){
    poly.draw();
  }
  return results;
  
}


function draw_groups(){
  push();
    for (let group of groups) {
      group.draw();
    }
  pop();

}

function update_groups(){
  let active = 0;
  for (let group of groups) {
    active += group.update();
  }
  return active;
}
    
function create_scene(){
  let r = polyCircle.split(polylineB);

  results = r;

  for(let i = 0; i < polylines.length; i++){
    results = split_polys(results, polylines[i]);
  }


  results = set_scene(results);

  console.log(results)

}

let FILL_TYPES = ['blank', 'hatching', 'hatching', 'circles'];

function set_scene(polygons){
  let results = [];  
  for(let polygon of polygons){
    let fill_type = random(FILL_TYPES);
    let colour = random(colours)

    let pc = polygon.centroid();
    let stD = W/5
    let dst = dist(pc.x, pc.y, W/2, H/2);
    let prob = exp(-0.5 * pow(dst / stD, 2));
    if(random(1) < prob){ fill_type = 'blank'; }
    
    
    let fill_object;
    if(fill_type === 'hatching') {
      let d = random(directions);

      fill_object = new Hatching(polygon, 5, d);
      fill_object.hatch(d);
    }

    if(fill_type === 'circles') {
      const [minX, minY, maxX, maxY] = polygon.bounds();
      let wd = maxX - minX;
      let hd = maxY - minY;
      let area = wd * hd;
      let minSize = int(random(2, 20))
      let maxSize = minSize*4
      let avgSize = (minSize + maxSize) / 2;
      let numCircles = 2 * floor(area / (avgSize * avgSize));
      console.log("---------------------")
      console.log(numCircles, area, avgSize, minSize, maxSize);
      createCircularGroup(polygon, numCircles, minSize, maxSize);
    }

    results.push({polygon: polygon, fill_type: fill_type, colour: colour, fill: fill_object});
  }
  return results;
}

function draw_scene(){
  for(let result of results){
    stroke(result.colour);
    result.polygon.draw();
    if(result.fill) {
      result.fill.draw();
    }
  }
}


let polylines = []

function create_polygons(){
  polyOuter = new Polygon([
    createVector(0, 0),
    createVector(W, 0),
    createVector(W, H),
    createVector(0, H)
  ]);

 
  polyCircle = new RegularPolygon(
    W/2, H/2,
    W/2, W/2, 100
  );


  polylineA = new Polyline([
    createVector(W/2, 0),
    createVector(W/2, H)
  ]);

  
  polylineB = new Polyline([
    createVector(0, 0),
    createVector(W, W)
  ]);


  polylineF = new Polyline([
    createVector(0, 3*H/4),
    createVector(W, 3*H/4)
  ]);

  polylines.push(polylineF);

  for(let i = 0; i < 3; i++){
    let polyline = new Polyline([
      createVector(30, H),
      createVector(130 + i*200, 0), 
    ]);

    polylines.push(polyline);
  }
  

}


function split_polys(input, input_line){
  if(!input_line.points) { return }
  let results =  []
  for(let polygon of input){
    if(results.length > 100) { break; }
    let polyline = new Polyline(input_line.points);

    let second = polygon.split(polyline);
    for(let s of second){
      results.push(s);
    }
  }
  return results;
}

