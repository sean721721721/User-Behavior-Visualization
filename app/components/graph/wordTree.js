import React from 'react';
import Chart from 'react-google-charts';
import {GoogleCharts} from 'google-charts';
import sententree from 'sententree';

const WordTree = (props) => {
  const { optionsWord, word } = props;
  const option = [['Phrases']];
  const newWord = option.concat(word);
  const options = {
    maxFontSize: 14,
    wordtree: {
      format: 'implicit',
      type: 'double',
      word: optionsWord,
    },
  };
  return (
    <div className="wordTree">
        <div id="vis"></div>
      <Chart
        chartType="WordTree"
        width="100%"
        height="100%"
        data={newWord}
        options={options}
      />
    </div>
  );
};

export default WordTree;
