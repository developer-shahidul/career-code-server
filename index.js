require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is runnig");
});

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASS}@cluster0.39yqdr4.mongodb.net/?appName=Cluster0`;

let client;
let jobCollection;
let applicationCollection;
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
    applicationCollection = client.db("careerCode").collection("applications");

    return { jobCollection, applicationCollection };
  } catch (err) {
    console.error("mongodb connect error", err);
    throw err;
  }
}
connectToDB();

app.get("/jobs", async (req, res) => {
  try {
    const { jobCollection } = await connectToDB();
    const email = req.query.email;
    const query = {};
    if (email) {
      query.hr_email = email;
    }

    const result = await jobCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});
app.get("/jobs/applications", async (req, res) => {
  try {
    const { applicationCollection, jobCollection } = await connectToDB();

    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ message: "email is required" });
    }

    const query = { hr_email: email };
    const result = await jobCollection.find(query).toArray();

    for (const job of result) {
      const applicationQuery = { jobId: job._id.toString() };
      const application_count =
        await applicationCollection.countDocuments(applicationQuery);

      job.application_count = application_count;
    }

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "server side error" });
  }
});
app.get("/jobs/:id", async (req, res) => {
  try {
    const { jobCollection } = await connectToDB();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await jobCollection.findOne(query);
    res.send(result);
  } catch (err) {
    res.status(500).send("server error");
  }
});

// // my jobs
// app.get("/myJobs", async (req, res) => {
//   try {
//     const { jobCollection } = await connectToDB();
//     const email = req.query.email;
//     if (!email) {
//       return res.status(400).send({ message: "Email is required" });
//     }
//     const query = { hr_email: email };
//     const result = await jobCollection.find(query).toArray();
//     res.send(result);
//   } catch (err) {
//     res.status(500).send("server error");
//   }
// });

app.post("/jobs", async (req, res) => {
  try {
    const { jobCollection } = await connectToDB();
    const newJob = req.body;
    const result = await jobCollection.insertOne(newJob);
    res.send(result);
  } catch (error) {
    res.status(500).send("job post server site error");
  }
});

// applicationCollection aer jonno
app.post("/applications", async (req, res) => {
  try {
    const application = req.body;
    const { applicationCollection } = await connectToDB();
    const result = await applicationCollection.insertOne(application);
    res.send(result);
  } catch (error) {
    res.status(500).send("Application server error");
  }
});

app.get("/applications/job/:job_id", async (req, res) => {
  try {
    const { applicationCollection } = await connectToDB();
    const job_id = req.params.job_id;
    const query = { jobId: job_id };
    const result = await applicationCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "application server side error" });
  }
});

app.patch("/applications/:id", async (req, res) => {
  try {
    const { applicationCollection } = await connectToDB();

    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: { status: req.body.status },
    };

    const result = await applicationCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "update failed" });
  }
});

app.get("/applications", async (req, res) => {
  try {
    const { applicationCollection } = await connectToDB();
    const query = applicationCollection.find({});
    const result = await query.toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send("Application server error");
  }
});

app.get("/applications/applicant", async (req, res) => {
  try {
    const { applicationCollection, jobCollection } = await connectToDB();

    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: "email দাও" });
    }
    const query = { applicant: email };

    // 1️⃣ আগে application গুলো আনো
    const result = await applicationCollection.find(query).toArray();

    // 2️⃣ loop দিয়ে job data যোগ করো (bad way but works)
    for (const application of result) {
      if (application.jobId) {
        const jobQuery = { _id: new ObjectId(application.jobId) };
        const job = await jobCollection.findOne(jobQuery);

        if (job) {
          application.company = job.company;
          application.title = job.title;
          application.company_logo = job.company_logo;
          application.location = job.location;
          application.description = job.description;
        }
      }
    }

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Application server error");
  }
});

app.listen(port, () => {
  console.log(`server is running port : ${port}`);
});
