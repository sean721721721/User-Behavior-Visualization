// @flow
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  fetchRequested, fetchFailed, fetchCancel, fetchSucceeded, saveCards,
} from '../actions';
import VisibleCardList from './VisibleCardList';

const mapStateToProps = (state) => {
  console.log(state);
  const { fetch } = state;
  const {
    isFetching, didInvalidate, lastUpdated, cards,
  } = fetch || {
    isFetching: false,
    didInvalidate: false,
    lastUpdated: Date().toLocaleTimeString(),
    cards: [],
  };

  return {
    isFetching,
    didInvalidate,
    lastUpdated,
    cards,
  };
};

const mapDispatchToProps = dispatch => ({
  fetchRequested: () => dispatch(fetchRequested()),
  saveCards: cards => dispatch(saveCards(cards)),
});

class Async extends React.Component {
  constructor(props) {
    super(props);
    this.handleRefreshClick = this.handleRefreshClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
  }

  componentDidMount() {
    // const { fetchRequested } = this.props;
    // fetchRequested();
  }

  componentDidUpdate() {}

  handleRefreshClick(e) {
    e.preventDefault();
    // action('CARD_FETCH_REQUESTED');
    // dispatch();
    const { fetchRequested } = this.props;
    fetchRequested();
  }

  handleSaveClick(e) {
    e.preventDefault();
    const { saveCards, cards } = this.props;
    saveCards(cards);
  }

  render() {
    console.log(this.props);
    const { cards, isFetching, lastUpdated } = this.props;

    return (
      <div>
        <VisibleCardList />
        <p>
          {lastUpdated && (
            <span>
              Last updated at
              {new Date(lastUpdated).toLocaleTimeStrin()}
.
              {' '}
            </span>
          )}
          {!isFetching && (
            <button type="button" onClick={this.handleRefreshClick}>
              Refresh
            </button>
          )}
          {
            <button type="button" onClick={this.handleSaveClick}>
              Save
            </button>
          }
        </p>
        {isFetching && cards.length === 0 && <h2>Loading...</h2>}
        {!isFetching && cards.length === 0 && <h2>Empty.</h2>}
        {cards.length > 0 && (
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <p> posts</p>
          </div>
        )}
      </div>
    );
  }
}
/*
Async.propTypes = {
  cards: PropTypes.arrayOf().isRequired,
  isFetching: PropTypes.bool.isRequired,
  // lastUpdated: PropTypes.number,
  // dispatch: PropTypes.func.isRequired,
};
*/

const AnsyncApp = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Async);

export default AnsyncApp;
