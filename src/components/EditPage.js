import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { withAlert } from 'react-alert';
import DayPicker, { DateUtils } from 'react-day-picker';
import Card from '@material/react-card';
import 'react-day-picker/lib/style.css';
import { Mutation } from 'react-apollo';
import queryString from 'query-string';
import { startOfToday, endOfToday } from 'date-fns';
import gql from 'graphql-tag';
import { getAuthInput } from '../utils/auth';
import { cleanName } from '../utils/string';
import Loading from './Loading';

import styles from './EditPage.module.scss';
import 'rc-time-picker/assets/index.css';
import TimePicker from 'rc-time-picker';

import TextField, { Input } from '@material/react-text-field';
import Button from '@material/react-button';
import BottomAppBar from './BottomAppBar';

class EditPage extends Component {
  constructor(props) {
    super(props);
    const { name } = queryString.parse(props.location.search);
    this.state = {
      name: name || '',
      selectedDays: [],
      interval: 15,
      startTime: startOfToday(),
      endTime: endOfToday(),
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDayClick = this.handleDayClick.bind(this);
    this.setStartTime = this.setStartTime.bind(this);
    this.setEndTime = this.setEndTime.bind(this);
  }

  handleSubmit(event) {
    const { name, selectedDays, interval, startTime, endTime } = this.state;
    this.props.createShow(cleanName(name), selectedDays, startTime, endTime, interval);
    event.preventDefault();
  }

  handleInputChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleDayClick(day, { selected, disabled }) {
    const { selectedDays } = this.state;
    if (disabled) {
      return;
    }
    if (!disabled && selected) {
      const selectedIndex = selectedDays.findIndex((selectedDay) =>
        DateUtils.isSameDay(selectedDay, day),
      );
      selectedDays.splice(selectedIndex, 1);
    } else {
      selectedDays.push(day);
    }
    this.setState({ selectedDays });
  }

  setStartTime(value) {
    if (value) {
      this.setState({startTime: value.toDate()});
    }
  }

  setEndTime(value) {
    if (value) {
      this.setState({endTime: value.toDate()});
    }
  }

  setInterval(value) {
    this.setState({interval: value})
    console.log("Set to" + value)
  }

  render() {
    const {
      createShowResult: { loading, data, error },
    } = this.props;
    const { selectedDays, name } = this.state;
    const noSelectedDay = selectedDays.length === 0;

    if (loading) {
      // TODO: Beautify
      return <Loading text="Creating" />;
    } else if (data) {
      return <Redirect to={`/show/${data.createNewShow.slug}`} />;
    } else {
      // Not loading. Render form
      // TODO: Display error if it exists
      if (error) {
        console.log('Show creation got error', error);
      }

      // TODO: uncomment following lines if want to show last few months
      // const lastMonth = new Date();
      // lastMonth.setMonth(lastMonth.getMonth() - 2);
      const today = new Date();

      // TODO: Validate input and disable submit button if necessary
      return (
        <div id={styles.pageContainer}>
          <section>
            <h1 id={styles.header}>Create a new Meeting</h1>
          </section>
          <form>
            <section className={styles.formSection}>
              <Card>
                <div>
                  <TextField label="Meet for what?" className={styles.formInput}>
                    <Input
                      type="text"
                      name="name"
                      value={name}
                      autoComplete="off"
                      onChange={this.handleInputChange}
                    />
                  </TextField>
                </div>
              </Card>
            </section>
            <section className={styles.formSection}>
              <Card>
                <div>
                  <DayPicker
                    fromMonth={today}
                    disabledDays={{ before: today }}
                    selectedDays={selectedDays}
                    onDayClick={this.handleDayClick}
                  />
                </div>
              </Card>
            </section>
            <section className={styles.formSection}>
              <Card>
                 Select Time Interval
                <div className={styles.radioRow}>
                    
                    <div className={styles.radioGroup}>
                      <div className="mdc-radio" onChange={() => this.setInterval(15)}>
                        <input className="mdc-radio__native-control" 
                          type="radio"
                          name="radios"
                          id = "radio-1"
                          readOnly
                          checked={this.state.interval === 15} />
                        <div className="mdc-radio__background">
                          <div className="mdc-radio__outer-circle"></div>
                          <div className="mdc-radio__inner-circle"></div>
                        </div>
                      </div>
                      <label>15 mins</label>
                    </div>

                    <div className={styles.radioGroup}>
                      <div className="mdc-radio" onChange={() => this.setInterval(30)}>
                        <input className="mdc-radio__native-control" 
                          type="radio"
                          name="radios"
                          id = "radio-2"
                          readOnly
                          checked={this.state.interval === 30} />
                        <div className="mdc-radio__background">
                          <div className="mdc-radio__outer-circle"></div>
                          <div className="mdc-radio__inner-circle"></div>
                        </div>
                      </div>
                      <label>30 mins</label>
                    </div>

                  </div>
              </Card>
            </section>
            <section className={styles.formSection}>
              <Card>
                <div className={styles.timePickerRow}>
                    <div> Select Start and End Times</div>
                    <TimePicker className="mdc"
                      showSecond={false}
                      placeholder="No meeting earlier than..."
                      className={styles.timePicker}
                      onChange={this.setStartTime}
                      format={'h:mm a'}
                      minuteStep={this.state.interval}
                      use12Hours
                      inputReadOnly
                    />

                    <TimePicker className="mdc"
                      showSecond={false}
                      placeholder="No meeting after..."
                      className={styles.timePicker}
                      onChange={this.setEndTime}
                      format={'h:mm a'}
                      minuteStep={this.state.interval}                      
                      use12Hours
                      // TODO: Validation for end time
                      // disabledHours={(hour) => {hour <= this.state.startTime.getHours()}}
                      inputReadOnly
                    />
                </div>
              </Card>
            </section>
            <BottomAppBar>
              <div className={styles.bottomBarContent}>
                <Button
                  className={styles.submitButton}
                  onClick={this.handleSubmit}
                  disabled={noSelectedDay || 
                            cleanName(name).length === 0 || 
                            this.state.startTime === null || 
                            this.state.endTime === null}
                  raised
                >
                  Submit
                </Button>
              </div>
            </BottomAppBar>
          </form>
        </div>
      );
    }
  }
}

const EDIT_SHOW_MUTATION = gql`
  mutation CreateNewShow(
    $name: String!
    $dates: [DateTime!]
    $startTime: DateTime!
    $endTime: DateTime!
    $interval: Int!
    $auth: AuthInput
  ) {
    createNewShow(
      auth: $auth
      data: {
        name: $name
        dates: $dates
        startTime: $startTime
        endTime: $endTime
        interval: $interval
      }
    ) {
      slug
    }
  }
`;

export default withAlert((props) => (
  <Mutation mutation={EDIT_SHOW_MUTATION}>
    {(createNewShow, result) => (
      <EditPage
        {...props}
        createShow={async (name, dates, startTime, endTime, interval) => {
          const auth = await getAuthInput();
          createNewShow({ variables: { name, dates, startTime, endTime, interval, auth } });
        }}
        createShowResult={result}
      />
    )}
  </Mutation>
));
