class Edge {
  static id = 0;
  constructor(start, end, weight) {
    this.id = Edge.id++;
    // start and end are Nodes
    this.start = start; 
    this.end = end; 
    this.start_id = start.id;
    this.end_id = end.id;
    this.weight = weight || 1; 
    this.v = this.end.position.copy().sub(this.start.position);
    this.distance = this.v.mag();
    this.direction = this.v.heading();
  }

  draw(){
    line(this.start.position.x, this.start.position.y, 
         this.end.position.x,   this.end.position.y    );

    circle(this.start.position.x, this.start.position.y, 5);
    circle(this.end.position.x, this.end.position.y, 5);
  }

  // get one end or the other
  grab(id){
    if(this.start.id === id) return this.end;
    return this.start;
  }


}
