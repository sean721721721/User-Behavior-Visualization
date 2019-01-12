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
  addCard,
  updateCard,
  clearCard,
  editTime,
  editTitle,
  editAbout,
  editTag,
} from '../actions';

const mapStatToProps = (state) => {
  const { edit: props } = state;
  // console.log(state);
  return { edit: props };
};

const mapDispatchToProps = dispatch => ({
  addCard: card => dispatch(addCard(card)),
  updateCard: c => dispatch(updateCard(c)),
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
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleTime = this.handleTime.bind(this);
    this.handleTitle = this.handleTitle.bind(this);
    this.handleTextArea = this.handleTextArea.bind(this);
    this.handleTag = this.handleTag.bind(this);
  }

  handleFormSubmit = (e) => {
    e.preventDefault();
    const { edit, addCard } = this.props;
    // console.log(input);
    addCard(edit);
  };

  handleUpdate = (e) => {
    e.preventDefault();
    const { edit, updateCard } = this.props;
    console.log(edit);
    updateCard(edit);
  };

  handleClear = (e) => {
    e.preventDefault();
    const { clearCard } = this.props;
    clearCard();
  };

  handleTime = (e) => {
    e.preventDefault();
    const { editTime } = this.props;
    const time = e.target.value;
    // console.log(time);
    editTime(time);
  };

  handleTitle = (e) => {
    e.preventDefault();
    const { editTitle } = this.props;
    const title = e.target.value;
    // console.log(title);
    editTitle(title);
  };

  handleTextArea = (e) => {
    e.preventDefault();
    const { editAbout } = this.props;
    const about = e.target.value;
    // console.log(about);
    editAbout(about);
  };

  handleTag = (e) => {
    e.preventDefault();
    const { editTag } = this.props;
    const tag = e.target.value;
    // onsole.log(tag);
    editTag(tag);
  };

  render() {
    // console.log(this.props);
    const {
      edit: {
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
            placeholder="Enter time"
          />
          <Input
            inputtype="text"
            title="Title"
            name="title"
            value={title}
            onChange={this.handleTitle}
            placeholder="Enter time"
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
            value={about}
            handleChange={this.handleTextArea}
            placeholder="Enter card info"
          />
          <Input
            inputtype="text"
            title="Tags"
            name="tag"
            value={tag}
            onChange={this.handleTag}
            placeholder="Enter tags with space"
          />
          <Button
            action={this.handleFormSubmit}
            type="Add Card"
            title="Submit"
            style={buttonStyle}
          />
          <Button
            action={this.handleUpdate}
            type="Update Card"
            title="Update"
            style={buttonStyle}
          />
          <Button action={this.handleClear} type="Clear" title="Clear" style={buttonStyle} />
        </form>
      </div>
    );
  }
}

export default connect(
  mapStatToProps,
  mapDispatchToProps,
)(ConnectedAddCard);

/* stateless function
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
