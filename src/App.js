import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [prDate, setPrDate] = useState('');
  const [wasNpr, setWasNpr] = useState(false);
  const [applicationDate, setApplicationDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [datesAway, setDatesAway] = useState([]);
  const [loadedStateCount, setLoadedStateCount] = useState(0);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationMessageForDatesAdded, setValidationMessageForDatesAdded] = useState('');

  useEffect(() => {
      console.log("Loading data from local storage.");
      const savedDates = localStorage.getItem('datesAway');
      const savedPrDate = localStorage.getItem('prDate');
      const savedWasNpr = localStorage.getItem('wasNpr');
      const savedApplicationDate = localStorage.getItem('applicationDate');

      if (savedDates) {
          setDatesAway(JSON.parse(savedDates));
      }
      if (savedPrDate) {
          setPrDate(savedPrDate);
      }
      if (savedWasNpr) {
        setWasNpr(JSON.parse(savedWasNpr));
      }
      if (savedApplicationDate) {
        setApplicationDate(savedApplicationDate);
      }
  }, []);

  useEffect(() => {
      if (datesAway.length > 0) {
          setLoadedStateCount(prev => prev + 1);
      }
  }, [datesAway]);

  useEffect(() => {
      if (prDate) {
          setLoadedStateCount(prev => prev + 1);
      }
  }, [prDate]);

  useEffect(() => {
    if (wasNpr) {
        setLoadedStateCount(prev => prev + 1);
    }
  }, [wasNpr]);

  useEffect(() => {
    if (applicationDate) {
        setLoadedStateCount(prev => prev + 1);
    }
  }, [applicationDate]);


  let initialized = loadedStateCount >= 4;
  // Save on fields update, but not updating until we're fully initialized.
  useEffect(() => {
    if (!initialized) {
      console.log("Progress not saved due to race condition.");
    } else {
      const saveProgress = () => {
        localStorage.setItem('datesAway', JSON.stringify(datesAway));
        localStorage.setItem('prDate', prDate);
        localStorage.setItem('wasNpr', wasNpr);
        localStorage.setItem('applicationDate', applicationDate);
        console.log("Saved progress (dates away, pr date, was temp resident, planned application date):", datesAway, prDate, wasNpr, applicationDate);
      };
      saveProgress();
    }
  }, [initialized, datesAway, prDate, wasNpr, applicationDate]);

  useEffect(() => {
    if (!initialized) {
      console.log("Progress not saved due to race condition.");
    } else {
      const validateApplicationDates = () => {
        if (new Date(prDate) >= new Date(applicationDate)) {
            setValidationMessage('PR date has to be before the planned application date.');
            return false;
        }
        setValidationMessage('');
        return true;
      }
      validateApplicationDates();
    }
  }, [initialized, prDate, applicationDate]);

  const addDatesAway = () => {
    const isValidStartDate = (startDate, endDate) => {
      return new Date(startDate) < new Date(endDate);
    };
    const isValidCommentLength = (comment) => {
      return comment.length <= 200;
    };
    const hasNoOverlappingDates = (startDate, endDate, existingDates) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let range of existingDates) {
          const rangeStart = new Date(range.start);
          const rangeEnd = new Date(range.end);
          if ((start >= rangeStart && start <= rangeEnd) ||
              (end >= rangeStart && end <= rangeEnd) ||
              (start <= rangeStart && end >= rangeEnd)) {
              return false;
          }
      }
      return true;
    };
    const validateDateAway = () => {
      if (!isValidStartDate(startDate, endDate)) {
        setValidationMessageForDatesAdded('The start date has to be before the end date.');
        return false;
      }
      if (!isValidCommentLength(comment)) {
        setValidationMessageForDatesAdded('The maximum comment length is 200. Currently at ' + comment.length + '.');
        return false;
      }
      if (!hasNoOverlappingDates(startDate, endDate, datesAway)) {
        setValidationMessageForDatesAdded('The date range being added overlaps with some of the existing dates.');
        return false;
      }
      setValidationMessageForDatesAdded('');
      return true;
    }
    let result = validateDateAway();
    if (!result) {
      console.log("Will not add data until the validation passes.");
    } else {
      setDatesAway([...datesAway, { start: startDate, end: endDate, comment: comment }]);
      setStartDate('');
      setEndDate('');
      setComment('');
    }
  };

  const removeDate = (index) => {
    const updatedDates = [...datesAway];
    updatedDates.splice(index, 1);
    setDatesAway(updatedDates);
  };

  const FIVE_YEARS_IN_DAYS = 365 * 5;
  const DAYS_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

  let parsedApplicationDate = Date.parse(applicationDate);
  let parsedPrDate = Date.parse(prDate);

  // Starting from 5 years before the application date.
  const startCountDate = parsedApplicationDate - FIVE_YEARS_IN_DAYS * DAYS_IN_MILLISECONDS;

  let totalDaysAwayBeforePR = 0;
  let totalDaysAwayAfterPR = 0;
  let totalDaysHereBeforePR = 0;
  let totalDaysHereAfterPR = 0;


  datesAway.forEach(d => {
    let from = new Date(d.start);
    let to = new Date(d.end);

    // If the entire duration of absence is before startCountDate, skip
    if (to < startCountDate) {
      return;
    }

    // If the start of the duration is before startCountDate, adjust 'from' to startCountDate
    if (from < startCountDate) {
      from = startCountDate;
    }

    let daysDifference = 0;
    if (from < parsedPrDate) {
      // Before PR
      if (to >= parsedPrDate) {
        // Split between before and after pr date
        let toBeforePR = parsedPrDate;
        let fromAfterPR = parsedPrDate;
        let daysDifferenceBeforePR = (toBeforePR - from) / (DAYS_IN_MILLISECONDS) - 1 >= 0 ? (to - from) / (DAYS_IN_MILLISECONDS) - 1 : 0;
        let daysDifferenceAfterPR = (to - fromAfterPR) / (DAYS_IN_MILLISECONDS) - 1 >= 0 ? (to - from) / (DAYS_IN_MILLISECONDS) - 1 : 0;
        totalDaysAwayBeforePR += daysDifferenceBeforePR + 1;
        totalDaysAwayAfterPR += daysDifferenceAfterPR + 1;
      } else {
        daysDifference = (to - from) / (DAYS_IN_MILLISECONDS) - 1 >= 0 ? (to - from) / (DAYS_IN_MILLISECONDS) - 1 : 0;
        totalDaysAwayBeforePR += daysDifference;
      }
    } else {
      // After PR
      if (to >= applicationDate) {
        // Cap at application date
        to = applicationDate;
        daysDifference = (to - from) / (DAYS_IN_MILLISECONDS) - 1 >= 0 ? (to - from) / (DAYS_IN_MILLISECONDS) - 1 : 0;
        totalDaysAwayAfterPR += daysDifference;
      } else {
        daysDifference = (to - from) / (DAYS_IN_MILLISECONDS) - 1 >= 0 ? (to - from) / (DAYS_IN_MILLISECONDS) - 1 : 0;
        totalDaysAwayAfterPR += daysDifference;
      }
    }
  });

  let maxTotalDaysHereBeforePR = (parsedPrDate - startCountDate) >= 0 ? (parsedPrDate - startCountDate) / (DAYS_IN_MILLISECONDS) : 0;
  if (wasNpr) {
    totalDaysHereBeforePR = maxTotalDaysHereBeforePR - totalDaysAwayBeforePR < 365 ? maxTotalDaysHereBeforePR - totalDaysAwayBeforePR : 365;
  } else {
    totalDaysAwayBeforePR = 0;
  }
  // console.log("Maximum possible days in Canada before PR within the 5 years timeframe (excluding 365 days limit):", maxTotalDaysHereBeforePR);
  // console.log("Total days away before PR (excluding 365 days limit):", totalDaysAwayBeforePR);
  // console.log("Total days counted before PR (capped at 365 days):", totalDaysHereBeforePR);

  let maxTotalDaysHereAfterPR = (parsedApplicationDate - parsedPrDate) / DAYS_IN_MILLISECONDS;
  totalDaysHereAfterPR = maxTotalDaysHereAfterPR - totalDaysAwayAfterPR;
  // console.log("Maximum possible days in Canada after PR within the 5 years timeframe:", maxTotalDaysHereAfterPR);
  // console.log("Total days away before PR:", totalDaysAwayAfterPR);
  // console.log("Total days counted before PR:", totalDaysHereAfterPR);

  const totalDaysInCanada = totalDaysHereBeforePR + totalDaysHereAfterPR;
  // console.log("Total days residing in Canada (for the purpose of immigration):", totalDaysInCanada);

  return (
    <div className="App">
      <h1>Residency Tracker for Canadian Citizenship</h1>

      <div className="input-section">
        <label>PR Approval Date: </label>
        <input type="date" value={prDate} onChange={(e) => setPrDate(e.target.value)} />
      </div>

      <div className="input-section">
        <label>Planned Application Date: </label>
        <input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
      </div>

      {validationMessage && <p style={{color: 'red'}}>{validationMessage}</p>}

      <div className="input-section">
        <label>
          <input type="checkbox" checked={wasNpr} onChange={(e) => setWasNpr(e.target.checked)} />
          Were you a legal temporary resident of Canada before PR?
        </label>
      </div>

      <div className="input-section">
        <label>Left Canada:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>Enter Canada:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <label>Reason:</label>
        <input type="text" placeholder="Travel" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {validationMessageForDatesAdded && <p style={{color: 'red'}}>{validationMessageForDatesAdded}</p>}

      <div className="input-section">
        <button onClick={addDatesAway}>Add</button>
      </div>

      <ul>
        {datesAway
          .sort((a, b) => new Date(a.start) - new Date(b.start))
          .map((dateRange, index) => (
            <li key={index} className="list-item">
              <span className="date-column">{dateRange.start} to {dateRange.end}</span>
              <span className="comment-column">{dateRange.comment}</span>
              <button className="remove-button-column" onClick={() => removeDate(index)}>Remove</button>
            </li>
          ))}
      </ul>

      <h2>Total days in Canada (within the 5 year period): {totalDaysInCanada}</h2>

      <div>
        Note:
        <ul>
          <li>
            The "Left Canada" and "Enter Canada" dates are inclusive. Those two days are counted as being in Canada.
          </li>
          <li>
            The app autosaves everytime an input is changed, but it only starts autosaving after all the fields are filled.
          </li>
          <li>
            Data are only stored locally in localStroage.
          </li>
          <li>
            This is only meant to be a useful utility. Please still confirm all the residency calculations on your own.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
