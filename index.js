const express = require('express');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 2003;

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());
// // middleware

const corsOptions = {
    origin: ['https://community-food-sharing-7180e.web.app', 'https://arsdev-food-share.netlify.app'],
    credentials: true,            
    optionSuccessStatus: 200
}



const verifyToken = (req, res, next) => {
    const { token } = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESSTOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded
        next();
    })

}


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
        // await client.connect();

        // const foodCollection = client.db('foodDB').collection('featurefoodcollection');
        const foodCollection = client.db('foodDB').collection('foodcollection');
        const requestedFoodCollection = client.db('foodDB').collection('requestedfoodcollection')

        //jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(process.env.ACCESSTOKEN)
            const token = jwt.sign(user, process.env.ACCESSTOKEN, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
            })
            res.send({ token })
        })
        //featured food api
        app.get('/featuredfood', async (req, res) => {
            const query = {status : 'available'}
            const cursor = foodCollection.find(query).sort({ quantity: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })
        //add foods
        app.post('/foods', async (req, res) => {
            const newFood = req.body;
            const result = await foodCollection.insertOne(newFood);
            res.send(result);
        })
        //all available foods api
        app.get('/foods', async(req, res)=>{
            const query = {$and : []};
            query.$and.push({ status : 'available' })

            const searchQuery = req.body.food_name;
            if(searchQuery){
                query.$and.push({food_name : {$regex: `^${searchQuery}`, $options : 'i'}});
            }
            const result = await foodCollection.find(query).toArray();
            res.send(result)
        })
        //get any food detais api
        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await foodCollection.findOne(query);
            res.send(result)
        })
        //update food 
        app.put('/updatefoodstatus/:id', async(req, res)=>{
            const id = req.params.id;
            const filter = { _id : new ObjectId(id)}
            const updateStatus = req.body;
            const options = { upsert : true }
            const updatedDetails = {
              $set:{
                status : updateStatus.status
              }
            }
            const result = await foodCollection.updateOne(filter, updatedDetails, options)
            res.send(result)
        })
        //manageuserfood api
        app.get('/manageuserfood', async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { donator_email: email };
            }
            const result = await foodCollection.find(query).toArray();
            // console.log(result)
            res.send(result)
        })
        //updatefoodapi
        app.put('/manageuserfood', async (req, res) => {
            const email = req.query.email;
            const filter = { donator_email: email };
            const oldFoodDetails = req.body;
            const options = { upsert: true };
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
            const result = await foodCollection.updateOne(filter, updatedFoodDetails, options)
            res.send(result)
        })
        //delete food
        app.delete('/manageuserfood', async (req, res) => {
            const email = req.query.email;
            const query = { donator_email: email };
            const result = await foodCollection.deleteOne(query);
            res.send(result)
        })
        //requested food api
        app.post('/requestedfood', async (req, res) => {
            const requestedFood = req.body;
            const result = await requestedFoodCollection.insertOne(requestedFood);
            res.send(result);
        })
        //get requested food data 
        app.get('/requestedfood', async (req, res) => {
            const cursor = requestedFoodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/requestedfood/:id', async (req, res) => {
            const id = req.params.id;
            const query = { food_id: id }
            const result = await requestedFoodCollection.findOne(query);
            res.send(result)
        })
        app.get('/myfoodrequest', async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { user_email: email };
            }
            const result = await requestedFoodCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/myfoodrequest/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await requestedFoodCollection.deleteOne(query);
            res.send(result)
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