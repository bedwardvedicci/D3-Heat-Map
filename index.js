import React from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";
import "./index.css";

window.onload = async () => {
  const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
  const data = await fetch(url);
  const json = await data.json();

  init(json);
}

const init = (exData) => {
  const App = () => (
    <div>
      <h1 id="title">Monthly Global Land-Surface Temperature<br/>
        <span id="description">
          1753 - 2015: base temperature {exData.baseTemperature}°C
        </span>
      </h1>
      <div id="mapWrapper">
        <div id="map">
        </div>
      </div>
    </div>
  );
  
  ReactDOM.render(<App/>, document.getElementById("root"));
  
  // CONSTANTS ↓↓↓
  const w=1200, h=350, pad={n:20, e:10, s:20, w:65};//n: North etc...
  const toDec = (num) => { // rounds and converts a float to float with 1 digit after decimal point ex: 1.21 to 1.2
    return parseFloat(num.toFixed(1));// "parseFloat" because "toFixed" returns a string
  }
  
  const data = exData.monthlyVariance; // {year, month, variance}
  const base = toDec(exData.baseTemperature);
  data.forEach((o)=> o.variance = toDec(o.variance));
  // CONSTANTS ↑↑↑
  
  const mapSvg = d3
                .select("#map")
                .style("position", "relative")
                .append("svg")
                .attr("width", w)
                .attr("height", h);
  
  // ↓↓↓ Scales
  
  const xScale = d3
                  .scaleBand()
                  .domain(data.map(o=>o.year)) // array of Years
                  .range([pad.w, w-pad.e])
                  .paddingOuter(.1)
                  .align(1);
  
  const xAxisScale = d3
                      .scaleLinear()
                      .domain([d3.min(data, d=>d.year), d3.max(data, d=>d.year)])
                      .range([pad.w, w-pad.e]);
                  
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  data.forEach(o=>{
    o.month = months[o.month-1];
  })
  const yScale = d3
                  .scaleBand()
                  .domain(data.map(o=>o.month))
                  .range([pad.n, h-pad.s]);
  
                  
  const minTmp=2.8; // Temperature
  const maxTmp=12.8;
  const colorScale = d3
                      .scaleQuantize()
                      .domain([minTmp, maxTmp])
                      .range(["#4575b4","#74add1","#abd9e9","#e0f3f8","#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027"]);
  
  // ↑↑↑ Scales
  
  // ↓↓↓ Axis
  
  const xAxis = d3
                .axisBottom(xAxisScale)
                .tickFormat(d3.format("d"))
                .ticks(20)
                .tickSizeOuter(0);
  
  const yAxis = d3
                .axisLeft(yScale)
                .tickSizeOuter(0);
  
  mapSvg
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${h-pad.s})`)
    .call(xAxis);
  
  mapSvg
    .append("g")
    .attr("id", "y-axis")
    .attr("transform", `translate(${pad.w}, 0)`)
    .call(yAxis);
  // ↑↑↑ Axis
  
  // MouseHandlers ↓↓↓
  const handleMouseOver = (e, d) => {
    const temp = toDec(base+d.variance);
    
    d3
      .select("#map")
      .append("div")
      .attr("id", "tooltipContainer")
      .style("position", "absolute")
      .style("left", xScale(d.year))
      .style("bottom", (h-yScale(d.month))+pad.s+pad.n+yScale.bandwidth()+5)
      .append("div")
      .attr("id", "tooltip")
      .attr("data-year", d.year)
      .html(`
      ${d.year}-${d.month}<br/>
      ${temp}°C<br/>
      ${d.variance}°C
      `);
  }
  const handleMouseOut = () => {
    d3
    .select("#tooltipContainer")
    .remove();
  }
  // MouseHandlers ↑↑↑
  
  
  mapSvg
    .selectAll(".cell")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", d=>xScale(d.year))
    .attr("width", xScale.bandwidth())
    .attr("y", d=>yScale(d.month))
    .attr("height", yScale.bandwidth())
    .attr("fill", d=>colorScale(toDec(base+d.variance)))
    .attr("data-month", d=>months.indexOf(d.month))
    .attr("data-year", d=>d.year)
    .attr("data-temp", d=>toDec(base+d.variance))
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);
  
  // Map's Legend ↓↓↓  
  const thresholds = [...colorScale.thresholds()].map(v=>toDec(v));
  thresholds.unshift(minTmp);
  thresholds.push(maxTmp);
  
  const lW=300, lH=65, lHPad=15, lVPad=20; // legend's width and height.
  const sqDimens = (lW-(lHPad*2))/(thresholds.length-1);// sqDimens for square Dimensions
  
  const legend = d3
    .select("#map")
    .append("svg")
    .attr("id", "legend")
    .attr("width", lW)
    .attr("height", lH);
  
  const legendScale = d3.scalePoint()
                            .domain(thresholds)
                            .range([lHPad, lW-lHPad]);
  
  const legendAxis = d3
                      .axisBottom(legendScale)
                      .tickSizeOuter(0);
  
  legend
      .append("g")
      .attr("transform", `translate(0, ${lH-lVPad})`)
      .call(legendAxis);
  
  legend
      .selectAll(".legendRect")
      .data(thresholds.slice(0, thresholds.length-1))
      .enter()
      .append("rect")
      .attr("stroke", "black")
      .attr("stroke-width", "1px")
      .attr("width", sqDimens)
      .attr("height", sqDimens)
      .attr("fill", d=>colorScale(d))
      .attr("x", d=>legendScale(d))
      .attr("y", lH-lVPad-sqDimens);
  // Map's Legend ↑↑↑
}