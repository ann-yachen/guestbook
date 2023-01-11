const express = require('express');
const multer= require('multer');
const crypto = require('crypto');
const mysql = require('mysql');

const app = express();
const port = 3000;
const host = '0.0.0.0';
app.use(express.static('public'));

/* Create .env */
require('dotenv').config();
/* For S3Client */
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

/* Connect to MySQL */
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

/* Create a connection pool */
const pool = mysql.createPool({
    host            : dbHost,
    user            : dbUser,
    password        : dbPassword,
    database        : dbName,
    connectionLimit : 3 // Default 10
})

/* Use multer for file uploading */
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* Connect to S3  */
const { S3Client, PutObjectCommand, RedirectAllRequestsToFilterSensitiveLog } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
});

/* Create image name by random creating for S3 storage */
const randomImageName = () => crypto.randomBytes(32).toString('hex'); // Bytes = 32

/* Route for '/' */
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.route('/api/message')
    .post(upload.single('image'), async (req, res) => {
        const imageName = randomImageName(); // Create random image name
        /* Send to S3 */
        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: req.file.buffer, // Store in multer buffer
            ContentType: req.file.mimetype
        };
        const command = new PutObjectCommand(params);
        await s3.send(command);

        pool.getConnection((err, connection) => {
            if(err) throw err;
            console.log('Connected to pool');

            const par = [req.body.message, imageName];
            const sql = 'INSERT INTO message (message, image) VALUES (?)';
            connection.query(sql, [par], (err) => {
                if(err) throw err;
                res.status(200).send({ 'ok': true });
            })
            connection.release();
            console.log('Disconnected to pool');
        });
    })
    .get((req, res) => {
        pool.getConnection((err, connection) => {
            if(err) throw err;
            console.log('Connected to pool');

            const sql = 'SELECT message, image FROM message';
            connection.query(sql, (err, result) => {
                if(err) throw err;
                const data = { 'data': JSON.parse(JSON.stringify(result)) };
                res.status(200).send(data);
            });
            connection.release();
            console.log('Disconnected to pool');
        });
    });

app.listen(port, host, () => {
    console.log(`Running on http://${host}:${port}`);
});