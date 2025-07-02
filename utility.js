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
  hotspot_to_node_ids = []
  for(let i = 0; i < hotspots.length; i++){
    let h = hotspots[i];
    // TODO remove this translation
    let node = new Node(h.position.x - 2*MBW, h.position.y - 4*MBW);
    nodes[i] = node;
  }

  for(let c of connections){
    let from = nodes[c.from_id];
    let to = nodes[c.to_id];
    let edge = new Edge(from, to);
    console.log(`Edge from ${c.from_id} to ${c.to_id} with ${edge.start_id} to ${edge.end_id}`);
    edges.push(edge);
  }
  emitters = process_file(emitters);
  journeys = process_file(journeys);
  major_hotspots = hotspots.filter(h => h.major)
  minor_hotspots = hotspots.filter(h => !h.major)
  // hotspots = hotspots.sort((a, b) => { return b.count - a.count; });
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

function mousePressed(){
  if(mouseButton == LEFT){
    console.log(`-------------Mouse pressed at (${mouseX}, ${mouseY})`);
    let point = createVector(mouseX, mouseY); 
    for(let coffer of coffers){
      if(coffer.polygon.contains(point)){ 
        console.log(`Clicked on coffer ${coffer.id} with polygon ${coffer.polygon.id}`);
        console.log(`Coffer is: ${coffer.fill_type}`);
        console.log(coffer);
        console.log(coffer.polygon);
      }
    }
  }
}
