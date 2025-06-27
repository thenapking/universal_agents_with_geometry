
////////////////////////////////////////////////////////////////
// SCENE CREATION
// Create the scene by splitting the polygons with the polylines

let template;
// {foci: [createVector(W/2, H/2)], offscreen_foci: [createVector(W + 2*BW + 2*MBW, 0)]};
class Scene {
  constructor(template){
    this.foci = template.foci || [];
    this.focus = this.foci[0] 
    this.points = [];
    this.polylines = [];
    this.offscreen_foci = template.offscreen_foci || [];
    this.offscreen_points = [];
    this.offscreen_lines = [];
    this.offscreen_hotspots = []; 
    this.hotspots = [];
    this.graph = new Graph(hotspots, connections);
    this.focus_roads = []
    this.create_scene();
  }

  create_scene(){
    this.create_lines();
    this.create_onscreen_foci_from_offscreen_lines()
    this.offscreen_hotspots = this.find_hotspots(this.offscreen_foci, false);
    this.hotspots = this.find_hotspots(this.foci, false);
    this.create_offscreen_connections();
    for(let h of this.hotspots){
      let p = this.create_onscreen_connections(h, 100);
      this.focus_roads.push(p);
    }
  }

  create_offscreen_connections(){
    this.roads = [];
    let selected = this.offscreen_hotspots.concat(this.hotspots);

    // TODO, lines self intersect if the sw > 5
    for(let h of selected){
      for(let other of selected){
        if(h.id === other.id){ continue; }
        let road_points = this.graph.shortest(h.id, other.id);
        let polyline = new Polyline(road_points).to_bezier(40);
        let intersects = false;
        for(let existing of this.roads){
          if(polyline.intersects(existing)){
            intersects = true;
            break;
          }
        }
        if(intersects){ continue; }
        this.roads.push(polyline);
      }
    }
  }

  create_onscreen_connections(hotspot, r){
    let selected = []
    let f = createVector(hotspot.position.x, hotspot.position.y);
    console.log("Creating onscreen connections for hotspot: ", hotspot.id, " at ", f.x, f.y);
    for(let connection of connections){
      let fx = connection.from.position.x;
      let fy = connection.from.position.y;
      let tx = connection.to.position.x;
      let ty = connection.to.position.y;
      let from = createVector(fx, fy);
      let to = createVector(tx, ty);
      if(p5.Vector.dist(from, f) < r || p5.Vector.dist(to, f) < r){
        console.log("Adding connection from", connection.from.id, "to", connection.to.id);
        for(let i = 0; i < hotspots.length; i++){
          let hh = hotspots[i];
          if(hh.id === connection.from.id){
            console.log("From hotspot found:", hh.id, "at", i);
          }
          if(hh.id === connection.to.id){
            console.log("To hotspot found:", hh.id, "at", i);
          }
        }
        let pl = new Polyline([from, to]).to_bezier(40).to_polygon(5, 'road');
        selected.push(pl);
      }
    }

    let unionized = selected[0];
    for(let i = 1; i < selected.length; i++){
      unionized = unionized.union(selected[i])[0];
    }

    return unionized

  }

  create_lines(){
    this.add_full_line(this.foci[0], this.offscreen_foci[0], createVector(BW + MBW, BW + MBW) );
    for(let i = 1; i < this.offscreen_foci.length; i++){
      this.add_crosshairs(this.offscreen_foci[i]);
    }
  }

  create_onscreen_foci_from_offscreen_lines(){
    for(let a of this.offscreen_lines){
      for(let b of this.offscreen_lines){
        if(a === b) continue; // Avoid self-comparison
        let intersection = a.intersection(b);
        if(intersection.length > 0){
          let x = intersection[0].x - (BW + MBW);
          let y = intersection[0].y - (BW + MBW);
          this.foci.push(createVector(x, y));
        }
      }
    }
  }

  find_hotspots(points, major){
    let hotspots = [];
    for(let p of points){
      let nearest = this.find_nearest_hotspot(p, major);
      if(!nearest) continue; // No nearest hotspot found
      if(hotspots.some(h => h.id === nearest.id)) continue; // Avoid duplicates
      hotspots.push(nearest)
    }
    return hotspots;
  }

  find_nearest_hotspot(p, major = true){
    let nearest = null;
    let min_dist = Infinity;

    let hotspots = major ? major_hotspots : minor_hotspots; 

    for(let hotspot of hotspots){
      // TODO: remove this when adding connections
      let position = createVector(hotspot.position.x, hotspot.position.y).sub(MBW, 3*MBW);
      let d = p5.Vector.dist(p, position);
      if(d < min_dist){
        min_dist = d;
        nearest = hotspot;
      }
    }

    return nearest;
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
    console.log(a)
    let a1 = a.copy().add(trans);
    let b1 = a.copy().mult(1,0).add(trans);
    let b2 = a.copy().mult(0,1).add(trans);
    let l1 = this.full_line(a1, b1);
    let l2 = this.full_line(a1, b2);
    this.offscreen_lines.push(l1);
    this.offscreen_lines.push(l2);
    return [l1, l2];
  }

  perpendicular(l, p){
    let start = l.points[0];
    let end = l.points[l.points.length - 1];
    let lv = p5.Vector.sub(end, start);
    let pv = p5.Vector.sub(p, start);
    let projection = lv.copy().mult(pv.dot(lv) / lv.dot(lv));
    let perpendicular_point = p5.Vector.add(start, projection);

    console.log("Perpendicular point:", perpendicular_point.x, perpendicular_point.y);
    return perpendicular_point;
  }

  help(){
    push()
    translate(MBW, MBW);
    translate(BW, BW);
    let h = this.hotspots[0];
    let x = h.position.x - MBW;
    let y = h.position.y - 3*MBW;

    let c = this.focus_roads[0];
    let pf = c.outer[11]
    let pt = c.outer[12]
    let pfx = pf.x - MBW;
    let pfy = pf.y - 3*MBW;
    let ptx = pt.x - MBW;
    let pty = pt.y - 3*MBW;

    fill(0, 255, 0);
    // circle(x, y, 20);
    noFill();
    line(pfx, pfy, ptx, pty);
    
    pop();
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

      fill(255, 0, 0);
      for(let p of this.offscreen_hotspots){
        let x = p.position.x - MBW;
        let y = p.position.y - 3*MBW;
        circle(x, y, 10);
        text(p.id, x + 10, y + 10);
      }

     
      
      

      // visible area
      noFill();
      translate(MBW, MBW);
      rect(VW/2, VH/2, VW, VH); 

     
      // image area
      translate(BW, BW);
      rect(W/2, H/2, W, H);

      

      noFill();
      for(let f of this.foci){
        circle(f.x, f.y, 10);
      }

      
      


      translate(-MBW,-3*MBW)
      
      for(let p of this.hotspots){
        fill(0, 255, 0);

        let x = p.position.x ;
        let y = p.position.y;
        circle(x, y, 10);
        fill(0)
        text(p.id, x + 10, y + 10);
        noFill();
        circle(x, y, 200)

      }

      for(let l of this.roads){
        l.draw();
      }


      fill(0, 0, 255);
      for(let r of this.focus_roads){
        r.draw();
      }
      noFill();


     
      

    pop();
  }

  
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


