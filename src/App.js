import { useState, useEffect } from 'react';
import { readString } from 'react-papaparse';
import './App.css';

// load static data
import paymentsCSV from './data/payments.csv';
import usersCSV from './data/users.csv';

const App = () => {

  const [payments, setPayments] = useState(0);
  const [users, setUsers] = useState(0);

  const paymentsConfig = {
    download: true,
    complete: results => {
        const payments = {data: results.data};
        setPayments(payments);
    },
    error: (error, file) => {
      console.log('Error while parsing:', error, file);
    }
  };

  const usersConfig = {
    download: true,
    complete: results => {
        const users = {data: results.data};
        setUsers(users);
    },
    error: (error, file) => {
      console.log('Error while parsing:', error, file);
    }
  };
  
  useEffect(() => {
    if (payments === 0) {
      readString(paymentsCSV, paymentsConfig);
    }
    if (users === 0) {
      readString(usersCSV, usersConfig);
    }
  }, []);
  
  useEffect(() => { 
    if (payments.data != undefined) {

      for (let i = 0; i < payments.data.length; i++) {
        const item = payments.data[i];
        if (i === 0 || item[0] === "i9tlVXuPmPUBgIUMYQkMET1gT0wyQqlqLlQU0q3+1UU=") {
          console.log(item);
        }
      }

    }
  }, [payments]);

  useEffect(() => { 
    if (users.data != undefined) {

      for (let i = 0; i < users.data.length; i++) {
        const item = users.data[i];
        if (i === 0 || item[0] === "i9tlVXuPmPUBgIUMYQkMET1gT0wyQqlqLlQU0q3+1UU=") {
          console.log(item);
        }
      }
      
    }
  }, [users]);

  return (
    <div>
      Users: {users.data === undefined ? "Reading..." : users.data.length + " rows"}
      <br />
      Payments: {payments.data === undefined ? "Reading..." : payments.data.length + " rows"}
    </div>
  );
}

export default App;