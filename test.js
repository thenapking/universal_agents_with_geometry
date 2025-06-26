// Test filling with reference to A Mashiro

let piecesA, piecesB, piecesAC, piecesCA, piecesC, piecesD, piecesE, piecesF, piecesG, piecesH;
let polygonD, adjacency_map, colour_map, shared_map, final;

function concentric_circle(x, y, r, w, n){
  let pieces = [];

  for(let i = 0; i <= n; i++){
    let dA = i * w
    if(dA >= r) { break;}

    let polyCircle = new RegularPolygon(
      x, y,
      r - dA, r - dA, 100
    );
   
    pieces.push(polyCircle);
  }

  return pieces
}

function hatching_test(){
  beginRecordSVG(this, "PEN HATCH TEST"); 
  let xoff = 50;
  let yoff = 50;
  let counter = 0.5; 
  noFill();
  stroke(0);
  translate(BW, BW);
  for(let y = 0; y < yoff * 3; y += yoff){
    for(let x = 0; x < W - BW; x += xoff){
      let coords = [[x, y], [x + xoff, y], [x + xoff, y + yoff], [x, y + yoff]];
      let poly = new Polygon(coords);
      let hatching = new Hatching(poly, counter, 'upwards');
      hatching.hatch('upwards');
      poly.draw();
      hatching.draw();
      counter+=0.5;
    }
  }
  endRecordSVG(this); 
}

function test_clipper(){
  let off = 100
  let xoff = 50

  polyCircleA = new RegularPolygon(
    W/4 + 60 + xoff, H/3,
    W/3, W/3, 150
  );

  polyCircleB = new RegularPolygon(
    W/2 - 160 + xoff, H/2 - 60  + off,
    W/10, W/10, 150
  );

  polyCircleC = new RegularPolygon(
    W/2 + 120 + xoff, H/2 + 40  + off,
    W/12, W/12, 150
  );

  polyCircleD = new RegularPolygon(
    W/2 + 66 + xoff, H/2  + off,
    W/16, W/16, 150
  );

  let pA = [
    createVector(0 + xoff, H/2 - 80 + off),
    createVector(W + xoff, H/2 + 160 + off)
  ]

  let pB = [
    createVector(0.15 * W, H/2 - 48 + off),
    createVector(0.1125*W, H/2 - 56 + off)
  ]

  let pC = [
    createVector(0.45 * W + xoff, H/2 + 16 + off),
    createVector(0.2625*W + xoff, H/2 - 24 + off)
  ]

  let pD = [
    createVector(60 + xoff, H + off),
    createVector(0.66 * W + xoff, 0 + off)
  ];

  let pE = [  
    createVector(0.9 * W + xoff, 0.95*H + off),
    createVector(0.35*W + xoff, 0.15*H + off)
  ];


  polylineA = new Polyline(pA);
  polylineC = new Polyline(pC);
  polylineD = new Polyline(pD);
  polylineE = new Polyline(pE);


 
  
  piecesB = concentric_circle(W/3 + 60 + xoff, H/2 - off, W/4, 20, 5);
  piecesC = concentric_circle(3*W/4 - 100 + xoff, H/2 - 150- off, W/6, 10, 4);
  piecesD = concentric_circle(2*W/3 -30 + xoff, H/2 + 160- off, W/5, 10, 6);
  piecesE = concentric_circle(W/4 + 60 + xoff, 3*H/4 + 60- off, W/3 - 20, 40, 3);
  
  let res = piecesC.concat(piecesB).concat(piecesD).concat(piecesE).concat([polyCircleA, polyCircleB, polyCircleC, polyCircleD]); //
  create_coffers(res);
  
}

function create_concentric_circles(){
  polyOuter = new Polygon([
    createVector(0, 0),
    createVector(W, 0),
    createVector(W, H),
    createVector(0, H)
  ]);

  let off = 200

  polyCircleA = new RegularPolygon(
    W/3 + off, H/2,
    W/4, W/4, 100
  );

  polyCircleA2 = new RegularPolygon(
    W/3 + off, H/2,
    W/6, W/6, 100
  );

  polyCircleA3 = new RegularPolygon(
    W/3 + off, H/2,
    W/8, W/8, 100
  );


  polyCircleB = new RegularPolygon(
    2*W/3 - off, H/2,
    W/4, W/4, 150
  );

  polyCircleB2 = new RegularPolygon(
    2*W/3 - off, H/2,
    W/6, W/6, 150
  );

  polyCircleB3 = new RegularPolygon(
    2*W/3 - off, H/2,
    W/8, W/8, 150
  );

  polyCircleC = new RegularPolygon(
    W/2 + 60, H/2 + 40,
    W/12, W/12, 150
  );

  polyCircleD = new RegularPolygon(
    W/2, H/2,
    W/16, W/16, 150
  );

  polyCircleE = new RegularPolygon(
    3*W/4 + 66, H/2 - 60,
    W/16, W/16, 150
  );


  
  let pE = [  
    createVector(0.9 * W, 0.95*H),
    createVector(0.35*W, 0.15*H)
  ];

  polylineE = new Polyline(pE);

  piecesC = concentric_circle(2*W/3 - off, H/2, W/4, 10, 2);
  piecesA = concentric_circle(W/3 + off, H/2, W/4, 10, 2);
  piecesB = concentric_circle(W/3 + off, H/4, W/5, 10, 2);
  piecesD = piecesC.concat(piecesA).concat(piecesB).concat([polyCircleC, polyCircleD, polyCircleE]);

}

function create_test_polygons(){
  polyOuter = new Polygon([
    createVector(0, 0),
    createVector(W, 0),
    createVector(W, H),
    createVector(0, H)
  ]);

  
  polyCircleA = new RegularPolygon(
    W/3 + 60, H/2,
    W/8, W/8, 150
  );

  polyCircleB = new RegularPolygon(
    W/2 + 60, H/2 - 60,
    W/10, W/10, 150
  );

  polyCircleC = new RegularPolygon(
    W/2 + 60, H/2 + 40,
    W/12, W/12, 150
  );

  polyCircleD = new RegularPolygon(
    W/2 + 66, H/2,
    W/16, W/16, 150
  );

  let pA = [
    createVector(0,      H/2 - 80),
    createVector(0.75*W, H/2 + 80)
  ]

  let pB = [
    createVector(0.15 * W, H/2 - 48),
    createVector(0.1125*W, H/2 - 56)
  ]

  let pC = [
    createVector(0.45 * W, H/2 + 16),
    createVector(0.2625*W, H/2 - 24)
  ]

  let pD = [
    createVector(60, 0.9*H),
    createVector(0.66 * W, 0.25*H)
  ];

  let pE = [  
    createVector(0.9 * W, 0.95*H),
    createVector(0.35*W, 0.15*H)
  ];


  polylineA = new Polyline(pA);
  polylineC = new Polyline(pC);
  polylineD = new Polyline(pD);
  polylineE = new Polyline(pE);
 
  polylineB = new Polyline(pB);
  polygonB = polylineB.to_polygon(20)
  polygonC = polylineC.to_polygon(20);


  piecesB = polygonB.split(polylineA);

  // it works better to use the greiner horman algorithm
  // it also works better to split by the lines afterwards
  piecesD = disjoint([polyCircleA, polyCircleB, polyCircleC, polyCircleD, polygonC], true)


  let bits = [];
  for(let p of piecesD){
    let r = p.split(polylineA);
    for(let b of r){
      bits.push(b);
    }
  }

  piecesE = [];
  for(let b of bits){
    let r = b.split(polylineD);
    for(let p of r){
      piecesE.push(p);
    }
  }

  piecesF = [];
  for(let b of piecesE){
    let r = b.split(polylineE);
    for(let p of r){
      piecesF.push(p);
    }
  }

  final = piecesF.concat(piecesB);

  adjacency_map = adjacency(final)
  shared_map = shared_vertices(final);
  colour_map = full_recursive_colour_map();

}





