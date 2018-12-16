// @flow
import React from 'react';
import {
  BrowserRouter as Router, Route, Link, Redirect, withRouter,
} from 'react-router-dom';
// import LoginTab from './Login';
import Grid from './grid';
import './login.css';
// import LoginTab from './Login';

function AuthExample() {
  return (
    <Router>
      <div>
        <AuthButton />
        <ul>
          <li>
            <Link to="/public">Public Page</Link>
          </li>
          <li>
            <Link to="/ptttool">Protected Page</Link>
          </li>
        </ul>
        <Route path="/public" component={Public} />
        <Route path="/login" component={LoginTab} />
        <PrivateRoute path="/ptttool" component={Protected} />
      </div>
    </Router>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  authenticate(cb) {
    this.isAuthenticated = true;
    setTimeout(cb, 100); // fake async
  },
  signout(cb) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  },
};

class LoginTab extends React.Component {
  state = { redirectToReferrer: false };

  login = () => {
    fakeAuth.authenticate(() => {
      this.setState({ redirectToReferrer: true });
    });
  };

  render() {
    console.log(this.props);
    const { from } = this.props.location.state || { from: { pathname: '/' } };
    const { redirectToReferrer } = this.state;

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

const AuthButton = withRouter(({ history }) => (fakeAuth.isAuthenticated ? (
  <p>
      Welcome!
    {' '}
    <button
      onClick={() => {
        fakeAuth.signout(() => history.push('/'));
      }}
    >
        Sign out
    </button>
  </p>
) : (
  <p>You are not logged in.</p>
)));

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props => (fakeAuth.isAuthenticated ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: '/login',
            state: { from: props.location },
          }}
        />
      ))
      }
    />
  );
}

function Public() {
  // return <h1>login</h1>;
  return <LoginTab />;
}

function Protected() {
  return <Grid />;
}

export default AuthExample;
/*
function BasicExample() {
  return (
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/topics">Topics</Link>
          </li>
        </ul>

        <hr />

        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/topics" component={Topics} />
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div>
      <Grid />
    </div>
  );
}

function About() {
  return (
    <div>
      <h2>About</h2>
    </div>
  );
}

function Topics({ match }) {
  return (
    <div>
      <h2>Topics</h2>
      <ul>
        <li>
          <Link to={`${match.url}/rendering`}>Rendering with React</Link>
        </li>
        <li>
          <Link to={`${match.url}/components`}>Components</Link>
        </li>
        <li>
          <Link to={`${match.url}/props-v-state`}>Props v. State</Link>
        </li>
      </ul>

      <Route path={`${match.path}/:topicId`} component={Topic} />
      <Route exact path={match.path} render={() => <h3>Please select a topic.</h3>} />
    </div>
  );
}

function Topic({ match }) {
  return (
    <div>
      <h3>{match.params.topicId}</h3>
    </div>
  );
}
*/
