<<<<<<< HEAD
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// HTMLやJS、CSSを現在のディレクトリから提供
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// ルートアクセス時に index.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// アップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// フォーム送信処理
app.post('/submit', upload.single('photo'), (req, res) => {
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

    const filename = req.file?.filename || 'none';

    console.log('応募内容:', {
      title,
      dogName,
      dogAge,
      ownerPostal,
      ownerAddress,
      ownerPhone,
      ownerEmail,
      ownerName,
      ownerKana,
      image: filename
    });
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
  photo: filename,
  timestamp: new Date().toISOString()
};

fs.appendFile('submissions.log', JSON.stringify(entry) + '\n', err => {
  if (err) console.error('保存失敗:', err);
});


    res.status(200).send('応募が完了しました！ありがとうございました。');
  } catch (error) {
    console.error(error);
    res.status(500).send('送信中にエラーが発生しました。');
  }
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
const XLSX = require('xlsx');
app.get('/submissions', (req, res) => {
  fs.readFile('submissions.log', 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: '読み込み失敗' });

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
// 応募情報の一覧（JSONで返す）
app.get('/submissions', (req, res) => {
  fs.readFile('submissions.log', 'utf-8', (err, data) => {
    if (err) {
      console.error('submissions.log 読み込み失敗:', err);
      return res.status(500).json({ error: '読み込み失敗' });
    }

    const entries = data.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.warn('パース失敗行:', line);
        return null;
      }
    }).filter(Boolean);

    res.json(entries);
  });
});

app.get('/export-excel', (req, res) => {
  fs.readFile('submissions.log', 'utf-8', (err, data) => {
    if (err) return res.status(500).send('読み込み失敗');

    const entries = data.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    const worksheet = XLSX.utils.json_to_sheet(entries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '応募一覧');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="submissions.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});
=======
const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();


// Cloudinary 設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// index.html ルート表示
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// フォーム送信処理
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

    // Cloudinaryにアップロード
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
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

    fs.appendFile('submissions.log', JSON.stringify(entry) + '\n', err => {
      if (err) console.error('保存失敗:', err);
    });

    res.status(200).send('応募が完了しました！ありがとうございました。');
  } catch (error) {
    console.error('送信エラー:', error);
    res.status(500).send('送信中にエラーが発生しました。');
  }
});

// 応募情報取得（JSON）
app.get('/submissions', (req, res) => {
  fs.readFile('submissions.log', 'utf-8', (err, data) => {
    if (err) {
      console.error('submissions.log 読み込み失敗:', err);
      return res.status(500).json({ error: '読み込み失敗' });
    }

    const entries = data.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.warn('パース失敗行:', line);
        return null;
      }
    }).filter(Boolean);

    res.json(entries);
  });
});

// Excelエクスポート
app.get('/export-excel', (req, res) => {
  fs.readFile('submissions.log', 'utf-8', (err, data) => {
    if (err) return res.status(500).send('読み込み失敗');

    const entries = data.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    const worksheet = XLSX.utils.json_to_sheet(entries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '応募一覧');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="submissions.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
>>>>>>> 5a8cbf7 (最初のコミット：Cloudinary対応済み)
