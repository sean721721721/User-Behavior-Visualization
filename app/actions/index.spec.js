// @flow
import * as actions from './index';

describe('todo actions', () => {
  it('setVisibilityFilter should create SET_VISIBILITY_FILTER action', () => {
    expect(actions.setVisibilityFilter('active')).toEqual({
      type: 'SET_VISIBILITY_FILTER',
      filter: 'active',
    });
  });

  it('addCard should create ADD_CARD action', () => {
    expect(actions.addCard('Use Redux')).toEqual({
      type: 'ADD_CARD',
      id: 0,
      text: 'Use Redux',
    });
  });

  it('toggleCard should create TOGGLE_CARD action', () => {
    expect(actions.toggleCard(1)).toEqual({
      type: 'TOGGLE_CARD',
      id: 1,
    });
  });
});
