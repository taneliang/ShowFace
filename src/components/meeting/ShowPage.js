import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Redirect } from 'react-router';
import Button from '@material/react-button';
import MaterialIcon from '@material/react-material-icon';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import Modal from 'react-modal';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import update from 'immutability-helper';

import { getAuthInput, getFirebaseUserInfo, isSignedIn } from '../../utils/auth';
import { datifyShowResponse } from '../../utils/datetime';

import Loading from '../common/errors-loaders/Loading';
import Error from '../common/errors-loaders/Error';
import AuthenticatedQuery from '../common/AuthenticatedQuery';
import ShowRespond from './ShowRespond';
import ShowResults from './ShowResults';
import ShareModal from './ShareModal';
import EditShowPage from './EditShowPage';
import { respondentFragment, showWithoutRespondentsFragment, showFragment } from './fragments';

import '../../styles/ReactModalOverride.scss';
import styles from './ShowPage.module.scss';

class ShowPageComponent extends Component {
  constructor(props) {
    super();
    this.state = {
      hasSetName: false,
      isInviteModalOpen: (props.location.state && props.location.state.inviteImmediately) || false,
      modalHeadline: (props.location.state && props.location.state.modalHeadline) || null,
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentWillMount() {
    Modal.setAppElement('body');
  }

  meetingPageBaseUrl() {
    return `/meeting/${this.props.match.params.showId}`;
  }

  openModal() {
    this.setState({ isInviteModalOpen: true });
  }

  closeModal() {
    this.setState({ isInviteModalOpen: false, modalHeadline: null });
  }

  latestShow() {
    const { getShowResult } = this.props;
    if (getShowResult.data && getShowResult.data.show) return getShowResult.data.show;
    return null;
  }

  handleSetName = (isSet) => {
    this.setState({ hasSetName: isSet });
  };

  handleLogIn = () => {
    // Show log in dialog/page, and make auth page redirect back to this page
    const { history } = this.props;
    history.push('/login', { from: history.location });
  };

  renderLoginPrompt = () => {
    return (
      <>
        <p>Log in to be part of this meeting</p>
        <Button onClick={this.handleLogIn} outlined>
          Log In or Sign Up
        </Button>
      </>
    );
  };

  handleDeleteRespondents = (id) => {
    const slug = this.props.match.params.showId;
    this.props.deleteRespondents(slug, [id]);
  };

  handleDeleteResponse = (id) => {
    const slug = this.props.match.params.showId;
    this.props.deleteResponse(slug, id);
  };

  handleEditRespondentStatus = (id, role, isKeyRespondent) => {
    const slug = this.props.match.params.showId;
    this.props.editShowRespondentStatus(slug, id, role, isKeyRespondent);
    //TODO: add rerender method
  };

  updateShowSettings = (name, dates, startTime, endTime, interval) => {
    const slug = this.props.match.params.showId;
    this.props.editShowSettings(name, dates, startTime, endTime, interval, slug);
  };

  sendEmailInvites = (emails) => {
    const slug = this.props.match.params.showId;
    const emailsAndRoles = emails.map((e) => ({ email: e, role: 'member' }));
    this.props.addRespondentsByEmail(slug, emailsAndRoles);
  };

  renderTabBar(responseAllowed) {
    const { location, history } = this.props;
    const links = [
      { text: 'Results', icon: 'list', path: `${this.meetingPageBaseUrl()}/results` },
      { text: 'Settings', icon: 'settings', path: `${this.meetingPageBaseUrl()}/settings` },
    ];

    if (responseAllowed) {
      links.unshift({
        text: 'Respond',
        icon: 'add',
        path: `${this.meetingPageBaseUrl()}/respond`,
      });
    }

    const { pathname } = location;
    const activeIndex = links.length === 1 ? 0 : links.findIndex(({ path }) => path === pathname);
    const tabs = links.map(({ text, icon }) => (
      <Tab key={text}>
        <MaterialIcon className="mdc-tab__icon" icon={icon} />
        <span className="mdc-tab__text-label">{text}</span>
      </Tab>
    ));

    return (
      <div className={styles.tabBarContainer}>
        <TabBar
          className={styles.tabBar}
          activeIndex={activeIndex === -1 ? undefined : activeIndex}
          handleActiveIndexUpdate={(activeIndex) => history.push(links[activeIndex].path)}
        >
          {tabs}
        </TabBar>
      </div>
    );
  }

  isAnonymousMeeting() {
    const show = this.latestShow();
    const { respondents } = show;
    // Find if any of the respondents are an admin
    const admin = respondents.find((r) => r.role === 'admin');
    return !admin;
  }

  amIAdmin() {
    if (this.isAnonymousMeeting()) return true;

    const user = getFirebaseUserInfo();
    const email = user ? user.email : null;
    const show = this.latestShow();
    const { respondents } = show;
    // Find current respondent by current user's email
    const currentRespondent = respondents.find((r) => (r.user ? r.user.email : false) === email);

    return currentRespondent && currentRespondent.role === 'admin';
  }

  render() {
    const { match, getShowResult } = this.props;
    const { hasSetName } = this.state;
    const { loading: getShowLoading, error: getShowError } = getShowResult;

    if (getShowLoading) {
      return <Loading />;
    } else if (getShowError) {
      console.log('Show page load got getShowError', getShowError);
      if (
        getShowError.message === "GraphQL error: TypeError: Cannot read property 'token' of null"
      ) {
        return <Error title="This meeting is private" message={this.renderLoginPrompt()} />;
      } else if (getShowError.message === 'GraphQL error: Error: UserNotAuthorizedError') {
        return (
          <Error
            title="This meeting is private"
            message="Contact the meeting's organizers to ask for an email invite"
          />
        );
      }
      return <Error title="That didn&#39;t work" message={getShowError.message} />;
    }

    const show = this.latestShow();

    if (!show) {
      return (
        <Error
          title="We couldn't find this poll"
          message="Check if you entered the correct link."
        />
      );
    }

    const adminAccess = this.amIAdmin();
    const responseAllowed = !show.isReadOnly || adminAccess;

    const baseUrl = this.meetingPageBaseUrl();
    const lastPathComponent = match.params[0]; // undefined if URL is /meeting/<slug>

    // Redirects if necessary, according to show settings
    if (!lastPathComponent && responseAllowed) {
      return <Redirect to={`${baseUrl}/respond`} />;
    }
    if (!responseAllowed && (!lastPathComponent || lastPathComponent === 'respond')) {
      return <Redirect to={`${baseUrl}/results`} />;
    }

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.showNameHeader}>{show && show.name}</h1>
          {show.isReadOnly ? (
            <p className="mdc-typography--body1">
              This meeting is closed from further responses.
              <br />
              {adminAccess
                ? 'You can allow others to respond again in the settings tab.'
                : 'Contact the organizers of this meeting to allow responses.'}
            </p>
          ) : (
            <Button onClick={this.openModal} outlined icon={<MaterialIcon icon="share" />}>
              Invite Attendees
            </Button>
          )}
        </div>
        <Modal
          isOpen={this.state.isInviteModalOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          contentLabel="Share"
        >
          <ShareModal
            link={window.location.href
              .split('/')
              .slice(0, -1)
              .join('/')}
            modalHeadline={this.state.modalHeadline}
            sendEmailInvites={this.sendEmailInvites}
            isAdmin={adminAccess}
            isSignedIn={isSignedIn()}
          />
        </Modal>
        {this.renderTabBar(responseAllowed)}
        <section id="show">
          {lastPathComponent === 'respond' && (
            <ShowRespond show={show} hasSetName={hasSetName} onSetName={this.handleSetName} />
          )}
          {lastPathComponent === 'results' && (
            <ShowResults
              show={show}
              onDeleteResponse={this.handleDeleteResponse}
              onDeleteRespondents={this.handleDeleteRespondents}
              onEditRespondentStatus={this.handleEditRespondentStatus}
              onUserAction={this.onUserAction}
            />
          )}
          {lastPathComponent === 'settings' && (
            <EditShowPage
              show={show}
              updateShow={this.updateShowSettings}
              accessAllowed={adminAccess}
              isSignedIn={isSignedIn()}
            />
          )}
        </section>
      </div>
    );
  }
}

const GET_SHOW_QUERY = gql`
  query Show($slug: String!, $auth: AuthInput) {
    show(where: { slug: $slug }, auth: $auth) {
      ...ShowFragment
    }
  }
  ${showFragment}
`;

const EDIT_SHOW_RESPONDENT_STATUS = gql`
  mutation EditShowRespondentStatus(
    $slug: String!
    $id: String!
    $role: String
    $isKeyRespondent: Boolean
    $auth: AuthInput
  ) {
    editShowRespondentStatus(
      auth: $auth
      where: { slug: $slug, id: $id }
      data: { role: $role, isKeyRespondent: $isKeyRespondent }
    ) {
      id
      respondents {
        ...RespondentFragment
      }
    }
  }
  ${respondentFragment}
`;

const DELETE_RESPONDENTS = gql`
  mutation DeleteRespondents($slug: String!, $id: [String!]!, $auth: AuthInput) {
    deleteRespondents(auth: $auth, where: { slug: $slug, id: $id }) {
      id
      respondents {
        ...RespondentFragment
      }
    }
  }
  ${respondentFragment}
`;

const DELETE_RESPONSE = gql`
  mutation DeleteResponse($slug: String!, $id: String!, $auth: AuthInput) {
    deleteResponse(auth: $auth, where: { slug: $slug, id: $id }) {
      id
      respondents {
        ...RespondentFragment
      }
    }
  }
  ${respondentFragment}
`;

const EDIT_SHOW_SETTINGS = gql`
  mutation EditShowSettings(
    $name: String!
    $dates: [DateTime!]
    $startTime: DateTime!
    $endTime: DateTime!
    $interval: Int!
    $auth: AuthInput
    $slug: String!
  ) {
    editShowSettings(
      auth: $auth
      where: { slug: $slug }
      data: {
        name: $name
        dates: $dates
        startTime: $startTime
        endTime: $endTime
        interval: $interval
      }
    ) {
      ...ShowWithoutRespondentsFragment
    }
  }
  ${showWithoutRespondentsFragment}
`;

const ADD_RESPONDENTS_BY_EMAIL = gql`
  mutation AddRespondentsByEmail(
    $slug: String!
    $auth: AuthInput!
    $emailsAndRoles: [AddRespondentsByEmailInput!]!
  ) {
    addRespondentsByEmail(auth: $auth, where: { slug: $slug }, data: $emailsAndRoles) {
      slug
    }
  }
`;

function getOptimisticResponseForEditShowSettings(
  name,
  dates,
  startTime,
  endTime,
  interval,
  getShowResult,
) {
  const show = getShowResult.data && getShowResult.data.show;
  if (!show) return null;
  return {
    __typename: 'Mutation',
    editShowSettings: {
      __typename: 'Show',
      ...show,
      name: name,
      dates: dates,
      startTime: startTime,
      endTime: endTime,
      interval: interval,
    },
  };
}

function getOptimisticResponseForDeleteResponse(id, getShowResult) {
  const show = getShowResult.data && getShowResult.data.show;
  if (!show) return null;
  const { respondents } = show;

  const index = respondents.findIndex(function(a) {
    return a.id === id;
  });

  if (index === -1) {
    return null;
  }

  const newRespondents = update(respondents, {
    [index]: {
      response: { $set: [] },
    },
  });

  return {
    __typename: 'Mutation',
    deleteResponse: {
      __typename: 'Show',
      ...show,
      respondents: newRespondents,
    },
  };
}

function getOptimisticResponseForDeleteRespondents(id, getShowResult) {
  const show = getShowResult.data && getShowResult.data.show;
  if (!show) return null;
  const { respondents } = show;
  const index = respondents.findIndex(function(a) {
    return a.id === id;
  });

  if (index === -1) {
    return null;
  }

  const newRespondents = update(respondents, {
    $splice: [[index, 1]],
  });

  return {
    __typename: 'Mutation',
    deleteResponse: {
      __typename: 'Show',
      respondents: newRespondents,
    },
  };
}

function getOptimisticResponseForEditShowRespondentStatus(
  id,
  role,
  isKeyRespondent,
  getShowResult,
) {
  const show = getShowResult.data && getShowResult.data.show;
  if (!show) return null;
  const { respondents } = show;
  const index = respondents.findIndex(function(a) {
    return a.id === id;
  });

  if (index === -1) {
    return null;
  }

  const newRespondents = update(respondents, {
    [index]: {
      role: { $set: role },
      isKeyRespondent: { $set: isKeyRespondent },
    },
  });

  return {
    __typename: 'Mutation',
    deleteResponse: {
      __typename: 'Show',
      respondents: newRespondents,
    },
  };
}

function ShowPageWithQueries(props) {
  const slug = props.match.params.showId;
  return (
    <AuthenticatedQuery query={GET_SHOW_QUERY} variables={{ slug }}>
      {(getShowResult) => (
        <Mutation mutation={DELETE_RESPONSE}>
          {(deleteResponse, deleteResponseResult) => (
            <Mutation mutation={DELETE_RESPONDENTS}>
              {(deleteRespondents, deleteRespondentsResult) => (
                <Mutation mutation={EDIT_SHOW_RESPONDENT_STATUS}>
                  {(editShowRespondentStatus, editShowRespondentStatusResult) => (
                    <Mutation mutation={EDIT_SHOW_SETTINGS}>
                      {(editShowSettings, editShowSettingsResult) => (
                        <Mutation mutation={ADD_RESPONDENTS_BY_EMAIL}>
                          {(addRespondentsByEmail, addRespondentsByEmailResult) => (
                            <ShowPageComponent
                              {...props}
                              getShowResult={datifyShowResponse(getShowResult, 'data.show')}
                              deleteResponse={async (slug, id) => {
                                const auth = await getAuthInput();
                                deleteResponse({
                                  variables: { slug, id, auth },
                                  optimisticResponse: getOptimisticResponseForDeleteResponse(
                                    id,
                                    getShowResult,
                                  ),
                                });
                              }}
                              deleteResponseResult={deleteResponseResult}
                              deleteRespondents={async (slug, id) => {
                                const auth = await getAuthInput();
                                deleteRespondents({
                                  variables: { slug, id, auth },
                                  optimisticResponse: getOptimisticResponseForDeleteRespondents(
                                    id,
                                    getShowResult,
                                  ),
                                });
                              }}
                              deleteRespondentsResult={deleteRespondentsResult}
                              editShowRespondentStatus={async (slug, id, role, isKeyRespondent) => {
                                const auth = await getAuthInput();
                                editShowRespondentStatus({
                                  variables: { slug, id, role, isKeyRespondent, auth },
                                  optimisticResponse: getOptimisticResponseForEditShowRespondentStatus(
                                    id,
                                    role,
                                    isKeyRespondent,
                                    getShowResult,
                                  ),
                                });
                              }}
                              editShowRespondentStatusResult={editShowRespondentStatusResult}
                              editShowSettings={async (
                                name,
                                dates,
                                startTime,
                                endTime,
                                interval,
                                slug,
                              ) => {
                                const auth = await getAuthInput();
                                editShowSettings({
                                  variables: {
                                    name,
                                    dates,
                                    startTime,
                                    endTime,
                                    interval,
                                    auth,
                                    slug,
                                  },
                                  optimisticResponse: getOptimisticResponseForEditShowSettings(
                                    name,
                                    dates,
                                    startTime,
                                    endTime,
                                    interval,
                                    getShowResult,
                                  ),
                                });
                              }}
                              editShowSettingsResult={editShowSettingsResult}
                              addRespondentsByEmail={async (slug, emailsAndRoles) => {
                                const auth = await getAuthInput();
                                addRespondentsByEmail({
                                  variables: { slug, auth, emailsAndRoles },
                                });
                              }}
                              addRespondentsByEmailResult={addRespondentsByEmailResult}
                            />
                          )}
                        </Mutation>
                      )}
                    </Mutation>
                  )}
                </Mutation>
              )}
            </Mutation>
          )}
        </Mutation>
      )}
    </AuthenticatedQuery>
  );
}

export default withRouter(ShowPageWithQueries);
