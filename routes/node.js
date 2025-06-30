class Node {
  static id = 0;

  constructor(x, y) {
    this.id = Node.id++; 
    this.position = createVector(x,y);
    this.community_id = -1; // Default community ID
    this.members; // Members of the community
    this.radius = 5
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
    noFill();
    circle(this.position.x, this.position.y, this.radius);

    if(this.radius > 5) {
      for(let member of this.members) {
        circle(member.position.x, member.position.y, 5);
      }
    }
  }  
}
