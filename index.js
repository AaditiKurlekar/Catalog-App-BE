// app.js

const express = require('express');

require('dotenv').config()
const productRoutes = require('./routes/productRoutes');
const cors = require('cors');
const db = require("./db/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({ "Message": "Hello World" })
})

// Use the product routes
app.use('/api', productRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
