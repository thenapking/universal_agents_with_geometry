// PLAN
// 1. One coffer, replicating existing code / 
// 2. Two non-intersecting coffers /
// 3. Multiple intersecting coffers /
// 4. Street fill randomness relative to distance from centre /
// 5. Adjacent polygons must not have the same fill type or colour /
// 6. Adjacent polygons can be unioned
// 7. Three intersecting coffers, plus smaller coffers which may be complete contained within a larger coffer /
// 8. Outer polygon
// 9. Data from slime mould

// IMPROVEMENTS / BUG FIXES
// Spawning does not tessellate fully
// Find min-hatching size for pens
// Hatching missing lines bug
// Hatching spacing
// Subdivide spacing
// Minimum area
// River crazyness DONE
// Multi intersection Craziness DONE
// Fix resolution based intersection issues


// Set the fill type of each polygon based on its area
let SMALL =  [ 'black', 'blank', 'downwards', 'upwards', 'vertical', 'pips' ]
let MEDIUM = [ 'black', 'blank', 'downwards', 'upwards', 'circles'  ]
let LARGE =  [ 'blank' ];  
let colours = ['brown', 'yellow', 'grey', 'pink', 'orange', 'blue', 'red', 'green', 'purple',  'cyan', 'magenta'];
class Coffer {
  constructor(polygon) {
    this.polygon = polygon;
    this.pieces = [];
    this.polygons = [polygon];
  }

  add_piece(polygon, fill_type, fill_object, colour, area_type, area, area_ratio, bounding_box_area) {
    this.pieces.push({polygon: polygon, fill_type: fill_type, colour: colour, fill: fill_object, 
      area_type: area_type, area: area, area_ratio: area_ratio, bounding_box_area: bounding_box_area});
  };

  split_by_poly_roads(point_arrays, road_width = LARGE_SW, detail = 0.1) {
    for(let points of point_arrays){
      let new_pieces = []

      let polyline = new Polyline(points);
      polyline.simplify(detail)
      let road = polyline.to_polygon(road_width); 

      for(let polygon of this.polygons){
        let results = polygon.difference(road);
        for(let result of results){
          new_pieces.push(result);
        }
        console.log(new_pieces)
      }
      this.polygons = new_pieces;
    }
  }

  split_by_line(point_arrays, detail = 0.1) {
    for(let points of point_arrays){
      if(this.polygons.length > 1000) { return; }
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

  fill(c){
    for(let polygon of this.polygons){
      const [minX, minY, maxX, maxY] = polygon.bounds();
      let W = maxX - minX;
      let H = maxY - minY;
      let bounding_box_area = W * H;
      let area = polygon.area();
      let area_ratio = polygon.max_diameter() / polygon.min_diameter(); 
  
      let fill_type = 'blank';
      let fill_types = []
      let area_type;

      if(area <  200){
        area_type = 'tiny';
        fill_types = ['blank']
      } else if(area < 6000) {
        area_type = 'small';
        fill_types = SMALL
      } else if(area < 40000) {
        area_type = 'medium';
        fill_types = MEDIUM
      } else {
        area_type = 'large';
        fill_types = LARGE
      }
      
      
      let cidx = colours.indexOf(c);
      let colour = colours[cidx] || 'grey';

      fill_type = fill_types[cidx] || fill_types[0];

  
      let pc = polygon.centroid();
      let stD = W/5
      let dst = dist(pc.x, pc.y, W/2, H/2);
      let prob = exp(-0.5 * pow(dst / stD, 2));
  
      if(random(1) < prob){ fill_type = 'blank'; }
      
      
      let fill_object;
      if(area_ratio < 2 && (area_type == 'large' || area_type == 'medium')) { fill_type = 'housing'}

      console.log("FILL", fill_type, colour, area_type);

      if(fill_type === 'downwards' || fill_type === 'upwards' || fill_type === 'black') {
        let sw = fill_type === 'black' ? 6 : 9;
        let final_fill_type = fill_type === 'black' ? 'downwards' : fill_type;  
        fill_object = new Hatching(polygon, sw, final_fill_type);
        fill_object.hatch(final_fill_type);
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
        this.add_piece(polygon, fill_type, fill_object, colour, area_type, area, area_ratio, bounding_box_area);
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
            let sw = area > CIVIC ? 12 : 9;
            let fill_object = new Hatching(piece, sw, direction);
            fill_object.hatch(direction);
            this.add_piece(piece, fill_type, fill_object, colour, area_type, area, area_ratio, bounding_box_area);
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

    if(this.pieces.length === 0) {
      for(let polygon of this.polygons) {
        polygon.draw();
      }
    }
  }
}

let houses;

let coffers = [];

function create_coffers(list){
  // let road_points = get_contour(WATER_LEVEL);
  let poly_roads = [polylineA, polylineD];

  let potential_coffers = multi_disjoint(list)

  for(let polyline of poly_roads){
    potential_coffers = split_polygons(potential_coffers, polyline);
  }

  for(let shape of potential_coffers){
    let coffer = new Coffer(shape);
    coffers.push(coffer);
  }

  
  adjacency_map = create_adjacency_map(coffers)
  shared_map = find_shared_vertices(coffers, adjacency_map);
  colour_map = full_recursive_colour_map(coffers);

  for(let i=0; i < coffers.length; i++){
    let c = colour_map[i] || 'grey';
    let coffer = coffers[i];
    coffer.fill(c);
  }

}

function split_polygons(polygons, polyline){
  let new_polygons = [];
  for(let polygon of polygons){
    let results = polygon.split(polyline);

    for(let result of results){
      new_polygons.push(result);
    }
  }
    
  return new_polygons;
}

function create_adjacency_map(coffers){
  let result = [];
  for(let i = 0; i < coffers.length; i++){
    result[i] = [];
    let coffer = coffers[i];
    for(let j = 0; j < coffers.length; j++){
      if(i === j) continue;
      let other = coffers[j];
      if(coffer.polygon.adjacent(other.polygon)){
        result[i].push(j);
      }
    }
  }
  return result;
}

function find_shared_vertices(coffers, adjacency_map){
  let result = [];
  let tolerance = 1e-6; // Tolerance for vertex comparison
  for(let i = 0; i < coffers.length; i++){
    result[i] = [];
    let coffer = coffers[i];
    for(let j = 0; j < coffers.length; j++){
      if(i === j) continue;
      if(adjacency_map[i].includes(j)) continue;
      let other = coffers[j];
      let found = false;
      for(let s of coffer.polygon.segments[0]){
        for(let t of other.polygon.segments[0]){
          if(p5.Vector.dist(s.start, t.start) < tolerance || 
             p5.Vector.dist(s.start, t.end)   < tolerance || 
             p5.Vector.dist(s.end, t.start)   < tolerance || 
             p5.Vector.dist(s.end, t.end)     < tolerance){
            result[i].push(j);
            found = true; 
            break;
          }
        }
        if(found) { break; }
      }
    }
  }
  return result;
}

function recursive_colour_map(depth = 0, idx = 0, results = [], input_colours){
  if(depth > 100) { console.log("Recursion depth exceeded for piece", idx);
    results[idx] = 'pink'; // Fallback colour
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
    } 

    if(shared_map[idx].length > 0){
      for(let i of shared_map[idx]){
        recursive_colour_map(depth++, i, results, input_colours);
      }
    }

    
  }

  return results;
}

function full_recursive_colour_map(final) {
  let results = [];
  for (let i = 0; i < final.length; i++) {
    if (results[i] === undefined) {
      recursive_colour_map(0, i, results, colours );
    }
  }

  return results;
}





