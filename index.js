require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is runnig");
});

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASS}@cluster0.39yqdr4.mongodb.net/?appName=Cluster0`;

let client;
let jobCollection;
async function connectToDB() {
  try {
    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    jobCollection = client.db("careerCode").collection("jobs");

    return jobCollection;
  } catch (err) {
    console.error("mongodb connect error", err);
    throw err;
  }
}
connectToDB();

app.get("/jobs", async (req, res) => {
  try {
    const jobCollection = await connectToDB();
    const result = await jobCollection.find({}).toArray();
    res.send(result);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});
app.listen(port, () => {
  console.log(`server is running port : ${port}`);
});
// Rh6Yfv3VmvqnVE4i
