const request = require('request'),
    parser = require('fast-html-parser'),
    nodemailer = require('nodemailer'),
    fs = require('fs'),
    db = require('./db/db.json');

const sendEmail = issue => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'email@gmail.com',
            pass: 'password'
        }
    });
      
    const mailOptions = {
        from: 'email@gmail.com',
        to: 'email@gmail.com',
        subject: `Jl8: New Issue #${issue}`,
        html: `<h1>Jl8 has released issue ${issue}</h1><br/>
        <h3>Read it now: <a href='http://limbero.org/jl8'>Jl8 #${issue}</a></h3>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) { console.log('error sending email', err) }
        else {
            db.issue = issue;
            db.updates++;
            fs.writeFile('db/db.json', JSON.stringify(db), err => {
                if (err) console.log('error writing to db', err);
                else console.log('db updated');
            });
        }
    });
      
}
request('http://limbero.org/jl8/', function (error, res, body) {
    if (error) console.log('error request page');
    const dom = parser.parse(body),
        title = dom.querySelector('title').childNodes[0].rawText,
        issue = parseInt(title.substr(1));
    if (issue > db.issue) sendEmail(issue);
});