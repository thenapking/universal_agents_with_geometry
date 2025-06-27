// TODO:

// fix circle filling
// eliminate vertical / horizontal fill?
// fix diagonal shading
// Intersection - is it just resolution / circle vertices?
// fix + identify bugs

// new:
// add dashed lines
// add grid lines
// add network lines

// fills:
// test filling logic
// countour fill
// dots/lines parallel to roads
// dahsed lines for paths


let DPI= 96;
let wi = 7;
let hi = 10;
let bwi = 0.25;
let mbwi = 1
let W = wi * DPI;
let H = hi * DPI;
let BW = bwi * DPI;
let MBW = mbwi * DPI;
let FW = W + 2 * BW + 2 * MBW;
let FH = H + 2 * BW + 2 * MBW;
let VW = W + 2 * BW;
let VH = H + 2 * BW;

let MARGIN = 1;
let BORDER_MARGIN = 5;
let POLYGONAL_DETAIL = 360;
let SF = 0.9

let INTERCITY_ROAD = 6
let MAJOR_ROAD = 4.5;
let MINOR_ROAD = 3;
let SMALL_HATCH = 4
let MEDIUM_HATCH = 6;
let LARGE_HATCH = 10;


let PHI;



let exporting = false;


let groups = [];
let active_group_id = 0;

let scene;

let seed; 

function preload() {
  load_data(2)
}

function setup(){
  createCanvas(FW, FH);

  seed = Math.floor(Math.random() * 1000000);
  console.log("seed = ", seed);
  randomSeed(seed);
  noiseSeed(seed);
  
  pixelDensity(1);

  setup_svg();

  
  create_noise_field()
 

  process_data();
  // test_slime();
  frameRate(1);
  template = {
    foci: [
      createVector(W/2, H/2)
    ], 
    offscreen_foci: [
      // createVector(W + 2*BW + 2*MBW, 0),
      createVector(0, 0),
      createVector(W + 2*BW + 2*MBW, H/4 + BW + MBW),
      createVector(W + 2*BW + 2*MBW, 3*H/4 + BW + MBW),
      // createVector(W/4 + BW + MBW, 0),
      // createVector(3*W/4 + BW + MBW, 0),
    ]};
  // scene = new Scene(template)
  // scene.draw();

  default_setup()
  
}

let ctx = 0;
function draw(){
  
  translate(BW, BW-2*MBW);
  // join_connections()
  // for(let c of connections){
  //   if(c.active === false) { continue; }
  //   let from = createVector(c.from.position.x, c.from.position.y) 
  //   let to = createVector(c.to.position.x, c.to.position.y) 
  //   let points = c.points || [];
  //   points.push(to);
  //   points.unshift(from);
  //   let pl = new Polyline(points)
  //   let poly = pl.to_polygon(5);
  //   push();
  //     poly.draw();
  //   pop();
  // }

  let traversed_paths = traverse_connections();
  stroke(0, 255, 0);
  noFill();
  for(let path of traversed_paths){
    let points = []
    for(let c of path){
      points.push(createVector(c.position.x, c.position.y));
    }
    if(points.length < 2) { continue; }
    let pl = new Polyline(points);
    let poly = pl.to_polygon(5);
    push();
      pl.draw();
    pop();
  }

  stroke(0, 0, 255);

  
  noLoop();
  
  // animation_draw();

  // stroke(255,0,0)
  // let p = coffers[ctx]
  // if(p){
  //   p.draw();
  //   ctx++

  // } else{
  //   noLoop();
  // }
}

function join_connections() {
  let connections_joined = true;

  // Repeat until no more connections are joined
  while (connections_joined) {
    connections_joined = false;  // Reset the flag

    // Iterate over all hotspots
    for (let i = 0; i < hotspots.length; i++) {
      let from_hotspot = hotspots[i];

      // Find all connections starting from this hotspot
      let joinable = connections.filter(c => c.from.id === from_hotspot.id && c.active !== false);

      // If there is exactly one connection from this hotspot, attempt to join it
      if (joinable.length === 1) {
        let connection = joinable[0];
        let to_hotspot = hotspots.find(h => h.id === connection.to.id);
        
        // Find connections that are directly reachable from `to_hotspot`
        let removable = connections.filter(c => c.from.id === connection.to.id && c.active !== false);

        // If there's exactly one connection going out from `to_hotspot`, join the paths
        if (removable.length === 1) {
          let removable_connection = removable[0];

          // Mark the `to_hotspot` as inactive (because it's part of the merged path)
          to_hotspot.active = false;

          // Merge the two connections into one
          connection.to = removable_connection.to;
          connection.to_id = removable_connection.to_id;

          // Merge the points (join the endpoints)
          connection.points = connection.points || [];
          connection.points.push(createVector(to_hotspot.position.x, to_hotspot.position.y));

          // Mark the removable connection as inactive (it was merged)
          removable_connection.active = false;

          // Increment the joined count and set the flag to true
          connections_joined = true;
        }
      }
    }
  }

  console.log("Pruning complete. Remaining connections:", connections);
}


// This works until it finds a cycle.
// When it does that it should split the cycle off from the path and push it to paths.
// Then we need to continue traversing the rest of the connections.
// One idea is that we should go backwards from the first node.  Or perhaps we should go backwards and forwards at each step!
// Extending the path from one end to the other.
function traverse_connections() {
  let visited = new Set();  // To track globally visited nodes (across all paths)
  let paths = [];  // To store all valid paths (including cycles)

  // Iterate through each hotspot
  for (let i = 0; i < hotspots.length; i++) {
    let current = hotspots[i];
    if (!visited.has(current.id)) {
      let path = [];
      let stack = [];  // Use stack for backtracking (to track the current path)

      // Start the traversal from the current hotspot
      stack.push(current);
      visited.add(current.id);

      // Traverse until no further connections are found or cycle is detected
      let counter = 0;
      while (stack.length > 0 && counter < 100) {
        let currentNode = stack[stack.length - 1];
        path.push(currentNode);
        counter++;

        // Find the next unvisited connection
        let nextConnection = connections.find(c => c.from.id === currentNode.id);

        if (nextConnection) {
          let nextHotspot = nextConnection.to;
          if (stack.includes(nextHotspot)) {
            // We found a cycle! (node already in the stack means cycle)
            
            path.push(nextHotspot);
            console.log("Cycle detected:", path[0].id, "->", nextHotspot.id);
            paths.push(path);
            break;  // Exit the loop once the cycle is detected
          }
          // if( visited.has(nextHotspot.id)) { break; }
          stack.push(nextHotspot);
          visited.add(nextHotspot.id);
        } else {
          // If no more connections, break out of the loop
          stack.pop();
        }
      }

      // If the path is longer than 1, it's a valid path (avoid paths of length 1)
      if (path.length > 1 && !paths.includes(path)) {
        paths.push(path);
      }
    }
  }

  return paths;
}





// function traverse_connections(){
//   let visited = new Set();
//   let paths = [];
//   for(let i = 0; i < hotspots.length; i++){
//     let current = hotspots[i];
//     let path = [];
//     while (current && !visited.has(current.id)) {
//       visited.add(current.id);
//       path.push(current);
      
//       // Find the next connection
//       let nextConnection = connections.find(c => c.from.id === current.id && !visited.has(c.to.id));
//       if (nextConnection) {
//         current = nextConnection.to;
//       } else {
//         // If no next connection, break the loop
//         break;
//       }
//     }
//     if(path.length > 0) {
//       paths.push(path);
//     }
//   }
//   return paths
// }


// fill(0,255,0)
// for(let h of minor_hotspots){
//   let x = h.position.x - MBW;
//   let y = h.position.y - 3*MBW;
//   // circle(x,y, 10);
// }
// noLoop();

function animation_draw(){
  let active = update_groups();

  if(active > 0){
    push()
      // default_setup()

      draw_coffers();
      draw_groups();
    pop()


    draw_borders();

  } else {
    
    if(exporting){ 
      let file_name = `output_${seed}.svg`;
      console.log("Exporting to: ", file_name);
      beginRecordSVG(this, file_name); 
    }

    push()
      // default_setup()
      draw_coffers();
      final_draw();
    pop()

    draw_borders();
    
    noLoop();

    if(exporting){ endRecordSVG(this); }
  }
}
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





function draw_coffers(){
  for(let coffer of coffers){
    coffer.draw();
  }
}


function draw_groups(){
  push();
    for (let group of groups) {
      group.draw();
    }
  pop();
}

function update_groups(){
  if(groups.length === 0) { return 0; }
  let active_group = groups[active_group_id];
  active_group.update();

  if(!active_group.active) {
    active_group_id++;
    if(active_group_id >= groups.length) {
      return 0;
    } else {
      active_group = groups[active_group_id];
    }
  }
  
  return 1
}

function default_setup(){
  background(240);
  stroke(0,0,0);
}
    
function draw_borders(){
  push();
    noStroke();
    fill(240);
    rect(0, 0, width, BW);
    rect(0, 0, BW, height);
    rect(width - BW, 0, BW, height);
    rect(0, height - BW, width, BW);
  pop();
}
