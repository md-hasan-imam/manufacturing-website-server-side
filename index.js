const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hruulxd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}




async function run() {
  try {
    await client.connect();
    const partsCollection = client.db('automa_care').collection('parts');
    const orderCollection = client.db('automa_care').collection('orders');
    const reviewCollection = client.db('automa_care').collection('reviews');
    const userCollection = client.db('automa_care').collection('users');


    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }


    // loading parts in home page
    app.get('/parts', async (req, res) => {
      const query = {};
      const cursor = partsCollection.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });

    // loading single parts in 
    app.get('/part/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const parts = await partsCollection.findOne(query);
      res.send(parts);
    });

    // Adding new product 
    app.post('/addaproduct', async (req, res) => {
      const newProduct = req.body;
      const result = await partsCollection.insertOne(newProduct);
      return res.send(result);
    });

    // orders
    app.post('/order', async (req, res) => {
      const order = req.body;
      const query = {}
      const result = await orderCollection.insertOne(order);
      return res.send(result);
    });


    // loading my orders
    app.get('/myorder/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const orders = await orderCollection.find(query).toArray();
        res.send(orders);
      }
      else {
        return res.status(403).send({ message: 'Forbidden Access' })
      }
    });

    // delete order 
    app.delete('/myorder', async (req, res) => {
      const id = req.query.id;
      console.log('id and email', id);
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      console.log(result)
      res.send(result);
    });

    // post review
    app.post('/reviews', async (req, res) => {
      const newRatings = req.body;
      const result = await reviewCollection.insertOne(newRatings);
      return res.send(result);
    });

    // loading all reviews in home page
    app.get('/reviews', async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // loading all users
    app.get('/users', async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });

    // update or insert users 
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3h' })
      res.send({ result, token });
    })
    // make admin
    app.put('/user/admin/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // load admin information
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })

    // delete user
    app.delete('/user/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await userCollection.deleteOne(filter);
      console.log(email, filter, result);
      res.send(result);
    })

  }
  finally {

  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello From automa!')
})

app.listen(port, () => {
  console.log(`Automa App listening on port ${port}`)
})







