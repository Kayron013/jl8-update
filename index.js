const request = require('request');
const parser = require('fast-html-parser');
const nodemailer = require('nodemailer');
const moment = require('moment');
const credentials = require('./private/email_credentials.json');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({});
const bucket_params = require('./private/bucket.json');

exports.handler = async () => {
  let db;
  try {
    db = await getDB();
    const issue = await getCurrentIssue();
    const is_new_issue = issue > db.issue;
    if (is_new_issue) {
      await sendEmail(issue);
      db.issue = issue;
      db.updates++;
    }
    db.last_check = formatDate();
    db.error = {};
  } catch (e) {
    console.log(e);
    if (db) db.error = e;
  } finally {
    if (db) {
      s3.putObject(
        {
          ...bucket_params,
          Body: JSON.stringify(db, undefined, 2)
        },
        (err, data) => {
          if (err) console.log(err);
          if (data) console.log(data);
        }
      );
    }
  }
};

const getDB = () =>
  new Promise((resolve, reject) => {
    s3.getObject(bucket_params, (err, data) => {
      if (err) reject(err.message);
      else if (data) resolve(JSON.parse(data.Body.toString()));
    });
  });

const getCurrentIssue = () =>
  new Promise((resolve, reject) => {
    request('http://limbero.org/jl8/', function(error, res, body) {
      if (error) reject(error);
      const dom = parser.parse(body);
      const title = dom.querySelector('title').childNodes[0].rawText;
      const issue = parseInt(title.substr(1));
      resolve(issue);
    });
  });

const formatDate = () => moment().format('MMM DD, YY hh:mm:ss');

const sendEmail = issue => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: credentials.username,
      pass: credentials.password
    }
  });

  const mailOptions = {
    from: 'Cloud Angel',
    to: credentials.username,
    subject: `Jl8: New Issue #${issue}`,
    html: `<h1>Jl8 has released issue ${issue}</h1><br/>
        <h3>Read it now: <a href='http://limbero.org/jl8/${issue}'>Jl8 #${issue}</a></h3>`
  };

  return transporter.sendMail(mailOptions);
};
