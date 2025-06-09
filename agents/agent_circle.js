class CircularGroup extends Group {
  constructor(n, center, radius, boundaries, options) {
    super(n, center, radius, boundaries);
    this.noiseScale = options.noiseScale;
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 10;
  }

  initialize() {
    for (let i = 0; i < this.n; i++) {
      let x = this.center.x + random(-10, 10);
      let y = this.center.y + random(-10, 10);
      this.agents.push(new CircularAgent(createVector(x, y), this));
    }
  }

  add_agents(n){
    n = constrain(n, 0, potential_agents.length -1);
    let agents_added = 0;
    for (let i = 0; i < n; i++) {
      let agent = potential_agents.shift();
      if(!agent) { break }
      
      let outside = !this.boundaries[0].contains(agent.pos)
      if(outside) { continue; }
      agent.set_size();

      let intersecting = false;
      for(let other of this.agents){
        if(agent.pos.dist(other.pos) < agent.size/2 + other.size/2){
          intersecting = true;
          break
        }
      }

      if(!intersecting){
        this.agents.push(agent);
        agents_added++;
        continue;
      }
    }
    return agents_added;
  
  }
  

  update(){
    if (!this.active) return 0;
    this.add_agents(100, this.agents);

    let active = 0;
    for (let agent of this.agents) {
      if (agent.spawned > 5) {
        agent.active = false;
      }

      agent.set_size();
      agent.spawn();
     
      if (agent.active) active++;
    }


    if (active < 1) {
      this.active = false; 
    }
    console.log("Active agents in group: ", active);
    return active;
  }

  
}

class CircularAgent extends Agent {
  constructor(pos, group) {
    super(pos, group);
    this.spawned = 0;
  }

  set_size() {
    let nz = noise(this.pos.x * this.group.noiseScale, this.pos.y * this.group.noiseScale);
    this.size = lerp(this.group.minSize, this.group.maxSize, nz);
    this.w = this.size;
    this.h = this.size;
  }

  spawn() {
    if(this.spawned > 5) {  return; }


    for(let i = 0; i < 6; i++){
      let angle = i*PI/3 + random(-0.1, 0.1);
      let r = this.size*1.04;
      let x = this.pos.x + r * cos(angle);
      let y = this.pos.y + r * sin(angle);
      let new_agent = new CircularAgent(createVector(x, y), this.group);

      potential_agents.push(new_agent);
      this.spawned++;
    }


  } 

  draw() {
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

let potential_agents = [];


function createCircularGroup(polygon) {
  let boundaries = [polygon];

  const [minX, minY, maxX, maxY] = polygon.bounds();

  let wd = maxX - minX;
  let hd = maxY - minY;
  let center = createVector(
    minX + wd / 2,
    minY + hd / 2
  );
  let area = wd * hd;
  let min_minSize = map(area, 0, 60000, 2, 5);
  let max_maxSize = map(area, 0, 60000, 5, 15);
  let minSize = int(random(min_minSize, max_maxSize))
  let maxSize = minSize*4

  const OPTIONS = {
    noiseScale: 0.01,
    minSize: minSize,
    maxSize: maxSize,
  };
  // TO DO remove radius = 100
  let group = new CircularGroup(1, center, 100, boundaries, OPTIONS) 
  group.initialize();
  groups.push(group);
}


