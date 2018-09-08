import React, { Component } from 'react';
import { Route, Link } from 'react-router-dom';

import PollRespond from './PollRespond';
import PollResults from './PollResults';

import db from '../db';

class Poll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      poll: {
        name: '',
      },
      isLoaded: false,
    };
  }

  componentDidMount() {
    const self = this;

    db.collection('polls')
      .doc('testpoll')
      .get()
      .then((doc) => {
        if (doc.exists) {
          self.setState({ poll: doc.data() });
          self.setState({ isLoaded: true });
        } else {
          console.log('no such document');
          console.log(doc);
        }
      });
  }

  render() {
    const match = this.props.match;

    return (
      <section id="poll">
        <section id="header">
          <h1>{this.state.poll.name}</h1>
          <nav>
            <ul>
              <Link to="/poll/testpoll/respond">Respond</Link>
              <Link to="/poll/testpoll/results">Results</Link>
            </ul>
          </nav>
        </section>
        <Route path={match.url + '/respond'} component={PollRespond} />
        <Route path={match.url + '/results'} component={PollResults} />
      </section>
    );
  }
}

export default Poll;
