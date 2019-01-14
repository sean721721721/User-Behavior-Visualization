// @flow
import { connect } from 'react-redux';
import { setVisibilityFilter } from '../actions';
import Link from '../components/Link';

/* mapStateToProps that describes how to transform the current Redux store state
 into the props you want to pass to a presentational component you are wrapping */
const mapStateToProps = (state, ownProps) => {
  return {
    active: ownProps.filter === state.visibilityFilter,
  };
};

/* mapDispatchToProps() that receives the dispatch() method and returns callback props
 that you want to inject into the presentational component */
const mapDispatchToProps = (dispatch, ownProps) => ({
  onClick: () => dispatch(setVisibilityFilter(ownProps.filter)),
});

const FilterLink = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Link);

export default FilterLink;
