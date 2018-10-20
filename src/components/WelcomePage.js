import React, { Component } from 'react';
import Button from '@material/react-button';
import { NavLink } from 'react-router-dom';
import { getFirebaseUserInfo } from '../utils/auth';
import TextField, { Input } from '@material/react-text-field';

import styles from './WelcomePage.module.scss';
import downwardArrow from '../downward-arrow.svg';

class WelcomePage extends Component {
  constructor(props) {
    super(props);
    this.state = { name: '' };

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    this.setState({ name: event.target.value });
  }

  render() {
    return (
      <div id={styles.halfPage}>
        <div id={styles.titleContainer}>
          <div id={styles.titleNoteContainer}>
            <img src={downwardArrow} id={styles.downwardArrow} />
            <span id={styles.note}> for free</span>
          </div>
          <h1 id={styles.pageTitle}> Get together with ShowFace</h1>
          <h2 id={styles.subText}>The simple way to decide on dates, places &amp; more.</h2>
        </div>
        <div id={styles.formContainer}>
          <TextField label="What's the ocassion?" className={styles.pollNameField}>
            <Input
              type="text"
              name="name"
              value={this.state.name}
              autoComplete="off"
              onChange={this.handleInputChange}
            />
          </TextField>
          <NavLink
            id={styles.buttonContainer}
            to={{
              pathname: '/new',
              state: { name: this.state.name },
            }}
          >
            <Button id={styles.createPollButton} raised>
              Create new meeting
            </Button>
          </NavLink>
        </div>
      </div>
    );
  }
}

export default WelcomePage;
