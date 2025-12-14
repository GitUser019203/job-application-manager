const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3001;

// Enable CORS for the React app
app.use(cors());

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.docx') {
            cb(null, true);
        } else {
            cb(new Error('Only .docx files are allowed'));
        }
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/api/convert-resume', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }

    const filePath = req.file.path;

    // Detect platform
    const isWindows = process.platform === 'win32';

    // Build the command
    let command;
    if (isWindows) {
    // On Windows: Set UTF-8 code page silently, then run markitdown with quoted path
    command = `chcp 65001 > nul && markitdown "${filePath}"`;
    } else {
    // On Linux/macOS: No chcp needed (terminal is usually UTF-8), just run markitdown
    command = `markitdown "${filePath}"`;
    }

    // Execute markitdown command
    // using "markitdown <filename>" as per help output
    exec(command, { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
        // Clean up the uploaded file
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
        });

        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to convert file', details: stderr });
        }

        // Return the markdown content
        res.json({ markdown: stdout });
    });
});

app.use(express.json());

app.post('/api/convert-to-pdf', (req, res) => {
    const { markdown } = req.body;
    if (!markdown) {
        return res.status(400).json({ error: 'No markdown content provided' });
    }

    const tempId = crypto.randomUUID();
    const inputPath = path.join('uploads', `${tempId}.md`);
    const outputPath = path.join('uploads', `${tempId}.pdf`);

    fs.writeFileSync(inputPath, markdown, 'utf8');

    exec(`pandoc "${inputPath}" -o "${outputPath}" --pdf-engine=xelatex -V geometry:margin=1in`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Pandoc error: ${error}`);
            // Cleanup input
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            return res.status(500).json({ error: 'Failed to convert to PDF', details: stderr });
        }

        res.download(outputPath, 'resume.pdf', (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Cleanup both files
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
    });
});

const https = require('https');

// Load SSL certificates
const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
    console.log(`Secure Server running on port ${port}`);
});
