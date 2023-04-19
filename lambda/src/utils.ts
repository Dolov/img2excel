

export const excelIndexToColumn = (index: number) => {
  let column = '';
  while (index > 0) {
    let remainder = index % 26;
    if (remainder === 0) {
      remainder = 26;
      index--;
    }
    column = String.fromCharCode(remainder + 64) + column;
    index = Math.floor(index / 26);
  }
  return column;
}

export const rgbToHex = (r: number, g: number, b: number) => {
  let red = r.toString(16);
  let blue = b.toString(16);
  let green = g.toString(16);

  if (red.length < 2) {
    red = "0" + red;
  }
  if (green.length < 2) {
    green = "0" + green;
  }
  if (blue.length < 2) {
    blue = "0" + blue;
  }

  return red + green + blue;
}
