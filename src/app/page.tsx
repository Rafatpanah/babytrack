/** @jsxImportSource @emotion/react */
"use client";

import { css } from "@emotion/react";
import Image from "next/image";
import MultiLineGraph from "../../components/multiline_graph_with_nav";
import {
  d3Line,
  d3LinePoint,
  d3LineRange,
  XYPoint,
} from "../../components/types";
import { useState, useEffect, useRef } from "react";
import { isNumber } from "util";

const clamp = (n: number, min: number, max: number) =>
  Math.max(Math.min(n, max), min);

// function to format the dates for the date pickers
const formatDatefromObject = (
  date: string | number | Date | null,
  timeZoneOffsetMSec: number
) => {
  if (date === null) {
    return "";
  } else
    return (typeof date === "object") === true || typeof date === "string"
      ? new Date(date).toISOString().slice(0, 10)
      : new Date(date - timeZoneOffsetMSec).toISOString().slice(0, 10);
};

const formatTimefromObject = (
  date: string | number | Date,
  timeZoneOffsetMSec: number
) =>
  (typeof date === "object") === true || typeof date === "string"
    ? new Date(date).toISOString().slice(0, 10)
    : new Date(date - timeZoneOffsetMSec).toISOString().slice(11, 16);

const formatTimefromNumber = (data: {
  hours: number | null;
  minutes: number | null;
}) => {
  if (data.hours === null && data.minutes === null) {
    return "";
  } else if (data.hours === null || data.minutes === null) {
    return "";
  }
  const hoursString = data.hours < 10 ? "0" + data.hours : "" + data.hours;
  const minutesString =
    data.minutes < 10 ? "0" + data.minutes : "" + data.minutes;
  return hoursString + ":" + minutesString;
};

const weightOzValidation = (data: { new: number | string }) => {
  if (data.new === "") {
    return 0;
  } else if (typeof data.new === "string") {
    const newValue = parseInt(data.new);
    return isNaN(newValue) ? 0 : clamp(newValue, 0, 15);
  }
  return clamp(data.new, 0, 15);
};
const weightLbValidation = (data: { new: number | string }) => {
  if (data.new === "") {
    return 0;
  } else if (typeof data.new === "string") {
    const newValue = parseInt(data.new);
    return isNaN(newValue) ? 0 : newValue;
  }
  return data.new;
};

export default function Home() {
  const girlWeight =
    // Month	L	M	S	2nd (2.3rd)	5th	10th	25th	50th	75th	90th	95th	98th (97.7th)
    // https://www.cdc.gov/growthcharts/who_charts.htm
    // P10 = 6
    // P50 = 8
    // P90 = 10
    [
      [
        0, 0.3809, 3.2322, 0.14171, 2.394672, 2.532145, 2.677725, 2.932331,
        3.2322, 3.55035, 3.852667, 4.040959, 4.23043022,
      ],
      [
        1, 0.1714, 4.1873, 0.13724, 3.161067, 3.326209, 3.502477, 3.814261,
        4.1873, 4.590075, 4.979539, 5.225436, 5.4754539,
      ],
      [
        2, 0.0962, 5.1282, 0.13, 3.941053, 4.13172, 4.335355, 4.695944, 5.1282,
        5.596104, 6.049862, 6.337067, 6.62967897,
      ],
      [
        3, 0.0402, 5.8458, 0.12619, 4.53604, 4.745935, 4.970282, 5.368044,
        5.8458, 6.364222, 6.868317, 7.188096, 7.51447955,
      ],
      [
        4, -0.005, 6.4237, 0.12402, 5.013368, 5.238858, 5.480078, 5.90832,
        6.4237, 6.984281, 7.530756, 7.87815, 8.23331075,
      ],
      [
        5, -0.043, 6.8985, 0.12274, 5.403844, 5.642267, 5.897544, 6.351329,
        6.8985, 7.495018, 8.077933, 8.449225, 8.82941522,
      ],
      [
        6, -0.0756, 7.297, 0.12204, 5.729383, 5.97888, 6.246243, 6.72212, 7.297,
        7.925102, 8.540297, 8.93289, 9.33549062,
      ],
      [
        7, -0.1039, 7.6422, 0.12178, 6.008387, 6.267836, 6.546104, 7.042017,
        7.6422, 8.299352, 8.94444, 9.356859, 9.78039888,
      ],
      [
        8, -0.1288, 7.9487, 0.12181, 6.253445, 6.522061, 6.810403, 7.324907,
        7.9487, 8.633118, 9.306424, 9.737639, 10.1810939,
      ],
      [
        9, -0.1507, 8.2254, 0.12199, 6.472906, 6.750018, 7.047717, 7.579535,
        8.2254, 8.935413, 9.63531, 10.08429, 10.5466186,
      ],
      [
        10, -0.17, 8.48, 0.12223, 6.673828, 6.958886, 7.265345, 7.813398, 8.48,
        9.214115, 9.939115, 10.4049, 10.8851054,
      ],
      [
        11, -0.1872, 8.7192, 0.12247, 6.862262, 7.15483, 7.46957, 8.032975,
        8.7192, 9.476145, 10.22495, 10.7067, 11.2038881,
      ],
      [
        12, -0.2024, 8.9481, 0.12268, 7.042612, 7.342376, 7.665043, 8.24313,
        8.9481, 9.726833, 10.49835, 10.99531, 11.5086985,
      ],
      [
        13, -0.2158, 9.1699, 0.12283, 7.217847, 7.524538, 7.854825, 8.446994,
        9.1699, 9.969431, 10.76258, 11.27401, 11.8028109,
      ],
      [
        14, -0.2278, 9.387, 0.12294, 7.389684, 7.70313, 8.040838, 8.646697,
        9.387, 10.20666, 11.02071, 11.54612, 12.0897773,
      ],
      [
        15, -0.2384, 9.6008, 0.12299, 7.559527, 7.879566, 8.224501, 8.843658,
        9.6008, 10.43988, 11.27403, 11.81285, 12.3707367,
      ],
      [
        16, -0.2478, 9.8124, 0.12303, 7.727588, 8.054179, 8.406286, 9.038616,
        9.8124, 10.67062, 11.52454, 12.07652, 12.6483665,
      ],
      [
        17, -0.2562, 10.0226, 0.12306, 7.894535, 8.227652, 8.586898, 9.232317,
        10.0226, 10.89976, 11.77319, 12.33814, 12.9237235,
      ],
      [
        18, -0.2637, 10.2315, 0.12309, 8.060311, 8.399952, 8.766325, 9.424795,
        10.2315, 11.12747, 12.02024, 12.59804, 13.1972107,
      ],
      [
        19, -0.2703, 10.4393, 0.12315, 8.224599, 8.570832, 8.944403, 9.616043,
        10.4393, 11.3542, 12.26642, 12.85712, 13.4699234,
      ],
      [
        20, -0.2762, 10.6464, 0.12323, 8.387882, 8.74076, 9.121584, 9.806487,
        10.6464, 11.58033, 12.51209, 13.11573, 13.7422028,
      ],
      [
        21, -0.2815, 10.8534, 0.12335, 8.55031, 8.909946, 9.298148, 9.996544,
        10.8534, 11.80669, 12.75831, 13.37511, 14.0154884,
      ],
      [
        22, -0.2862, 11.0608, 0.1235, 8.712397, 9.078906, 9.474611, 10.18672,
        11.0608, 12.03376, 13.00554, 13.6357, 14.2901756,
      ],
      [
        23, -0.2903, 11.2688, 0.12369, 8.8741, 9.247632, 9.651002, 10.37713,
        11.2688, 12.26184, 13.25422, 13.89801, 14.5668755,
      ],
      [
        24, -0.2941, 11.4775, 0.1239, 9.035869, 9.416516, 9.827655, 10.56799,
        11.4775, 12.49092, 13.50419, 14.16181, 14.8452857,
      ],
    ];

  //https://www.who.int/tools/child-growth-standards/standards/weight-for-age
  // Week	L	M	S	P01	P1	P3	P5	P10	P15	P25	P50	P75	P85	P90	P95	P97	P99	P999
  // P10 = 8
  // P50 = 11
  // P90 = 14
  const girl_weight2 = [
    [
      0, 0.3809, 3.2322, 0.14171, 2, 2.3, 2.4, 2.5, 2.7, 2.8, 2.9, 3.2, 3.6,
      3.7, 3.9, 4, 4.2, 4.4, 4.8,
    ],
    [
      1, 0.2671, 3.3388, 0.146, 2.1, 2.3, 2.5, 2.6, 2.8, 2.9, 3, 3.3, 3.7, 3.9,
      4, 4.2, 4.4, 4.6, 5.1,
    ],
    [
      2, 0.2304, 3.5693, 0.14339, 2.2, 2.5, 2.7, 2.8, 3, 3.1, 3.2, 3.6, 3.9,
      4.1, 4.3, 4.5, 4.6, 4.9, 5.4,
    ],
    [
      3, 0.2024, 3.8352, 0.1406, 2.4, 2.7, 2.9, 3, 3.2, 3.3, 3.5, 3.8, 4.2, 4.4,
      4.6, 4.8, 5, 5.3, 5.8,
    ],
    [
      4, 0.1789, 4.0987, 0.13805, 2.6, 2.9, 3.1, 3.3, 3.4, 3.5, 3.7, 4.1, 4.5,
      4.7, 4.9, 5.1, 5.3, 5.6, 6.2,
    ],
    [
      5, 0.1582, 4.3476, 0.13583, 2.8, 3.1, 3.3, 3.5, 3.6, 3.8, 4, 4.3, 4.8, 5,
      5.2, 5.4, 5.6, 5.9, 6.5,
    ],
    [
      6, 0.1395, 4.5793, 0.13392, 3, 3.3, 3.5, 3.7, 3.8, 4, 4.2, 4.6, 5, 5.3,
      5.4, 5.7, 5.9, 6.2, 6.8,
    ],
    [
      7, 0.1224, 4.795, 0.13228, 3.2, 3.5, 3.7, 3.8, 4, 4.2, 4.4, 4.8, 5.2, 5.5,
      5.7, 5.9, 6.1, 6.5, 7.1,
    ],
    [
      8, 0.1065, 4.9959, 0.13087, 3.3, 3.7, 3.9, 4, 4.2, 4.4, 4.6, 5, 5.5, 5.7,
      5.9, 6.2, 6.4, 6.7, 7.4,
    ],
    [
      9, 0.0918, 5.1842, 0.12966, 3.4, 3.8, 4.1, 4.2, 4.4, 4.5, 4.7, 5.2, 5.7,
      5.9, 6.1, 6.4, 6.6, 7, 7.7,
    ],
    [
      10, 0.0779, 5.3618, 0.12861, 3.6, 4, 4.2, 4.3, 4.5, 4.7, 4.9, 5.4, 5.8,
      6.1, 6.3, 6.6, 6.8, 7.2, 7.9,
    ],
    [
      11, 0.0648, 5.5295, 0.1277, 3.7, 4.1, 4.3, 4.5, 4.7, 4.8, 5.1, 5.5, 6,
      6.3, 6.5, 6.8, 7, 7.4, 8.2,
    ],
    [
      12, 0.0525, 5.6883, 0.12691, 3.8, 4.2, 4.5, 4.6, 4.8, 5, 5.2, 5.7, 6.2,
      6.5, 6.7, 7, 7.2, 7.6, 8.4,
    ],
    [
      13, 0.0407, 5.8393, 0.12622, 3.9, 4.3, 4.6, 4.7, 5, 5.1, 5.4, 5.8, 6.4,
      6.7, 6.9, 7.2, 7.4, 7.8, 8.6,
    ],
  ];

  const LunaWeight = [
    [Date.parse("09 Mar 2024 23:07:00 EST").valueOf(), 5 + 14 / 16],
    [Date.parse("11 Mar 2024 00:33:00 EST").valueOf(), 5 + 10 / 16],
    [Date.parse("12 Mar 2024 04:24:00 EST").valueOf(), 5 + 6.4 / 16],
    [Date.parse("14 Mar 2024 11:43:00 EST").valueOf(), 5 + 10 / 16],
    [Date.parse("21 Mar 2024 11:11:00 EST").valueOf(), 6 + 1.5 / 16],
    [Date.parse("02 Apr 2024 15:58:00 EST").valueOf(), 6 + 13.5 / 16],
    [Date.parse("22 Apr 2024 13:57:00 EST").valueOf(), 9 + 9 / 16],
    [Date.parse("10 May 2024 13:56:00 EST").valueOf(), 11 + 4.5 / 16],
    [Date.parse("05 Jun 2024 12:24:00 EST").valueOf(), 12 + 12.4 / 16],
    [Date.parse("21 Jun 2024 12:24:00 EST").valueOf(), 14 + 1 / 16],
    [Date.parse("12 Jul 2024 14:37:00 EST").valueOf(), 14 + 15 / 16],
    [Date.parse("6 Aug 2024 14:00:00 EST").valueOf(), 15 + 11.2 / 16],
  ] as d3Line;
  const hoursToMS = 1 * 60 * 60 * 1000;
  const minToMS = 1 * 60 * 1000;

  // unix date, time in ms, lb, oz
  type WeightDataSingle = {
    date: number;
    timeHours: number;
    timeMinutes: number;
    weightLb: number;
    weightOz: number;
  };
  type WeightDataSingleOpt = {
    date?: number;
    timeHours?: number;
    timeMinutes?: number;
    weightLb?: number;
    weightOz?: number;
  };
  type WeightData = Array<WeightDataSingle>;

  const LunaWeight2: WeightData = [
    {
      date: Date.parse("09 Mar 2024").valueOf(),
      timeHours: 23,
      timeMinutes: 7,
      weightLb: 5,
      weightOz: 14,
    },
    {
      date: Date.parse("11 Mar 2024").valueOf(),
      timeHours: 0,
      timeMinutes: 33,
      weightLb: 5,
      weightOz: 10,
    },
    {
      date: Date.parse("12 Mar 2024").valueOf(),
      timeHours: 4,
      timeMinutes: 24,
      weightLb: 5,
      weightOz: 6.4,
    },
    {
      date: Date.parse("14 Mar 2024").valueOf(),
      timeHours: 11,
      timeMinutes: 43,
      weightLb: 5,
      weightOz: 10,
    },
    {
      date: Date.parse("21 Mar 2024").valueOf(),
      timeHours: 11,
      timeMinutes: 11,
      weightLb: 6,
      weightOz: 1.5,
    },
    {
      date: Date.parse("02 Apr 2024").valueOf(),
      timeHours: 3,
      timeMinutes: 58,
      weightLb: 6,
      weightOz: 13.5,
    },
    {
      date: Date.parse("22 Apr 2024").valueOf(),
      timeHours: 1,
      timeMinutes: 52,
      weightLb: 9,
      weightOz: 9,
    },
    {
      date: Date.parse("10 May 2024").valueOf(),
      timeHours: 1,
      timeMinutes: 56,
      weightLb: 11,
      weightOz: 4.5,
    },
    {
      date: Date.parse("05 Jun 2024").valueOf(),
      timeHours: 12,
      timeMinutes: 24,
      weightLb: 12,
      weightOz: 12.4,
    },
    {
      date: Date.parse("21 Jun 2024").valueOf(),
      timeHours: 12,
      timeMinutes: 24,
      weightLb: 14,
      weightOz: 1,
    },
    {
      date: Date.parse("12 Jul 2024").valueOf(),
      timeHours: 14,
      timeMinutes: 37,
      weightLb: 14,
      weightOz: 15,
    },
    {
      date: Date.parse("06 Aug 2024").valueOf(),
      timeHours: 14,
      timeMinutes: 9,
      weightLb: 15,
      weightOz: 11.2,
    },
    {
      date: Date.parse("06 Sep 2024").valueOf(),
      timeHours: 14,
      timeMinutes: 0,
      weightLb: 16,
      weightOz: 1,
    },
    {
      date: Date.parse("13 Sep 2024").valueOf(),
      timeHours: 15,
      timeMinutes: 0,
      weightLb: 16,
      weightOz: 7,
    },
    {
      date: Date.parse("18 Oct 2024").valueOf(),
      timeHours: 15,
      timeMinutes: 0,
      weightLb: 16,
      weightOz: 11,
    },
    {
      date: Date.parse("20 Dec 2024").valueOf(),
      timeHours: 15,
      timeMinutes: 0,
      weightLb: 17,
      weightOz: 12,
    },
  ];

  const [weightData, SetWeightData] = useState<WeightData>(() => LunaWeight2);

  type InputLine = (WeightDataSingleOpt & { updateRequested?: boolean }) | null;

  const [inputLine, SetInputLine] = useState<InputLine>(() => null);
  const [inputLineError, SetInputLineError] = useState({
    date: false,
    time: false,
    weightLb: false,
    weightOz: false,
  });

  useEffect(() => {
    // SetWeightData(() => weightData.toSorted((a, b) => a.date - b.date));
    updateInputLineError();
  }, [inputLine]);

  const updateInputLineError = () => {
    if (inputLine === null) {
      SetInputLineError(() => ({
        date: false,
        time: false,
        weightLb: false,
        weightOz: false,
      }));
    } else {
      if (inputLine.updateRequested === true) {
        SetInputLineError(() => ({
          date: !inputLine.hasOwnProperty("date"),
          time: !(
            inputLine.hasOwnProperty("timeMinutes") &&
            inputLine.hasOwnProperty("timeHours")
          ),
          weightLb: !inputLine.hasOwnProperty("weightLb"),
          weightOz: !inputLine.hasOwnProperty("weightOz"),
        }));
      } else {
        SetInputLineError(() => ({
          date: false,
          time: false,
          weightLb: false,
          weightOz: false,
        }));
      }
    }
  };

  const curr_time = new Date().valueOf();
  const birthTime = Date.parse("09 Mar 2024 23:07:00 EST").valueOf();
  const birthTimeOffset =
    Date.parse("06 Apr 2024 00:00:00 EST").valueOf() -
    Date.parse("09 Mar 2024 00:00:00 EST").valueOf();

  const timeZoneOffsetMSec =
    new Date(birthTime).getTimezoneOffset() * 60 * 1000;
  const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const oneMonth = (365 / 12) * 24 * 60 * 60 * 1000;
  const kgToLb = 2.20462;

  const filterOptions = [
    { label: "1 Week", months: 0.25 },
    { label: "3 Months", months: 3 },
    { label: "6 Months", months: 6 },
    { label: "1 Year", months: 12 },
    { label: "2 Years", months: 24 },
  ];

  const [filterTime, setFilterTime] = useState(() => ({
    selected: 2,
    value: filterOptions[2].months,
  }));

  const girlWeightFiltered = girlWeight.filter(
    (row) => row[0] <= filterTime.value
  );

  const weight10 = girlWeightFiltered.map(
    (row) =>
      [
        row[0] * oneMonth + birthTime + birthTimeOffset,
        row[6] * kgToLb,
      ] as d3LinePoint
  );
  const weight50 = girlWeightFiltered.map(
    (row) =>
      [
        row[0] * oneMonth + birthTime + birthTimeOffset,
        row[8] * kgToLb,
      ] as d3LinePoint
  );
  const weight90 = girlWeightFiltered.map(
    (row) =>
      [
        row[0] * oneMonth + birthTime + birthTimeOffset,
        row[10] * kgToLb,
      ] as d3LinePoint
  );

  return (
    <main>
      <h2
        css={css`
          text-align: center;
        `}
      >
        BabyTrack
      </h2>

      <details
        css={css`
          text-align: center;
          margin: 20px;
        `}
      >
        <summary>Input Table</summary>
        <table
          css={css`
            font-size: min(12px, 2.3vw);
            border: solid;
            border-radius: 15px;
            border-width: 2px;
            padding: 5px;
            width: min(90%, 600px);
            margin: 20px auto;
            & > tbody > tr > td {
              padding: 5px;
              text-align: center;
              vertical-align: middle;
              & > input {
                text-align: center;
                font-size: min(12px, 2.3vw);
              }
            }
            & > :is(thead, tbody) tr:nth-of-type(2n) {
              background-color: rgba(0, 0, 0, 0.08);
            }
          `}
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Weight</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {weightData.map((entry, index) => (
              <tr key={index}>
                <td>
                  <input
                    css={css`
                      width: min(125px, 20vw);
                    `}
                    type="date"
                    // min={formatDate(
                    //   index === 0 ? birthTime : weightData[index - 1][0]
                    // )}
                    // max={formatDate(
                    //   index === weightData.length - 1
                    //     ? birthTime * 10
                    //     : weightData[index + 1][0]
                    // )}
                    value={formatDatefromObject(entry.date, timeZoneOffsetMSec)}
                    onChange={(event) => {
                      // SetWeightData(() =>
                      //   weightData.toSorted((a, b) => a.date - b.date)
                      // );

                      SetWeightData(() =>
                        weightData
                          .map((item, index2) =>
                            index === index2
                              ? {
                                  ...item,
                                  date:
                                    new Date(event.target.value).valueOf() +
                                    timeZoneOffsetMSec,
                                }
                              : item
                          )
                          .toSorted((a, b) => a.date - b.date)
                      );
                    }}
                  />
                </td>
                <td>
                  <input
                    css={css`
                      width: min(110px, 20vw);
                    `}
                    type="time"
                    value={formatTimefromNumber({
                      hours: entry.timeHours,
                      minutes: entry.timeMinutes,
                    })}
                    onChange={(event) => {
                      const [hours, minutes] = event.target.value.split(":");
                      SetWeightData(() =>
                        weightData.map((item, index2) =>
                          index === index2
                            ? {
                                ...item,
                                timeHours: parseInt(hours),
                                timeMinutes: parseInt(minutes),
                              }
                            : item
                        )
                      );
                    }}
                  />
                </td>
                <td
                  css={css`
                    & > input {
                      width: min(45px, 8vw);
                    }
                  `}
                >
                  <input
                    type="text"
                    value={entry.weightLb}
                    onChange={(event) => {
                      SetWeightData(() =>
                        weightData.map((item, index2) =>
                          index === index2
                            ? {
                                ...item,
                                weightLb: weightLbValidation({
                                  new: event.target.value,
                                }),
                              }
                            : item
                        )
                      );
                    }}
                  />
                  &nbsp;lb&nbsp;
                  <input
                    type="text"
                    value={entry.weightOz}
                    onChange={(event) => {
                      SetWeightData(() =>
                        weightData.map((item, index2) =>
                          index === index2
                            ? {
                                ...item,
                                weightOz: weightOzValidation({
                                  new: event.target.value,
                                }),
                              }
                            : item
                        )
                      );
                    }}
                  />
                  &nbsp;oz
                </td>
                <td>
                  <input
                    readOnly={true}
                    value="&nbsp;&nbsp;&times;&nbsp;&nbsp;"
                    css={css`
                      width: min(35px, 6vw);
                      appearance: none;
                      background-color: transparent;
                      border: 2px solid #1a1a1a;
                      border-radius: 10px;
                      box-sizing: border-box;
                      color: #3b3b3b;
                      cursor: pointer;
                      display: inline-block;
                      font-family: Roobert, -apple-system, BlinkMacSystemFont,
                        "Segoe UI", Helvetica, Arial, sans-serif,
                        "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                      font-size: min(10vw, 20px);
                      font-weight: 600;
                      line-height: normal;
                      min-height: min(6vw, 30px);
                      min-width: 0;
                      outline: none;
                      padding: min(0.2vw, 1px), 50px;
                      text-align: center;
                      text-decoration: none;
                      transition: all 300ms cubic-bezier(0.23, 1, 0.32, 1);
                      user-select: none;
                      -webkit-user-select: none;
                      touch-action: manipulation;
                      will-change: transform;
                      :hover {
                        color: #fff;
                        background-color: #1a1a1a;
                        box-shadow: rgba(0, 0, 0, 0.25) 0 8px 15px;
                        transform: translateY(-2px);
                      }
                    `}
                    type="text"
                    key={index}
                    onClick={() => {
                      SetWeightData(() =>
                        weightData.filter((item, index2) => index !== index2)
                      );
                    }}
                  />
                </td>
              </tr>
            ))}

            {/* last row */}
            <tr>
              <td>
                <input
                  css={css`
                    width: min(125px, 20vw);
                    color: ${inputLineError.date ? "rgb(255,0,0)" : ""};
                    background-color: ${inputLineError.date
                      ? "rgba(255,0,0,0.15)"
                      : ""};
                  `}
                  type="date"
                  value={formatDatefromObject(
                    inputLine?.date ?? null,
                    timeZoneOffsetMSec
                  )}
                  onChange={(event) => {
                    SetInputLine(() => ({
                      ...inputLine,
                      date:
                        new Date(event.target.value).valueOf() +
                        timeZoneOffsetMSec,
                    }));
                    updateInputLineError();
                  }}
                />
              </td>
              <td>
                <input
                  css={css`
                    width: min(110px, 20vw);
                    color: ${inputLineError.time ? "rgb(255,0,0)" : ""};
                    background-color: ${inputLineError.time
                      ? "rgba(255,0,0,0.15)"
                      : ""};
                  `}
                  type="time"
                  value={formatTimefromNumber({
                    hours: inputLine?.timeHours ?? null,
                    minutes: inputLine?.timeMinutes ?? null,
                  })}
                  onChange={(event) => {
                    const [hours, minutes] = event.target.value.split(":");

                    SetInputLine(() => ({
                      ...inputLine,
                      timeHours: parseInt(hours),
                      timeMinutes: parseInt(minutes),
                    }));
                    updateInputLineError();
                  }}
                />
              </td>
              <td
                css={css`
                  & > input {
                    width: min(45px, 8vw);
                  }
                `}
              >
                <input
                  css={css`
                    color: ${inputLineError.weightLb ? "rgb(255,0,0)" : ""};
                    background-color: ${inputLineError.weightLb
                      ? "rgba(255,0,0,0.15)"
                      : ""};
                  `}
                  type="text"
                  value={inputLine?.weightLb ?? ""}
                  onChange={(event) => {
                    SetInputLine(() => ({
                      ...inputLine,
                      weightLb: weightLbValidation({ new: event.target.value }),
                    }));
                    updateInputLineError();
                  }}
                />
                &nbsp;lb&nbsp;
                <input
                  css={css`
                    color: ${inputLineError.weightOz ? "rgb(255,0,0)" : ""};
                    background-color: ${inputLineError.weightOz
                      ? "rgba(255,0,0,0.15)"
                      : ""};
                  `}
                  type="text"
                  value={inputLine?.weightOz ?? ""}
                  onChange={(event) => {
                    SetInputLine(() => ({
                      ...inputLine,
                      weightOz: weightOzValidation({ new: event.target.value }),
                    }));
                    updateInputLineError();
                  }}
                />
                &nbsp;oz
              </td>
              <td>
                <input
                  type="text"
                  readOnly={true}
                  value="&nbsp;&nbsp;&#43;&nbsp;&nbsp;"
                  css={css`
                    width: min(35px, 6vw);
                    appearance: none;
                    background-color: transparent;
                    border: 2px solid #1a1a1a;
                    border-radius: 10px;
                    box-sizing: border-box;
                    color: #3b3b3b;
                    cursor: pointer;
                    display: inline-block;
                    font-family: Roobert, -apple-system, BlinkMacSystemFont,
                      "Segoe UI", Helvetica, Arial, sans-serif,
                      "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                    font-size: min(2.3vw, 20px);
                    font-weight: 600;
                    line-height: normal;
                    min-height: min(6vw, 30px);
                    min-width: 0;
                    outline: none;
                    padding: min(0.2vw, 1px), 50px;
                    text-align: center;
                    text-decoration: none;
                    transition: all 300ms cubic-bezier(0.23, 1, 0.32, 1);
                    user-select: none;
                    -webkit-user-select: none;
                    touch-action: manipulation;
                    will-change: transform;
                    :hover {
                      color: #fff;
                      background-color: #1a1a1a;
                      box-shadow: rgba(0, 0, 0, 0.25) 0 8px 15px;
                      transform: translateY(-2px);
                    }
                  `}
                  onClick={(event) => {
                    if (inputLine !== null) {
                      if (
                        inputLine.date !== undefined &&
                        inputLine.timeHours !== undefined &&
                        inputLine.timeMinutes !== undefined &&
                        inputLine.weightLb !== undefined &&
                        inputLine.weightOz !== undefined
                      ) {
                        const test: WeightDataSingle = {
                          date: inputLine.date,
                          timeHours: inputLine.timeHours,
                          timeMinutes: inputLine.timeMinutes,
                          weightLb: inputLine.weightLb,
                          weightOz: inputLine.weightOz,
                        };
                        SetWeightData(() => [...weightData, test]);
                        SetInputLine(() => null);
                        SetInputLineError(() => ({
                          date: false,
                          time: false,
                          weightLb: false,
                          weightOz: false,
                        }));
                      } else {
                        console.log({ inputLine, inputLineError });
                        SetInputLine(() => ({
                          ...inputLine,
                          updateRequested: true,
                        }));
                        updateInputLineError();
                      }
                    } else {
                      console.log("it's null");
                      SetInputLine(() => ({
                        updateRequested: true,
                      }));
                    }
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </details>

      <text
        css={css`
          display: block;
          text-align: center;
          padding: 2px;
        `}
      >
        Select Display Time Range
      </text>
      <form
        css={css`
          text-align: center;
          padding-bottom: 20px;
        `}
      >
        <div>
          {filterOptions.map((filterOption, index) => (
            <text
              css={css`
                appearance: none;
                background-color: ${filterTime.selected === index
                  ? `#1a1a1a`
                  : `transparent`};
                border: 2px solid #1a1a1a;
                border-radius: 15px;
                box-sizing: border-box;
                color: ${filterTime.selected === index ? `#fff` : `#3b3b3b`};
                cursor: pointer;
                display: inline-block;
                font-family: Roobert, -apple-system, BlinkMacSystemFont,
                  "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji",
                  "Segoe UI Emoji", "Segoe UI Symbol";
                font-size: min(2.3vw, 16px);
                font-weight: 600;
                line-height: normal;
                margin: 5px;
                min-height: min(6vw, 30px);
                min-width: 0;
                outline: none;
                padding: min(1vw, 10px);
                text-align: center;
                text-decoration: none;
                transition: all 300ms cubic-bezier(0.23, 1, 0.32, 1);
                user-select: none;
                -webkit-user-select: none;
                touch-action: manipulation;
                will-change: transform;
                :hover {
                  color: #fff;
                  background-color: #1a1a1a;
                  box-shadow: rgba(0, 0, 0, 0.25) 0 8px 15px;
                  transform: translateY(-2px);
                }
                :active {
                  box-shadow: none;
                  transform: translateY(0);
                }
              `}
              key={index}
              onClick={(event) => {
                setFilterTime({ selected: index, value: filterOption.months });
              }}
            >
              {filterOption.label}
            </text>
          ))}
        </div>
      </form>

      <div>
        <MultiLineGraph
          {...{
            margin: { left: 50, right: 50, top: 60, bottom: 30 },
            totalWidth: 800,
            totalHeight: 300,
            title: "Growth Chart (girl)",
            y1AxisTitle: "weight (lb)",
            data: [
              weight90,
              weight50,
              weight10,
              weightData.length === 0
                ? [[0, 0]]
                : weightData.map((item) => [
                    item.date +
                      item.timeHours * hoursToMS +
                      item.timeMinutes * minToMS,
                    item.weightLb + item.weightOz / 16,
                  ]),
            ],
            lineLabel: ["90%", "50%", "10%", "Luna"],
            legend: true,
            isRefLine: [true, true, true, false],
          }}
        />
      </div>
    </main>
  );
}
