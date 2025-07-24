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


function deterministic_shuffle(arr) {
  let a = [...arr]; 
  for (let i = a.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function set_seeds(){
  seed = Math.floor(Math.random() * 1000000);
  // seed =  136482
  // seed =  250765
  // seed = 504760
  // seed = 90640
  // seed =  166449
  // seed =  43430
  // seed =  414118
  // seed =  835476

  // seed =  954640
  // seed =  362367
  // seed =  491539
  // seed =  30924
  console.log("seed = ", seed);

  randomSeed(seed);
  noiseSeed(seed);
}



function keyPressed(){
  if(key == 's'){
    save("cities.png");
  } 

  if (key.toLowerCase() === "p") {
    exporting = true;
    redraw();
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
        console.log(`Coffer is: ${coffer.type}, with colour: ${coffer.colour}, with fill ${coffer.fill_type}`);
        if(coffer.error_message) { console.log(`Coffer message: ${coffer.error_message}`);}
        console.log(coffer);
        console.log(coffer.polygon);
        stroke(255,0,0);
        coffer.polygon.draw();
      }
    }

    for(let node of scene.graph.nodes){
      if(p5.Vector.dist(point, node.position) < 5){
        console.log(`Clicked on node at (${node.position.x}, ${node.position.y})`);
        console.log(`Node ID: ${node.id}, index: ${scene.graph.nodes.indexOf(node)}`);
        console.log(node);
      }
    }

    for(let sector of scene.sectors){
      if(sector.contains(point)){
        console.log(`Clicked on sector polygon ${sector.id}`);
        console.log(sector);
        stroke(255,0,0);
        sector.draw()
      }
    }

    for(let village of scene.villages){
      if(village.contains(point)){
        console.log(`Clicked on village ${village.id}`);
        console.log(village);
        stroke(0,0,255);
        village.draw();
      }
    }

    for(let road of scene.roads){
      if(road.contains(point)){
        console.log(`Clicked on road ${road.id}`);
        console.log(road);
        stroke(0,255,0);
        noFill();
        road.draw();
      }
    }


  }
}
