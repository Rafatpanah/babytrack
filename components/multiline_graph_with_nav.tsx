/** @jsxImportSource @emotion/react */
"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { indexToColor, stringToColor } from "./util";
import {
  d3Line,
  d3LinePoint,
  d3LineRange,
  XYPoint,
  navSlider,
  direction,
} from "./types";
import { css } from "@emotion/react";

// data must be sorted in ascending order
// data must not have null or undefined value pairs

interface MultiLineGraphData {
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
  data: d3Line[];
  lineLabel: string[];
  legend: boolean;
  isRefLine: boolean[];
}

export default function MultiLineGraphWithBars(
  lineGraphData: MultiLineGraphData
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

  const svgRef = useRef<SVGSVGElement>(null);
  const svgLabelsRef = useRef<SVGSVGElement>(null);

  const timeZoneOffsetSec = new Date().getTimezoneOffset() * 60 * 1;
  const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const oneDay = 1 * 24 * 60 * 60 * 1000;
  const oneHour = 1 * 60 * 60 * 1000;

  lineGraphData;

  const dataRef = useRef(lineGraphData.data);

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
      16
    ),
  };

  const legendBox = {
    height: height * 0.75,
    width: Math.min(width * 0.35, 125),
    singleLineOffset: (height * 0.5) / lineGraphData.data.length,
    fontSize: Math.min((height * 0.75) / lineGraphData.data.length - 2, 20),
  };

  // d3.extent can return [undefined, undefined], however we do not want
  // our range to have an undefined type, we will ensure it is not an undefined array
  // check lineGraphData.data.length > 0

  const axisRangeAllData: d3LineRange[] = lineGraphData.data.map(
    (currMetric) => ({
      x: d3.extent(currMetric.map((point) => point[0])) as d3LinePoint,
      y: d3.extent(currMetric.map((point) => point[1])) as d3LinePoint,
    })
  );

  const axisRangeAllDataFlat: d3LineRange = {
    x: d3.extent(
      axisRangeAllData.map((point) => point.x).flat()
    ) as d3LinePoint,
    y: d3.extent(
      axisRangeAllData.map((point) => point.y).flat()
    ) as d3LinePoint,
  };

  const allDataNoRef: d3Line[] = lineGraphData.data.map((currMetric, index) =>
    currMetric.filter((curve) => lineGraphData.isRefLine[index] === false)
  );

  const axisRangeAllDataNoRef: d3LineRange[] = allDataNoRef.map(
    (currMetric) => ({
      x: d3.extent(currMetric.map((point) => point[0])) as d3LinePoint,
      y: d3.extent(currMetric.map((point) => point[1])) as d3LinePoint,
    })
  );

  const axisRangeAllDataFlatNoRef: d3LineRange = {
    x: d3.extent(
      axisRangeAllDataNoRef.map((point) => point.x).flat()
    ) as d3LinePoint,
    y: d3.extent(
      axisRangeAllDataNoRef.map((point) => point.y).flat()
    ) as d3LinePoint,
  };

  const dateRangeRef = useRef({
    start: axisRangeAllDataFlatNoRef.x[0],
    end: axisRangeAllDataFlatNoRef.x[1],
    startPercent: 0.0,
    endPercent:
      (axisRangeAllDataFlatNoRef.x[1] - axisRangeAllDataFlatNoRef.x[0]) /
      (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]),
  });

  const axisRangeFiltered: d3LineRange[] = dataRef.current.map(
    (currMetric) => ({
      x: d3.extent(currMetric.map((point) => point[0])) as d3LinePoint,
      y: d3.extent(currMetric.map((point) => point[1])) as d3LinePoint,
    })
  );

  const axisRangeFilteredFlat: d3LineRange = {
    x: d3.extent(
      axisRangeFiltered.map((point) => point.x).flat()
    ) as d3LinePoint,
    y: d3.extent(
      axisRangeFiltered.map((point) => point.y).flat()
    ) as d3LinePoint,
  };

  // console.log(JSON.stringify(axisRange, null, 2));
  // console.log(JSON.stringify(axisRangeFiltered, null, 2));

  let xScale = d3
    .scaleTime()
    .domain([dateRangeRef.current.start, dateRangeRef.current.end])
    .range([0, width]);
  let xScaleAll = d3
    .scaleTime()
    .domain(axisRangeAllDataFlat.x)
    .range([0, width]);
  let yScale = d3
    .scaleLinear()
    .domain(axisRangeFilteredFlat.y)
    .range([height, 0])
    .nice();

  const xScaleOneDayWidth = 0.9 * (xScaleAll(oneDay) - xScaleAll(0));

  const graphYMinValue = yScale.invert(height);

  let line = d3
    .line()
    .curve(d3.curveCatmullRom.alpha(0.5))
    // .curve(d3.curveBundle.beta(1))
    .x((d) => xScale(d[0]))
    .y((d) => yScale(d[1]));

  useEffect(() => {
    if (xAxisRef.current) {
      let xAxis = d3.axisBottom(xScaleAll);
      d3.select(xAxisRef.current).call(xAxis).style("fontSize", 14);
    }

    if (yAxisRef.current) {
      let yAxis = d3.axisLeft(yScale).ticks(3);
      d3.select(yAxisRef.current).call(yAxis).style("fontSize", 14);
    }
  }, [xScaleAll, yScale]);

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
      graphXAxisValue > axisRangeAllDataFlat.x[0] &&
      graphXAxisValue < axisRangeAllDataFlat.x[1]
        ? interpolateXPt(currMetric, graphXAxisValue)
        : graphXAxisValue <= axisRangeAllDataFlat.x[0]
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

  // function to bound slider range
  const clamp = (n: number, min: number, max: number) =>
    Math.max(Math.min(n, max), min);

  const [sliderState, setSliderState] = useState(() => ({
    // start: min,
    // width: totalWidth,
    start: 50,
    width: 0,
  }));
  const sliderRef = useRef({
    start: sliderState.start,
    width: sliderState.width,
    dragDirection: null as direction,
  });

  const sliderEventRef = useRef({ x: 0, direction: "Range" });
  const navRef = useRef<SVGSVGElement>(null);
  const rangeRef = useRef<HTMLButtonElement>(null);

  const navHeight = height * 0.2;
  const ratio = {
    left:
      lineGraphData.margin.left /
      (width + lineGraphData.margin.left + lineGraphData.margin.right),
    right:
      lineGraphData.margin.right /
      (width + lineGraphData.margin.left + lineGraphData.margin.right),
  };
  const navWidth = navRef.current?.clientWidth ?? 300;
  const min = navWidth * ratio.left;
  const totalWidth = navWidth - navWidth * ratio.right - min;
  const sliderEndWidthPixels = navWidth * 0.02;

  let yScaleNav = d3
    .scaleLinear()
    .domain(axisRangeAllDataFlat.y)
    .range([navHeight, 0])
    .nice();
  let lineNav = d3
    .line()
    .x((d) => xScaleAll(d[0]))
    .y((d) => yScaleNav(d[1]));

  // function to format the dates for the date pickers
  const formatDate = (date: string | number | Date) =>
    new Date(date).toISOString().slice(0, 10);

  const updateSlider = ({ x, direction }: navSlider) => {
    // console.log({ direction });

    const dx = sliderEventRef.current.x ? x - sliderEventRef.current.x : 0;
    sliderEventRef.current.x = x;

    sliderRef.current.dragDirection = direction;

    return (() => {
      switch (direction) {
        case "Left": {
          const currMin = min;
          const currMax =
            sliderRef.current.start +
            sliderRef.current.width -
            2 * sliderEndWidthPixels;

          // when dx is greater than min bounds, the width grows by dx when it should
          // grow by the actual change which is < dx
          const clampX = clamp(sliderRef.current.start + dx, currMin, currMax);
          if (clampX > currMin && clampX < currMax) {
            setSliderState(() => ({
              start: clamp(sliderRef.current.start + dx, currMin, currMax),
              width: sliderRef.current.width - dx,
            }));
          }
          sliderRef.current.start = sliderState.start;
          sliderRef.current.width = sliderState.width;

          const startPercent = (sliderState.start - min) / totalWidth;
          const start = Math.round(
            axisRangeAllDataFlat.x[0] +
              (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]) *
                startPercent
          );

          dateRangeRef.current.start = start;
          dateRangeRef.current.startPercent = startPercent;

          // not needed if the resizing problem is fixed
          if (sliderState.start < min) {
            setSliderState((state) => ({
              ...state,
              start: min,
            }));
          }
          break;
        }
        case "Right": {
          const currMin = sliderState.start + 2 * sliderEndWidthPixels;
          const currMax = min + totalWidth;

          const clampX = clamp(
            sliderState.start + sliderRef.current.width + dx,
            currMin,
            currMax
          );
          if (clampX > currMin && clampX < currMax) {
            setSliderState((state) => ({
              ...state,
              width: clamp(
                sliderRef.current.width + dx,
                0,
                totalWidth - sliderState.start + min
              ),
            }));
          }
          sliderRef.current.width = sliderState.width;

          const endPercent =
            (sliderState.start + sliderState.width - min) / totalWidth;
          const end = Math.round(
            axisRangeAllDataFlat.x[0] +
              (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]) *
                endPercent
          );

          dateRangeRef.current.end = end;
          dateRangeRef.current.endPercent = endPercent;

          // not needed if the resizing problem is fixed
          if (sliderState.width > min + totalWidth) {
            setSliderState((state) => ({
              ...state,
              width: totalWidth - sliderState.start + min,
            }));
          }
          break;
        }

        case "Range": {
          if (!sliderRef.current.dragDirection) {
            break;
          }
          const currMin = min;
          const currMax = min + totalWidth;

          if (
            sliderRef.current.start + dx >= currMin &&
            sliderRef.current.start + sliderRef.current.width <= currMax
          ) {
            setSliderState(() => ({
              start: clamp(
                sliderRef.current.start + dx,
                currMin,
                totalWidth - sliderRef.current.width + min
              ),
              width: sliderRef.current.width,
            }));
          }
          sliderRef.current.start = sliderState.start;
          sliderRef.current.width = sliderState.width;

          const startPercent = (sliderState.start - min) / totalWidth;
          const start = Math.round(
            axisRangeAllDataFlat.x[0] +
              (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]) *
                startPercent
          );

          const endPercent =
            (sliderState.start + sliderState.width - min) / totalWidth;
          const end = Math.round(
            axisRangeAllDataFlat.x[0] +
              (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]) *
                endPercent
          );

          dateRangeRef.current.start = start;
          dateRangeRef.current.startPercent = startPercent;
          dateRangeRef.current.end = end;
          dateRangeRef.current.endPercent = endPercent;

          break;
        }
        default:
      }
    })();
  };

  useEffect(() => {
    function handleResize() {
      const navWidth = navRef.current?.clientWidth ?? 0;
      const min = navWidth * ratio.left;
      const totalWidth = navWidth - navWidth * ratio.right - min;

      const startPercent = clamp(
        (dateRangeRef.current.start - axisRangeAllDataFlat.x[0]) /
          (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]),
        0,
        1
      );
      const endPercent = clamp(
        (dateRangeRef.current.end - axisRangeAllDataFlat.x[0]) /
          (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]),
        0,
        1
      );

      setSliderState(() => ({
        start: startPercent * totalWidth + min,
        width: (endPercent - startPercent) * totalWidth,
      }));
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [ratio]);

  useEffect(() => {
    dataRef.current = lineGraphData.data.map((currMetric) => {
      const filteredData = currMetric.filter(
        (point) =>
          point[0] >= dateRangeRef.current.start &&
          point[0] <= dateRangeRef.current.end
      );
      return filteredData.length > 0
        ? filteredData
        : [
            [0, 0],
            [0, 0],
          ];
    });
  });

  useEffect(() => {
    setSliderState(() => ({
      start: dateRangeRef.current.startPercent * totalWidth + min,
      width:
        (dateRangeRef.current.endPercent - dateRangeRef.current.startPercent) *
        totalWidth,
    }));
  }, [totalWidth]);

  return (
    <div
      css={css`
        position: relative;
        opacity: ${sliderState.width === 0 ? 0 : 1};
      `}
    >
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
          {/* <g
            ref={yAxisBarRef}
            transform={`translate(${lineGraphData.margin.left + width}, ${
              lineGraphData.margin.top
            })`}
          /> */}
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
        </g>

        <g
          transform={`translate(${lineGraphData.margin.left}, ${lineGraphData.margin.top})`}
        >
          {/* background box for labels */}
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
            {dataRef.current.map((currMetric, index) => (
              <g key={index}>
                <path
                  key={index}
                  // lineGraphData.data.length > 0 checked earlier
                  d={line(currMetric) as string}
                  stroke={indexToColor(index)}
                  strokeWidth="2"
                  fill="none"
                  strokeOpacity={lineGraphData.isRefLine[index] ? 0.15 : 1}
                />
                {lineGraphData.isRefLine[index] === false
                  ? currMetric.map((point, indexPoint) => (
                      <circle
                        key={indexPoint}
                        cx={xScale(point[0])}
                        cy={yScale(point[1])}
                        r="5"
                        // stroke={stringToColor(title)}
                        stroke={indexToColor(index)}
                        strokeWidth="2"
                        fill="none"
                      />
                    ))
                  : ""}

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

                  {/* label box text */}
                  <text
                    x={cursorLabel.xPosition}
                    y={
                      -lineGraphData.margin.top +
                      labelBox.singleLineOffset * index +
                      labelBox.singleLineOffset / 2
                    }
                    // alignmentBaseline="middle"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: labelBox.fontSize,
                      fill: indexToColor(index),
                      // textAnchor: "middle",
                      // dominantBaseline: "middle",
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
      </svg>

      <div>
        <figure
          css={css`
            padding-bottom: 10px;
          `}
          onMouseMove={(event) =>
            updateSlider({
              x: event.clientX,
              direction: sliderRef.current.dragDirection,
            })
          }
          onTouchMove={(event) =>
            updateSlider({
              x: event.touches[0].clientX,
              direction: sliderRef.current.dragDirection,
            })
          }
          onMouseUp={(event) => {
            sliderRef.current.dragDirection = null;
            sliderEventRef.current.x = 0;
          }}
          onTouchEnd={(event) => {
            sliderRef.current.dragDirection = null;
            sliderEventRef.current.x = 0;
          }}
        >
          <nav
            css={css`
              position: relative;
              /* opacity: ${sliderState.width === 0 ? 0 : 1}; */
            `}
          >
            <svg
              ref={navRef}
              viewBox={`0 0 ${
                width + lineGraphData.margin.left + lineGraphData.margin.right
              } ${navHeight}`}
            >
              <g transform={`translate(${lineGraphData.margin.left},  0)`}>
                {lineGraphData.data.map((currMetric, index) => (
                  <g key={index}>
                    <path
                      key={index}
                      // lineGraphData.data.length > 0 checked earlier
                      d={lineNav(currMetric) as string}
                      stroke={indexToColor(index)}
                      strokeWidth="2"
                      fill="none"
                      strokeOpacity={lineGraphData.isRefLine[index] ? 0 : 1}
                    />
                  </g>
                ))}
              </g>
            </svg>
            <button
              css={css`
                border: 0;
                background-color: papayawhip;
                opacity: 0.8;
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                cursor: pointer;

                & > span {
                  display: block;
                  background-color: firebrick;
                  width: min(1.5vw, 10px);
                  height: 80%;
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  cursor: pointer;
                  margin: auto;
                }

                & > span:first-of-type {
                  left: 0;
                }

                & > span:last-of-type {
                  right: 0;
                }
              `}
              ref={rangeRef}
              style={{
                transform: `translateX(${sliderState.start}px)`,
                width: `${sliderState.width}px`,
              }}
              onMouseDown={(event) =>
                updateSlider({
                  x: event.clientX,
                  direction: "Range",
                })
              }
              onTouchStart={(event) =>
                updateSlider({
                  x: event.touches[0].clientX,
                  direction: "Range",
                })
              }
            >
              <span
                onMouseDown={(event) => {
                  event.stopPropagation();
                  updateSlider({
                    x: event.clientX,
                    direction: "Left",
                  });
                }}
                onTouchStart={(event) => {
                  event.stopPropagation();
                  updateSlider({
                    x: event.touches[0].clientX,
                    direction: "Left",
                  });
                }}
              />
              <span
                onMouseDown={(event) => {
                  event.stopPropagation();
                  updateSlider({
                    x: event.clientX,
                    direction: "Right",
                  });
                }}
                onTouchStart={(event) => {
                  event.stopPropagation();
                  updateSlider({
                    x: event.touches[0].clientX,
                    direction: "Right",
                  });
                }}
              />
            </button>
          </nav>
        </figure>
        <div>
          <label>
            Start Date:&nbsp;
            <input
              type="date"
              max={formatDate(dateRangeRef.current.end)}
              value={formatDate(dateRangeRef.current.start)}
              onChange={(event) => {
                dateRangeRef.current.start = clamp(
                  new Date(event.target.value).getTime(),
                  axisRangeAllDataFlat.x[0],
                  dateRangeRef.current.end
                );
                const startPercent = clamp(
                  (dateRangeRef.current.start - axisRangeAllDataFlat.x[0]) /
                    (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]),
                  0,
                  1
                );
                const endPercent = clamp(
                  (dateRangeRef.current.end - axisRangeAllDataFlat.x[0]) /
                    (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]),
                  0,
                  1
                );
                setSliderState((state) => ({
                  start: startPercent * totalWidth + min,
                  width: (endPercent - startPercent) * totalWidth,
                }));
              }}
            />
          </label>

          <label>
            End Date:&nbsp;
            <input
              type="date"
              min={formatDate(dateRangeRef.current.start)}
              value={formatDate(dateRangeRef.current.end)}
              onChange={(event) => {
                dateRangeRef.current.end = clamp(
                  new Date(event.target.value).getTime(),
                  dateRangeRef.current.start,
                  axisRangeAllDataFlat.x[1]
                );
                const startPercent = clamp(
                  (dateRangeRef.current.start - axisRangeAllDataFlat.x[0]) /
                    (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]),
                  0,
                  1
                );
                const endPercent = clamp(
                  (dateRangeRef.current.end - axisRangeAllDataFlat.x[0]) /
                    (axisRangeAllDataFlat.x[1] - axisRangeAllDataFlat.x[0]),
                  0,
                  1
                );
                setSliderState((state) => ({
                  start: startPercent * totalWidth + min,
                  width: (endPercent - startPercent) * totalWidth,
                }));
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
