class Node {
  static id = 0;

  constructor(x, y) {
    this.id = Node.id++; 
    this.position = createVector(x,y);
    this.radius = 5
    this.degree = 0;
  }

  distance(other) {
    return p5.Vector.dist(this.position, other.position); 
  }

  calculate_radius(){
    if(!this.members || this.members.length === 0){ return 5; }
    let r = 0;
    for(let member of this.members) {
      let d = p5.Vector.dist(this.position, member.position);
      r = Math.max(r, d);
    }
    this.radius = r;
  }

  draw() {
    push();
    noFill();
    circle(this.position.x, this.position.y, this.radius);
    // fill(0);
    // textSize(20);
    // text(this.id, this.position.x + 5, this.position.y + 5);
    // noFill()
    pop();
  }  
}
