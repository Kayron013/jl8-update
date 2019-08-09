const request = require('request'),
  parser = require('fast-html-parser'),
  nodemailer = require('nodemailer'),
  fs = require('fs'),
  moment = require('moment'),
  db = require('./db/db.json'),
  credentials = require('./private/credentials.json');

const formatDate = () => moment().format('MMM DD, YY hh:mm:ss');

const setError = (msg = '', context = '') => {
  db.error = { date: formatDate(), msg, context };
};

const writeToFile = () => {
  fs.writeFile('db/db.json', JSON.stringify(db, undefined, 2), err => {
    if (err) console.log('error writing to db', err);
    else console.log('Done');
  });
};

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

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      setError(err, 'sending email');
      writeToFile();
    } else {
      db.issue = issue;
      db.updates++;
      db.last_check = formatDate();
      db.error = {};
      writeToFile();
    }
  });
};

const check = () => {
  request('http://limbero.org/jl8/', function(error, res, body) {
    if (error) {
      setError(error, 'url request');
      writeToFile();
      return;
    }

    const dom = parser.parse(body),
      title = dom.querySelector('title').childNodes[0].rawText,
      issue = parseInt(title.substr(1));

    if (issue > db.issue) sendEmail(issue);
    else {
      db.last_check = formatDate();
      db.error = {};
      writeToFile();
    }
  });
};

check();
