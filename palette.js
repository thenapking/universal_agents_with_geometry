let palettes = {
  "Pumpkin": {background: "#F9AF1C", strength: "1", black: "#0D2529", white: "#FFFFFF" },
  "Gola": {background: "#FFA21E", strength: "3", black:"#22629D", white: "#FFFFFF" },
  "Almond BG": { background: "#F07500", strength: "1", black:"#343549", white: "#FFFFFF" },
  "Pumpkin II": {background: "#F9AF1C", strength: "1", black: "#F5E8D7", white: "#000000" },
  "Cherry": {background: "#BE1340", strength: "1", black: "#F8ECE7", white: "#000000"},
  "Burnt Orange": {background: "#F77331", strength: "2.5", black: "#F8ECE7", white: "#000000"},
  "Console II":{background: "#ED4404", strength: "1", black: "#3B4552", white: "#FFFFFF" },
  "Nightshade": {background: "#0D1929", strength: "3", black: "#FFFFFF", white: "#000000"},
  "Monochrome": {background: "#000000", strength: "2", black: "#FFFFFF", white: "#000000"},
  "Whale": {background: "#003049", strength: "3", black: "#F7F2EF", white: "#000000"},
  "Light Smoke": {background: "#2E2A40", strength: "2", black: "#F5F5F7", white: "#000000"},
  "Grind Blue Grey":{background: "#253B56", strength: "3", black: "#E6EAEE", white: "#000000" },
  "Neutral": {background: "#193541", strength: "3", black: "#F5F3EE", white: "#000000"},
  "Fire": {background: "#31456A", strength: "1", black: "#FF9833", white: "#000000" },
  "Pink Dusk Inverse": {background: "#08142C", strength: "2", black: "#ffaba2", white: "#000000"},
  "Prussian": {background: "#1E3049", strength: "3", black: "#FDF0D5", white: "#000000"},
  "Computer Manual": {background: "#2E3F47", strength: "2", black: "#FBF4D7", white: "#000000"},
  "Hand Bill": {background: "#32404A", strength: "3", black: "#F4D8B9", white: "#000000"},
  "Almond": {background: "#343549", strength: "2", black: "#F6E9DF", white: "#000000"},
  "Military Grey": {background: "#86999D", strength: "2", black: "#F5E6C5", white: "#000000"},
  "Console": {background: "#8399b4", strength: "3", black: "#FFFFFF", white: "#000000"},
  "Warm Grey": {background: "#CDDBE8", strength: "2", black: "#A62A4F", white: "#FFFFFF"},
  "Vosper": {background: "#229bb9", strength: "2", black: "#FFFFFF", white: "#000000"},
  "Vosper Inverse": {background: "#77C4D1", strength: "1", black: "#FFFFFF", white: "#000000"},
  "Hi Contrast": {background: "#65C3CF", strength: "2", black: "#DD1B1C", white: "#FFFFFF" },
  "Dream Building": {background: "#40A5AF", strength: "3", black: "#FDFAEB", white: "#000000"},
  "KPM": {background: "#6D8049", strength: "3", black: "#F7EECD", white: "#000000"},
  "Aesop Green":{background: "#7F865C", strength: "3", black: "#FDFDF8", white: "#000000" },
  "West Coast": {background: "#B5D6C5", strength: "2", black: "#D75931", white: "#FFFFFF"},
  "Grey Grass and Pumpkin": {background: "#A9B6A4", strength: "2", black: "#f9b815", white: "#000000"},
  "Engraved Limestone":{background: "#b8c4c2", strength: "3", black: "#ffc907", white: "#000000" },
  "Grey Grass": {background: "#A9B6A4", strength: "2", black: "#FAF3E2", white: "#000000"},
  "Garden Catalogue": {background:"#457E55", strength: "2", black: "#FDF0DD", white: "#000000" },
  "Brazil": {background: "#2C8F3D", strength: "2", black: "#EEC219", white: "#000000" },
  "System I":{background: "#003A11", strength: "3", black: "#E2EDBB", white: "#000000" },
  "Seashell": {background: "#3A5970", strength: "2", black: "#F1F0F2", white: "#000000"},
  "Porcelain": {background: "#293F92", strength: "3", black: "#F2F0F0", white: "#000000"},
  "Lavender": {background: "#22629D", strength: "2", black: "#FCF2F0", white: "#000000"},
  "Lara": {background: "#3272BD", strength: "2", black: "#F7F2F2", white: "#000000"},
  "Sandy Pool": {background: "#1C6AA8", strength: "2", black: "#F3E3BF", white: "#000000"},
  "Cornflour": {background: "#8EC8EC", strength: "2", black: "#201C59", white: "#FFFFFF"},
  "Grind Caramel":{background: "#CA996D", strength: "3", black: "#3C352E", white: "#FFFFFF"}, 
  "Caffeine":{background: "#a67b56", strength: "3", black: "#ffffff", white: "#000000" },
  "Grind":{background: "#F6DEE2", strength: "3", black: "#282522", white: "#FFFFFF" },
  "Pink Dusk": {background: "#F2A299", strength: "2", black: "#08142C", white: "#FFFFFF"},
  "Candy Floss": {background: "#F8BCC8", strength: "1", black: "#FAF3E9", white: "#000000" },
  "Boy Girl": {background: "#FFC2C9", strength: "3", black: "#1B4D8C", white: "#FFFFFF"},
  "Dairy": {background: "#FCE0C4", strength: "2", black: "#19141B", white: "#FFFFFF"},
  "Aesop":{background: "#F7E5C0", strength: "3", black: "#1D1812", white: "#FFFFFF" },
  "Almond Paper": {background: "#F6E9DF", strength: "2", black: "#343549", white: "#FFFFFF"},
  "Prussian Ink": {background: "#FDF0D5", strength: "2", black: "#1E3049", white: "#FFFFFF"},
  "Cosmetics":{background: "#FFFEF0", strength: "3", black: "#2D2D2D", white: "#FFFFFF" },
  "Japanese": {background: "#FFF8F5", strength: "1", black: "#193541", white: "#FFFFFF"},
  "Whale Ink": {background: "#F7F2EF", strength: "1", black: "#003049", white: "#FFFFFF"},
  "Light Smoke Ink": {background: "#F5F5F7", strength: "1", black: "#2E2A40", white: "#FFFFFF"},
  "Lavender Ink": {background: "#FCF2F0", strength: "1", black: "#22629D", white: "#FFFFFF"},
  "Lara Ink": {background: "#F7F2F2", strength: "1", black: "#3272BD", white: "#FFFFFF"},
  "Navy Ink": {background: "#F8F4F9", strength: "2.5", black: "#293F92", white: "#FFFFFF"},
  "Neutral Ink": {background: "#F5F3EE", strength: "1", black: "#193541", white: "#FFFFFF"},
  "Harbour": {background: "#EEE7E6", strength: "2", black: "#245590", white: "#FFFFFF"},
  "Soft Peach": {background: "#F7ECE4", strength: "2", black: "#5272BD", white: "#FFFFFF"},
  "Seashell Ink": {background: "#F1F0F2", strength: "2", black: "#3A5970", white: "#FFFFFF"},
  "Light Cherry": {background: "#F8ECE7", strength: "2.5", black: "#BE1340", white: "#FFFFFF"},
  "Burnt Orange Ink": {background: "#F8ECE7", strength: "2.5", black: "#F77331", white: "#FFFFFF"},
  "Fabricworm": {background: "#e9e7e8", black: "#474246", white: "#FFFFFF", colours:[ "#aaafc5", "#d97d5f", "#cec7bf", "#b7b0a5", "#8b838b", "#79758a"]},
  "MultiTest": {background: "#f4ecf1", strength: "2.5", black: "#FFFFF", white: "#FFFFFF", 
  colours:["#485f8b", "#632c72", "#e99d29", "#4794a2", "#474246"]},
};


let palette_names = Object.keys(palettes);
let palette_name = palette_names[Math.floor(Math.random() * palette_names.length)];
palette_name = "Pumpkin II"; // For testing
let palette = palettes[palette_name];


function change_palette(key){
  let palette_index = palette_names.indexOf(palette_name)

  if (key === "=") {
    palette_index += 1;
  } else {
    palette_index -= 1;
  }
  palette_index = constrain(palette_index, 0, palette_names.length-1) 
  palette_name = palette_names[palette_index]
  palette = palettes[palette_name];
  console.log(`Palette: ${palette_name}`)
  redraw();
}
