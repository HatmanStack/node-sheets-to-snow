const path = require('path');
const {google} = require('googleapis');
const sheets = google.sheets('v4');
const snow = require('snowflake-sdk');

const getInvite = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'creds.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  google.options({auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1qIaETXgtwNLeFmc-_sCQ9vfOyy58YV1kKJzp5YRbIy4',
    range: 'A2:E',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
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
  conn.execute({ sqlText: 'CREATE OR REPLACE TABLE DEMO_DB.PUBLIC.SHEETS (TS string, NAME string, DAYS string, DIET string, PAY string);' });
  //Timeout for Snowflake Create/Replace to Run
  setTimeout(() => {
    conn.execute({sqlText: 'insert INTO DEMO_DB.PUBLIC.SHEETS(TS, NAME, DAYS, DIET, PAY) values(?, ?, ?, ?, ?)', binds: rows});
  }, 2000)
}

exports.addData = (req, res) => {
  getInvite();
};



