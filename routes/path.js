class Path {
  constructor(nodes) {
    this.nodes = nodes; // Array of nodes in the path
    this.points = []
    this.initialise();
    this.length = this.points.length;
  }

  initialise(){
    for(let node of this.nodes){
      let p = node.position;
      this.points.push(p)
    }
  }

  node(index){
    return this.nodes[index];
  }

  to_polyline(stroke_width, filter){
    let polyline = new Polyline(this.points).to_bezier(60)
    if(!filter){ return polyline }
    
    return polyline.filter(stroke_width*2);
  }

  to_polygon(stroke_width, filter){
    let polyline = this.to_polyline(stroke_width, filter);

    if(stroke_width < 0.1) { return polyline }
    return polyline.to_polygon(stroke_width);
  }

  reverse(){
    return new Path(this.nodes.reverse());
  }

  slice(start, end){
    let sliced_nodes = this.nodes.slice(start, end);
    return new Path(sliced_nodes);
  }

  // removes intersections with other paths, searching forwards and backwards
  find_intersections(other){
    let forwards = this.find_forward_intersections(other, this);

    // all points in b are in a, return empty array
    if(forwards === null){ return [] }
    if(forwards.length > 0){ return forwards }
    // console.log("Reversing b to find intersections with a");

    let backwards = this.find_forward_intersections(other, this.reverse());
    if(backwards.length > 0){ return backwards }
    return [this]
  }

  // this splits path b into subsections which are not included in a
  find_forward_intersections(other){
    console.log("--------Finding intersections");
    let a = other.nodes
    let b = this.nodes;

    // ia is list of indices of intersections in a
    // ib is list of indices of intersections in b
    let ia = [];
    let ib = []
    let points = []

    for(let i = 0; i < other.length; i++){
      let node = other.nodes[i];
      for(let j = 0; j < this.length; j++){
        let other = this.nodes[j];
        if(node === other){
          points.push(node);
          ia.push(i);
          ib.push(j);
        }
      }
    }

    console.log("Found intersections at indices:")
    console.log(ia, ib)


    // only one intersection
    if(ib.length < 2) { 
      // console.log("Only one intersection found, returning original", [b]);
      return [this];
    }

    if(ib.length === this.length){
      // console.log("All points in b are in a, returning empty array");
      return null;
    }

    // Sort the indicies in case one route traverses in an opposite direction
    ia = ia.sort((x, y) => x - y);
    ib = ib.sort((x, y) => x - y);

    

    let highest_index = 0;
    let subsequences = [];
    let previous_idx = 0;

    // console.log("Found intersections at indices:", ia, ib);
    // now we find subsequences between the intersection points
    for(let k = 0; k < ib.length - 1; k++){
      if(k < highest_index) { continue }
      let current = ib[k];
      let next = ib[k + 1];
      if(current + 1 === next){
        // console.log("Found matching indices", current, next);
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
          // console.log("Found subsequence from", previous_idx, "to", ib[subsequence_start_idx]);
          subsequences.push([previous_idx, ib[subsequence_start_idx]]);
        }

        // console.log("Subsequence from", ib[subsequence_start_idx], "to", ib[subsequence_end_idx]);
        subsequences.push([ib[subsequence_start_idx], ib[subsequence_end_idx]]);
        previous_idx = ib[subsequence_end_idx];
        // console.log("previous increase", previous_idx)
      }
    }

    if(previous_idx < ib.length){
      // console.log("Adding last subsequence from", previous_idx, "to", b.length);
      subsequences.push([previous_idx, this.length]);
    }

    
    let results = []
    for(let i = 0; i < subsequences.length; i++){
      let indices = subsequences[i];
      let start = indices[0];
      let end = indices[1];

      let new_route = this.slice(start, end + 1);
      console.log("potential subsequence", new_route);

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
      results.push(new_route);
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
      // console.log("Route a completely covers b, returning null");
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

function create_paths(shortest_paths, min_length = 3){
  if(shortest_paths.length == 0){ return []; }

  // Given a connected network of paths(ie all the possible combinations of paths)
  // Put these in a queue
  // Pop the first path and push to the finalised paths
  // Pop a path in the queue
  // For each finalised path, if this path doesn't intersect it, find_intersections will return an array with one element
  // If it does intersect, then we shift all the intersections into the top of the queue, and start the queue again
  // If we get to the end of checking this path against the finalised paths, 
  // More work is needed however, because I still see overlaps

  let final = [];
  
  let queue = shortest_paths
  let r0 = queue[0]
  let r1 = queue[1];
  // console.log("Paths", paths)
  let r0r1 = r0.find_intersections(r1);

  // if r0r1 length == 1 then add
  final.push(r0r1[0])
  // queue = shuffle(queue);
  // console.log("-------------------------------------------------------")
  while(queue.length > 0){
    let current = queue.shift();
    // console.log("Picking from queue", current);
    for(let i = 0; i < final.length; i++){
      let other = final[i];
      let intersections = current.find_intersections(other);
      // console.log("intersections", intersections);
      if(intersections.length == 0){
        // all points in current are in other, so we can skip this path
        // console.log("intersections empty");
        current = [];
        break;
      } else if(intersections.length == 1){
        current = intersections[0];
      } else {
        // console.log("Found multiple intersections");
        for(let intersection of intersections){
          queue.unshift(intersection)
          break;
        }
      }
    }

    // console.log("-------------------------------------------------------")
    // console.log("Current path", current);
    if(current.length > min_length){
      // console.log("ADDDING", current);
      final.push(current);
    }
  }

  return final;
  
}
