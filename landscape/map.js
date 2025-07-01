const isoStep = 0.015;
const noiseScale = 0.0006;
const resolution = 20; // this affects the intersection accuracy
const margin = 100; // margin in pixels

let cols, rows;
let values = [];
let grouped_values = {};
let min_threshold = 1.0;
let max_threshold = 0.0;
let WATER_LEVEL;
function create_noise_field() {
  cols = floor((width + 2 * margin) / resolution);
  rows = floor((height + 2 * margin) / resolution);
  values = [];
  grouped_values = {};
  min_threshold = 1.0;
  max_threshold = 0.0;

  for (let i = 0; i <= cols; i++) {
    values[i] = [];
    for (let j = 0; j <= rows; j++) {
      let x = (i * resolution - margin) * noiseScale;
      let y = (j * resolution - margin) * noiseScale;
      let v = fbm(x, y);

      values[i][j] = v;

      let k = Math.floor(v * 100) / 100;
      grouped_values[k] = (grouped_values[k] || 0) + 1;
      min_threshold = min(min_threshold, v);
      max_threshold = max(max_threshold, v);
    }
  }

  let keys = Object.keys(grouped_values).map(parseFloat).sort((a, b) => a - b);
  WATER_LEVEL = keys[Math.floor(keys.length * 0.5)] - isoStep;

  console.log("Water level:", WATER_LEVEL, "Min:", min_threshold, "Max:", max_threshold);
  create_flow_field?.(); // optional
}

function fbm(x, y, octaves=5) {
  let sum = 0, amp = 1, freq = 1
  for (let i = 0; i < octaves; i++) {
    sum   += amp * noise(x * freq, y * freq);
    freq  *= 1.5; // was 2
    amp   *= 0.5;
  }
  return sum;
}

function get_contour(level = WATER_LEVEL) {
  let raw_segments = marchingSquares(values, cols, rows, resolution, level);
  let chains = link_segments(raw_segments, 0.5);

  if (chains.length === 0) return [];

  chains.sort((a, b) => b.length - a.length);
  let longest = chains[0];
  let results = longest.map(p => createVector(p.x, p.y));
  console.log(results)
  return results
}
function link_segments(segments, tolerance = 0.5) {
  let chains = [];

  while (segments.length > 0) {
    let [start, end] = segments.pop();
    let chain = [start, end];

    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < segments.length; i++) {
        let [s, e] = segments[i];
        let head = chain[0];
        let tail = chain[chain.length - 1];

        if (dist(tail.x, tail.y, s.x, s.y) < tolerance) {
          chain.push(e); segments.splice(i, 1); changed = true; break;
        } else if (dist(tail.x, tail.y, e.x, e.y) < tolerance) {
          chain.push(s); segments.splice(i, 1); changed = true; break;
        } else if (dist(head.x, head.y, s.x, s.y) < tolerance) {
          chain.unshift(e); segments.splice(i, 1); changed = true; break;
        } else if (dist(head.x, head.y, e.x, e.y) < tolerance) {
          chain.unshift(s); segments.splice(i, 1); changed = true; break;
        }
      }
    }

    chains.push(chain);
  }

  return chains;
}

function marchingSquares(grid, cols, rows, resolution, threshold) {
  let segments = [];

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let vTL = grid[i][j];
      let vTR = grid[i + 1][j];
      let vBR = grid[i + 1][j + 1];
      let vBL = grid[i][j + 1];

      let tl = vTL > threshold ? 1 : 0;
      let tr = vTR > threshold ? 1 : 0;
      let br = vBR > threshold ? 1 : 0;
      let bl = vBL > threshold ? 1 : 0;
      let state = tl * 8 + tr * 4 + br * 2 + bl;

      let x = i * resolution - margin;
      let y = j * resolution - margin;

      let top = null, right = null, bottom = null, left = null;

      if ((vTL - threshold) * (vTR - threshold) < 0) {
        top = getIntersection(x, y, vTL, x + resolution, y, vTR, threshold);
      }
      if ((vTR - threshold) * (vBR - threshold) < 0) {
        right = getIntersection(x + resolution, y, vTR, x + resolution, y + resolution, vBR, threshold);
      }
      if ((vBL - threshold) * (vBR - threshold) < 0) {
        bottom = getIntersection(x, y + resolution, vBL, x + resolution, y + resolution, vBR, threshold);
      }
      if ((vTL - threshold) * (vBL - threshold) < 0) {
        left = getIntersection(x, y, vTL, x, y + resolution, vBL, threshold);
      }

      switch (state) {
        case 1: case 14: segments.push([left, bottom]); break;
        case 2: case 13: segments.push([bottom, right]); break;
        case 3: case 12: segments.push([left, right]); break;
        case 4: case 11: segments.push([top, right]); break;
        case 5:
          segments.push([top, left]);
          segments.push([bottom, right]);
          break;
        case 6: case 9: segments.push([top, bottom]); break;
        case 7: case 8: segments.push([top, left]); break;
        case 10:
          segments.push([top, right]);
          segments.push([bottom, left]);
          break;
        // cases 0 and 15: no contour segment
      }
    }
  }

  return segments;
}

function getIntersection(x1, y1, v1, x2, y2, v2, threshold) {
  if (abs(v2 - v1) < 1e-10) return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  let t = (threshold - v1) / (v2 - v1);
  return {
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t
  };
}

function below_water_level(position) {
  let col = constrain(floor((position.x + margin) / resolution), 0, cols);
  let row = constrain(floor((position.y + margin) / resolution), 0, rows);
  return values[col][row] > WATER_LEVEL;
}

function near_the_water_front(position) {
  let col = constrain(floor((position.x + margin) / resolution), 0, cols);
  let row = constrain(floor((position.y + margin) / resolution), 0, rows);
  let v = values[col][row];
  return v > WATER_LEVEL - 2 * isoStep && v < WATER_LEVEL;
}

function above_water_level(position) {
  return !below_water_level(position);
}

let flow_values = [];  
let max_fv = 0, min_fv = Infinity ;
function create_flow_field() {
  flow_values = [];
  for (let i = 0; i < cols; i++) {
    flow_values[i] = [];
    for (let j = 0; j < rows; j++) {
      let left  = values[max(i-1,0)][j];
      let right = values[min(i+1,cols-1)][j];
      let top   = values[i][max(j-1,0)];
      let bot   = values[i][min(j+1,rows-1)];

      // gradient ∇f = (df/dx, df/dy)
      let dfdx = (right - left)  / (2 * resolution);
      let dfdy = (bot   - top)   / (2 * resolution);

      // rotate by +90° to get tangent (or –90° depending on direction you prefer)
      // [tx, ty] = normalize( [-dfdy, dfdx] )
      let tx = -dfdy;
      let ty =  dfdx;
      let mag = sqrt(tx*tx + ty*ty) || 1;

      flow_values[i][j] = createVector(tx/mag, ty/mag).rotate(HALF_PI).heading();
    }
  }
}


function draw_grid(grid_size, nsq = 5){
  push()
    for(let i = 0; i < FW + 1; i+=grid_size){
      let sw = i%nsq == 0 ? 0.8 : 0.65;
      strokeWeight(sw);
      line(0, 0, 0, FH);
      translate(grid_size, 0)
    }
  pop()

  push()
    for(let j = 0; j < FH + 1; j+=grid_size){
      let sw = j%nsq == 0 ? 0.8 : 0.65;
      strokeWeight(sw);
      line(0, 0, FW, 0);
      translate(0, grid_size)
    }
  pop()
}



