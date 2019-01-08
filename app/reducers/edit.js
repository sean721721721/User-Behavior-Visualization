// @flow
const { input } = {
  time: '08 Jan 019',
  title: '柯P',
  description: '台北市長柯文哲在PTT上別稱',
  tags: ['人物', '政治', '台北'],
};

const edit = (state = { input }, action) => {
  switch (action.type) {
    case 'EDIT_TIME':
      return {
        ...state,
        input: {
          time: action.time,
        },
      };
    case 'EDIT_TITLE':
      return {
        ...state,
        input: {
          title: action.title,
        },
      };
    case 'EDIT_ABOUT':
      return {
        ...state,
        input: {
          description: action.about,
        },
      };
    case 'EDIT_TAG':
      return {
        ...state,
        input: {
          tags: action.tags,
        },
      };
    default:
      return state;
  }
};

export default edit;
