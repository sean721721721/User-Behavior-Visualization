// @flow
import React from 'react';
import { connect } from 'react-redux';
// import TextareaAutosize from 'react-autosize-textarea';
import CheckBox from '../components/CheckBox';
import Input from '../components/Input';
import TextArea from '../components/TextArea';
import Select from '../components/Select';
import Button from '../components/Button';
import {
  addCard, clearCard, editTime, editTitle, editAbout, editTag,
} from '../actions';

const mapStatToProps = (state) => {
  console.log(state);
  return { cardprops: state.input };
};

const mapDispatchToProps = dispatch => ({
  addCard: card => dispatch(addCard(card)),
  clearCard: () => dispatch(clearCard()),
  editTime: card => dispatch(editTime(card.time)),
  editTitle: card => dispatch(editTitle(card.title)),
  editAbout: card => dispatch(editAbout(card.about)),
  editTag: card => dispatch(editTag(card.tag)),
});
class ConnectedAddCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: {
        time: '08 Jan 019',
        title: '柯P',
        description: '台北市長柯文哲在PTT上別稱',
        tags: ['人物', '政治', '台北'],
      },
    };

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleTime = this.handleTime.bind(this);
    this.handleTextArea = this.handleTextArea.bind(this);
  }

  handleFormSubmit = (e) => {
    e.preventDefault();
    let { input } = this.state;
    console.log(input);
    this.props.addCard(input);
    input = {};
  };

  handleTime = (e) => {
    e.preventDefault();
    let { input } = this.state;
    this.props.editTime(input);
    input = {};
  };

  handleTextArea = (e) => {
    e.preventDefault();
    console.log('Inside handleTextArea');
    let { input } = this.state;
    this.props.editAbout(input);
    input = {};
    /* const { value } = e.target;
    this.setState(
      prevState => ({
        info: {
          ...prevState.info,
          info: value,
        },
      }),
      () => console.log(this.state.info),
    ); */
  };

  render() {
    const { input } = this.state;
    const buttonStyle = {
      margin: '10px 10px 10px 10px',
    };
    return (
      <div>
        <form className="container-fluid" onSubmit={this.handleFormSubmit}>
          <Input
            inputtype="text"
            title="Time"
            name="time"
            ref={(node) => {
              input.time = node.value;
            }}
            onChange={this.handleTime}
            palceholder="Enter time" /* handleChange={this.handleInput} */
          />
          <Input
            inputtype="text"
            title="Title"
            name="title"
            ref={(node) => {
              input.title = node.value;
            }}
            palceholder="Enter time" /* handleChange={this.handleInput} */
          />
          {/* <TextareaAutosize
          defaultValue="Church-key flannel bicycle rights,
           tofu tacos before they sold out polaroid for free"
          theme={{
            textarea: {
              fontSize: '18px',
              borderColor: 'green',
            },
          }}
        /> */}
          <TextArea
            title="About"
            name="cardInfo"
            rows="5"
            cols="20"
            value="SoBad Church-key flannel bicycle rights, tofu tacos before they sold out polaroid for free"
            handlChange={this.handleTextArea}
            placeholder="Enter card info"
          />
          <Input
            inputtype="text"
            title="Tags"
            name="tag"
            ref={(node) => {
              input.tags = node.value;
            }}
            palceholder="Enter time" /* handleChange={this.handleInput} */
          />
          <Button
            action={this.handleFormSubmit}
            type="Add Card"
            title="Submit"
            style={buttonStyle}
          />
          <Button
            action={(e) => {
              e.preventDefault();
              console.log('clear');
              clearCard();
            }}
            type="Clear"
            title="Clear"
            style={buttonStyle}
          />
        </form>
      </div>
    );
  }
}

/*
const AddCard = ({ dispatch }) => {
  let input = {};
  const buttonStyle = {
    margin: '10px 10px 10px 10px',
  };
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // if (!input.title) {
    //   return;
    // }
    console.log(input);
    dispatch(addCard(input));
    input = {};
  };

  return ();
};

export default connect()(AddCard);
*/
export default connect(
  null,
  mapDispatchToProps,
)(ConnectedAddCard);
