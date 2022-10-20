const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const snow = require('snowflake-sdk');
const express = require('express');
const app = express();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const keys = JSON.parse(process.env.CREDENTIALS);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}


async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: process.env.CREDENTIALS,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function getInvite(auth) {
  const sheets = google.sheets({version: 'v4', auth});
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
  
app.get('/', (req, res) => {
  authorize().then(getInvite).catch(console.error);
  //const name = process.env.NAME || 'World';
  //res.send(`Hello ${name}!`);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port);


