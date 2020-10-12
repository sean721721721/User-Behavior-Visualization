// @flow
import React from 'react';
import {
  BrowserRouter as Router, Route, Link, Redirect, withRouter,
} from 'react-router-dom';
import Favicon from 'react-favicon';
// import LoginTab from './Login';
import Grid from './grid';
import Input from './Input';
import Button from './Button';
import './style/login.css';
// import LoginTab from './Login';

const Auth = {
  // isAuthenticated: true,
  isAuthenticated: false,
  authenticate(cb) {
    this.isAuthenticated = true;
    setTimeout(cb, 100); // async
  },
  signout(cb) {
    this.isAuthenticated = false;
    setTimeout(cb, 100);
  },
};

/*
const AuthButton = withRouter(({ history }) => (Auth.isAuthenticated ? (
  <p>
      Welcome!
    {' '}
    <button
      type="submit"
      onClick={() => {
        Auth.signout(() => history.push('/'));
      }}
    >
        Sign out
    </button>
  </p>
) : (
  <p>You are not logged in.</p>
)));
*/

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props => (Auth.isAuthenticated ? (
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

/**
          <div>
          <p>
            You must log in to view the page at
            {from.pathname}
          </p>
          <button onClick={this.login}>Log in</button>
        </div>
 */
class LoginTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = { redirectToReferrer: false, username: '', password: '' };
    this.login = this.login.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  login = () => {
    const { username, password } = this.state;
    const authstr = `/login?username=${username}&password=${password}`;
    const auth = new Request(authstr, {
      method: 'post',
    });
    console.log(auth);
    Auth.isAuthenticated=true;
    if (Auth.isAuthenticated) {
      Auth.authenticate(() => {
        this.setState({ redirectToReferrer: Auth.isAuthenticated });
      });
    } else {
      fetch(auth)
        .then(res => res.json())
        .then((res) => {
          console.log(res);
          Auth.isAuthenticated = res.isAuthenticated;
          Auth.authenticate(() => {
            this.setState({ redirectToReferrer: res.isAuthenticated });
          });
        });
    }
  };

  handleInput = (e) => {
    const { value } = e.target;
    const { name } = e.target;
    this.setState(
      prevState => ({
        ...prevState,
        [name]: value,
      }) /* ,
      () => console.log(this.state), */,
    );
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { newUser: userData } = this.state;
    this.login();
  };

  render() {
    // console.log(this.props);
    const {
      location: { state },
    } = this.props;
    const { from } = state || { from: { pathname: '/' } };
    const { redirectToReferrer, username, password } = this.state;
    const buttonStyle = {};
    // console.log(tab);
    if (redirectToReferrer) return <Redirect to={from} />;
    return (
      <div className="container">
        <section id="content">
          <form action="/login" method="get">
            <h1>Login</h1>
            <div>
              <Input
                inputtype="text"
                title=""
                name="username"
                value={username}
                palceholder="Username"
                onChange={this.handleInput}
              />
            </div>
            <div>
              <Input
                inputtype="password"
                title=""
                name="password"
                value={password}
                placeholder="Password"
                onChange={this.handleInput}
              />
            </div>
            <div>
              <Button
                action={this.handleSubmit}
                type="primary"
                classname="primary"
                title="Login"
                style={buttonStyle}
              />
              <a href="/#">Lost your password?</a>
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

function Public() {
  // return <h1>login</h1>;
  return <LoginTab />;
}

function Protected() {
  return <Grid />;
}

function AuthExample() {
  const from = { pathname: '/ptttool' };
  return (
    <Router>
      <div>
        {/* <AuthButton />
        <ul>
          <li>
            <Link to="/login">Public Page</Link>
          </li>
          <li>
            <Link to="/ptttool">Protected Page</Link>
          </li>
        </ul> */}
        {/* <Favicon url="../favicon.ico" /> */}
        <Redirect to={from} />
        <Route path="/login" component={LoginTab} />
        <PrivateRoute path="/ptttool" component={Protected} />
      </div>
    </Router>
  );
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
