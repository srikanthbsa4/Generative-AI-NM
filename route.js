const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const path = require('path');
const app = express();

const genAI = new GoogleGenerativeAI('AIzaSyBPgUgdyLH5bcHqyEsCtTHjjfbN3PQfJFc');

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

async function run1(image,question) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const prompt = question;

  const imageParts = [
      fileToGenerativePart(image, "image/jpeg"),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  const imageData = fs.readFileSync(image);
  const base64Image = Buffer.from(imageData).toString('base64'); 
  return { text, base64Image }; // Return both text and base64 encoded image
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });
app.post('/upload', upload.single('image'), async (req, res) => {
    const question = req.body.question;
  console.log(req.file);
  if (!req.file) {
      return res.status(400).send('No file uploaded.');
  }
  console.log('Uploaded file:', req.file);
  const result = await run1(req.file.path,question); // Wait for run1 function to complete
  return res.send(result); // Send both text and base64 encoded image as response
});


app.get('/page1', (req, res) => {
    res.sendFile(__dirname + '/page1.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
