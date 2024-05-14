const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());
app.use(cors());

app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@datafind.xfgov3s.mongodb.net/?retryWrites=true&w=majority&appName=datafind`;

// if(req.decode === req.params.email){

// }else{
//   res.send({validation : "unauthorize user"})
// }

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //  await client.connect();
    //  await client.db("admin").command({ ping: 1 });
    const datacoll = client.db("alternativeProduct").collection("product");
    const dataRecomendation = client
      .db("alternativeProduct")
      .collection("recommendation");

    const verify = (req, res, next) => {
      try {
        const findtoken = req.cookies.token;
        if (findtoken === null) {
          res.send({ status: "UnAuthorize User" });
        }
        jwt.verify(findtoken, process.env.JWT_SECRATE, (err, decode) => {
          if (err) {
            res.send({ success: false, user: "UnAuthroize User" });
          }

          req.decode = decode;
          next();
        });
      } catch (err) {
        res.send({ success: false, message: err.message });
      }
    };

    app.get("/jwtTokenCreate/:email", async (req, res) => {
      try {
        const emails = req.params.email;
        const token = jwt.sign(emails, process.env.JWT_SECRATE);
        res.cookie("token", token, cookieOptions).send({ success: true });
      } catch (err) {
        res.send({ success: false, message: err.message });
      }
    });

    app.post("/createProduct", verify, async (req, res) => {
      try {
        const prods = req.body;
        const decodeemial = req.decode;
        const routemail = prods.userinfotime.userEmail;
        // console.log(prods)
        // console.log(res.decode, prods.userinfotime.userEmail)
        if (decodeemial === routemail) {
          const result = await datacoll.insertOne(prods);
          res.send(result);
        } else {
          console.log("not found");
        }
      } catch {
        res.send({ message: "server error" });
      }
    });

    app.get("/findProduct", async (req, res) => {
      try {
        const result = await datacoll.find().toArray();
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.get("/getProductByEmail", verify, async (req, res) => {
      try {
        if (req.decode === req.query.email) {
          const email = { "userinfotime.userEmail": req.query.email };
          const result = await datacoll.find(email).toArray();
          res.send(result);
        } else {
          res.send({ error: "router : Invalid User" });
        }
      } catch (err) {
        res.send(err.message);
      }
    });

    app.get("/findData/:id", async (req, res) => {
      try {
        const ids = { _id: new ObjectId(req.params.id) };
        const result = await datacoll.findOne(ids);
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.put("/updateProduct/:id", async (req, res) => {
      try {
        const id = { _id: new ObjectId(req.params.id) };
        const find = req.body;
        const options = {
          $set: find,
        };
        console.log(options);
        const result = await datacoll.updateOne(id, options);
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.delete("/delete/:id", async (req, res) => {
      try {
        const ids = { _id: new ObjectId(req.params.id) };
        const result = await datacoll.deleteOne(ids);
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.post("/comment", async (req, res) => {
      console.log(req.body);
      try {
        const idscount = { _id: new ObjectId(req.body.queryId) };
        const increment = { $inc: { "userinfotime.recommendationCount": 1 } };
        await datacoll.updateOne(idscount, increment);
        const datas = req.body;
        const result = await dataRecomendation.insertOne(datas);
        res.send(result);
      } catch (err) {
        res.send({ success: false });
      }
    });

    app.get("/allcomment/:id", async (req, res) => {
      try {
        const idsfi = { queryId: req.params.id };
        const result = await dataRecomendation.find(idsfi).toArray();
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.get("/mycomment/:id", async (req, res) => {
      try {
        const email = { reEmail: req.params.id };
        const result = await dataRecomendation.find(email).toArray();
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.post("/deleteProduct/:id", async (req, res) => {
      try {
        const ids = { _id: new ObjectId(req.params.id) };
        const idscount = { _id: new ObjectId(req.body.id) };
        const increment = { $inc: { "userinfotime.recommendationCount": -1 } };
        await datacoll.updateOne(idscount, increment);
        const result = await dataRecomendation.deleteOne(ids);
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });
    app.get("/logutUser", async (req, res) => {
      res
        .clearCookie("token", { cookieOptions, maxAge: 0 })
        .send({ success: true });
    });
    app.get("/getOtherComment/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await dataRecomendation
          .find({ reEmail: { $ne: email } })
          .toArray();
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.get("/searchproduct/:text", async (req, res) => {
      const text = req.params.text;
      const filter = { productName: { $regex: text, $options: "i" } };
      const result = await datacoll.find(filter).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(5000, () => {
  console.log("this server is running");
});
