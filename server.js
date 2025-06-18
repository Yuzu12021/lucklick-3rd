const GAS_WEBHOOK = process.env.GAS_WEBHOOK;
const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// メモリ上に保存するmulter
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// indexページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 応募フォーム POST
app.post('/submit', upload.single('photo'), async (req, res) => {
  try {
    const {
      title,
      dogName,
      dogAge,
      ownerPostal,
      ownerAddress,
      ownerPhone,
      ownerEmail,
      ownerName,
      ownerKana
    } = req.body;

    let imageUrl = '';

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'LuckLickUploads'
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      imageUrl = result.secure_url;
    }

    const entry = {
      title,
      dogName,
      dogAge,
      ownerPostal,
      ownerAddress,
      ownerPhone,
      ownerEmail,
      ownerName,
      ownerKana,
      photo: imageUrl,
      timestamp: new Date().toISOString()
    };

    // 追記 ★★★★★
    try {
      await fetch(process.env.SPREADSHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dogName,
          ownerName,
          ownerKana,
          ownerEmail,
          ownerPhone,
          ownerPostal,
          ownerAddress,
          photo: imageUrl // ← Cloudinaryの画像URL
        })
      });
      console.log('✅ GAS へ転送完了');
    } catch (err) {
      console.error('❌ GAS への転送失敗', err);
    }
// ★★★★★ ここまで

    fs.appendFile('submissions.log', JSON.stringify(entry) + '\n', err => {
      if (err) console.error('保存失敗:', err);
    });

    res.status(200).send('応募が完了しました！ありがとうございました。');
  } catch (error) {
    console.error('送信エラー:', error);
    res.status(500).send('送信中にエラーが発生しました。');
  }
});

// 応募一覧取得
app.get('/submissions', (req, res) => {
  fs.readFile('submissions.log', 'utf-8', (err, data) => {
    if (err) {
      console.error('読み込み失敗:', err);
      return res.status(500).json({ error: '読み込み失敗' });
    }

    const entries = data.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.json(entries);
  });
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
