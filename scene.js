////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////
// draw outer polygons and non-dynamic based fills


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

 
  polyCircleA = new RegularPolygon(
    W/4, H/2,
    W/4, W/4, 100
  );

  polyCircleB = new RegularPolygon(
    3*W/4, H/2,
    W/4, W/4, 100
  );



  polylineA = [
    createVector(W/2, 0),
    createVector(W/2, H)
  ]

  
  polylineB = [
    createVector(0, 0),
    createVector(W, W)
  ]

  polylineBr = [
    createVector(W, W),
    createVector(0, 0),
  ]

  polylineC = [
    createVector(3*W/4, 0),
    createVector(3*W/4, H)
  ]



  polylineF = [
    createVector(0, 3*H/4),
    createVector(W, 3*H/4)
  ]

  polylines.push(polylineA);
  polylines.push(polylineC);
  polylines.push(polylineF);

  for(let i = 0; i < 3; i++){
    let polyline = [
      createVector(30, H),
      createVector(130 + i*200, 0), 
    ]

    polylines.push(polyline);
  }
  

}

function split_polys(input, input_line, sw = 0){
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

