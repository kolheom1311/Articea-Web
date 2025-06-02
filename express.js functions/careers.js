const serverless = require('serverless-http');
const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');
const multer = require('multer');
const { SendMailClient } = require("zeptomail");
const path = require('path');
const serviceAccount = require("../articea-web-firebase-adminsdk.json");

// ✅ Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
    databaseURL: process.env.DB_URL
  });
}

const bucket = admin.storage().bucket();
const app = express();

// ✅ Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ ZeptoMail setup
const url = process.env.mailurl;
const token = process.env.mailtoken;
const client = new SendMailClient({ url, token });

// ✅ CORS - Allow only the main website
const allowedOrigins = ['https://www.uhtarticea.com', 'https://uhtarticea.com'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ✅ Multer Configuration (Accept only PDF, DOC, DOCX)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// ✅ Role-based WhatsApp Group Links
const whatsappLinks = {
  "Dart Developer": "https://chat.whatsapp.com/",
  "Figma Developer": "https://chat.whatsapp.com/",
  "FlutterFlow Developer": "https://chat.whatsapp.com/",
  "Website Developer": "https://chat.whatsapp.com/",
  "Others": "https://chat.whatsapp.com/"
};

// ✅ Route to handle form submission
app.post('/.netlify/functions/careers', upload.single('resume'), async (req, res) => {
  try {
    const formData = req.body;
    const file = req.file;
    const db = admin.database();

    // ✅ Validate form fields
    const requiredFields = ["name", "email", "phone", "role", "yop", "college", "course", "workStudy"];
    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        return res.status(400).json({
          success: false,
          error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`,
        });
      }
    }

    // ✅ Validate phone number (only 10 digits, no spaces or symbols)
    if (!/^\d{10}$/.test(formData.phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be exactly 10 digits with no spaces or symbols.",
      });
    }

    // ✅ Check for file upload
    if (!file) {
      return res.status(400).json({ success: false, error: "Resume file is required." });
    }

    // ✅ Validate file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({ success: false, error: "Only PDF, DOC, and DOCX files are allowed." });
    }

    // ✅ Check if the email already exists
    const internsRef = db.ref('Interns');
    const snapshot = await internsRef.orderByChild('email').equalTo(formData.email).once('value');

    if (snapshot.exists()) {
      return res.status(400).json({
        success: false,
        error: "You are already registered. If you think this is an error, contact the admin."
      });
    }

    // ✅ Generate file name
    const userName = formData.name.replace(/\s+/g, '');
    const timestamp = Date.now();
    const fileName = `Resumes/${userName}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    // ✅ Upload file to Firebase Storage
    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    // ✅ Get signed URL (Valid until 2030)
    const [fileURL] = await fileUpload.getSignedUrl({ action: 'read', expires: '03-01-2030' });

    // ✅ Save form data in Firebase Realtime Database
    const userKey = `${userName}_${timestamp}`;
    await db.ref(`Interns/${userKey}`).set({ ...formData, resumeUrl: fileURL });

    // ✅ Assign WhatsApp Group Link based on role
    const whatsappLink = whatsappLinks[formData.role] || whatsappLinks["Others"];

    // ✅ Send an email using ZeptoMail
    client.sendMail({
      "mail_template_key": process.env.TemplateKey, // ✅ Template Key from ZeptoMail
      "from": {
        "address": "noreply@uhtarticea.com",
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
      "reply_to": {
        "address": "team@uhtarticea.com",
        "name": "Articea Support"
      },
      "subject": "Test",
      "merge_info": {
        "Student_Name": formData.name,
        "role": formData.role,
        "link": whatsappLink // ✅ Assigned WhatsApp group link dynamically
      }
    })
      .then((resp) => {
        console.log("Success", resp);
        return res.status(200).json({
          success: true,
          message: 'Data saved and email sent successfully!',
        });
      })
      .catch((error) => {
        console.error("Email Error:", error.response ? error.response.data : error.message);
        return res.status(500).json({
          success: false,
          message: 'Data saved but failed to send email.',
          error: error.message
        });
      });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error.' });
  }
});

// ✅ Export for Netlify
module.exports.handler = serverless(app);