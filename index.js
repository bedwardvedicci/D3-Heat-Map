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
  const base = exData.baseTemperature;
  data.forEach((o)=> o.variance = o.variance);
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
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  data.forEach(o=>{
    o.month = months[o.month-1];
  })
  const yScale = d3
                  .scaleBand()
                  .domain(data.map(o=>o.month))
                  .range([pad.n, h-pad.s]);
  
  const colors = ["#3060a4","#4575b4","#74add1","#abd9e9","#e0f3f8","#ffffbf","#fee090","#fdae61","#f46d43","#d73027","#c71512"]
  const temperatures = data.map(d=>d.variance+base);
  const minTmp = Math.min.apply(null, temperatures); // min Temperature
  const maxTmp = Math.max.apply(null, temperatures); // max Temperature
  const thresholdScale = d3
                      .scaleThreshold()
                      .domain(((min, max, count)=>{// (max-min / colors count) to get the step
                        const thresholds = [];
                        const step = (max-min)/count;
                        const base = min;
                        for (let i=1; i<count; i++) {
                          thresholds.push(base+step*i)
                        }
                        return thresholds; // return array of (colors count -1) of thresholds
                      })(minTmp, maxTmp, colors.length))
                      .range(colors);
  // ↑↑↑ Scales
  
  // ↓↓↓ Axis
  const xAxis = d3
                .axisBottom(xScale)
                .tickValues(xScale.domain().filter(y => y%10===0))
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
    .attr("fill", d=>thresholdScale(base+d.variance))
    .attr("data-month", d=>months.indexOf(d.month))
    .attr("data-year", d=>d.year)
    .attr("data-temp", d=>base+d.variance)
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);
  
  //Map's Legend ↓↓↓  
  const lW=300, lH=70, lHPad=15, lVPad=25; // legend's width and height.
  
  const legendSvg = d3
    .select("#map")
    .append("svg")
    .attr("id", "legend")
    .attr("width", lW)
    .attr("height", lH);

  const legendXScale = d3
                        .scaleLinear()
                        .domain([minTmp, maxTmp])
                        .range([lHPad, lW-lHPad]);
  
  const legendAxis = d3
                      .axisBottom(legendXScale)
                      .tickValues(thresholdScale.domain())
                      .tickFormat(d3.format(".1f"))
                      .tickSize(13)
                      .tickSizeOuter(0);

  const gLegendAxis = legendSvg
                        .append("g")
                        .attr("transform", `translate(0, ${lH-lVPad})`)
                        .call(legendAxis);
  
  gLegendAxis
      .selectAll(".legendRect")
      .data(thresholdScale.range().map(color => {
        const delim = thresholdScale.invertExtent(color); // delimiter
        if (!delim[0]) delim[0]=legendXScale.domain()[0]; // if delimiter has a falsy value, null or undefined
        if (!delim[1]) delim[1]=legendXScale.domain()[1];
        return delim;
      }))
      .enter()
      .insert("rect", ".tick")
      .attr("stroke", "black")
      .attr("stroke-width", "1px")
      .attr("x", d=>legendXScale(d[0]))
      .attr("width", d=>legendXScale(d[1])-legendXScale(d[0]))
      .attr("y", d=>-(legendXScale(d[1])-legendXScale(d[0])))
      .attr("height", d=>legendXScale(d[1])-legendXScale(d[0]))
      .attr("fill", d=>thresholdScale(d[0]));
  // Map's Legend ↑↑↑
}
init(exData);