// Test filling with reference to A Mashiro

let piecesA, piecesB, piecesAC, piecesCA, piecesC, piecesD, piecesE, piecesF, piecesG, piecesH;
let polygonD, adjacency_map, colour_map, shared_map, final;


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
    W/3, W/3, 100, 'city'
  );

  polyCircleB = new RegularPolygon(
    mih0.position.x * sf, mih0.position.y * sf,
    W/10, W/10, 100, 'decoration'
  );

  polyCircleC = new RegularPolygon( 
    mih1.position.x * sf, mih1.position.y * sf,
    W/12, W/12, 100, 'decoration'
  );

  polyCircleD = new RegularPolygon(
    mih2.position.x * sf, mih2.position.y * sf,
    W/16, W/16, 100, 'decoration'
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

  let r1 = all_roads[0].to_polygon(INTERCITY_ROAD, 'road');
  let r2 = all_roads[1].to_polygon(INTERCITY_ROAD, 'road');
  let r3 = all_roads[2].to_polygon(INTERCITY_ROAD, 'road');
  let r4 = all_roads[3].to_polygon(INTERCITY_ROAD, 'road');
  let r5 = all_roads[4].to_polygon(INTERCITY_ROAD, 'road');
  let long_road = r1.union(r2)[0].union(r3)[0].union(r4)[0];
  
  let res = piecesB.concat(piecesC).concat(piecesE).concat([polyCircleA, polyCircleB, polyCircleC, polyCircleD]).concat([long_road, r5]);
  create_coffers(res, [])



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


// OLD SCENE TEST
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




