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
  const { edit: props } = state;
  console.log(props);
  return { card: props };
};

const mapDispatchToProps = dispatch => ({
  addCard: card => dispatch(addCard(card)),
  clearCard: () => dispatch(clearCard()),
  editTime: time => dispatch(editTime(time)),
  editTitle: title => dispatch(editTitle(title)),
  editAbout: description => dispatch(editAbout(description)),
  editTag: tag => dispatch(editTag(tag)),
});
class ConnectedAddCard extends React.Component {
  constructor(props) {
    super(props);

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleTime = this.handleTime.bind(this);
    this.handleTitle = this.handleTitle.bind(this);
    this.handleTextArea = this.handleTextArea.bind(this);
    this.handleTag = this.handleTag.bind(this);
  }

  handleFormSubmit = (e) => {
    e.preventDefault();
    const input = this.props.card;
    console.log(input);
    this.props.addCard(input);
  };

  handleTime = (e) => {
    e.preventDefault();
    const time = e.target.value;
    console.log(time);
    this.props.editTime(time);
  };

  handleTitle = (e) => {
    e.preventDefault();
    const title = e.target.value;
    console.log(title);
    this.props.editTitle(title);
  };

  handleTextArea = (e) => {
    e.preventDefault();
    const about = e.target.value;
    console.log(about);
    this.props.editAbout(about);
  };

  handleTag = (e) => {
    e.preventDefault();
    const tag = e.target.value;
    console.log(tag);
    this.props.editTag(tag);
  };

  render() {
    console.log(this.props);
    const {
      card: {
        time, title, description: about, tag,
      },
    } = this.props;
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
            value={time}
            onChange={this.handleTime}
            palceholder="Enter time"
          />
          <Input
            inputtype="text"
            title="Title"
            name="title"
            /* ref={(node) => {
              input.title = node.value;
            }} */
            value={title}
            onChange={this.handleTitle}
            palceholder="Enter time"
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
            // inputtype="text"
            title="About"
            name="cardInfo"
            // rows="5"
            // cols="20"
            value={about}
            onChange={this.handleTextArea}
            placeholder="Enter card info"
          />
          <Input
            inputtype="text"
            title="Tags"
            name="tag"
            value={tag}
            onChange={this.handleTag}
            palceholder="Enter time"
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
  mapStatToProps,
  mapDispatchToProps,
)(ConnectedAddCard);
