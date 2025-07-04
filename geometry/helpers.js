function area(points, signed = false) {
  let n = points.length;
  if (n < 3) return 0;

  let A = 0;
  for (let i = 0; i < n; i++) {
    let j = (i + 1) % n;
    A += points[i].x * points[j].y - points[j].x * points[i].y;
  }

  let fA = A * 0.5
  return signed ? fA : Math.abs(fA);
}

function contains(point, points) {
  let n = points.length;

  let inside = false;
  let x = point.x, y = point.y;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    let xi = points[i].x, yi = points[i].y;
    let xj = points[j].x, yj = points[j].y;

    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}


function clipper(poly, other, op) {
  const clipper = new ClipperLib.Clipper();

  let poly_paths = poly.to_clipper_paths();
  let other_paths = other.to_clipper_paths();

  if (!poly_paths.length || !other_paths.length) {
    console.log("No paths in this or other polygon for operation:", op); 
    return [];
  }

  clipper.AddPaths(poly_paths, ClipperLib.PolyType.ptSubject, true);
  clipper.AddPaths(other_paths, ClipperLib.PolyType.ptClip, true);

  let clipType;
  switch (op) {
    case 'union':
      clipType = ClipperLib.ClipType.ctUnion;
      break;
    case 'intersection':
      clipType = ClipperLib.ClipType.ctIntersection;
      break;
    case 'difference':
      clipType = ClipperLib.ClipType.ctDifference;
      break;
    case 'xor':
      clipType = ClipperLib.ClipType.ctXor;
      break;
    default:
      console.error("Unknown operation:", op);
      return [];
  }
  
  
  let solution = new ClipperLib.Paths();

  const succeeded = clipper.Execute(
    clipType,
    solution,
    ClipperLib.PolyFillType.pftEvenOdd,
    ClipperLib.PolyFillType.pftEvenOdd
  );


  if (!succeeded){ 
    console.error("Clipper operation failed:", op);
    return [];
  }

  const results = from_clipper_paths(solution);
  return results;
}

function from_clipper_paths(paths) {
  const new_paths = [];
  for (const path of paths) {
    let scaled = [];
    for(let point of path){
      let p = [point.X / SCALE, point.Y / SCALE]
      scaled.push(p)
    }
    new_paths.push(new MultiPolygon([scaled]));
  }

  new_paths.sort((a, b) => Math.abs(area(b.outer, true)) - Math.abs(area(a.outer, true)));
  let polygons = [];
  let used = new Set();
  for (let i = 0; i < new_paths.length; i++){ 
    if (used.has(i)) continue; // Skip already used paths{
    let path = new_paths[i];
    // Skip non-outer or v small rings
    if(area(path.outer, true) < 1e-6) { continue }

    let holes = [];
    for (let j = i + 1; j < new_paths.length; j++) {
      if (used.has(j)) continue; // Skip already used paths
      let hole = new_paths[j];
      if (area(hole.outer, true) < 1e-6) { continue } // Skip degenerate holes
      if(contains(hole.centroid(), path.outer)){
        holes.push(hole.outer);
        used.add(j); // Mark this hole as used
      }
    }
    polygons.push(new MultiPolygon([path.outer, ...holes]));
    used.add(i); // Mark this path as used
  }

  for (let i = 0; i < new_paths.length; i++) {
    if (!used.has(i)) {
      console.warn("Unclaimed ring at index", i, "with area", area(new_paths[i].outer, true));
    }
  }
  
  return polygons;
}
