import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(__dirname, "../dist-web/index.html");

const fontCSS = `
  <style id="vector-icon-fonts">
    @font-face {
      font-family: 'Ionicons';
      src: url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'Feather';
      src: url('https://unpkg.com/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
      font-display: swap;
    }
  </style>`;

let html = readFileSync(indexPath, "utf8");

if (html.includes('id="vector-icon-fonts"')) {
  console.log("Font patch already applied.");
} else {
  html = html.replace("</head>", `${fontCSS}\n</head>`);
  writeFileSync(indexPath, html, "utf8");
  console.log("Font patch applied — icon fonts will load from CDN.");
}
