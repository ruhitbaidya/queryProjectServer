const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const stripe = require("stripe")(process.env.STRIPE_KEY);

const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: 'https://query-project-client.vercel.app', // Allow only this origin
  methods: ['GET', 'POST'], // Allow only GET and POST requests
  allowedHeaders: ['Content-Type'], // Allow only Content-Type header
  credentials: true, // Allow credentials
};

// Use CORS middleware
app.use(cors(corsOptions));
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: true,
};

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@datafind.xfgov3s.mongodb.net/?retryWrites=true&w=majority&appName=datafind`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const datacoll = client.db("alternativeProduct").collection("product");
    const addcard = client.db("alternativeProduct").collection("card");
    const dataRecomendation = client
      .db("alternativeProduct")
      .collection("recommendation");

    const verify = (req, res, next) => {
      try {
        const findtoken = req.cookies.token;
        if (!findtoken) {
          return res.send({ status: "findUnAuthorize User" });
        }
        jwt.verify(findtoken, process.env.JWT_SECRATE, (err, decode) => {
          if (err) {
            return res.send({ success: false, user: "errUnAuthroize User" });
          } else {
            req.decode = decode;
            next();
          }
        });
      } catch (err) {
        res.send({ success: false, message: err.message });
      }
    }

    // Payment integration
    app.post("/payment-create", async (req, res) => {
      const price = req.body;
      const num = parseInt(price.money * 100);

      const paymentIngreat = await stripe.paymentIntents.create({
        amount: num,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({ clientSecrate: paymentIngreat.client_secret });
    });

    app.get("/jwtTokenCreate/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const token = jwt.sign(email, process.env.JWT_SECRATE);
        res.cookie("token", token, cookieOptions).send({ success: true });
      } catch (err) {
        res.send({ success: false, message: err.message });
      }
    });

    app.get("/productGetCard", async (req, res) => {
      const result = await addcard.find().toArray();
      return res.send(result);
    });

    app.delete("/deleteCardProduct/:id", async (req, res) => {
      const ids = { _id: new ObjectId(req.params.id) };
      const result = await addcard.deleteOne(ids);
      res.send(result);
    });

    app.post("/createProductAlternative", async (req, res) => {
      try {
        const prods = req.body;
        const result = await datacoll.insertOne(prods);
        res.send(result);
      } catch {
        res.send({ message: "server error" });
      }
    });

    app.post("/addCard", async (req, res) => {
      const product = req.body;
      const result = await addcard.insertOne(product);
      res.send(result);
    });

    app.get("/findProduct", async (req, res) => {
      try {
        const result = await datacoll.find().toArray();
        res.send(result);
      } catch (err) {
        res.send(err.message);
      }
    });

    app.get("/getProductByEmailalternative", async (req, res) => {
      try {
        if (req.decode === req.query.email) {
          const email = { "userinfotime.userEmail": req.query.email };
          const result = await datacoll.find(email).toArray();
          res.send(result);
        } else {
          res.send({ error: "router: Invalid User" });
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
      res.clearCookie("token", { cookieOptions, maxAge: 0 }).send({ success: true });
    });

    app.get("/getOtherComment/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await dataRecomendation.find({ reEmail: { $ne: email } }).toArray();
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

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(5000, () => {
  console.log("This server is running");
});
