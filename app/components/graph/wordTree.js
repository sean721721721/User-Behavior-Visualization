import React from 'react';
import Chart from 'react-google-charts';
import {GoogleCharts} from 'google-charts';

const WordTree = (props) => {
  // console.log(this.props);
  const options = {
    maxFontSize: 14,
    wordtree: {
      format: 'implicit',
      word: 'cats',
    },
  };
  const style = {
    float: 'left',
    border: '2px solid gray',
  };

  const { word } = props;
  console.log(word);
  return (
    <div className="wordTree">
      <Chart
            // style={style}
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
