import { profileAssist as pa } from "../modules/util.js";
import { EventMap, EventNavigator, EventTrend } from "../modules/dashboard.js";

export async function mainIncidents(incidentData, metaData, lang) {
  const eventType = "incidents";
  const field = "Substance";
  const filters = { type: "frequency" };

  const incidentBar = (data, map) => {
    const barNav = new EventNavigator({
      plot: map,
      pillWidth: 75,
      data: data,
    });
    barNav.makeBar("Substance", "substance-bar", "activated", true);
    barNav.makeBar("Company", "company-bar", "deactivated", true, 260);
    barNav.makeBar("Status", "status-bar", "deactivated", true);
    barNav.makeBar("Was NEB Staff Deployed", "staff-bar", "deactivated", true);
    barNav.makeBar("Year", "year-bar", "deactivated", true);
    barNav.makeBar(
      "Activity at time of incident",
      "activity-bar",
      "deactivated",
      true
    );
    barNav.makeBar(
      "Residual effects on the environment",
      "environment-bar",
      "deactivated",
      true
    );
    barNav.makeBar(
      "How was it discovered",
      "discovered-bar",
      "deactivated",
      true
    );
    barNav.makeBar("Province", "province-bar", "deactivated", true);
    barNav.divEvents();
    return barNav;
  };

  const incidentMap = (field, filters, lang) => {
    const map = new EventMap({
      eventType: eventType,
      field: field,
      filters: filters,
      minRadius: 12000,
      leafletDiv: "incident-map",
      lang: lang,
    });
    map.addBaseMap();
    map.processEventsData(incidentData);
    map.lookForSize();
    return map;
  };

  const incidentTimeSeries = (field, filters, definitions) => {
    const timeSeries = new EventTrend({
      eventType: eventType,
      field: field,
      filters: filters,
      data: incidentData,
      hcDiv: "time-series",
      definitions: definitions,
    });
    const trendNav = new EventNavigator({
      plot: timeSeries,
      height: 80,
    });

    trendNav.makeBar("Substance", "substance-trend", "activated", false);
    trendNav.makeBar("Status", "status-trend", "deactivated", false);
    trendNav.makeBar("What Happened", "what-trend", "deactivated", false);
    trendNav.makeBar("Why It Happened", "why-trend", "deactivated", false);
    trendNav.makeBar("Province", "province-trend", "deactivated", false);
    trendNav.divEvents();
    timeSeries.createChart();
    return timeSeries;
  };

  function buildDashboard() {
    if (!incidentData.length == 0) {
      try {
        //generateDynamicIncidentText(metaData);
        const thisMap = incidentMap(field, filters, lang.dashboard);
        thisMap.reZoom();
        const bars = incidentBar(incidentData, thisMap);
        const trends = incidentTimeSeries(field, filters, lang.definitions);
        // user selection to show volume or incident frequency
        $("#inline_content input[name='type']").click(function () {
          var btnValue = $("input:radio[name=type]:checked").val();
          thisMap.filters.type = btnValue;
          trends.filters.type = btnValue;
          bars.switchY(btnValue);
          thisMap.updateRadius();
          if (btnValue !== "frequency") {
            thisMap.addMapDisclaimer();
          } else {
            thisMap.removeMapDisclaimer();
          }
        });
        if (incidentData.length == 1) {
          // if there is only one incident, then disable the select volume option
          $("#incident-volume-btn").attr("disabled", "disabled");
        }

        // user selection to show map or trends
        $("#incident-view-type button").on("click", function () {
          $(".btn-incident-view-type > .btn").removeClass("active");
          $(this).addClass("active");
          var thisBtn = $(this);
          var btnValue = thisBtn.val();
          var dashboardDivs = ["incident-map", "nearby-incidents-popup"].concat(
            bars.allDivs
          );
          if (btnValue !== "trends") {
            pa.visibility(dashboardDivs, "show");
            pa.visibility(["time-series-section"], "hide");
            $("#incident-volume-btn").removeAttr("disabled");
            thisMap.map.invalidateSize(true); // fixes problem when switching from trends to map after changing tabs
          } else {
            // if the user selects trends, the option to view volume should be disabled
            $("#incident-volume-btn").attr("disabled", "disabled");
            $("#incident-count-btn").prop("checked", true).click();
            pa.visibility(dashboardDivs, "hide");
            pa.visibility(["time-series-section"], "show");
          }
        });

        // user selection for finding nearby incidents
        $("#incident-range-slide").on("change", function () {
          let slide = $(this);
          let findIncidentBtn = document.getElementById("find-incidents-btn");
          let findIncidentTitle = document.getElementById(
            "find-incidents-title"
          );
          findIncidentBtn.innerText = `Find Incidents within ${slide.val()}km`;
          findIncidentTitle.innerText = `Select Range (${slide.val()}km):`;
          findIncidentBtn.value = slide.val();
        });

        // user selects a range to find nearby incidents
        $("#find-incidents-btn").on("click", function () {
          document.getElementById("reset-incidents-btn").disabled = false;
          let range = document.getElementById("find-incidents-btn").value;
          if (!thisMap.user.latitude && !thisMap.user.longitude) {
            thisMap.waitOnUser().then((userAdded) => {
              thisMap.nearbyIncidents(range);
            });
          } else {
            thisMap.nearbyIncidents(range);
          }
        });

        // reset map after user has selected a range
        $("#reset-incidents-btn").on("click", function () {
          thisMap.resetMap();
          document.getElementById("reset-incidents-btn").disabled = true;
          document.getElementById("nearby-flag").innerHTML = ``;
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      // no incidents data
      let noIncidents = document.getElementById("incidents-dashboard");
      let noIncidentsHTML = `<section class="alert alert-warning"><h3>${lang.noIncidents.header}</h3>`;
      noIncidentsHTML += `<p>${lang.noIncidents.note(
        metaData.companyName
      )}</p></section>`;
      noIncidents.innerHTML = noIncidentsHTML;
    }
  }
  return buildDashboard();
}
