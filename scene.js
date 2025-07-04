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
    W/4, H/4,
    W/4, W/4, POLYGONAL_DETAIL
  );

  polyCircleB = new RegularPolygon(
    random(0.5,0.75) * W, 3*H/4,
    W/2, W/2, POLYGONAL_DETAIL
  );

  polyCircleC = new RegularPolygon(
    W/4, H/2,
    W/5, W/5, POLYGONAL_DETAIL
  );

  polyCircleD = new RegularPolygon(
    0.25*W, 0.2*H,
    W/6, W/6, POLYGONAL_DETAIL
  );

  polyCircleE = new RegularPolygon(
    0.75*W, 0.3*H,
    W/6, W/6, POLYGONAL_DETAIL
  );

  polyCircleF = new RegularPolygon(
    0.45*W, 0.267*H,
    W/6, W/6, POLYGONAL_DETAIL
  );

  polyCircleG = new RegularPolygon(
    0.3*W, 0.8*H,
    W/5, W/5, POLYGONAL_DETAIL
  );


  polylineA = [
    createVector(W/2 + 60, 0),
    createVector(W/2 + 20, H)
  ]

  
  polylineB = [
    createVector(0, 0),
    createVector(-W, 2*W)
  ]

  polylineBr = [
    createVector(-W, 2*W),
    createVector(0, 0),
  ]

  polylineC = [
    createVector(3*W/4, -H),
    createVector(3*W/4, 2*H)
  ]



  polylineF = [
    createVector(-W, 3*H/4),
    createVector(2*W, 3*H/4)
  ]

  polylines.push(polylineA);
  polylines.push(polylineC);
  polylines.push(polylineF);

  for(let i = 0; i < 3; i++){
    let polyline = [
      createVector(30, H),
      createVector(130 + i*POLYGONAL_DETAIL, 0), 
    ]

    polylines.push(polyline);
  }
  

}

function split_polys(input, input_line, sw = 0){
  if(!input_line.points) { return }
  let results =  []
  for(let polygon of input){
    if(results.length > POLYGONAL_DETAIL) { break; }
    let polyline = new Polyline(input_line.points);
    
    let second = polygon.split(polyline);
    for(let s of second){
      results.push(s);
    }
  }
  return results;
}

