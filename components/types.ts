// x, y data point for d3 line graphs
export type d3LinePoint = [number, number];
// d3 line graph
export type d3Line = d3LinePoint[];

// min and max range for d3 line graphs
export type d3LineRange = {
  x: [number, number];
  y: [number, number];
};
// x, y point as an object
export type XYPoint = {
  x: number;
  y: number;
};

export type direction = "Left" | "Right" | "Range" | null;

export type navSlider = { x: number; direction: direction };
