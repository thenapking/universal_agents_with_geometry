// Test filling with reference to A Mashiro

let piecesB, piecesAC, piecesCA, piecesC, piecesD, piecesE;
let polygonD, adjacency_map, colour_map, shared_map, final;
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
    W/8, W/8, 150
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
  polylineD = new Polyline(pD);
 
  polylineB = new Polyline(pB);
  polygonB = polylineB.to_polygon(20)
  polygonC = polylineC.to_polygon(20);


  piecesB = polygonB.split(polylineA);

  // it works better to use the greiner horman algorithm
  // it also works better to split by the lines afterwards
  piecesD = disjoint([polyCircleA, polygonC], true)


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

  final = piecesE.concat(piecesB);

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
      recursive_colour_map(i, results);
    }
  }

  return results;
}

function recursive_colour_map(idx = 0, results = []){
  if(results[idx] == undefined) {
    let neighbours = adjacency_map[idx];
    let unused = [...colours];

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
      console.log("Unused colours for piece", idx, unused);
      results[idx] = unused[0];
    } 

    if(shared_map[idx].length > 0){
      for(let i of shared_map[idx]){
        recursive_colour_map(i, results);
      }
    }
  }

  return results;
}
