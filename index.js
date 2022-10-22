const path = require('path');
const {google} = require('googleapis');
const sheets = google.sheets('v4');
const snow = require('snowflake-sdk');
const express = require('express');
const app = express();

const getInvite = async () => {
    const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'secrets/creds.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  google.options({auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1bZ7vNXLzV39VltQc74chsOHfjgNvdBQfYLc_wirN1WU',
    range: 'A2:E',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  console.log(rows);
  const connection = snow.createConnection(
    {
      account: process.env.REGION,
      username: process.env.USER,
      password: process.env.PASSWORD
    }
  );
  
  const conn = connection.connect();
  console.log('snow start');
  //Callback for snowflake-nodejs-connector does not support current nodejs callback framework
  conn.execute( {sqlText: 'CREATE OR REPLACE TABLE DEMO_DB.PUBLIC.SHEETS (TS string, NAME string, DAYS string, DIET string, PAY string);'});
  console.log('table deleted');
  setTimeout(() => {
    console.log('table update');
    conn.execute({sqlText: 'insert INTO DEMO_DB.PUBLIC.SHEETS(TS, NAME, DAYS, DIET, PAY) values(?, ?, ?, ?, ?)', binds: rows});
    }, 2000);
}


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('listening');
});

app.get('/', (req,res) => {
    getInvite();
    res.send('Adding Data');
});



