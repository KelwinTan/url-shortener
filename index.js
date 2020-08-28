const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup')
const { nanoid } = require('nanoid');
const { response } = require('express');
const monk = require('monk');

require('dotenv').config();

const db = monk('localhost/db');
const urls = db.get('urls');
urls.createIndex('name');

const schema = yup.object().shape({
    slug: yup.string().trim().matches(/[\w\-]/i),
    url: yup.string().trim().url().required(),
})


const app = express();

app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static('./public'));


app.get('/', (req, res) => {
    res.json({
        message: 'url shortener'
    });
});

app.get('/:id', (req, res) => {
    // redirect to url
});

app.post('/url', async (req, res, next) => {
    let { slug, url } = req.body;
    try {
        await schema.validate({
            slug,
            url,
        })

        if (!slug) {
            slug = nanoid(5);
        } else {
            const existing = await urls.findOne({ slug });
            if (existing) {
                throw new Error('Slug in use.');
            }
        }
        slug = slug.toLowerCase();
        const secret = nanoid(10).toLowerCase();
        const newUrl = {
            url,
            slug,
        };
        const created = await urls.insert(newUrl);
        res.json(created);
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    if (error.status) {
        res.status(error.status);
    } else {
        res.status(500);
    }
    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? 'yoms' : error.stack
    })
});

app.get('/url/:id', (req, res) => {
    //get a short url by id
});

const port = process.env.port || 1337;

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});