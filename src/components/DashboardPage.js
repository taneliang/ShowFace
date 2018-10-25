import React, { Component } from 'react';
import gql from 'graphql-tag';
import logo from '../logo.png';
import { Link } from 'react-router-dom';
import { withAlert } from 'react-alert';
import ReactLoading from 'react-loading';
import { getFirebaseUserInfo } from '../utils/auth';
import AuthenticatedQuery from './AuthenticatedQuery';
import { userShowsToDict } from '../utils/userShows';

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.userShowItems = this.userShowItems.bind(this);
  }

  userShowItems(userShows, tab) {
    return (
      <ul>
        {userShows.map(function(userShow) {
          return (
            <>
              <Link
                to={`/show/${userShow.slug}/${tab}`}
                className="btn btn-outline-primary btn-lg btn-block"
              >
                {userShow.slug}
              </Link>
              <br />
            </>
          );
        })}
      </ul>
    );
  }

  render() {
    const firebaseUser = getFirebaseUserInfo();
    const { getUserShowsResult } = this.props;

    const { loading: getUserShowsLoading, error: getUserShowsError } = getUserShowsResult;

    if (getUserShowsLoading) {
      return (
        <section className="full-page flex">
          <h2>Loading</h2>
          <ReactLoading type="bubbles" color="#111" />
        </section>
      );
    } else if (getUserShowsError) {
      console.log('Show page load got getUserShowsError', getUserShowsError);
      return (
        <section className="full-page flex">
          <h2>That didn&#39;t work</h2>
          <div>{getUserShowsError.message}</div>
        </section>
      );
    }

    const userShows = userShowsToDict(
      getUserShowsResult.data && getUserShowsResult.data.userShows,
      firebaseUser.email,
    );

    const header = firebaseUser ? (
      <div>
        <h1>Welcome, {firebaseUser.displayName}!</h1>
      </div>
    ) : (
      <div>
        <Link to="/login" className="btn btn-outline-primary btn-lg btn-block">
          Log in
        </Link>
      </div>
    );

    return (
      <div className="container">
        <section id="form-header">
          <img className="content-logo" alt="" src={logo} />
          {header}
          <Link to="/new" className="btn btn-outline-primary btn-lg btn-block">
            Create New Poll
          </Link>
        </section>

        {userShows.admin.length > 0 ? (
          <section id="admin">
            <h3>Shows created by you</h3>
            {this.userShowItems(userShows.admin, 'results')}
          </section>
        ) : null}

        {userShows.pending.length > 0 ? (
          <section id="pending">
            <h3>Shows pending your response</h3>
            {this.userShowItems(userShows.pending, 'respond')}
          </section>
        ) : null}

        {userShows.responded.length > 0 ? (
          <section id="responded">
            <h3>Shows you responded to</h3>
            {this.userShowItems(userShows.responded, 'results')}
          </section>
        ) : null}
      </div>
    );
  }
}

DashboardPage.fragments = {
  userShows: gql`
    fragment DashboardPageShow on Show {
      id
      slug
      name
      isPrivate
      isReadOnly
      areResponsesHidden
      startTime
      endTime
      interval
      respondents {
        id
        anonymousName
        user {
          email
          name
          uid
        }
        role
        response
      }
      createdAt
    }
  `,
};

const GET_USER_SHOW_QUERY = gql`
  query userShows($auth: AuthInput!) {
    userShows(auth: $auth) {
      ...DashboardPageShow
    }
  }
  ${DashboardPage.fragments.userShows}
`;

export default withAlert((props) => {
  return (
    <AuthenticatedQuery query={GET_USER_SHOW_QUERY} requiresAuth>
      {(getUserShowsResult) => <DashboardPage {...props} getUserShowsResult={getUserShowsResult} />}
    </AuthenticatedQuery>
  );
});
