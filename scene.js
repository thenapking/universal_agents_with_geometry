
////////////////////////////////////////////////////////////////
// SCENE CREATION
// Create the scene by splitting the polygons with the polylines

let template;
// {foci: [createVector(W/2, H/2)], offscreen_foci: [createVector(W + 2*BW + 2*MBW, 0)]};
class Scene {
  constructor(template){
    this.foci = template.foci || [];
    this.focus = this.foci[0] 
    this.sizes = [100, 100, 100, 75, 75]
    this.points = [];
    this.polylines = [];
    this.polycircles = [];
    this.potential_coffers = [];
    this.offscreen_foci = template.offscreen_foci || [];
    this.offscreen_points = [];
    this.offscreen_lines = [];
    
    this.graph = new Graph(edges);
    this.c_graph = this.graph.louvain(3)
    this.roads = this.graph.to_polygon()
    
    this.create_scene();
  }

  create_scene(){
    this.create_lines();
    
    let potential_circles = this.c_graph.nodes.sort((a, b) => b.radius - a.radius)
    this.split_circles = []
    let p = potential_circles[0];
    this.polycircles = concentric_circle(p.position.x, p.position.y, p.radius/2, 30, 3);

    for(let i = 1; i < potential_circles.length; i++){
      let p = potential_circles[i];
      let polyCircle = new RegularPolygon(
        p.position.x, p.position.y,
        p.radius/2, p.radius/2, 300, 'city'
      );


      let valid = true;
      for(let other of this.polycircles){
        if(other.intersection(polyCircle).length > 0){
          valid = false;
          break;
        }
      }
      if(valid){
        let st = polyCircle.split(this.offscreen_lines[0]);
        console.log("Split result:", st);
        for(let s of st){
          this.polycircles.push(s);
        }
      }
    }
    let disjoint_circles = multi_disjoint(this.polycircles);

    this.disjoint_circles = disjoint_circles;
    for(let dC of disjoint_circles){
      let selected_roads = intersect_all(dC, this.roads);
      let unioned_roads = unionPolygons(this.roads);
      let xC = dC.xor(unioned_roads);
      console.log("XOR result:", xC);
      for(let r of xC){
        this.split_circles.push(r);
      }
    }

    create_coffers(this.split_circles);

    colour_coffers();
    
  }

  


  create_lines(){
    this.add_full_line(this.foci[0], this.offscreen_foci[0], createVector(BW + MBW, BW + MBW) );
    for(let i = 1; i < this.offscreen_foci.length; i++){
      this.add_crosshairs(this.offscreen_foci[i]);
    }
  }

  add_full_line(a, b, at = createVector(0, 0), bt = createVector(0, 0)){
    let l = this.full_line(a.copy().add(at), b.copy().add(bt));
    this.offscreen_lines.push(l);
    this.add_crosshairs(a, at);
  }

  full_line(a, b){
    // y = mx + c, m = dy / dx
    let d = p5.Vector.sub(b, a);

    if(d.x === 0) { 
      console.warn("Vertical line detected, using x-coordinate for line.");
      return new Polyline([createVector(a.x, 0), createVector(a.x, height)]);
    }
    
    let m = d.y / d.x;
    let c = a.y - m * a.x;
    let x1 = 0;
    let y1 = m * x1 + c;
    let x2 = width;
    let y2 = m * x2 + c;
    return new Polyline([createVector(x1, y1), createVector(x2, y2)]);
  }

  add_crosshairs(a, trans = createVector(0, 0)){
    let a1 = a.copy().add(trans);
    let b1 = a.copy().mult(1,0).add(trans);
    let b2 = a.copy().mult(0,1).add(trans);
    let l1 = this.full_line(a1, b1);
    let l2 = this.full_line(a1, b2);
    this.offscreen_lines.push(l1);
    this.offscreen_lines.push(l2);
    return [l1, l2];
  }


  

  draw(){
    push();
      noFill();
      stroke(100);
      strokeWeight(1);
      rectMode(CENTER)

      // full outer box
      rect(FW/2, FH/2, FW, FH);

      for(let o of this.offscreen_foci){
        circle(o.x, o.y, 10);
      }

      for(let l of this.offscreen_lines){
        l.draw();
      }

      for(let p of this.polycircles){
        p.draw();
      }

      stroke(0);
      for(let p of this.roads){
        noFill();
        p.draw();
        fill(0)
        text(p.id, p.outer[0].x, p.outer[0].y);
      }
      noFill();
      stroke(0, 0, 255);
      // for(let p of this.split_circles){
      //   p.draw();
      // }

      translate(BW + MBW, BW + MBW);
      rect(W/2, H/2, W, H);

    pop();
  }

  
}

function recursive_xor(polygons, lines, depth = 0) {
  if(depth > 10 || lines.length === 0) { return polygons; }
  let result = polygons;
  
  for (i = 0; i < lines.length; i++) {
      let l = lines.pop();
      let newResult = [];
      for (let polygon of result) {
          let xorResult = polygon.xor(l);
          if (xorResult.length > 1) {
            for(let newPoly of xorResult) {
              let final = recursive_xor([newPoly], lines, depth + 1);
              console.log(`Depth: ${depth}, Polygons:`, final);
              newResult.push(...final);
            }
          }
      }
      result = newResult;
  }
  
  return result;
}

function unionPolygons(polygons) {
  let current = polygons[0];
  
  for (let i = 1; i < polygons.length; i++) {
      let unionResult = current.union(polygons[i]);
      
      if (unionResult.length === 1) {
          current = unionResult[0];
      } else {
          // If multiple polygons are returned, handle recursively or by iterating
          current = mergeDisjointPolygons(unionResult);
      }
  }
  return current;
}

function mergeDisjointPolygons(polygonArray) {
  let result = polygonArray[0];
  for (let i = 1; i < polygonArray.length; i++) {
      result = result.union(polygonArray[i])[0]; // Merge them into one
  }
  return result;
}

function intersect_all(pcircle, lines){
  let results = [];
  for(let l of lines){
    let intersection = pcircle.intersection(l);
    if(intersection){
      results.push(...intersection);
    }
  }

  return results;
}

////////////////////////////////////////////////////////////////
let polylines = []
let poly_road;
let polygonA, polygonB, polylineA, polylineB, polyCircle;
let polyOuter, polyInner;


function concentric_circle(x, y, r, w, n){
  let pieces = [];

  for(let i = 0; i <= n; i++){
    let dA = i * w
    if(dA >= r) { break;}
    let type = i < n ? 'decoration' : 'city';

    let polyCircle = new RegularPolygon(
      x, y,
      r - dA, r - dA, 100, type
    );
   
    pieces.push(polyCircle);
  }

  return pieces
}


////////////////////////////////////////////////////////////////


