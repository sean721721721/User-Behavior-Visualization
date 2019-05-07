import React, { Component } from 'react';
import PropTypes from 'prop-types';
//import { connect } from 'react-redux';
//import { push } from 'react-router-redux';
import * as d3 from 'd3';
//import { Row, Form } from 'antd';

class BarChart extends Component {
  
  componentDidMount() {
    this.drawChart();
  }
  componentDidUpdate() {
    this.drawChart();
  }
  drawChart() {
    const data = [12, 5, 6, 6, 9, 10];
    const w = 700,h = 300;
    const svg = d3.select(this.refs.chart)
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .style("margin-left", 100);
                  
    svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * 70)
      .attr("y", (d, i) => h - 10 * d)
      .attr("width", 65)
      .attr("height", (d, i) => d * 10)
      .attr("fill", "green")
  }
 
  render(){
    return <div id={'#' + this.props.id}>
      <div ref='chart'></div>
    </div>
  }
}



export default BarChart;
