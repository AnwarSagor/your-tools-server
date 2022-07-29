const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.znkbe.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('yourTools').collection('tool');
        const orderCollection = client.db('yourTools').collection('order');
        const userCollection = client.db('yourTools').collection('user');

        // GET........Get Tool
        app.get('/tool', async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        });

        // POST.....Add Tool
        app.post('/tool', async (req, res) => {
            const newProduct = req.body;
            const result = await toolCollection.insertOne(newProduct);
            res.send(result);
        });

        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;

            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });

        app.get('/tool/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolCollection.findOne(query);
            res.send(tool);
        });

        app.get('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        })

        // app.get('/order', verifyJWT, async (req, res) => {
        //     const email = req.query.email
        //     const decodedEmail = req.decoded.email;
        //     if (email === decodedEmail) {
        //         const query = { email: email };
        //         const order = await orderCollection.find(query).toArray();
        //         return res.send(order);
        //     }
        //     else {
        //         return res.status(403).send({ message: 'Access forbidden' });
        //     }
        // });

        app.get('/order', async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const order = await orderCollection.find(query).toArray();
            res.send(order);

        });

        // app.get('/order', verifyJWT, async (req, res) => {
        //     const email = req.query.email
        //     const decodedEmail = req.decoded.email;
        //     if (email === decodedEmail) {
        //         const query = { email: email };
        //         const order = await orderCollection.find(query).toArray();
        //         res.send(order);
        //     }
        //     else {
        //         return res.status(403).send({ message: 'Forbidden access' })
        //     }
        // });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send({ success: true, result });
        })


    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Tools!')
})

app.listen(port, () => {
    console.log(`Tools port ${port}`)
})