const express = require('express')
const cors = require('cors')
const app = express()
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xe3zx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const userCollection = client.db('programming_db').collection('users')
    const memberCollection = client.db('programming_db').collection('members')
    const projectCollection = client.db('programming_db').collection('projects')
    const eventCollection = client.db('programming_db').collection('events')
    const blogCollection = client.db('programming_db').collection('blogs')
    const photoCollection = client.db('programming_db').collection('photos')
    const registerEventCollection = client.db('programming_db').collection('eventsMember')



    
        //middleware for verify token
        const verifyToken = (req,res,next) => {
          console.log("inside verify token",req.headers)
          if(!req.headers.authorization){
            return res.status(401).send({message:'unauthorized access'})
          }
          const token = req.headers.authorization.split(' ')[1]
          jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) =>{
            if(err){
            return res.status(401).send({message:'unauthorized access'})
            }
            req.decoded = decoded;
            next()
          })
        }

        
         //use verify admin after verify token
       const verifyAdmin = async (req,res,next) =>{
        const email = req.decoded.email;
        const query = {email: email}
        const user = await userCollection.findOne(query)
        const isAdmin = user?.role === 'admin';
        if(!isAdmin){
          return res.status(403).send({message:'forbidden access'})
        }
        next()
      }

        //check admin
    app.get("/users/admin/:email", verifyToken,async(req,res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message:'forbidden access'})
      }

      const query = {email: email}
      const user = await userCollection.findOne(query)
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin})
    })

 
       //update a specific person
      app.patch('/users/admin/:id',verifyToken,verifyAdmin, async(req,res) =>{
        const id = req.params.id;
        const filter = {_id : new ObjectId(id)}
        const updatedDoc = {
          $set:{
            role:'admin'
          }
        }
        const result = await userCollection.updateOne(filter,updatedDoc)
        res.send(result)
      })


    //create a user
    
    app.post('/users', async(req,res) =>{
      const user = req.body;
      //insert email if user does not exist
      const query = {email: user.email}
      const existUser = await userCollection.findOne(query)
      if(existUser){
      return res.send({massage : 'user already Exit', insertedId:null})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    //get all user
    app.get('/users',verifyToken,verifyAdmin,async(req,res) =>{
      const result = await userCollection.find().toArray()
      res.send(result)
    })


    //delete a user from clint and db
    app.delete('/users/:id',verifyToken,verifyAdmin,async(req,res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

   

    //jwt related api
    app.post('/jwt',async (req,res) =>{
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:'1h'});
            res.send({token}) 
    })

    //Create a member
    app.post('/members',async(req,res) =>{
      const member = req.body;
      const result = await memberCollection.insertOne(member)
      res.send(result)
    })

    //get all members
    app.get('/members',async(req,res) =>{
      const result = await memberCollection.find().toArray()
      res.send(result)
    })


    //update a specific member
    app.get('/members/:id',verifyToken,verifyAdmin,async(req,res) =>{
      // const member = req.body
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await memberCollection.findOne(query)
      res.send(result)
    })

    //update a specific event data
    app.get('/events/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await eventCollection.findOne(query)
      res.send(result)
    })

    //update a members
    app.patch('/members/:id',verifyToken,verifyAdmin,async(req,res) =>{
      const member = req.body
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      updatedDoc={
        $set:{
          name: member.name,
          category:member.category,
          position:member.position,
          image: member.image,
          department: member.department
        }
      }
      const result = await memberCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    //update event information
    app.patch('/events/:id',verifyToken,verifyAdmin,async(req,res) =>{
      const event = req.body;
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      updatedDoc = {
        $set:{
          eventName: event.eventName,
            placeName: event.placeName,
            registrationStart: new Date().toLocaleString(),
            registrationDeadline: event.registrationDeadline,
            finalResult: event.finalResult,
            hackathonsStart: event.hackathonsStart,
            price1: event.price1,
            price2: event.price2,
            price3: event.price3,
            aboutEvent: event.aboutEvent
        }
      }
      const result = await eventCollection.updateOne(query,updatedDoc)
      res.send(result)
    })

     //delete a member from clint and db
     app.delete('/members/:id',verifyToken,verifyAdmin,async(req,res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await memberCollection.deleteOne(query)
      res.send(result)
    })

    //create a project
    app.post('/projects',async(req,res) =>{
      const projects = req.body
      const result = await projectCollection.insertOne(projects)
      res.send(result)
    })

    //get all Projects
    app.get('/projects',async(req,res) =>{
      const result = await projectCollection.find().toArray()
      res.send(result)
    })

    //create a events
    app.post('/events',async(req,res)=>{
      const event = req.body
      const result = await eventCollection.insertOne(event)
      res.send(result)
    })

    //get all events
    app.get('/events',async(req,res) =>{
      const result = await eventCollection.find().toArray()
      res.send(result)
    })

    //delete event
    app.delete('/events/:id',async(req,res) =>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await eventCollection.deleteOne(query)
      res.send(result)
    })

    //add a blog
    app.post('/blogs',async(req,res) =>{
      const blog = req.body
      const result = await blogCollection.insertOne(blog)
      res.send(result)
    })

    //add photo to db
    app.post('/photos',async(req,res)=>{
      const photo = req.body
      const result = await photoCollection.insertOne(photo)
      res.send(result)
    })

    //get all photo
    app.get('/photos',async(req,res) =>{
      const result = await photoCollection.find().toArray()
      res.send(result)
    })


    //create eventsmembers
    app.post('/eventMembers',async(req,res) =>{
      const member = req.body
      const result = await registerEventCollection.insertOne(member)
      res.send(result)
    })

    //GET ALL EVENTSMEMBERS
    app.get('/eventMembers',async(req,res) =>{
      const result = await registerEventCollection.find().toArray()
      res.send(result)
    })

    //delete a eventmember
    app.delete('/eventMembers/:id',async(req,res) =>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await registerEventCollection.deleteOne(query)
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);













app.get('/', (req,res)=>{
    res.send('Programming Club in Running ')
})

app.listen(port, ()=>{
    console.log(`Programming club is running on port ${port}`)
})