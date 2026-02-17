require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://career-code-client-f17gue5rr-shaidul-portfollio.vercel.app",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// firebase jwt
var admin = require("firebase-admin");

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//firebase token verify
const firebaseTokenVerify = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  console.log("token headers", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unauthorize" });
  }

  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "unauthorize access" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("firebase token decoded", decoded);

    req.decoded = decoded;
    next();
  } catch (err) {
    res.status(401).send({ message: "unauthorize access" });
  }
};
///////////////////
const logger = (req, res, next) => {
  // console.log("inside the logger middleware");
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("cookie in the middleware", token);

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  // verifyToken
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

// verify token email check
const verifyEmailToken = (req, res, next) => {
  if (req.query.email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};

// mongodb
const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASS}@cluster0.39yqdr4.mongodb.net/?appName=Cluster0`;

let client;
let jobCollection;
let applicationCollection;
async function connectToDB() {
  if (jobCollection && applicationCollection) {
    return { jobCollection, applicationCollection };
  }
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

// jwt token related api
app.post("/jwt", async (req, res) => {
  const userData = req.body;
  const token = jwt.sign(userData, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "1d",
  });
  // set token in the cookies
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.send({ success: true });
});

app.get("/", (req, res) => {
  res.send("server is runnig");
});

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
app.get(
  "/jobs/applications",
  // firebaseTokenVerify,
  // verifyEmailToken,
  async (req, res) => {
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
  },
);
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

app.get(
  "/applications/applicant",
  // logger,
  // firebaseTokenVerify,
  // verifyToken,
  // verifyEmailToken,
  async (req, res) => {
    try {
      const { applicationCollection, jobCollection } = await connectToDB();
      const email = req.query.email;
      if (!email) {
        return res.status(400).json({ message: "email দাও" });
      }
      const query = { applicant: email };

      // console.log("inside application Api", req.cookies)

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
  },
);
app.listen(port, () => {
  console.log(`server port : ${port}`);
});
module.exports = app;
