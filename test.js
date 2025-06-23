// Test filling with reference to A Mashiro

let piecesB, piecesAC, piecesCA, piecesC, piecesD, piecesE;
function init_test(){
  create_test_polygons();
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
    W/8, W/8, 600
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



  polylineA = new Polyline(pA);
  polylineC = new Polyline(pC);
  let polylineA2 = new Polyline(pA);
 
  polylineB = new Polyline(pB);
  polygonB = polylineB.to_polygon(20)
  polygonC = polylineC.to_polygon(20);

  // TODO: the problem was that by splitting by **the SAME** polyline the junctures get double counted

  piecesB = polygonB.split(polylineA);
  piecesC = polygonC.split(polylineA2);


  // TODO
  polylineD = new Polyline(pD);

  
  // NB If you change the order of these points, the split algorithm will not work correctly.
  let pCA = [
    createVector(0.45 * W, H/2 + 16),
    createVector(0.2625*W, H/2 - 24)
  ]

  let pAC = [
    createVector(0.2625*W, H/2 - 24),
    createVector(0.45 * W, H/2 + 16)
  ]

  // polygonC = polylineAC.to_polygon(20);
  // polylineCA = new Polyline(pCA);
  // polylineAC = new Polyline(pAC);
  // let polygonCA = polylineCA.to_polygon(20);
  // let polygonAC = polylineAC.to_polygon(20);

  // piecesAC =  disjoint([polyCircleA, polygonAC])
  // piecesCA = disjoint([polyCircleA, polygonCA]);
  
  // ALL OF THESE FAIL TO SPLIT
  // polygonC = piecesCA[1]
  // piecesC = polygonC.split(polylineA);
  // piecesD = piecesAC[0].split(polylineD);
  // piecesE = polygonB.split(polylineA);
  // piecesE = polygonC.split(polylineD);
  // polygonE = piecesE[0].split(polylineA);
  
}
