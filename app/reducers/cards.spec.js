// @flow
import cards from './cards';

describe('todos reducer', () => {
  it('should handle initial state', () => {
    expect(cards(undefined, {})).toEqual([]);
  });

  it('should handle ADD_CARD', () => {
    expect(
      cards([], {
        type: 'ADD_CARD',
        text: 'Run the tests',
        id: 0,
      }),
    ).toEqual([
      {
        text: 'Run the tests',
        completed: false,
        id: 0,
      },
    ]);

    expect(
      cards(
        [
          {
            text: 'Run the tests',
            completed: false,
            id: 0,
          },
        ],
        {
          type: 'ADD_CARD',
          text: 'Use Redux',
          id: 1,
        },
      ),
    ).toEqual([
      {
        text: 'Run the tests',
        completed: false,
        id: 0,
      },
      {
        text: 'Use Redux',
        completed: false,
        id: 1,
      },
    ]);

    expect(
      cards(
        [
          {
            text: 'Run the tests',
            completed: false,
            id: 0,
          },
          {
            text: 'Use Redux',
            completed: false,
            id: 1,
          },
        ],
        {
          type: 'ADD_CARD',
          text: 'Fix the tests',
          id: 2,
        },
      ),
    ).toEqual([
      {
        text: 'Run the tests',
        completed: false,
        id: 0,
      },
      {
        text: 'Use Redux',
        completed: false,
        id: 1,
      },
      {
        text: 'Fix the tests',
        completed: false,
        id: 2,
      },
    ]);
  });

  it('should handle TOGGLE_CARD', () => {
    expect(
      cards(
        [
          {
            text: 'Run the tests',
            completed: false,
            id: 1,
          },
          {
            text: 'Use Redux',
            completed: false,
            id: 0,
          },
        ],
        {
          type: 'TOGGLE_CARD',
          id: 1,
        },
      ),
    ).toEqual([
      {
        text: 'Run the tests',
        completed: true,
        id: 1,
      },
      {
        text: 'Use Redux',
        completed: false,
        id: 0,
      },
    ]);
  });
});
