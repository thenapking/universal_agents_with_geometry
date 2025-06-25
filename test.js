// Test filling with reference to A Mashiro

let piecesA, piecesB, piecesAC, piecesCA, piecesC, piecesD, piecesE, piecesF, piecesG, piecesH;
let polygonD, adjacency_map, colour_map, shared_map, final;
function init_test(){
  // create_test_polygons();
  create_concentric_circles();
}

function concentric_circle(x, y, r, w, n){
  let pieces = [];

  for(let i = 0; i < n; i++){
    let dA = i * w
    let dB = (i + 1) * w;

    if(dA >= r || dB >= r) { break;}

    let polyCircleA = new RegularPolygon(
      x, y,
      r - dA, r - dA, 100
    );

    let polyCircleB = new RegularPolygon(
      x, y,
      r - dB, r - dB, 100
    );

    let piece = polyCircleA.difference(polyCircleB);
    if(piece.length > 0){
      pieces.push(piece[0]);
    }
  }

  let last = new RegularPolygon(
    x, y,
    r - n * w, r - n * w, 100
  );

  pieces.push(last);



  return pieces

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
    W/2 + 66, H/2,
    W/16, W/16, 150
  );

  
  let pE = [  
    createVector(0.9 * W, 0.95*H),
    createVector(0.35*W, 0.15*H)
  ];

  polylineE = new Polyline(pE);


  
  piecesC = concentric_circle(2*W/3 - off, H/2, W/4, 10, 8);
  piecesA = concentric_circle(W/3 + off, H/2, W/4, 10, 8);
  piecesD = [polyCircleA, polyCircleB, polyCircleC, polyCircleD, polyCircleA2, polyCircleA3, polyCircleB2, polyCircleB3];

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


function create_colour_map() {
  let result = [];
  let usage = {};
  for (let color of colours) usage[color] = 0;

  for (let i = 0; i < final.length; i++) {
    let neighbours = adjacency_map[i];
    let unused = [...colours];

    for (let n of neighbours) {
      let colour = result[n];
      if (colour !== undefined) {
        unused = unused.filter(c => c !== colour);
      }
    }

    // Sort unused by how often each color has been used (ascending)

    if(shared_map[i].length > 0){
      console.log("Shared vertices for piece", i, shared_map[i]);
      let shared_colours = shared_map[i].map(s => result[s]).filter(c => c !== undefined);
      console.log("Shared colours:", shared_colours);
      if(shared_colours.length > 0){
        unused = unused.filter(c => shared_colours.includes(c));
      }
    }

    unused.sort((a, b) => usage[a] - usage[b]);

    

    let selected = unused[0];
    result[i] = selected;
    usage[selected]++;
  }

  return result;
}


function full_recursive_colour_map() {
  let results = [];
  for (let i = 0; i < final.length; i++) {
    if (results[i] === undefined) {
      recursive_colour_map(0, i, results, ['black', 'brown', 'yellow', 'cyan', 'red', 'green', 'blue', 'purple', 'orange', 'pink'] );
    }
  }

  return results;
}

function recursive_colour_map(depth = 0, idx = 0, results = [], input_colours){
  if(depth > 100) { console.log("Recursion depth exceeded for piece", idx);
    return results; 
  } 

  if(results[idx] == undefined) {
    let neighbours = adjacency_map[idx];
    let unused = [...input_colours];

    for(let n of neighbours){
      let colour = results[n];
      if(colour !== undefined){
        unused = unused.filter(c => c !== colour);
      }
    }

    if(shared_map[idx].length > 0){
      let shared_colours = shared_map[idx].map(s => results[s]).filter(c => c !== undefined);
      if(shared_colours.length > 0){
        unused = unused.filter(c => shared_colours.includes(c));
      }
    }

    if(unused.length > 0){
      results[idx] = unused[0];

      if (random() < 0.1 && depth < 20) {
        let r = random(['green', 'blue', 'purple', 'orange', 'pink']);
        console.log("Choosing random colour for piece", idx, "from", unused, "selected:", r);
        results[idx] = r
      } 
      
      
    } 

    if(shared_map[idx].length > 0){
      for(let i of shared_map[idx]){
        recursive_colour_map(depth++, i, results, input_colours);
      }
    }

    
  }

  return results;
}


function draw_polygon_test(){
  polylineA.draw();
  polylineD.draw();
  polylineE.draw();

  // polyCircleA.draw();
  // polyCircleB.draw();

  piecesB[0].draw();
  piecesB[1].draw();

  // piecesD[0].draw();
  // piecesD[1].draw();
  // piecesD[2].draw();
  // piecesD[3].draw();
  // piecesD[4].draw();





  for(let i = 0; i < final.length; i++){
    let piece = final[i];
    let c = colour_map[i];
    if(c === undefined) {
      c = color(255, 255, 255);
    } else {
      c = color(c);
    }
    fill(c);
    // noFill();
    piece.draw();
    fill(0);
    // text(i, piece.centroid().x, piece.centroid().y);
  }
}
