const express = require("express");
const cors = require("cors");
require("dotenv").config()
const app = express();

app.use(express.json());
app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://cardoctor-bd.web.app",
        "https://cardoctor-bd.firebaseapp.com",
      ],
      credentials: true,
    })
  );


// password
// PVOatlalzfcaRiaF
// userName
// product_alternative


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@datafind.xfgov3s.mongodb.net/?retryWrites=true&w=majority&appName=datafind`;

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

    app.get('/findProduct', async(req, res)=>{
        try{
            const result = await datacoll.find().toArray();
            res.send(result)
        }
        catch(err){
            res.send(err.message)
        }
    })

    app.get("/getProductByEmail", async(req, res)=>{
        try{
            const email = {"userinfotime.userEmail" : req.query.email}
            const result = await datacoll.find(email).toArray();
            console.log(result)
            res.send(result)
        }
        catch(err){
            res.send(err.message)
        }
    })


    app.get("/findData/:id", async(req, res)=>{
            try{
                const ids = {_id : new ObjectId(req.params.id)}
                const result = await datacoll.findOne(ids);
                res.send(result)
            }
            catch(err){
                res.send(err.message)
            }
    })

    app.put("/updateProduct/:id", async(req, res)=>{
        try{
            const id = {_id : new ObjectId(req.params.id)}
            const find = req.body;
            const options = {
              $set : find
            }
            console.log(options)
            const result = await datacoll.updateOne(id, options);
            res.send(result)

        }
        catch(err){
            res.send(err.message)
        }
    })

    app.delete("/delete/:id", async(req, res)=>{
        try{
          const ids = {_id : new ObjectId(req.params.id)};
          const result = await datacoll.deleteOne(ids)
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