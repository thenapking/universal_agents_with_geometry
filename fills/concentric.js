class Concentric{
  constructor(polygon, centre, radius, rW, n ) {
    this.polygon = polygon;
    this.rW = rW; // ring width
    this.n= n; // number of rings
    this.centre = centre;
    this.radius = radius;
    this.lines = []
  }



  construct(){
    let x = this.centre.x;
    let y = this.centre.y;
    for(let i = 0; i <= this.n; i++){
      let dA = i * this.rW
      if(dA >= this.radius) { break;}
  
      let polyCircle = new RegularPolygon(
        x, y, this.radius - dA, this.radius - dA, 100, 'decoration'
      );

      
      let trimmed_circle = polyCircle.intersection(this.polygon);
      if(trimmed_circle.length == 0){ continue; }
      let final = trimmed_circle[0]
      this.lines.push(final);
    }


  }

  draw(){
    push()
      for(let l of this.lines){
        l.draw();
      }
    pop()
  }

}
