// @flow
import React from 'react';
import { connect } from 'react-redux';
import TextareaAutosize from 'react-autosize-textarea';
import CheckBox from '../components/CheckBox';
import Input from '../components/Input';
import TextArea from '../components/TextArea';
import Select from '../components/Select';
import Button from '../components/Button';
import { addCard, clearCard } from '../actions';

const AddCard = ({ dispatch }) => {
  let input = {};
  const buttonStyle = {
    margin: '10px 10px 10px 10px',
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    /*
          if (!input.title) {
            return;
          } */
    console.log(input);
    dispatch(addCard(input));
    input = {};
  };
  return (
    <div>
      <form className="container-fluid" onSubmit={handleFormSubmit}>
        <Input
          inputType="text"
          title="Time"
          name="time"
          ref={(node) => {
            input.time = node.value;
          }}
          palceholder="Enter time" /* handleChange={this.handleInput} */
        />
        <Input
          inputType="text"
          title="Title"
          name="title"
          ref={(node) => {
            input.title = node.value;
          }}
          palceholder="Enter time" /* handleChange={this.handleInput} */
        />
        <TextareaAutosize
          defaultValue="Church-key flannel bicycle rights, tofu tacos before they sold out polaroid for free"
          theme={{
            textarea: {
              fontSize: '18px',
              borderColor: 'green',
            },
          }}
        />
        <Input
          inputType="text"
          title="Tags"
          name="tag"
          ref={(node) => {
            input.tags = node.value;
          }}
          palceholder="Enter time" /* handleChange={this.handleInput} */
        />
        <Button action={handleFormSubmit} type="Add Card" title="primary" style={buttonStyle} />
        <Button
          action={(e) => {
            e.preventDefault();
            dispatch(clearCard());
          }}
          type="Clear"
          title="secondary"
          style={buttonStyle}
        />
      </form>
    </div>
  );
};

export default connect()(AddCard);
