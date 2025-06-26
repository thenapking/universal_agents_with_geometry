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

let connections0, processed_connections, g;
function test_slime(){
  let mh0 = major_hotspots[0];
  let mh1 = major_hotspots[1];
  let mh2 = major_hotspots[5];
  let mh3 = major_hotspots[4];
  let mh4 = major_hotspots[8];

  let mih0 = minor_hotspots[11];
  let mih1 = minor_hotspots[5];
  let mih2 = minor_hotspots[3];
  let selected = [mh0, mh1, mh2, mh3, mh4, mih0, mih1, mih2];
  let sf = 0.5
  polyCircleA = new RegularPolygon(
    mh0.position.x * sf, mh0.position.y * sf,
    W/3, W/3, 100
  );

  polyCircleB = new RegularPolygon(
    mih0.position.x * sf, mih0.position.y * sf,
    W/10, W/10, 100
  );

  polyCircleC = new RegularPolygon( 
    mih1.position.x * sf, mih1.position.y * sf,
    W/12, W/12, 100
  );

  polyCircleD = new RegularPolygon(
    mih2.position.x * sf, mih2.position.y * sf,
    W/16, W/16, 100
  );


  piecesB = concentric_circle(mh1.position.x * sf, mh1.position.y * sf, W/4, 10, 5);
  piecesC = concentric_circle(mh2.position.x * sf, mh2.position.y * sf, W/6, 10, 4);
  piecesD = concentric_circle(mh3.position.x * sf, mh3.position.y * sf, W/5, 10, 6);
  piecesE = concentric_circle(mh4.position.x * sf, mh4.position.y * sf, W/3 - 20, 40, 3);

  g = new Graph(hotspots, connections);
  let all_roads = [];

  // TODO, lines self intersect if the sw > 5

  for(let h of selected){
    for(let other of selected){
      if(h.id === other.id){ continue; }
      let road_points = g.shortest(h.id, other.id);
      let polyline = new Polyline(road_points).to_bezier(40);
      let intersects = false;
      for(let existing of all_roads){
        if(polyline.intersects(existing)){
          intersects = true;
          break;
        }
      }
      if(intersects){ continue; }
      all_roads.push(polyline);
    }
  }


  piecesF = []
  for(let road of all_roads){
    let poly = road.to_polygon(5);
    piecesF.push(poly);
  }
  let res = piecesB.concat(piecesF).concat(piecesC).concat(piecesE).concat([polyCircleA, polyCircleB, polyCircleC, polyCircleD]) 
  piecesG = multi_disjoint(res);



}


// connections0 = []
// for(let c of connections){
//   if(c.from_id == mh0.id || c.to_id == mh0.id){
//     connections0.push(c);
//   }
// }



// // processed_connections = []
// for(let c of connections){
//   let from = createVector(c.from.position.x * sf, c.from.position.y * sf);
//   let to = createVector(c.to.position.x * sf, c.to.position.y * sf);
  
//   let pl = new Polyline([from, to])
//   let poly = pl.to_polygon(5);
//   processed_connections.push(poly);
// }

// let full_union = processed_connections[0];
// for(let i = 1; i < processed_connections.length; i++){
//   let added =  full_union.union(processed_connections[i]);
 
//   full_union = added[0];
// }





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



let connections = [], emitters = [], journeys = [], hotspots = [], major_hotspots, minor_hotspots;
function load_data(id){
  connections = load_file('connections', id);
  emitters = load_file('emitters', id);
  journeys = load_file('journeys', id);
  hotspots = load_file('hotspots', id);

  
}

function process_data(){
  connections = process_file(connections);
  emitters = process_file(emitters);
  journeys = process_file(journeys);
  hotspots = process_file(hotspots)
  major_hotspots = hotspots.filter(h => h.major)
  minor_hotspots = hotspots.filter(h => !h.major)
  hotspots = hotspots.sort((a, b) => { return b.count - a.count; });
  major_hotspots = major_hotspots.sort((a, b) => { return b.count - a.count; });
  minor_hotspots = minor_hotspots.sort((a, b) => { return b.count - a.count; });
}

function load_file(model_name, id){
  return loadJSON('data/' + id + '/' + model_name +'.json');
}

function process_file(data){
  let processed = [];
  let keys = Object.keys(data);
  for(let key of keys){
    let d = data[int(key)];
    processed.push(d)
  }

  return processed;
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




