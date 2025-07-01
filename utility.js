function setup_svg(){
  // Set important values for our SVG exporting: 
  setSvgResolutionDPI(DPI); // 96 is default
  setSvgPointRadius(0.25); // a "point" is a 0.25 circle by default
  setSvgCoordinatePrecision(4); // how many decimal digits; default is 4
  setSvgTransformPrecision(6); // how many decimal digits; default is 6
  setSvgIndent(SVG_INDENT_SPACES, 2); // or SVG_INDENT_NONE or SVG_INDENT_TABS
  setSvgDefaultStrokeColor('black'); 
  setSvgDefaultStrokeWeight(1); 
  setSvgFlattenTransforms(false); // if true: larger files, closer to original
}


// NOT USED
const memo = new Map();

function memoize(op, a, b, fn) {
  const key = `${op}:${a.id}-${b.id}`;
  if (memo.has(key)) return memo.get(key);

  const result = fn();
  memo.set(key, result);
  return result;
}


let connections = [], emitters = [], journeys = [], hotspots = [], major_hotspots, minor_hotspots;
function load_data(id){
  connections = load_file('connections', id);
  emitters = load_file('emitters', id);
  journeys = load_file('journeys', id);
  hotspots = load_file('hotspots', id);

  
}

let edges = [], nodes = [];
function process_data(){
  connections = process_file(connections);
  hotspots = process_file(hotspots)
  for(let i = 0; i < hotspots.length; i++){
    let h = hotspots[i];
    // TODO remove this translation
    let node = new Node(h.position.x, h.position.y - 2*MBW);
    nodes[i] = node;
  }

  for(let c of connections){
    let from = nodes[c.from_id];
    let to = nodes[c.to_id];
    let edge = new Edge(from, to);
    edges.push(edge);
  }
  emitters = process_file(emitters);
  journeys = process_file(journeys);
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

function deterministic_shuffle(arr) {
  let a = [...arr]; 
  for (let i = a.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}



function keyPressed(){
  if(key == 's'){
    save("cities.png");
  } 

  if (key.toLowerCase() === "p") {
    exporting = true;
  }
  
  if (key.toLowerCase() === "-" || key.toLowerCase() === "=") {  
    change_palette(key)
  } 
}
