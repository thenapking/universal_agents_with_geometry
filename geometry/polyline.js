class Polyline {
  constructor(points) {
    this.points = points;
    this.edges = [];
    this.find_edges();
  }

  to_a(){
    let arr = [];
    for(let v of this.points){
      arr.push([v.x, v.y]);
    }
    return arr;
  }

  count(){
    return this.points.length;
  }

  bounds(){
    if (this.points.length === 0) return [0, 0, 0, 0];

    let minX = this.points[0].x;
    let minY = this.points[0].y;
    let maxX = this.points[0].x;
    let maxY = this.points[0].y;

    for(let v of this.points){
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    }
    return [minX, minY, maxX, maxY];
  }

  find_edges() {
    let previous;
    for (let i = 0; i < this.points.length - 1; i++) {
      const start = this.points[i];
      const end = this.points[i + 1];

      const edge = new Edge(start, end, i, null);
      this.edges.push(edge);

      if(previous) { 
        previous.next = edge; 
        edge.previous = previous;
      }
      previous = edge
    }
  }

  walk(juncture, result) {
    console.log("Walking polyline from juncture:", juncture);
    let next = juncture.polyline;

    if (next.junctures.length > 1) {
      return this.walk_multiple_junctures(next, juncture, result);
    } 

    console.log("Before", result)
    let r = this.walk_to_end_of_edge(next, juncture, result);
    console.log("After", result)
    return r
  }

  walk_multiple_junctures(edge, juncture, result) {    
    console.log("Walking polyline with multiple junctures:", edge.junctures);
    const last = edge.junctures[edge.junctures.length - 1];

    // TO DO - do we ever walk forwards?
    if (last !== juncture) {
      // console.log("Walking forwards");
      let idx = edge.junctures.findIndex(j => j === juncture);
      let next_juncture = edge.junctures[idx + 1];
      // console.log("Next juncture:", next_juncture);
      result.push(next_juncture.point);
      next_juncture.increment();
      return next_juncture;
    } else {
      // we are at the last juncture and should walk backwards
      // console.log("Walking backwards")
      let idx = edge.junctures.findIndex(j => j === juncture);
      let next_juncture = edge.junctures[idx - 1];
      // console.log("Next juncture:", next_juncture);
      result.push(next_juncture.point);
      next_juncture.increment();
      return next_juncture;

    }
  }

  walk_to_end_of_edge(edge, juncture, result) {
    console.log("Walking to end of edge:", edge);
    let counter = 0;
    while (edge && counter < 1000) {
      counter++;
      result.push(edge.end); 
      // console.log("Current result:", result);
      // circle(edge.end.x, edge.end.y, 5); 
      edge = edge.next;  

      if (!edge) { return juncture; }

      // If we find an intersection, stop and return the juncture
      if (edge.junctures.length > 0) {
        let next_juncture = edge.junctures[0];
        next_juncture.increment();  
        result.push(next_juncture.point);
        return next_juncture;  
      }
    }

    return juncture;
  }

  draw(){
    if (this.points.length < 2) return;
    beginShape();
    for(let v of this.points){
      vertex(v.x, v.y);
    }
    endShape();
  }
}

