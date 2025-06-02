const serverless = require('serverless-http');
const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');
const { SendMailClient } = require("zeptomail");
const path = require('path');
const serviceAccount = require("../articea-web-firebase-adminsdk.json");

// Firebase admin setup
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_URL
});

// // ZeptoMail setup
const url = process.env.mailurl;
const token = process.env.mailtoken;
let client = new SendMailClient({ url, token });

// Express app setup
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// CORS configuration
const allowedOrigins = ['https://uhtarticea.com', 'https://www.uhtarticea.com', 'http://uhtarticea.com', 'http://www.uhtarticea.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middleware to handle preflight requests
app.options('*', cors());

app.post('/.netlify/functions/server', (req, res) => {
  const formData = req.body;

  // Validate incoming data
  if (!formData.name || !formData.email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }

  // Remove spaces from the user's name to create a unique key
  const userName = formData.name.replace(/\s+/g, '');

  // Create a new Date object and adjust for IST (UTC +5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() + istOffset);

  // Format the IST time to a compact string
  const istDateTimeString = istTime.toISOString().replace(/[-:.]/g, '').slice(0, 15);

  // Combine the userEmail with the IST date and time
  const uniqueResponse = `${userName}_${istDateTimeString}`;

  // Reference to the Firebase Realtime Database
  const db = admin.database();

  // Patch the form data in the Realtime Database
  db.ref('responses/' + uniqueResponse).update(formData, (error) => {
    if (error) {
      console.error('Error saving data:', error);
      return res.status(500).json({ success: false, error: 'Error saving data.' });
    } else {
      // Send an email using Zeptomail
      client.sendMail({
        "mail_template_key": process.env.TemplateKey,
        "from": {
          "address": "team@uhtarticea.com",
          "name": "Team Articea"
        },
        "to": [
          {
            "email_address": {
              "address": formData.email,
              "name": formData.name
            }
          }
        ],
        "subject": "You’re In! Welcome to Articea",
        "merge_info": {
          "UName": formData.name
        }
      })
      .then((resp) => {
          console.log("Success", resp);
          return res.status(200).json({ success: true, message: 'Data saved and email sent successfully!' });
        })
      .catch((error) => {
          console.error("Error:", error.response ? error.response.data : error.message)
          return res.status(500).json({ success: false, message: 'Data saved but failed to send email.', error: error.message });
        });
    }
  });
});
// Export the app wrapped in serverless-http
module.exports.handler = serverless(app);
