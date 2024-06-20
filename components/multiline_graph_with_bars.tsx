"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { indexToColor, stringToColor } from "./util";
import { d3Line, d3LinePoint, d3LineRange, XYPoint } from "./types";

// data must be sorted in ascending order
// data must not have null or undefined value pairs

interface MultiLineWithBarsGraphData {
  margin: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  totalWidth: number;
  totalHeight: number;
  title: string;
  y1AxisTitle: string;
  y2AxisTitle: string;
  data: d3Line[];
  barData: d3Line[];
  lineLabel: string[];
  legend: boolean;
}

export default function MultiLineGraphWithBars(
  lineGraphData: MultiLineWithBarsGraphData
) {
  const width: number =
    lineGraphData.totalWidth -
    lineGraphData.margin.left -
    lineGraphData.margin.right;
  const height: number =
    lineGraphData.totalHeight -
    lineGraphData.margin.top -
    lineGraphData.margin.bottom;

  const xAxisRef = useRef<SVGSVGElement>(null);
  const yAxisRef = useRef<SVGSVGElement>(null);
  const yAxisBarRef = useRef<SVGSVGElement>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const svgLabelsRef = useRef<SVGSVGElement>(null);

  const timeZoneOffsetSec = new Date().getTimezoneOffset() * 60 * 1;
  const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const oneDay = 1 * 24 * 60 * 60 * 1000;
  const oneHour = 1 * 60 * 60 * 1000;

  // console.log(JSON.stringify(lineGraphData.data, null, 2));

  // use the cursor position to update graph labels
  const [cursorLabel, setCursorLabel] = useState(() => ({
    xPosition: 0,
    yPosition: [0],
    xValue: 0,
    yValue: [0],
    xValueString: "",
  }));

  const legendVisibility = lineGraphData.legend ? "" : "hidden";

  // hide labels when svg is inactive
  const [cursorLabelVisibility, setCursorLabelVisibility] = useState(
    () => "hidden"
  );

  // svg line labels to follow the cursor
  const labelBox = {
    height: lineGraphData.margin.top,
    width: 85,
    singleLineOffset: lineGraphData.margin.top / lineGraphData.data.length,
    fontSize: Math.min(
      lineGraphData.margin.top / lineGraphData.data.length - 2,
      12
    ),
  };

  const legendBox = {
    height: height * 0.75,
    width: Math.min(width * 0.35, 125),
    singleLineOffset: (height * 0.75) / lineGraphData.data.length,
    fontSize: Math.min((height * 0.75) / lineGraphData.data.length - 2, 20),
  };

  // d3.extent can return [undefined, undefined], however we do not want
  // our range to have an undefined type, we will ensure it is not an undefined array
  // check lineGraphData.data.length > 0

  const axisRange: d3LineRange[] = lineGraphData.data.map((currMetric) => ({
    x: d3.extent(currMetric.map((point) => point[0])) as d3LinePoint,
    y: d3.extent(currMetric.map((point) => point[1])) as d3LinePoint,
  }));

  const axisRangeAll: d3LineRange = {
    x: d3.extent(axisRange.map((point) => point.x).flat()) as d3LinePoint,
    y: d3.extent(axisRange.map((point) => point.y).flat()) as d3LinePoint,
  };

  // console.log(JSON.stringify(axisRange, null, 2));
  // console.log(JSON.stringify(axisRangeAll, null, 2));

  const axisRangeBar: d3LineRange[] = lineGraphData.barData.map(
    (currMetric) => ({
      x: d3.extent(currMetric.map((point) => point[0])) as d3LinePoint,
      y: d3.extent(currMetric.map((point) => point[1])) as d3LinePoint,
    })
  );
  const axisRangeBarAll: d3LineRange = {
    x: d3.extent(axisRangeBar.map((point) => point.x).flat()) as d3LinePoint,
    y: d3.extent(axisRangeBar.map((point) => point.y).flat()) as d3LinePoint,
  };

  let xScale = d3.scaleTime().domain(axisRangeAll.x).range([0, width]);
  let yScale = d3
    .scaleLinear()
    .domain(axisRangeAll.y)
    .range([height, 0])
    .nice();
  let yScaleBar = d3
    .scaleLinear()
    .domain(axisRangeBarAll.y)
    .range([height, 0])
    .nice();

  const xScaleOneDayWidth = 0.9 * (xScale(oneDay) - xScale(0));

  const graphYMinValue = yScale.invert(height);

  let line = d3
    .line()
    .x((d) => xScale(d[0]))
    .y((d) => yScale(d[1]));

  useEffect(() => {
    if (xAxisRef.current) {
      let xAxis = d3.axisBottom(xScale);
      d3.select(xAxisRef.current).call(xAxis).style("fontSize", 14);
    }

    if (yAxisRef.current) {
      let yAxis = d3.axisLeft(yScale).ticks(3);
      d3.select(yAxisRef.current).call(yAxis).style("fontSize", 14);
    }

    if (yAxisBarRef.current) {
      let yAxisBar = d3.axisRight(yScaleBar).ticks(3);
      d3.select(yAxisBarRef.current).call(yAxisBar).style("fontSize", 14);
    }
  }, [xScale, yScale, yScaleBar]);

  const interpolateXPt = (array: d3Line, x: number) => {
    // return if requested value is outside of array scope
    if (x >= array[array.length - 1][0]) {
      return array[array.length - 1][1];
    }
    if (x <= array[0][0]) {
      return array[0][1];
    }

    // find the index left of the insertion point (x)
    const leftIndex =
      d3.bisectLeft(
        array.map((row) => row[0]),
        x
      ) - 1;

    const x0 = array[leftIndex][0];
    const x1 = array[leftIndex + 1][0];
    const y0 = array[leftIndex][1];
    const y1 = array[leftIndex + 1][1];

    // return the interpolated y value
    return y0 + (x - x0) * ((y1 - y0) / (x1 - x0));
  };

  function handleMouseMoveLineValue({ x, y }: XYPoint) {
    setCursorLabelVisibility(() => "visible");
    const svgBasePoint = svgRef.current?.createSVGPoint() as DOMPoint;
    svgBasePoint.x = x;
    svgBasePoint.y = y;

    // const svgHeight = svgRef.current.getBoundingClientRect().height;

    const cursorpt = svgBasePoint.matrixTransform(
      svgRef.current?.getScreenCTM()?.inverse()
    );

    const graphXAxisPosition =
      cursorpt.x > lineGraphData.margin.left
        ? cursorpt.x < width + lineGraphData.margin.left
          ? cursorpt.x - lineGraphData.margin.left
          : width
        : 0;

    const graphXAxisValue = new Date(
      xScale.invert(graphXAxisPosition)
    ).valueOf();

    const graphXAxisValueString = new Date(graphXAxisValue).toLocaleString(
      "en-US",
      {
        dateStyle: "short",
        // timeStyle: "short",
        // hourCycle: "h12",
        timeZone: timeZoneName,
      }
    );

    const graphYAxisValue = lineGraphData.data.map((currMetric) =>
      graphXAxisValue > axisRangeAll.x[0] && graphXAxisValue < axisRangeAll.x[1]
        ? // currMetric[bisectX(currMetric, graphXAxisValue) - 1][1]
          interpolateXPt(currMetric, graphXAxisValue)
        : graphXAxisValue <= axisRangeAll.x[0]
        ? currMetric[0][1]
        : currMetric[currMetric.length - 1][1]
    );

    const graphYAxisPosition = lineGraphData.data.map((currMetric, index) =>
      yScale(graphYAxisValue[index])
    );

    setCursorLabel(() => ({
      xPosition: graphXAxisPosition,
      yPosition: graphYAxisPosition,
      xValue: graphXAxisValue,
      yValue: graphYAxisValue,
      xValueString: graphXAxisValueString,
    }));
  }

  const setTransparencyIfOutOfRange = (
    cursorXPosition: number,
    array: d3Line
  ) => {
    if (
      cursorXPosition < array[0][0] ||
      cursorXPosition > array[array.length - 1][0]
    ) {
      return 0;
    }
    return 100;
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${
        width + lineGraphData.margin.left + lineGraphData.margin.right
      } ${height + lineGraphData.margin.top + lineGraphData.margin.bottom}`}
      onMouseMove={(event) => {
        handleMouseMoveLineValue({ x: event.clientX, y: event.clientY });
      }}
      onMouseOver={(event) => {
        handleMouseMoveLineValue({ x: event.clientX, y: event.clientY });
      }}
      onTouchMove={(event) => {
        handleMouseMoveLineValue({
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        });
      }}
      onTouchStart={(event) => {
        handleMouseMoveLineValue({
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        });
      }}
      onMouseOut={(event) => {
        setCursorLabelVisibility(() => "hidden");
      }}
      onTouchEnd={(event) => {
        setCursorLabelVisibility(() => "hidden");
      }}
    >
      {/* graph title */}
      <text
        x={lineGraphData.totalWidth / 2}
        y="20"
        textAnchor="middle"
        // alignmentBaseline="middle"
        style={{
          fontSize: 20,
          // fill: stringToColor(title),
          fill: "black",
        }}
      >
        {lineGraphData.title}
      </text>

      {/* d3 axis scales */}
      <g>
        <g
          ref={xAxisRef}
          transform={`translate(${lineGraphData.margin.left}, ${
            height + lineGraphData.margin.top
          })`}
        />
        <g
          ref={yAxisRef}
          transform={`translate(${lineGraphData.margin.left}, ${lineGraphData.margin.top})`}
        />
        <g
          ref={yAxisBarRef}
          transform={`translate(${lineGraphData.margin.left + width}, ${
            lineGraphData.margin.top
          })`}
        />
        {/* y1-axis title */}
        <text
          x={lineGraphData.margin.left * 0.4}
          y={lineGraphData.totalHeight / 2}
          transform={`rotate(-90, ${lineGraphData.margin.left * 0.4}, ${
            lineGraphData.totalHeight / 2
          } )`}
          textAnchor="middle"
          style={{
            fontSize: 16,
            fill: "black",
          }}
        >
          {lineGraphData.y1AxisTitle}
        </text>
        {/* y2-axis title */}
        <text
          x={lineGraphData.totalWidth - lineGraphData.margin.right * 0.4}
          y={lineGraphData.totalHeight / 2}
          transform={`rotate(90, ${
            lineGraphData.totalWidth - lineGraphData.margin.right * 0.4
          }, ${lineGraphData.totalHeight / 2} )`}
          textAnchor="middle"
          style={{
            fontSize: 16,
            fill: "black",
          }}
        >
          {lineGraphData.y2AxisTitle}
        </text>
      </g>

      <g
        transform={`translate(${lineGraphData.margin.left}, ${lineGraphData.margin.top})`}
      >
        <rect
          visibility={cursorLabelVisibility}
          x={cursorLabel.xPosition - labelBox.width / 2}
          y={-lineGraphData.margin.top}
          width={labelBox.width}
          height={lineGraphData.margin.top}
          style={{ fill: "white", fillOpacity: "0.95" }}
        ></rect>

        <g visibility={legendVisibility}>
          <rect
            x={10}
            y={0}
            width={legendBox.width}
            height={legendBox.height}
            style={{ fill: "white", fillOpacity: "0.95" }}
          ></rect>

          {lineGraphData.data.map((currMetric, index) => (
            <text
              key={index}
              x={15}
              y={
                legendBox.singleLineOffset * index +
                legendBox.singleLineOffset / 2
              }
              alignmentBaseline="middle"
              style={{
                fontSize: legendBox.fontSize,
                fill: indexToColor(index),
                fillOpacity: "0.5",
              }}
            >
              {lineGraphData.lineLabel[index].slice(0, 15)}
            </text>
          ))}
        </g>

        {/* graph data */}
        <g>
          {lineGraphData.data.map((currMetric, index) => (
            <g key={index}>
              <path
                key={index}
                // lineGraphData.data.length > 0 checked earlier
                d={line(currMetric) as string}
                stroke={indexToColor(index)}
                strokeWidth="2"
                fill="none"
              />

              <g ref={svgLabelsRef} visibility={cursorLabelVisibility}>
                <line
                  x1={cursorLabel.xPosition}
                  y1={0}
                  x2={cursorLabel.xPosition}
                  y2={height}
                  stroke="black"
                />
                <circle
                  key={index}
                  cx={cursorLabel.xPosition}
                  cy={cursorLabel.yPosition[index]}
                  r="5"
                  // stroke={stringToColor(title)}
                  stroke={indexToColor(index)}
                  strokeWidth="2"
                  strokeOpacity={setTransparencyIfOutOfRange(
                    xScale.invert(cursorLabel.xPosition).valueOf(),
                    currMetric
                  )}
                  fill="none"
                />
                {/* date label */}
                <g>
                  <rect
                    x={cursorLabel.xPosition - 25}
                    y={height + 3}
                    width={50}
                    height={lineGraphData.margin.bottom}
                    style={{ fill: "white", fillOpacity: "100%" }}
                  ></rect>
                  <text
                    x={cursorLabel.xPosition}
                    y={height + 15}
                    textAnchor="middle"
                    style={{
                      fontSize: 16,
                      fill: "black",
                    }}
                  >
                    {/* {Math.round(cursorLabel.xValue * 10) / 10} */}
                    {cursorLabel.xValueString}
                  </text>
                </g>

                <text
                  x={cursorLabel.xPosition - labelBox.width / 2 + 5}
                  y={
                    -lineGraphData.margin.top +
                    labelBox.singleLineOffset * index +
                    labelBox.singleLineOffset / 2
                  }
                  alignmentBaseline="middle"
                  style={{
                    fontSize: labelBox.fontSize,
                    fill: indexToColor(index),
                    // fill: "white",
                  }}
                >
                  {lineGraphData.lineLabel[index].slice(0, 5) +
                    ": " +
                    (Math.round(cursorLabel.yValue[index] * 10) / 10).toFixed(
                      1
                    )}
                </text>
              </g>
            </g>
          ))}
        </g>
      </g>

      {/* bar data */}
      <g
        transform={`translate(${lineGraphData.margin.left}, ${lineGraphData.margin.top})`}
      >
        {lineGraphData.barData[0].map((day, day_index) => (
          <rect
            key={day_index}
            x={xScale(day[0]) - xScaleOneDayWidth / 2}
            y={yScaleBar(day[1])}
            height={height - yScaleBar(day[1])}
            width={xScaleOneDayWidth}
            style={{ fill: "black", fillOpacity: "0.3" }}
          ></rect>
        ))}
      </g>
    </svg>
  );
}
