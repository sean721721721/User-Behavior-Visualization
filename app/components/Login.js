// @flow
import React from 'react';
import Redirect from 'react-router-dom';
// import PropTypes from 'prop-types';
import './login.css';

class LoginTab extends React.Component {
  constructor(props) {
    super(props);

    this.state = { redirectToReferrer: false };
    this.login = this.login.bind(this);
  }

  login = () => {
    fakeAuth.authenticate(() => {
      this.setState({ redirectToReferrer: true });
    });
  };

  render() {
    const { show, onChange } = this.props;

    const { from } = this.props.location.state || { from: { pathname: '/' } };
    const { redirectToReferrer } = this.state;

    console.log(this.props);
    // console.log(tab);
    if (redirectToReferrer) return <Redirect to={from} />;
    return (
      <div className="container">
        <div>
          <p>
            You must log in to view the page at
            {from.pathname}
          </p>
          <button onClick={this.login}>Log in</button>
        </div>
        <section id="content">
          <form action="/login" method="post">
            <h1>Login</h1>
            <div>
              <input type="text" placeholder="Username" required="" id="username" name="username" />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                required=""
                id="password"
                name="password"
              />
            </div>
            <div>
              <input type="submit" value="Login" />
              <a href="#">Lost your password?</a>
              <a href="/register">Register</a>
            </div>
          </form>
          <div className="button">
            <a href="/">Home</a>
          </div>
        </section>
      </div>
    );
  }
}
/*
class Login extends React.Component {
  render() {

    return (

    );
  }
}
*/
/*
LoginTab.defaultProps = {};
LoginTab.propTypes = {
  show: PropTypes.string.isRequired,
  set: PropTypes.shape().isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
*/
export default LoginTab;
