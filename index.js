const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const e = require('express');
const port = process.env.PORT || 2003;

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DBUSER}:${process.env.DBPASS}@cluster0.hiylnp2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // const foodCollection = client.db('foodDB').collection('featurefoodcollection');
        const foodCollection = client.db('foodDB').collection('foodcollection');
        const requestedFoodCollection = client.db('foodDB').collection('requestedfoodcollection')

        //featured food api
        app.get('/featurefoods', async (req, res) => {
            const cursor = foodCollection.find().sort({quantity : -1}).limit(6);
             const result = await cursor.toArray();
            res.send(result);
        })
        //add foods
        app.post('/foods', async(req,res)=>{
            const newFood = req.body;
            const result = await foodCollection.insertOne(newFood);
            res.send(result);
        })
        //all available foods api
        app.get('/foods', async(req, res)=>{
            let query = {};
            const searchQuery = req.query.food_name;
            if(searchQuery){
                query = { food_name: { $regex: `^${searchQuery}`, $options: 'i'}};
            //    query.food_name = req.query.food_name;
            }else{
                query = {};
            }
            const cursor = foodCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        //get any food detais api
        app.get('/foods/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await foodCollection.findOne(query);
            res.send(result)
        })
        //manageuserfood api
        app.get('/manageuserfood',async(req,res)=>{ 
            const email = req.query.email;
            let query = {};
            if(email){
                query = {donator_email : email};
            }
            const result = await foodCollection.find(query).toArray();
            // console.log(result)
            res.send(result) 
        })
        //updatefoodapi
        app.put('/manageuserfood', async(req,res)=>{
            const email = req.query.email;
            const filter = {donator_email : email};
            const oldFoodDetails = req.body;
            const options = {upsert: true};
            const updatedFoodDetails = {
                $set: {
                    food_name: oldFoodDetails.food_name,
                    food_image: oldFoodDetails.food_image,
                    donator: oldFoodDetails.donator,
                    donator_email: oldFoodDetails.donator_email,
                    pickup_location: oldFoodDetails.pickup_location,
                    expire_date: oldFoodDetails.expire_date,
                    additional_notes: oldFoodDetails.additional_notes
                }
            } 
            const result = await foodCollection.updateOne(filter, updatedFoodDetails ,options)
            res.send(result)
        })
        //delete food
        app.delete('/manageuserfood', async(req,res)=>{
            const email = req.query.email;
            const query = {donator_email : email};
            const result = await foodCollection.deleteOne(query);
            res.send(result)
        })
        //requested food api
        app.post('/requestedfood', async(req, res)=>{
            const requestedFood = req.body;
            const result = await requestedFoodCollection.insertOne(requestedFood);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('community food share is running')
})
app.listen(port, () => {
    console.log('community food share is running on', port)
})