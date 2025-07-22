class SpawningGroup extends Group {
  constructor(n, center, radius, boundary, options) {
    super(n, center, radius, boundary);
    this.noiseScale = options.noiseScale;
    this.minSize = options.minSize || 5;
    this.maxSize = options.maxSize || 10;
    this.potential_agents = [];
  }

  initialize() {
    for (let i = 0; i < this.n; i++) {
      let x = this.center.x + random(-10, 10);
      let y = this.center.y + random(-10, 10);
      this.agents.push(new SpawningAgent(createVector(x, y), this));
    }
  }

  add_agents(n){
    n = constrain(n, 0, this.potential_agents.length -1);
    let agents_added = 0;
    for (let i = 0; i < n; i++) {
      let agent = this.potential_agents.shift();
      if(!agent) { break }
      
      let outside = !this.boundary.contains(agent.position)
      if(outside) { continue; }
      agent.set_size();

      let intersecting = false;
      for(let other of this.agents){
        if(agent.position.dist(other.position) < (agent.size + other.size)*0.45){
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

    return active;
  }
}

class SpawningAgent extends Agent {
  constructor(position, group, direction = createVector(0, 1)) {
    super(position, group);
    this.spawned = 0;
    this.direction = direction.copy();
    this.number_to_spawn = 2; // Number of agents to spawn around this agent
  }

  set_size() {
    let nz = noise(this.position.x * this.group.noiseScale, this.position.y * this.group.noiseScale);
    this.size = lerp(this.group.minSize, this.group.maxSize, nz);
    this.w = this.size;
    this.h = this.size;
  }

  spawn() {
    if(this.spawned > this.number_to_spawn) {  return; }

    for(let i = 0; i < this.number_to_spawn; i++){
      let a = i*TWO_PI/this.number_to_spawn + random(-1, 1)
      let r = this.direction.rotate(a)
      let d = this.size * (1 + i*0.02)
      r = r.normalize().mult(d)

      let x = Math.round(this.position.x + r.x)
      let y = Math.round(this.position.y + r.y)
      
      let new_agent = new SpawningAgent(createVector(x, y), this.group);

      this.group.potential_agents.push(new_agent);
      this.spawned++;
    }
  } 

  draw() {
    ellipse(this.position.x, this.position.y, this.size, this.size);
  }
}


// Move to coffer
function createSpawningGroup(polygon) {
  let boundary = polygon;

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
  let group = new SpawningGroup(1, center, 100, boundary, OPTIONS) 
  group.initialize();
  groups.push(group);
}


