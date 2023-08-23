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

  // useEffect(() => {
  //   const savedDates = localStorage.getItem('datesAway');
  //   const savedPrDate = localStorage.getItem('prDate');
  //   const savedWasNpr = localStorage.getItem('wasNpr');
  //   const savedApplicationDate = localStorage.getItem('applicationDate');

  //   if (savedDates) setDatesAway(JSON.parse(savedDates), () => { lock += 1; } );
  //   if (savedPrDate) setPrDate(savedPrDate, () => { lock += 1; });
  //   if (savedWasNpr) setWasNpr(JSON.parse(savedWasNpr), () => { lock += 1; } );
  //   if (savedApplicationDate) setApplicationDate(savedApplicationDate, () => { lock += 1; } );
  // }, []);
  const [loadedStateCount, setLoadedStateCount] = useState(0);

  useEffect(() => {
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

  useEffect(() => {
    if (loadedStateCount < 4) {
      console.log("Progress not saved due to race condition.");
    } else {
      const saveProgress = () => {
        console.log("Saving Progress", datesAway, prDate, wasNpr, applicationDate);
        localStorage.setItem('datesAway', JSON.stringify(datesAway));
        localStorage.setItem('prDate', prDate);
        localStorage.setItem('wasNpr', wasNpr);
        localStorage.setItem('applicationDate', applicationDate);
      };
      saveProgress();
      console.log("Progress saved.");
    }
  }, [loadedStateCount, datesAway, prDate, wasNpr, applicationDate]);

  const addDatesAway = () => {
    setDatesAway([...datesAway, { start: startDate, end: endDate, comment: comment }]);
    setStartDate('');
    setEndDate('');
    setComment('');
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
    const to = new Date(d.end);

    // If the entire duration of absence is before startCountDate, skip
    if (to < startCountDate) {
      return;
    }

    // If the start of the duration is before startCountDate, adjust 'from' to startCountDate
    if (from < startCountDate) {
      from = startCountDate;
    }
    const daysDifference = (to - from) / (DAYS_IN_MILLISECONDS) - 1 >= 0 ? (to - from) / (DAYS_IN_MILLISECONDS) - 1 : 0;

    if (from < parsedPrDate) {
      // Before PR
      totalDaysAwayBeforePR += daysDifference;
    } else {
      // After PR
      totalDaysAwayAfterPR += daysDifference;
    }
  });

  let maxTotalDaysHereBeforePR = (parsedPrDate - startCountDate) >= 0 ? (parsedPrDate - startCountDate) / (DAYS_IN_MILLISECONDS) : 0;
  if (wasNpr) {
    totalDaysHereBeforePR = maxTotalDaysHereBeforePR - totalDaysAwayBeforePR < 365 ? maxTotalDaysHereBeforePR - totalDaysAwayAfterPR : 365;
  } else {
    totalDaysAwayBeforePR = 0;
  }

  let maxTotalDaysHereAfterPR = (parsedApplicationDate - parsedPrDate) / DAYS_IN_MILLISECONDS;
  totalDaysHereAfterPR = maxTotalDaysHereAfterPR - totalDaysAwayAfterPR;

  const totalDaysInCanada = totalDaysHereBeforePR + totalDaysHereAfterPR;

  return (
    <div className="App">
      <h1>Residency Tracker for Canadian Citizenship</h1>

      <div className="input-section">
        <label>PR Approval Date: </label>
        <input type="date" value={prDate} onChange={(e) => setPrDate(e.target.value)} />
      </div>

      <div className="input-section">
        <label>
          <input type="checkbox" checked={wasNpr} onChange={(e) => setWasNpr(e.target.checked)} />
          Were you a legal temporary resident of Canada before PR?
        </label>
      </div>

      <div className="input-section">
        <label>Planned Application Date: </label>
        <input type="date" value={applicationDate} onChange={(e) => setApplicationDate(e.target.value)} />
      </div>

      <div className="input-section">
        <label>Left Canada:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>Enter Canada:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <label>Reason:</label>
        <input type="text" placeholder="Travel" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>

      <div className="input-section">
        <button onClick={addDatesAway}>Add</button>
      </div>

      <ul>
        {datesAway.map((date, index) => (
          <li key={index}>
            {date.start} - {date.end} ({date.comment})
            {' '}
            <button onClick={() => removeDate(index)}>Remove</button>
          </li>
        ))}
      </ul>

      <h2>Total days in Canada (within the 5 year period): {totalDaysInCanada}</h2>

      {/* <div className="input-section">
        <button onClick={saveProgress}>Save Progress</button>
      </div> */}
    </div>
  );
}

export default App;
