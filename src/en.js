console.time(`first content loading`);
import { generalTheme } from "./modules/themes.js";
//incidents data
import incidentData from "./incidents/incident_releases.json";
import { mainIncidents } from "./incidents/incidentsDashboard.js";
//language;
import { englishDashboard } from "./modules/langEnglish.js";
generalTheme();

import justWhy from "ie-gang";
let warningParams = {
  message:
    "We noticed you are using Internet Explorer. Please consider using a different browser for a better experience on this page.",
  type: "alert",
  title: "Old Browser Warning",
  applyIE: false,
};
justWhy.ieWarn(warningParams);

const arrayOfCharts = [
  mainIncidents(
    incidentData.events,
    incidentData.meta,
    englishDashboard.incidents
  ),
];

async function loadAllCharts(arrayOfCharts) {
  return Promise.allSettled(arrayOfCharts);
}

loadAllCharts(arrayOfCharts).then((value) => {
  console.timeEnd(`first content loading`);
});
