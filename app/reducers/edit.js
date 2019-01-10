// @flow
const input = {
  time: '08 Jan 019',
  title: '柯P',
  description: '台北市長柯文哲在PTT上別稱',
  tags: '人物 政治 台北',
};

const Edit = (state = input, action) => {
  // console.log(state);
  // console.log(action);
  switch (action.type) {
    case 'CLEAR_CARD':
      return {
        time: '',
        title: '',
        description: '',
        tags: '',
      };
    case 'EDIT_TIME':
      return {
        ...state,
        time: action.time,
      };
    case 'EDIT_TITLE':
      return {
        ...state,
        title: action.title,
      };
    case 'EDIT_ABOUT':
      return {
        ...state,
        description: action.about,
      };
    case 'EDIT_TAG':
      return {
        ...state,
        tags: action.tag.split(' '),
      };
    default:
      return state;
  }
};

export default Edit;
