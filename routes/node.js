class Node {
  static id = 0;

  constructor(x, y) {
    this.id = Node.id++; 
    this.position = createVector(x,y);
    this.community_id = -1; // Default community ID
  }

  distance(other) {
    return p5.Vector.dist(this.position, other.position); 
  }

  draw() {
    circle(this.position.x, this.position.y, 5);
  }
}
