class Oblong extends Polygon {
  constructor(x, y, width, height) {
    

    let top_left = createVector(x, y);
    let top_right = createVector(x + width, y);
    let bottom_right = createVector(x + width, y + height);
    let bottom_left = createVector(x, y + height);
    
    super([top_left, top_right, bottom_right, bottom_left]);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  divide_vertically(){
    let mid_x = this.x + this.width / 2;
    let left = new Oblong(this.x, this.y, this.width / 2, this.height);
    let right = new Oblong(mid_x, this.y, this.width / 2, this.height);
    return [left, right];
  }

  divide_horizontally(){
    let mid_y = this.y + this.height / 2;
    let top = new Oblong(this.x, this.y, this.width, this.height / 2);
    let bottom = new Oblong(this.x, mid_y, this.width, this.height / 2);
    return [top, bottom];
  }
}
