import React from 'react';
import Chart from 'react-google-charts';
import {GoogleCharts} from 'google-charts';
import sententree from 'sententree';

const WordTree = (props) => {
  // console.log(this.props);
  const options = {
    maxFontSize: 14,
    wordtree: {
      format: 'implicit',
      word: 'cats',
    },
  };

  const { word } = props;
  //   const model = new SentenTreeBuilder()
  //     .buildModel(data);

  //   new SentenTreeVis('#vis')
  //   // change the number to limit number of output
  //     .data(model.getRenderedGraphs(3))
  //     .on('nodeClick', (node) => {
  //       console.log('node', node);
  //     });
  console.log(word);
  return (
    <div className="wordTree">
        <div id="vis"></div>
      <Chart
        chartType="WordTree"
        width="100%"
        height="100%"
        data={word}
        options={options}
      />
    </div>
  );
};

export default WordTree;
