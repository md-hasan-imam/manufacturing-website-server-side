const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hruulxd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect();
    const partsCollection = client.db('automa_care').collection('parts');
    const orderCollection = client.db('automa_care').collection('orders');
    const reviewCollection = client.db('automa_care').collection('reviews');
    const userCollection = client.db('automa_care').collection('users');
    

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

    // orders
    app.post('/order', async (req, res) => {
      const order = req.body;
      const query = {}
      const result = await orderCollection.insertOne(order);
      return res.send(result);
    });

    
    // loading my orders
    app.get('/myorder/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const orders = await orderCollection.find(query).toArray();
      res.send(orders);
    });

    // delete order 
    app.delete('/myorder/:email', async (req, res) => {
      const customeremail  = req.params.email;
      const id = req.query.productid;
      console.log( 'id and email', id,customeremail );
      const query = { _id: ObjectId(id), email: customeremail };
      const result = await orderCollection.deleteOne(query);
      console.log(result)
      res.send(result);
    });

    // post review
    app.post('/reviews', async (req, res) => {
      const newRatings = req.body;
      const query = {}
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

    // update users 
    app.put('/user/:email',async(req, res)=>{
      const email = req.params.email;
      const updateUser = req.body;
      console.log(email,updateUser);
      const filter ={ email:email};
      const options= {upsert:true};
      const updateDoc = {
        $set: updateUser,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send({ result});
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







