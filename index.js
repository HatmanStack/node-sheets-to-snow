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
    range: 'A2:E2',
  });
  const row = res.data.values;
  if (!row || row.length === 0) {
    console.log('No data found.');
    return;
  }
  const connection = snow.createConnection(
    {
      account: process.env.REGION,
      username: process.env.USER,
      password: process.env.PASSWORD
    }
  );
  const conn = connection.connect();
  conn.execute({sqlText: 'INSERT INTO DEMO_DB.PUBLIC.SHEETS(TS, NAME, DAYS, DIET, PAY) values(?, ?, ?, ?, ?)', binds: row});
  }


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('listening');
});

app.get('/', (req,res) => {
    getInvite();
    res.send('Adding Data');
});



