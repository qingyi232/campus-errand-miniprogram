const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use('/api/user', require('./routes/user'));
app.use('/api/task', require('./routes/task'));
app.use('/api/market', require('./routes/market'));
app.use('/api/merchant', require('./routes/merchant'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/common', require('./routes/common'));

app.use('/admin', express.static(path.join(__dirname, '../admin')));

app.get('/', (req, res) => {
  res.json({ msg: '校园跑腿小程序后端服务运行中', version: '1.0.0' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器启动成功: http://localhost:${PORT}`);
  console.log(`管理后台: http://localhost:${PORT}/admin`);
});
