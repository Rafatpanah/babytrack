const hashString = (string) => {
  //set variable hash as 0
  var hash = 0;
  // if the length of the string is 0, return 0
  if (string.length == 0) return hash;
  for (var i = 0; i < string.length; i++) {
    var ch = string.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return Math.abs(hash);
};
const hashString2 = (string) => {
  //set variable hash as 0
  var stringValue = 0;
  // if the length of the string is 0, return 0
  if (string.length == 0) return hash;
  for (var i = 0; i < string.length; i++) {
    var stringValue = stringValue + string.charCodeAt(i);
  }
  console.log(stringValue);
  return stringValue;
};

const indexToColor = (index) => {
  const acceptableColors = [
    "rgb(230, 25, 75)",
    "rgb(60, 180, 75)",
    // "rgb(255, 225, 25)",
    "rgb(0, 130, 200)",
    "rgb(245, 130, 48)",
    "rgb(145, 30, 180)",
    "rgb(70, 240, 240)",
    "rgb(240, 50, 230)",
    // "rgb(210, 245, 60)",
    "rgb(250, 190, 212)",
    "rgb(0, 128, 128)",
    "rgb(220, 190, 255)",
    "rgb(170, 110, 40)",
    // "rgb(255, 250, 200)",
    "rgb(128, 0, 0)",
    // "rgb(170, 255, 195)",
    "rgb(128, 128, 0)",
    // "rgb(255, 215, 180)",
    "rgb(0, 0, 128)",
  ];
  return acceptableColors[index % (acceptableColors.length - 1)];
};

const stringToColor = (string) => {
  const acceptableColors = [
    "rgb(0,0,255)",
    "rgb(0,128,128)",
    "rgb(0,191,255)",
    "rgb(0,250,154)",
    "rgb(0,255,255)",
    "rgb(25,25,112)",
    "rgb(30,144,255)",
    "rgb(34,139,34)",
    "rgb(47,79,79)",
    "rgb(50,205,50)",
    "rgb(64,224,208)",
    "rgb(65,105,225)",
    "rgb(70,130,180)",
    "rgb(72,61,139)",
    "rgb(75,0,130)",
    "rgb(85,107,47)",
    "rgb(100,149,237)",
    "rgb(106,90,205)",
    "rgb(119,136,153)",
    "rgb(127,255,0)",
    "rgb(127,255,212)",
    "rgb(128,0,128)",
    "rgb(128,128,0)",
    "rgb(135,206,235)",
    "rgb(138,43,226)",
    "rgb(143,188,143)",
    "rgb(152,251,152)",
    "rgb(153,50,204)",
    "rgb(160,82,45)",
    "rgb(173,216,230)",
    "rgb(176,196,222)",
    "rgb(188,143,143)",
    "rgb(189,183,107)",
    "rgb(199,21,133)",
    "rgb(205,133,63)",
    "rgb(210,105,30)",
    "rgb(216,191,216)",
    "rgb(218,112,214)",
    "rgb(219,112,147)",
    "rgb(220,20,60)",
    "rgb(221,160,221)",
    "rgb(222,184,135)",
    "rgb(240,128,128)",
    "rgb(244,164,96)",
    "rgb(245,255,250)",
    "rgb(255,0,255)",
    "rgb(255,20,147)",
    "rgb(255,127,80)",
    "rgb(255,160,122)",
    "rgb(255,182,193)",
    "rgb(255,215,0)",
    "rgb(255,218,185)",
    "rgb(255,228,181)",
    "rgb(255,228,225)",
    "rgb(255,250,205)",
    "rgb(255,255,0)",
  ];
  // const acceptableColors = [
  //   "rgb(178,34,34)",
  //   "rgb(220,20,60)",
  //   "rgb(255,0,0)",
  //   "rgb(255,99,71)",
  //   "rgb(255,127,80)",
  //   "rgb(205,92,92)",
  //   "rgb(240,128,128)",
  //   "rgb(233,150,122)",
  //   "rgb(250,128,114)",
  //   "rgb(255,160,122)",
  //   "rgb(255,69,0)",
  //   "rgb(255,140,0)",
  //   "rgb(255,165,0)",
  //   "rgb(255,215,0)",
  //   "rgb(184,134,11)",
  //   "rgb(218,165,32)",
  //   "rgb(238,232,170)",
  //   "rgb(189,183,107)",
  //   "rgb(240,230,140)",
  //   "rgb(128,128,0)",
  //   "rgb(255,255,0)",
  //   "rgb(154,205,50)",
  //   "rgb(85,107,47)",
  //   "rgb(107,142,35)",
  //   "rgb(127,255,0)",
  //   "rgb(34,139,34)",
  //   "rgb(50,205,50)",
  //   "rgb(152,251,152)",
  //   "rgb(143,188,143)",
  //   "rgb(0,250,154)",
  //   "rgb(46,139,87)",
  //   "rgb(102,205,170)",
  //   "rgb(32,178,170)",
  //   "rgb(47,79,79)",
  //   "rgb(0,128,128)",
  //   "rgb(0,255,255)",
  //   "rgb(0,206,209)",
  //   "rgb(64,224,208)",
  //   "rgb(175,238,238)",
  //   "rgb(127,255,212)",
  //   "rgb(176,224,230)",
  //   "rgb(95,158,160)",
  //   "rgb(70,130,180)",
  //   "rgb(100,149,237)",
  //   "rgb(0,191,255)",
  //   "rgb(30,144,255)",
  //   "rgb(173,216,230)",
  //   "rgb(135,206,235)",
  //   "rgb(135,206,250)",
  //   "rgb(25,25,112)",
  //   "rgb(0,0,255)",
  //   "rgb(65,105,225)",
  //   "rgb(138,43,226)",
  //   "rgb(75,0,130)",
  //   "rgb(72,61,139)",
  //   "rgb(106,90,205)",
  //   "rgb(147,112,219)",
  //   "rgb(139,0,139)",
  //   "rgb(153,50,204)",
  //   "rgb(186,85,211)",
  //   "rgb(128,0,128)",
  //   "rgb(216,191,216)",
  //   "rgb(221,160,221)",
  //   "rgb(238,130,238)",
  //   "rgb(255,0,255)",
  //   "rgb(218,112,214)",
  //   "rgb(199,21,133)",
  //   "rgb(219,112,147)",
  //   "rgb(255,20,147)",
  //   "rgb(255,105,180)",
  //   "rgb(255,182,193)",
  //   "rgb(255,192,203)",
  //   "rgb(245,245,220)",
  //   "rgb(255,228,196)",
  //   "rgb(255,235,205)",
  //   "rgb(245,222,179)",
  //   "rgb(255,250,205)",
  //   "rgb(139,69,19)",
  //   "rgb(160,82,45)",
  //   "rgb(210,105,30)",
  //   "rgb(205,133,63)",
  //   "rgb(244,164,96)",
  //   "rgb(222,184,135)",
  //   "rgb(188,143,143)",
  //   "rgb(255,228,181)",
  //   "rgb(255,218,185)",
  //   "rgb(255,228,225)",
  //   "rgb(255,240,245)",
  //   "rgb(250,240,230)",
  //   "rgb(255,239,213)",
  //   "rgb(245,255,250)",
  //   "rgb(119,136,153)",
  //   "rgb(176,196,222)",
  // ];
  return acceptableColors[hashString(string) % (acceptableColors.length - 1)];
};

const stringToColor2 = (string) => {
  if (!string) {
    string = "asdf";
  }
  const userHash = parseInt(
    crypto.createHash("sha1").update(string).digest("hex").slice(0, 11),
    16
  ).toString();
  const s = 255;
  return (
    "rgb(" +
    (userHash.slice(0, 3) % s) +
    "," +
    (userHash.slice(4, 7) % s) +
    "," +
    (userHash.slice(8, 11) % s) +
    ")"
  );
};

function random_rgba() {
  const o = Math.round,
    r = Math.random,
    s = 255;
  return `rgba(${o(r() * s)},${o(r() * s)},${o(r() * s)},1)`;
}
function random_rgb() {
  const o = Math.round,
    r = Math.random,
    s = 255;
  return "rgb(" + o(r() * s) + "," + o(r() * s) + "," + o(r() * s) + ")";
}

const capitalizeFirstLetter = (string) => {
  return string[0].toUpperCase() + string.slice(1);
};

export { indexToColor, stringToColor, capitalizeFirstLetter };
