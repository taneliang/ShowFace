import React, { Component } from 'react';
import moment from 'moment';
import _ from 'lodash';
import memoize from 'memoize-one';
import responsesToDict from '../utils/response';
import './Timeline.css';

// Props
// allowedDates
// startTime, endTime
// responses

const getStartTimes = memoize(
  (startTime, endTime) => {
    const numMin = moment.duration(endTime.diff(startTime)).asMinutes();
    const mins = _.range(0, _.round(numMin), 15);
    const startTimes = mins.map((min) => startTime.clone().add(min, 'minutes'));
    return startTimes;
  },
  (newTime, oldTime) => newTime.isSame(oldTime),
);

const getMomentsForDates = memoize(
  (startTimes, allowedDates) => {
    return _.zipObject(
      startTimes,
      startTimes.map((time) => {
        return _.zipObject(
          allowedDates,
          allowedDates.map((date) => moveDateTimeToDate(date, time)),
        );
      }),
    );
  },
  (newTimes, oldTimes) =>
    _.zip(newTimes, oldTimes)
      .map(([newTime, oldTime]) => newTime.isSame(oldTime))
      .includes(true),
);

function moveDateTimeToDate(date, dateTime) {
  return dateTime.clone().set({ year: date.year(), month: date.month(), date: date.date() });
}

const Tick = ({ startTime }) => {
  const format = 'h:mm';
  return <span className="Timeline-Tick timeline-label">{startTime.format(format)}</span>;
};

const DateHeader = ({ date }) => {
  return <span className="date-heading timeline-label">{date.format('DD/MM')}</span>;
};

const ShowAttendees = ({ responses, allAttendees, time }) => {
  let attendees = responses[time] || [];
  attendees = Array.from(attendees);
  const notAttending = allAttendees.filter((x) => !new Set(attendees).has(x));

  return (
    <section id="attendees" className="flex-item">
      {time ? <h2 id="poll-time">{moment(time).format('Do MMM YYYY hh:mma')}</h2> : null}
      <section id="attending">
        <h3>Attending</h3>
        <ol>
          {attendees.map((attendee) => {
            return <li key={attendee}>{attendee}</li>;
          })}
        </ol>
      </section>
      <section id="notAttending">
        <h3>Not Attending</h3>
        <ol>
          {notAttending.map((notAttendee) => {
            return <li key={notAttendee}>{notAttendee}</li>;
          })}
        </ol>
      </section>
    </section>
  );
};

class TimeBox extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    const keysToOmit = ['onMouseDown', 'onMouseMove', 'onMouseUp', 'onMouseEnter'];
    const shouldUpdate = !_.isEqual(_.omit(this.props, keysToOmit), _.omit(nextProps, keysToOmit));
    return shouldUpdate;
  }

  getLightnessValue(maxSelectable, count) {
    return Math.floor(100 - (65 / maxSelectable) * count);
  }

  render() {
    const {
      date,
      selected,
      responseCount,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseEnter,
      maxSelectable,
    } = this.props;

    const divStyle = {
      backgroundColor: `hsla(107, 60%, ${this.getLightnessValue(
        maxSelectable,
        responseCount,
      )}%, 1)`,
    };

    return (
      <div
        className="Timeline-TimeBox"
        style={divStyle}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
      />
    );
  }
}

const DragStateEnum = Object.freeze({
  none: 0,
  dragSelecting: 1,
  dragDeselecting: 2,
});

class Timeline extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragState: DragStateEnum.none,
    };
  }

  isSelected(startTime) {
    const responsesForDate = this.renderableResponses[startTime] || new Set();
    return responsesForDate.has(this.props.name);
  }

  getResponseCount(startTime) {
    const responsesForDate = this.renderableResponses[startTime] || new Set();
    return responsesForDate.size;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState);
  }

  handleMouseEvent(startTime, shouldStart) {
    let dragState = this.state.dragState;
    const startMoment = moment(startTime);
    if (shouldStart) {
      const isSelected = this.isSelected(startTime);
      dragState = isSelected ? DragStateEnum.dragDeselecting : DragStateEnum.dragSelecting;
      this.setState({ dragState });
    }

    switch (dragState) {
      case DragStateEnum.dragSelecting:
        // console.log('Select', startMoment.toISOString());
        this.props.onSelect(startMoment);
        break;
      case DragStateEnum.dragDeselecting:
        // console.log('Deselect', startMoment.toISOString());
        this.props.onDeselect(startMoment);
        break;
    }
  }

  render() {
    const {
      allowedDates,
      startTime,
      endTime,
      responses,
      name,
      minCount,
      maxCount,
      showAttendees,
    } = this.props;

    const allAttendees = Object.keys(responses || {});

    const startTimes = getStartTimes(startTime, endTime);
    const momentsForDates = getMomentsForDates(startTimes, allowedDates);

    const allResponses = responsesToDict(responses || {});
    var self = this;
    self.allResponses = allResponses;
    this.renderableResponses = allResponses;

    if (minCount !== undefined) {
      this.renderableResponses = _.reduce(
        this.renderableResponses,
        (acc, v, k) => {
          if (v.size >= minCount) {
            acc[k] = v;
          }
          return acc;
        },
        {},
      );
    }

    if (maxCount !== undefined) {
      this.renderableResponses = _.reduce(
        this.renderableResponses,
        (acc, v, k) => {
          if (v.size <= maxCount) {
            acc[k] = v;
          }
          return acc;
        },
        {},
      );
    }

    const maxSelectable = name
      ? 1
      : _.reduce(
          allResponses,
          (maxLen, dates, name) => {
            return Math.max(maxLen, dates.size);
          },
          0,
        );

    const rows = startTimes.map((time) => {
      return (
        <React.Fragment key={`row ${time.toISOString()}`}>
          <Tick startTime={time} />
          {allowedDates.map((date) => {
            const startMomentWithDate = momentsForDates[time][date];
            const startTimeWithDate = startMomentWithDate.toDate();

            return (
              <TimeBox
                date={date.toDate()}
                startTime={startTimeWithDate}
                key={`timebox ${startMomentWithDate.toISOString()}`}
                selected={this.isSelected(startTimeWithDate)}
                maxSelectable={maxSelectable}
                responseCount={this.getResponseCount(startTimeWithDate)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  this.handleMouseEvent(startTimeWithDate, true);
                }}
                onMouseMove={(e) => {
                  e.preventDefault();
                  this.handleMouseEvent(startTimeWithDate, false);
                }}
                onMouseUp={() => this.setState({ dragState: DragStateEnum.none })}
                onMouseEnter={() => {
                  this.setState({ selectedTime: startTimeWithDate });
                }}
              />
            );
          })}
        </React.Fragment>
      );
    });

    const headerCells = allowedDates.map((date) => <DateHeader date={date} key={date} />);

    return (
      <section id="timeline" className="flex-container">
        <div
          className="Timeline flex-item flex-large"
          style={{ gridTemplateColumns: `auto repeat(${allowedDates.length}, 1fr)` }}
          onMouseLeave={() => this.setState({ dragState: DragStateEnum.none })}
        >
          <span className="Timeline-filler" />
          {headerCells}
          {rows}
        </div>
        {showAttendees ? (
          <ShowAttendees
            responses={self.allResponses}
            allAttendees={allAttendees}
            time={this.state.selectedTime}
          />
        ) : null}
      </section>
    );
  }
}

export default Timeline;
