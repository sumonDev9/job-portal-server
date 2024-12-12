const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middilware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qqfyy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // jobs related api
    const jobsCollection = client.db('jobportal').collection('jobs');
    const jobApplicationCollection = client.db('jobportal').collection('job-Applications');
    
    app.get('/jobs', async(req, res) => {
        const email = req.query.email;
        let query = {};
        if(email){
          query = {hr_email:email}
        } 
        const cursor = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/jobs/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobsCollection.findOne(query);
      res.send(result);
    })

   app.post('/jobs', async(req, res) => {
      const newjob = req.body;
      const result = await jobsCollection.insertOne(newjob);
      res.send(result);
   })









    //job application api
    // get all data

    app.get('/job-Applications', async (req, res) => {
      const email = req.query.email;
      const query = {applicant_email: email}
      const result = await jobApplicationCollection.find(query).toArray();

      // fokira vabe 
      for(const application of result) {
        const query1 = {_id: new ObjectId(application.job_id)}
        const job = await jobsCollection.findOne(query1);
        if(job){
          application.title = job.title;
          application.location = job.location;
          application.company = job.company;
          application.company_logo = job.company_logo;

        }
      }
      res.send(result);
    })

    app.post('/job-Applications', async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);

      // not the best way (use aggregate)
      // skip --> it (ekta compnay te kojon job apply koreche setar count)
      const id = application.job_id;
      const query = {_id: new ObjectId(id)}
      const job = await jobsCollection.findOne(query);
      let newCount = 0;
      if(job.applicationCount){
        newCount = job.applicationCount + 1
      }
      else {
        newCount = 1;
      }

      // number updated the job 
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          applicationCount: newCount
        }
      }
      const updateResult = await jobsCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })






  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('job is alling from the sk')
})

app.listen(port, () => {
    console.log(`job is waiting at: ${port}`)
})