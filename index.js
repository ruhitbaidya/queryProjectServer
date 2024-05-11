const express = require("express");
const cors = require("cors")
const app = express();

app.use(express.json());
app.use(cors());


// password
// PVOatlalzfcaRiaF
// userName
// product_alternative


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://product_alternative:PVOatlalzfcaRiaF@datafind.xfgov3s.mongodb.net/?retryWrites=true&w=majority&appName=datafind";

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
    
    const datacoll = client.db("alternativeProduct").collection("product");

    app.post("/createProduct", async(req, res)=>{
        const prods = req.body;
        try{
            const result = await datacoll.insertOne(prods)
            res.send(result)
        }
        catch(err){
            res.send(err.message)
        }
    })









    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(5000, ()=>{
    console.log("this server is running")
})