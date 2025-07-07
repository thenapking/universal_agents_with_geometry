// Various methods required for Savitzky-Golay filter
function calculate_factorial(a, b) {
  let factorial = 1;
  if (a >= b) {
    for (let i = a - b + 1; i <= a; i++) {
      factorial *= i;
    }
  }
  return factorial;
}

// Helper function to calculate the scaling factor (h) based on the x-values and derivative order
function calculateScalingFactor(xValues, centerIndex, halfWindowSize, derivativeOrder) {
  let scalingFactor = 0;
  let count = 0;
  for (let i = centerIndex - halfWindowSize; i < centerIndex + halfWindowSize; i++) {
    if (i >= 0 && i < xValues.length - 1) {
      scalingFactor += xValues[i + 1] - xValues[i];
      count++;
    }
  }
  return (scalingFactor / count) ** derivativeOrder;
}

// Helper function to calculate the Gram polynomial used in Savitzky-Golay filtering
function calculateGramPolynomial(i, windowSize, degree, derivativeOrder) {
  let gramPolyValue = 0;
  if (degree > 0) {
    gramPolyValue =
      ((4 * degree - 2) / (degree * (2 * windowSize - degree + 1))) *
        (i * calculateGramPolynomial(i, windowSize, degree - 1, derivativeOrder) + derivativeOrder * calculateGramPolynomial(i, windowSize, degree - 1, derivativeOrder - 1)) -
      (((degree - 1) * (2 * windowSize + degree)) / (degree * (2 * windowSize - degree + 1))) *
        calculateGramPolynomial(i, windowSize, degree - 2, derivativeOrder);
  } else if (degree === 0 && derivativeOrder === 0) {
    gramPolyValue = 1;
  } else {
    gramPolyValue = 0;
  }
  return gramPolyValue;
}



// Helper function to calculate the weight used for smoothing
function calculateWeight(i, t, windowSize, polynomialDegree, derivativeOrder) {
  let weightSum = 0;
  for (let degree = 0; degree <= polynomialDegree; degree++) {
    weightSum +=
      (2 * degree + 1) *
      (calculate_factorial(2 * windowSize, degree) / calculate_factorial(2 * windowSize + degree + 1, degree + 1)) *
      calculateGramPolynomial(i, windowSize, degree, 0) *
      calculateGramPolynomial(t, windowSize, degree, derivativeOrder);
  }
  return weightSum;
}

// Helper function to generate the full set of weights for a given window size and polynomial degree
function generateFullWeights(windowSize, polynomialDegree, derivativeOrder) {
  const weightsMatrix = new Array(windowSize);
  const halfWindowSize = Math.floor(windowSize / 2);
  for (let t = -halfWindowSize; t <= halfWindowSize; t++) {
    weightsMatrix[t + halfWindowSize] = new Float64Array(windowSize);
    for (let degree = -halfWindowSize; degree <= halfWindowSize; degree++) {
      weightsMatrix[t + halfWindowSize][degree + halfWindowSize] = calculateWeight(degree, t, halfWindowSize, polynomialDegree, derivativeOrder);
    }
  }
  return weightsMatrix;
}

////////////////////////
function factorial(n) {
  let r = 1;
  while (n > 0) r *= n--;
  return r;
}

// Matrix Transpose
function transpose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = [];

  for (let col = 0; col < cols; col++) {
    result[col] = [];
    for (let row = 0; row < rows; row++) {
      result[col][row] = matrix[row][col];
    }
  }

  return result;
}

// Matrix Inversion (using Gaussian elimination)
function inverse(matrix) {
  const n = matrix.length;
  const augmentedMatrix = matrix.map((row, i) => {
    return [...row, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))];
  });

  // Perform Gaussian elimination
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(augmentedMatrix[i][i]);
    let maxRow = i;

    // Find the row with the largest element in column i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmentedMatrix[k][i]) > maxEl) {
        maxEl = Math.abs(augmentedMatrix[k][i]);
        maxRow = k;
      }
    }

    // Swap the row with the max element
    const temp = augmentedMatrix[i];
    augmentedMatrix[i] = augmentedMatrix[maxRow];
    augmentedMatrix[maxRow] = temp;

    // Normalize the row
    const scale = augmentedMatrix[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmentedMatrix[i][j] /= scale;
    }

    // Eliminate the other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmentedMatrix[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
        }
      }
    }
  }

  // Extract the inverse matrix from the augmented matrix
  const inverseMatrix = augmentedMatrix.map(row => row.slice(n));
  return inverseMatrix;
}

// Matrix Multiplication
function multiply(matrixA, matrixB) {
  const rowsA = matrixA.length;
  const colsA = matrixA[0].length;
  const rowsB = matrixB.length;
  const colsB = matrixB[0].length;

  if (colsA !== rowsB) {
    throw new Error('Matrix multiplication: Number of columns of A must equal number of rows of B');
  }

  const result = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      result[i][j] = 0;
      for (let k = 0; k < colsA; k++) {
        result[i][j] += matrixA[i][k] * matrixB[k][j];
      }
    }
  }
  return result;
}

// Pad array function
function padArray(array, { size = 0, value = 0 } = {}) {
  if (size === 0) return array;

  const padLeft = Math.max(0, size); // Ensure no negative padding
  const padRight = Math.max(0, size);

  // Create a new array of the desired size
  const paddedArray = new Array(padLeft).fill(value).concat(array).concat(new Array(padRight).fill(value));
  return paddedArray;
}



// Savitzky-Golay filter function
function savitzkyGolay(
  data,  // y values
  h,     // x spacing (h)
  options = {}
) {
  const {
    windowSize = 5,
    derivative = 1,
    polynomial = 2,
    pad = 'none',
    padValue = 'replicate'
  } = options;

  // Validate parameters
  if (windowSize % 2 === 0 || windowSize < 5 || !Number.isInteger(windowSize)) {
    throw new RangeError('Invalid window size (should be odd and at least 5)');
  }
  if (derivative < 0 || !Number.isInteger(derivative)) {
    throw new RangeError('Derivative should be a positive integer');
  }
  if (polynomial < 1 || !Number.isInteger(polynomial)) {
    throw new RangeError('Polynomial should be a positive integer');
  }

  let C, norm;
  const step = Math.floor(windowSize / 2);

  // Padding
  if (pad === 'pre') {
    data = padArray(data, { size: step, value: padValue });
  }

  let ans = new Array(data.length - 2 * step);

  if (windowSize === 5 && polynomial === 2 && (derivative === 1 || derivative === 2)) {
    if (derivative === 1) {
      C = [-2, -1, 0, 1, 2];
      norm = 10;
    } else {
      C = [2, -1, -2, -1, 2];
      norm = 7;
    }
  } else {
    let J = Array(windowSize).fill().map(() => Array(polynomial + 1).fill(1));
    let inic = -(windowSize - 1) / 2;
    for (let i = 0; i < J.length; i++) {
      for (let j = 0; j < J[i].length; j++) {
        if (inic + 1 !== 0 || j !== 0) J[i][j] = Math.pow(inic + i, j);
      }
    }

    // Create matrix from array
    let Jtranspose = transpose(J);
    let Jinv = inverse(multiply(Jtranspose, J));
    C = multiply(Jinv, Jtranspose);
    C = C[derivative];
    norm = 1 / factorial(derivative);
  }

  let det = norm * Math.pow(h, derivative);

  for (let k = 0; k < data.length - 2 * step; k++) {
    let d = 0;
    for (let l = 0; l < C.length; l++) d += (C[l] * data[l + k]) / det;
    ans[k] = d;
  }

  if (pad === 'post') {
    ans = padArray(ans, { size: step, value: padValue });
  }

  return ans;
}
