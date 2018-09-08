import React, { Component } from 'react';
import { Route, Link } from 'react-router-dom';

import PollRespond from './PollRespond';
import PollResults from './PollResults';

import db from '../db';

const NewPollAlert = ({ isNew }) => {
  if (isNew) {
    return (
      <div class="alert alert-success" role="alert">
        Poll successfully created! Share this link with your friends!
      </div>
    );
  } else {
    return null;
  }
};

class Poll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isNew: false,
    };
  }

  componentDidMount() {
    const self = this;
    const pollId = this.props.match.params.pollId;
    if (this.props.location.state && this.props.location.state.isNew) {
      this.setState({ isNew: true });
      this.props.location.state.isNew = false;
    }

    db
      .collection('polls')
      .doc(pollId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          self.setState({ poll: doc.data() });
        } else {
          console.log('no such document');
          console.log(doc);
        }
      });
  }

  render() {
    const { match } = this.props;
    const { poll } = this.state;

    return (
      <section id="poll">
        <NewPollAlert isNew={this.state.isNew} />
        <section id="header">
          <h1>{poll && poll.name}</h1>
          <nav>
            <ul>
              <Link to={`${match.url}/respond`}>Respond</Link>
              <Link to={`${match.url}/results`}>Results</Link>
            </ul>
          </nav>
        </section>
        {poll && (
          <React.Fragment>
            <Route path={match.url + '/respond'} render={() => <PollRespond poll={poll} />} />
            <Route path={match.url + '/results'} render={() => <PollResults poll={poll} />} />
          </React.Fragment>
        )}
      </section>
    );
  }
}

export default Poll;
