"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { indexToColor, stringToColor } from "./util";
// import { css } from "@emotion/react";

export default function LineGraph({
  margin,
  totalWidth,
  totalHeight,
  data,
  title,
  lineLabel,
}) {
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  const xAxisRef = useRef();
  const yAxisRef = useRef();

  const svgRef = useRef();
  const svgLabelsRef = useRef();

  // data.map((currMetric) => d3.extent(currMetric.map((point) => point.x)))

  // console.log("lineLabel: ", lineLabel);
  // console.log("lineChartData: ", data);

  const plotMultipleLines = data[0].length > 1;
  // console.log("plotMultipleLines: ", plotMultipleLines);

  const [cursorLabel, setCursorLabel] = useState(() =>
    plotMultipleLines
      ? {
          x: 0,
          y: [...data.map(() => 0)],
          yValue: [...data.map(() => 0)],
          xValue: 0,
        }
      : { x: 0, y: [0], yValue: [0], xValue: 0 }
  );

  const [cursorLabelVisibility, setCursorLabelVisibility] = useState(
    () => "hidden"
  );

  const labelBox = {
    height: margin.top,
    width: 85,
    singleLineOffset: margin.top / data.length,
    fontSize: Math.min(margin.top / data.length - 2, 12),
  };

  const axisRange = plotMultipleLines
    ? {
        x: d3.extent(
          data
            .map((currMetric) =>
              d3.extent(d3.extent(currMetric.map((point) => point.x)))
            )
            .flat()
        ),
        y: d3.extent(
          data
            .map((currMetric) =>
              d3.extent(d3.extent(currMetric.map((point) => point.y)))
            )
            .flat()
        ),
      }
    : {
        x: d3.extent(data, ({ x }) => x),
        y: d3.extent(data, ({ y }) => y),
      };

  let xScale = d3.scaleLinear().domain(axisRange.x).range([0, width]).nice();

  let yScale = d3.scaleLinear().domain(axisRange.y).range([height, 0]).nice();

  const graphYMinValue = yScale.invert(height);

  let line = d3
    .line()
    .x((d) => xScale(d.x))
    .y((d) => yScale(d.y));

  useEffect(() => {
    if (xAxisRef.current) {
      let xAxis = d3.axisBottom().scale(xScale);
      d3.select(xAxisRef.current).call(xAxis).style("fontSize", 14);
    }

    if (yAxisRef.current) {
      let yAxis = d3.axisLeft().scale(yScale).ticks(3);
      d3.select(yAxisRef.current).call(yAxis).style("fontSize", 14);
    }
  }, [xScale, yScale]);

  useEffect(() => {
    d3.select(svgRef.current);
    d3.select(svgLabelsRef.current);
  }, [svgRef, svgLabelsRef]);

  const bisect = d3.bisector(function (d) {
    return d.x;
  }).left;

  function handleMouseMoveLineValue({ x, y }) {
    setCursorLabelVisibility(() => "visible");
    const svgBasePoint = svgRef.current.createSVGPoint();
    svgBasePoint.x = x;
    svgBasePoint.y = y;

    // const svgHeight = svgRef.current.getBoundingClientRect().height;

    const cursorpt = svgBasePoint.matrixTransform(
      svgRef.current.getScreenCTM().inverse()
    );

    const graphXAxisPosition =
      cursorpt.x > margin.left
        ? cursorpt.x < width + margin.left
          ? cursorpt.x - margin.left
          : width
        : 0;

    const graphXAxisValue = xScale.invert(graphXAxisPosition);

    // const graphYAxisValue = plotMultipleLines
    //   ? [
    //       ...data.map((line) =>
    //         yScale(line[bisect(line, graphXAxisValue)]?.y ?? graphYMinValue)
    //       ),
    //     ]
    //   : yScale(data[bisect(data, graphXAxisValue)]?.y ?? graphYMinValue);

    // plotMultipleLines
    //   ? setCursorLabel(() => ({
    //       x: graphXAxisPosition,
    //       y: [...graphYAxisValue],
    //       yValue: [
    //         ...data.map((line) => line[bisect(line, graphXAxisValue)]?.y ?? 0),
    //       ],
    //       xValue: graphXAxisValue,
    //     }))
    //   : setCursorLabel(() => ({
    //       x: graphXAxisPosition,
    //       y: graphYAxisValue,
    //       yValue: [data[bisect(data, graphXAxisValue)]?.y ?? 0],
    //       xValue: graphXAxisValue,
    //     }));

    // I am currently bisecting the data and getting the index
    // need to interpolate between data points

    const graphYAxisValue = plotMultipleLines
      ? [
          ...data.map((line) =>
            yScale(line[bisect(line, graphXAxisValue)]?.y ?? graphYMinValue)
          ),
        ]
      : yScale(data[bisect(data, graphXAxisValue)]?.y ?? graphYMinValue);

    plotMultipleLines
      ? setCursorLabel(() => ({
          x: graphXAxisPosition,
          y: [...graphYAxisValue],
          yValue: [
            ...data.map((line) => line[bisect(line, graphXAxisValue)]?.y ?? 0),
          ],
          xValue: graphXAxisValue,
        }))
      : setCursorLabel(() => ({
          x: graphXAxisPosition,
          y: graphYAxisValue,
          yValue: [data[bisect(data, graphXAxisValue)]?.y ?? 0],
          xValue: graphXAxisValue,
        }));
  }

  return (
    <div
    // css={css`
    //   margin: 0 auto;
    //   width: min(1000px, 90%);
    // `}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width + margin.left + margin.right} ${
          height + margin.top + margin.bottom
        }`}
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
        <text
          x={width / 2}
          y="20"
          style={{
            fontSize: 20,
            // fill: stringToColor(title),
            fill: "black",
          }}
        >
          {title}
        </text>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <rect
            visibility={cursorLabelVisibility}
            x={cursorLabel.x - labelBox.width / 2}
            y={-margin.top}
            width={labelBox.width}
            height={margin.top}
            style={{ fill: "black", fillOpacity: "0.75" }}
          ></rect>
          {plotMultipleLines ? (
            data.map((currMetric, index) => (
              <g key={index}>
                <path
                  d={line(currMetric)}
                  // stroke={stringToColor(labels + usernames[index])}
                  // stroke={stringToColor(lineLabel[index])}
                  stroke={indexToColor(index)}
                  strokeWidth="1"
                  // style={index > 0 ? { strokeDasharray: "5,5" } : null}
                  fill="none"
                />
                <g ref={svgLabelsRef} visibility={cursorLabelVisibility}>
                  <circle
                    cx={cursorLabel.x}
                    cy={cursorLabel.y[index]}
                    r="5"
                    // stroke={stringToColor(lineLabel[index])}
                    stroke={indexToColor(index)}
                    strokeWidth="2"
                    fill="none"
                  />
                  <line
                    x1={cursorLabel.x}
                    y1={0}
                    x2={cursorLabel.x}
                    y2={height}
                    stroke="black"
                  />

                  <text
                    x={cursorLabel.x}
                    y={height + 15}
                    textAnchor="middle"
                    style={{
                      fontSize: 16,
                      fill: "black",
                    }}
                  >
                    {Math.round(cursorLabel.xValue * 10) / 10}
                  </text>
                  <text
                    x={cursorLabel.x - labelBox.width / 2 + 5}
                    y={
                      -margin.top +
                      labelBox.singleLineOffset * index +
                      labelBox.singleLineOffset / 2
                    }
                    alignmentBaseline="middle"
                    style={{
                      fontSize: labelBox.fontSize,
                      // fill: stringToColor(lineLabel[index]),
                      fill: "white",
                    }}
                  >
                    {lineLabel[index].slice(0, 5) +
                      ": " +
                      cursorLabel.yValue[index]}
                  </text>
                </g>
              </g>
            ))
          ) : (
            <g>
              <path
                d={line(data)}
                // stroke={stringToColor(title)}
                stroke={indexToColor(1)}
                strokeWidth="1"
                fill="none"
              />
              <g ref={svgLabelsRef} visibility={cursorLabelVisibility}>
                <circle
                  cx={cursorLabel.x}
                  cy={cursorLabel.y}
                  r="5"
                  // stroke={stringToColor(title)}
                  stroke={indexToColor(1)}
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1={cursorLabel.x}
                  y1={0}
                  x2={cursorLabel.x}
                  y2={height}
                  stroke="black"
                />
                <text
                  x={cursorLabel.x}
                  y={height + 15}
                  textAnchor="middle"
                  style={{
                    fontSize: 16,
                    fill: "black",
                  }}
                >
                  {Math.round(cursorLabel.xValue * 10) / 10}
                </text>
                <text
                  x={cursorLabel.x - labelBox.width / 2 + 5}
                  y={-margin.top + labelBox.height / 2}
                  alignmentBaseline="middle"
                  style={{
                    fontSize: labelBox.fontSize,
                    // fill: stringToColor(lineLabel[index]),
                    fill: "white",
                  }}
                >
                  {lineLabel[0].slice(0, 5) + ": " + cursorLabel.yValue}
                </text>
              </g>
            </g>
          )}
        </g>
        <g
          ref={xAxisRef}
          transform={`translate(${margin.left}, ${height + margin.top})`}
        />
        <g
          ref={yAxisRef}
          transform={`translate(${margin.left}, ${margin.top})`}
        />
      </svg>
    </div>
  );
}
