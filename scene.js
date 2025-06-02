////////////////////////////////////////////////////////////////
// Set the fill type of each polygon based on its area
let LARGE = ['blank', 'housing', 'housing', 'housing'];
let SMALL = ['hatching', 'hatching', 'hatching', 'hatching', 'pips', 'circles', 'circles'];
let MEDIUM = ['hatching', 'hatching', 'housing', 'housing', 'housing', 'housing', 'circles'];
SMALL = []
MEDIUM = []
LARGE = []  
let directions = ['horizontal', 'vertical', 'downwards', 'upwards'];
let colours = ['blue', 'red', 'green', 'black', 'purple', 'orange'];

function set_scene(polygons){
  let results = [];  

  for(let polygon of polygons){
    const [minX, minY, maxX, maxY] = polygon.bounds();
    let W = maxX - minX;
    let H = maxY - minY;
    let area = W * H;

    let fill_type = 'blank';
    if(area <  200){
      area_type = 'tiny';
    } else if(area < 6000) {
      area_type = 'small';
      shuffle(SMALL);
      fill_type = SMALL.pop();
    } else if(area < 21000) {
      area_type = 'medium';
      shuffle(MEDIUM);
      fill_type = MEDIUM.pop();
    } else {
      area_type = 'large';
      shuffle(LARGE);
      fill_type = LARGE.pop();
    }

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
      createCircularGroup(polygon);
    }

    if(fill_type === 'pips') {
      createPipGroup(polygon);
    }

    if(fill_type === 'ellipses') {
      createEllipseGroups(polygon);
    }

    if(fill_type === 'housing') {
      fill_object = new Housing(polygon);
      fill_object.construct();
    }

    console.log(fill_type, area_type, colour, area)

    results.push({polygon: polygon, fill_type: fill_type, colour: colour, fill: fill_object});
  }
  return results;
}

////////////////////////////////////////////////////////////////
// draw outer polygons and non-dynamic based fills
function draw_scene(){
  for(let result of results){
    stroke(result.colour);
    result.polygon.draw();
    if(result.fill) {
      result.fill.draw();
    }
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

let poly_road;
////////////////////////////////////////////////////////////////
// SCENE CREATION
// Create the scene by splitting the polygons with the polylines
function create_scene(){
  // results is globablly defined
  let road_points = get_contour(WATER_LEVEL);
  let road = new Polyline(road_points);
  road = road.simplify(0.1);
  poly_road = road.to_polygon(20);
  results = polyCircle.difference(poly_road)

  for(let i = 0; i < polylines.length; i++){
    results = split_polys(results, polylines[i]);
  }

  results = set_scene(results);
}


let polylines = []

function create_polygons(){
  polyOuter = new Polygon([
    createVector(0, 0),
    createVector(W, 0),
    createVector(W, H),
    createVector(0, H)
  ]);
  let marg = 80;
  polyInnerA = new Polygon([
    createVector(marg, marg),
    createVector(W-marg, marg),
    createVector(W-marg, H-marg),
    createVector(marg, H-marg)
  ]);

  polyInnerB = new Polygon([
    createVector(marg, marg),
    createVector(W-marg, marg),
    createVector(W-marg, H-marg),
    createVector(marg, H-marg)
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

  polylineBr = new Polyline([
    createVector(W, W),
    createVector(0, 0),
  ]);

  polylineC = new Polyline([
    createVector(3*W/4, 0),
    createVector(3*W/4, H)
  ]);



  polylineF = new Polyline([
    createVector(0, 3*H/4),
    createVector(W, 3*H/4)
  ]);

  polylines.push(polylineA);
  polylines.push(polylineC);
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

