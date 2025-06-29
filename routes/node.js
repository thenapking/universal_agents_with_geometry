class Node {
  static id = 0;

  constructor(x, y) {
    this.id = Node.id++; 
    this.position = createVector(x,y);
  }

  distance(other) {
    return p5.Vector.dist(this.position, other.position); 
  }

  draw() {
    cricle(this.position.x, this.position.y, 5);
  }
}
