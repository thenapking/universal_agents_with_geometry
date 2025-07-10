class Path {
  constructor(nodes) {
    this.nodes = nodes; // Array of nodes in the path
    this.points = []
    this.initialise();
  }

  initialise(){
    for(let node of this.nodes){
      let p = node.position;
      this.points.push(p)
    }
  }

  to_polyline(stroke_width, filter){
    let polyline = new Polyline(points).to_bezier(60)
    if(filter){
      return polyline.filter(stroke_width*2);
    } 
    
    return new Polyline(points).to_bezier(60);
  }

  to_polygon(stroke_width){
    if(stroke_width < 0.1) { return }

    let polyline = this.to_polyline(stroke_width);
    return polyline.to_polygon(stroke_width);
  }

  find_intersections(other){
    let a = other.nodes
    let b = this.nodes;

    let forward = this.find_forward_intersections(a, b);
    // all points in b are in a, return empty array
    if(forward === null){ return [] }
    if(forward.length > 0){ return forward }
    // console.log("Reversing b to find intersections with a");
    let reverse_b = b.slice().reverse();
    let reverse = this.find_forward_intersections(a, reverse_b);
    if(reverse.length > 0){
      return reverse 
    }
    return [this]
  }


  find_forward_intersections(a,b){
    // a,b are two routes of ids
    // this splits line b into subsections which are not included in a

    // ia is list of indices of intersections in a
    // ib is list of indices of intersections in b
    // console.log("--------Finding intersections");
    // console.log(a, b)
    let ia = [];
    let ib = []
    let points = []

    for(let i = 0; i < a.length; i++){
      let node = a[i];
      for(let j = 0; j < b.length; j++){
        let other = b[j];
        if(node === other){
          points.push(node);
          ia.push(i);
          ib.push(j);
        }
      }
    }

    // only one intersection
    if(ib.length < 2) { 
      console.log("Only one intersection found, returning original", [b]);
      return [this];
    }

    if(ib.length === b.length){
      console.log("All points in b are in a, returning empty array");
      return null;
    }

    // Sort the indicies in case one route traverses in an opposite direction
    ia = ia.sort((x, y) => x - y);
    ib = ib.sort((x, y) => x - y);

    

    let highest_index = 0;
    let subsequences = [];
    let previous_idx = 0;

    console.log("Found intersections at indices:", ia, ib);
    // now we find subsequences between the intersection points
    for(let k = 0; k < ib.length - 1; k++){
      if(k < highest_index) { continue }
      let current = ib[k];
      let next = ib[k + 1];
      if(current + 1 === next){
        // found a matching index
        console.log("Found matching indices", current, next);
        let subsequence_start_idx = k;
        let subsequence_end_idx = k + 1;
        
        let sa_idx = k;
        let sb_idx = k + 1;
        let subsequence_a = ib[sa_idx];
        let subsequence_b = ib[sb_idx];
        while(subsequence_a + 1 === subsequence_b && sb_idx < ib.length - 1){
          sa_idx++;
          sb_idx++;
          subsequence_a = ib[sa_idx];
          subsequence_b = ib[sb_idx];
          subsequence_end_idx = sb_idx;
        }

        highest_index = max(highest_index, subsequence_end_idx);

        if(previous_idx < ib[subsequence_start_idx]){
          console.log("Found subsequence from", previous_idx, "to", ib[subsequence_start_idx]);
          subsequences.push([previous_idx, ib[subsequence_start_idx]]);
        }

        console.log("Subsequence from", ib[subsequence_start_idx], "to", ib[subsequence_end_idx]);
        subsequences.push([ib[subsequence_start_idx], ib[subsequence_end_idx]]);
        previous_idx = ib[subsequence_end_idx];
        console.log("previous increase", previous_idx)
      }
    }

    if(previous_idx < ib.length){
      console.log("Adding last subsequence from", previous_idx, "to", b.length);
      subsequences.push([previous_idx, b.length]);
    }

    
    let results = []
    for(let i = 0; i < subsequences.length; i++){
      let indices = subsequences[i];
      let start = indices[0];
      let end = indices[1];

      let new_route = b.slice(start, end + 1);
      // console.log("potential subsequence", new_route);

      let found_start = false;
      let found_end = false;
      for(let k = 0; k < ib.length; k++){
        if(ib[k] === start){
          found_start = true;
        }
        if(ib[k] === end){
          found_end = true;
        }
      }
      if(found_start && found_end) { continue; }
      let new_path = new Path(new_route)
      results.push(new_path);
    }


    // console.log("ia", ia);
    // console.log("ib", ib);
    // console.log("point", points)
    // console.log("Subseq", subsequences)
    // console.log("Found intersections:", results);
    
    // At this point we know that there is at least one subsequence
    // if we have no results, all subsequences were found in A
    // which means this route is completely contained in A
    if(results.length === 0){ 
      console.log("Route a completely covers b, returning null");
      return null 
    }
    
    return results;
  }
  

  draw(){
    push();
      stroke(palette.black);
      strokeWeight(1);
      noFill();
      
      for(let n of this.nodes){
        n.draw();
      }

      beginShape();
      for(let p of this.points){
        vertex(p.x, p.y);
      }
      endShape();
    pop();
  }
}
