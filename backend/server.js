// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./db/initAppDb');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/', require('./routes/ask'));
app.use('/', require('./routes/history'));

app.listen(3000, () => console.log('Server running on port 3000'));