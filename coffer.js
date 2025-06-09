// PLAN
// 1. One coffer, replicating existing code / 
// 2. Two non-intersecting coffers /
// 3. Multiple intersecting coffers /
// 4. Street fill randomness relative to distance from centre
// 5. Adjacent polygons must not have the same fill type or colour DONE
// 6. Adjacent polygons can be unioned
// 7. Three intersecting coffers, plus smaller coffers which may be complete contained within a larger coffer
// 8. Outer polygon
// 9. Data from slime mould

// IMPROVEMENTS / BUG FIXES
// Spawning does not tessellate fully
// Find min-hatching size for pens
// Hatching missing lines bug
// Hatching spacing
// Minimum area
// River crazyness
// Vertical line crazyness


// Set the fill type of each polygon based on its area
let SMALL = ['hatching', 'circles']
let MEDIUM = ['housing', 'hatching', 'blank' ]
let LARGE = ['housing',  'hatching', 'blank'];  
let directions = ['horizontal', 'vertical', 'downwards', 'upwards'];
let colours = ['blue', 'red', 'green', 'purple', 'orange', 'brown', 'pink', 'black', 'grey', 'cyan', 'magenta'];

class Coffer {
  constructor(polygon) {
    this.polygon = polygon;
    this.pieces = [];
    this.polygons = [polygon];
  }

  add_piece(polygon, fill_type, fill_object, colour, direction) {
    this.pieces.push({polygon: polygon, fill_type: fill_type, colour: colour, fill: fill_object, direction: direction});
  }

  // TODO: add methods to divide it by
  // (a) grid and construction lines - NOT WORKING
  // (b) other polygons
  // (c) poly_roads /
  // (d) roads


  split_by_poly_roads(point_arrays, road_width = LARGE_SW, detail = 0.1) {
    for(let points of point_arrays){
      console.log("SPLITTING BY POLY ROADS", points);
      let new_pieces = []

      let polyline = new Polyline(points);
      polyline.simplify(detail)
      let road = polyline.to_polygon(road_width); 

      for(let polygon of this.polygons){
        let results = polygon.difference(road);
        console.log("results", results);
        for(let result of results){
          new_pieces.push(result);
        }
        console.log(new_pieces)
      }
      console.log("NEW PIECES", new_pieces.length, new_pieces);
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
      // console.log("FILLING POLYGON", polygon);
      const [minX, minY, maxX, maxY] = polygon.bounds();
      let W = maxX - minX;
      let H = maxY - minY;
      let area = W * H;
  
      let fill_type = 'blank';
      let fill_types = []
      let area_type;

      if(area <  200){
        area_type = 'tiny';
        fill_types = ['blank']
      } else if(area < 6000) {
        area_type = 'small';
        fill_types = shuffle(SMALL).slice();
      } else if(area < 21000) {
        area_type = 'medium';
        fill_types = shuffle(MEDIUM).slice();
      } else {
        area_type = 'large';
        fill_types = shuffle(LARGE).slice();
      }
      
      let available_colours = colours.slice()
      let available_directions = directions.slice();

      for(let other_coffer of coffers){
        for(let other of other_coffer.pieces) {
          if(other.polygon.adjacent(polygon)) {
            if(other.fill_type === 'blank') { continue; }

            let index = fill_types.indexOf(other.fill_type);
            let direction_index = available_directions.indexOf(other.direction);
            if(other.fill_type === 'hatching' ) {
              if(direction_index > -1) {
                // console.log("REMOVING DIRECTION", other.direction, "FROM AVAILABLE DIRECTIONS", available_directions);
                available_directions.splice(direction_index, 1);
              }
              if(available_directions.length === 0) {
                // console.log("NO DIRECTIONS LEFT, REMOVING FILL TYPE", other.fill_type, "FROM AVAILABLE FILL TYPES", fill_types);
                fill_types.splice(index, 1);
              }

            } else if(index > -1) {
              // console.log("REMOVING FILL TYPE", other.fill_type, "FROM AVAILABLE FILL TYPES", fill_types);

              fill_types.splice(index, 1);
            }
          }
        }
      }

      let colour = available_colours.length > 0 ? random(available_colours) : 'black'
      fill_type = fill_types.length > 0 ? random(fill_types) : 'blank';

  
      let pc = polygon.centroid();
      let stD = W/5
      let dst = dist(pc.x, pc.y, W/2, H/2);
      let prob = exp(-0.5 * pow(dst / stD, 2));
  
      if(random(1) < prob){ fill_type = 'blank'; }
      
      
      let fill_object;
      let direction;

      if(fill_type === 'hatching') {
        direction = random(available_directions);
  
        fill_object = new Hatching(polygon, 5, direction);
        fill_object.hatch(direction);
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
        this.add_piece(polygon, fill_type, fill_object, colour, direction);
        continue;
      }
  
      if(fill_type === 'housing') {
        let pieces = polygon.subdivide(random(100, 300))
        for(let piece of pieces){
          let area = piece.area();
          if(area > PARK){
            createCircularGroup(piece);
          } else {
            let direction = area > CIVIC ? 'downwards' : 'upwards';
            let sw = area > CIVIC ? 6 : 4;
            let fill_object = new Hatching(piece, sw, direction);
            fill_object.hatch(direction);
            this.add_piece(piece, fill_type, fill_object, colour, direction);
          }
        }
      }
    }
  }

  unsplit(){
    let new_polygons = []
    for(let polygon of this.polygons) {
      let found = false;
      if(polygon.area() < 100) {
        new_polygons.push(polygon);
        stroke(0, 0, 255, 50);
        polygon.draw();
        continue;
      }
      for(let other_coffer of coffers){
        for(let other_polygon of other_coffer.polygons) {
          
          if(polygon.adjacent(other_polygon)) {
            let found = random(1) < 0.0625;
            if(!found) { continue; }
            // console.log("UNSPLITTING POLYGONS", polygon, other_polygon);
            
            let new_piece = polygon.union(other_polygon);
            new_polygons.push(new_piece);
            let idx = other_coffer.polygons.indexOf(other_polygon);
            if(idx > -1) {
              other_coffer.polygons.splice(idx, 1);
            }
            break;
          }
        }
      }
      if(!found) {
        new_polygons.push(polygon);
        stroke(0, 0, 255, 50);
        polygon.draw();
      }
    }
    this.polygons = new_polygons;
  }

  draw(){
    stroke(0,0,0,50);
    strokeWeight(1);

    for(let piece of this.pieces) {
      if(piece.fill_type === 'housing') { continue }
      piece.polygon.draw();
      if(piece.fill) {
        piece.fill.draw();
      }
    }

    push();
    for(let piece of this.pieces) {
      if(piece.fill_type != 'housing') { continue }
      piece.polygon.draw();
      if(piece.fill) {
        piece.fill.draw();
      }
    }
    pop();
  }
}

let coffers = [];
function create_coffers(){
  let road_points = get_contour(WATER_LEVEL);
  let poly_roads = [polylines[2], polylines[3], polylines[4], polylines[0]];
  let potential_coffers = disjoint([polyCircleB, polyCircleC, polyCircleD, polyCircleE, polyCircleF, polyCircleG]);
  for(let shape of potential_coffers){
    let coffer = new Coffer(shape);
    coffer.split_by_poly_roads([road_points], 25)
    coffer.split_by_poly_roads(poly_roads, 6);
    coffers.push(coffer);
  }

  for(let coffer of coffers){
    coffer.unsplit();
  }

  for(let coffer of coffers){
    coffer.fill();
  } 


}



