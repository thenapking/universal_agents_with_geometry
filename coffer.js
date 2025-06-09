// PLAN
// 1. One coffer, replicating existing code / 
// 2. Two non-intersecting coffers /
// 3. Two intersecting coffers
// 4. Three intersecting coffers, plus smaller coffers which may be complete contained within a larger coffer
// 5. Street fill randomness relative to distance from centre
// 6. Outer polygon
// 7. Removing edges? Joining them to the country?
// 8. Data from slime mould

// IMPROVEMENTS / BUG FIXES
// Spawning does not tessellate fully
// Find min-hatching size for pens
// Hatching missing lines bug
// Hatching spacing
// Minimum area


// Set the fill type of each polygon based on its area
let SMALL = ['hatching', 'circles', 'circles']
let MEDIUM = ['housing', 'housing', ]
let LARGE = ['housing', 'housing', 'housing', 'housing', 'housing', 'blank',  'hatching', 'hatching'];  
let directions = ['horizontal', 'vertical', 'downwards', 'upwards'];
let colours = ['blue', 'red', 'green', 'black', 'purple', 'orange'];

class Coffer {
  constructor(polygon) {
    this.polygon = polygon;
    this.pieces = [];
    this.polygons = [polygon];
  }

  add_piece(polygon, fill_type, fill_object, colour) {
    this.pieces.push({polygon: polygon, fill_type: fill_type, colour: colour, fill: fill_object});
  }

  // TODO: add methods to divide it by
  // (a) grid and construction lines - NOT WORKING
  // (b) other polygons
  // (c) poly_roads /
  // (d) roads

  split_by_polygons(polygons){
    if(polygons.length === 0) { return; }
    for(let polygon of polygons){
      console.log("SPLITTING BY POLYGON", polygon);
      
      let new_pieces = [];
      
      for(let piece of this.polygons){
        let results = piece.difference(polygon);
        console.log("DIFFERENCES", results);

        // let intersection = piece.intersection(polygon);
        // results.push(intersection);
        // console.log("INTERSECTIONS", intersection);

        for(let result of results){
          new_pieces.push(result);
        }
      }
      this.polygons = new_pieces;
    }
    console.log("POLYGONS AFTER SPLITTING BY POLYGONS", this.polygons.length, this.polygons);
  }

  split_by_poly_roads(point_arrays, road_width = LARGE_SW, detail = 0.1) {
    for(let points of point_arrays){
      console.log("SPLITTING BY POLY ROADS", points);
      let new_pieces = []

      let polyline = new Polyline(points);
      polyline.simplify(detail)
      let road = polyline.to_polygon(road_width); 

      for(let polygon of this.polygons){
        let results = polygon.difference(road);

        for(let result of results){
          new_pieces.push(result);
        }
      }
      this.polygons = new_pieces;
      console.log("POLYGONS AFTER SPLIT", this.polygons.length, this.polygons);
    }
  }

  split_by_line(point_arrays, detail = 0.1) {
    for(let points of point_arrays){
      if(this.polygons.length > 1000) { return; }
      console.log("HERE WE GO AGAIN")
      console.log("SPLITTING BY LINES", points);
      let new_pieces =  []

      let polyline = new Polyline(points);
      polyline.simplify(detail);

      for(let polygon of this.polygons){
        let results = polygon.split(polyline);

        for(let result of results){
          new_pieces.push(result);
        }
      }
      this.polygons = new_pieces;
      console.log("POLYGONS AFTER SPLIT", this.polygons.length, this.polygons);

    }
  }

  fill(){
    for(let polygon of this.polygons){
      const [minX, minY, maxX, maxY] = polygon.bounds();
      let W = maxX - minX;
      let H = maxY - minY;
      let area = W * H;
  
      let fill_type = 'blank';
      let area_type;
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
  
      if(fill_type !== 'housing') {
        this.add_piece(polygon, fill_type, fill_object, colour);
        continue;
      }
  
      // if(fill_type === 'housing') {
      //   let pieces = polygon.subdivide(random(100, 300))
      //   for(let piece of pieces){
      //     let area = piece.area();
      //     if(area > PARK){
      //       createCircularGroup(piece);
      //     } else {
      //       let direction = area > CIVIC ? 'downwards' : 'upwards';
      //       let sw = area > CIVIC ? 6 : 4;
      //       let fill_object = new Hatching(piece, sw, direction);
      //       fill_object.hatch(direction);
      //       this.add_piece(piece, fill_type, fill_object, colour);
      //     }
      //   }
      // }
  
  
    }
  
  }

  draw(){
    for(let piece of this.pieces) {
      stroke(piece.colour);
      piece.polygon.draw();
      if(piece.fill) {
        piece.fill.draw();
      }
    }
  }
}


