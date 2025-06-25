
function to_martinez(){
  let martinez_points = [];
  for(let contour of this.contours) {
    martinez_points.push(this.to_a(contour));
  }
  return martinez_points;
}

function operation(other, op) {
  let this_points = this.to_martinez();

  if (!this_points.length || !this_points[0]?.length) {
    console.log("No points in this polygon for operation:", op);
    return [];
  }

  let other_points = other.to_martinez();

  if (!other_points.length || !other_points[0]?.length) {
    console.log("No points in other polygon for operation:", op);
    if (op === 'difference' || op === 'union') {
      return [new MultiPolygon(this_points)];
    } else {
      return [];
    }
  }

  if (this.is_zero_area()) {
    console.log("Zero area polygon for operation:", op);
    return [];
  }

  if (other.is_zero_area()) {
    console.log("Zero area other polygon for operation:", op);
    if (op === 'difference' || op === 'union') {
      return [new MultiPolygon(this_points)];
    }
    return [];
  }


  let result;
  try {
    switch(op) {
      case 'union':
        result = martinez.union(this_points, other_points);
        break;
      case 'difference':
        result = martinez.diff(this_points, other_points);
        break;
      case 'intersection':
        result = martinez.intersection(this_points, other_points);
        break;
      case 'xor':
        result = martinez.xor(this_points, other_points);
        break;
      default:
        console.error("Unknown operation:", op);
        return;
    }
  } catch (e) {
    console.error("Martinez diff failed:", e);
    return [new MultiPolygon(this_points)];
  }

  if (!result?.[0]?.[0]?.length) {
    return 
  }
  // console.log("Operation result:", result);
  let results = []
  for(let r of result) {
    if (r.length > 0) {
      results.push(new MultiPolygon(r));
    }
  }
  return results
}
