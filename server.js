const express = require('express')
const app = express()
const mongoose = require("mongoose")
const cors = require('cors')
require('dotenv').config()

//Database Configuration & Modelling
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex:true,useFindAndModify:false})
.then(()=>console.log("MongoDB Connected!!"))
.catch(e=>console.error(e))

//schema & plugin here

const exerciseSchema = mongoose.Schema({
  username:{
    type:String,
    required:true
  },
  log:[{
    _id:false,
    description:String,
    duration:Number,
    date:String
  }]
})

const Exercise = mongoose.model("Exercise",exerciseSchema)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/public',express.static(`${process.cwd()}/public`))

//!ROOT HERE 
app.get('/', (req, res) => {
  res.sendFile(`${process.cwd()}`+ '/views/index.html')
});

//!SETUP API

app.post("/api/exercise/new-user",async(req,res,next)=>{
  //find user based on username in body 
  const existedUser = await Exercise.findOne({username:req.body.username})
  //check if user existed in db,return err,if not just next()
  return existedUser ? res.json({err_msg:"Username already taken"}): next()

},async(req,res)=>{
  try {
    //desctructure the body
    const {username}=req.body
    //create user with value username based in body 
    const createUser=await Exercise.create({username:username})
    //give back username & _id to user
    return res.json({
      username:createUser.username,
      _id:createUser._id
    })
  } catch (e) {
    return res.json({err_msg:"Cannot Create New User",reason:e})
  }
})

app.get("/api/exercise/users",async(req,res)=>{
  try {
    const getAllUser = await Exercise.find({}).select("-log")

    return res.json(getAllUser)
  } catch (e) {
    return res.json({err_msg:"Cannot Retrieve Users from database",reason:e})
  }
})

app.post("/api/exercise/add",async(req,res)=>{
  try {
    //destructure the body
    const {userId,description,duration,date}= await req.body
    let formattedDate
    
    //find user based on userId 
    const findUser=await Exercise.findOne({_id:userId})
    //check is user is exists in db or not
    if(!findUser){
      return res.json({err_msg:`${userId} not found.`})
    }

    //check if date is null or not,if null date will created automaticly based on current time
    if (await date === " "||date=== null||date===undefined){
      formattedDate=new Date().toDateString()
    }else{
      formattedDate=new Date(date).toDateString()
    }

    //push to array
    await findUser.log.push({description:description,duration:duration,date:formattedDate})
    
    //save to db 
    await findUser.save()
    
    //loop at log array, if log description same with current description, return it
    for (let i=0;i<findUser.log.length;i++){
      if(await findUser.log[i].description === description){
        return res.json({
          _id:findUser._id,
          username:findUser.username, 
          date:findUser.log[i].date,
          duration:findUser.log[i].duration,
          description:findUser.log[i].description
        })
      }
    }
  } catch (e) {
    return res.json({err_msg:"Cannot Create New Exercise",reason:e})
  }
})

app.get("/api/exercise/log",async(req,res)=>{
  try {
   const {userId,from,to,limit}=req.query
   let getLog
   const formattedFrom=new Date(from).toDateString()
   const formattedTo=new Date(to).toDateString()

   if(from===undefined&&to===undefined&&limit===undefined){
      getLog= await Exercise.findOne({_id:userId})
      if(!getLog){
        return res.json({
          err_msg:`${userId} not found`
        })
      }
      return res.json({
        _id:getLog._id,
        username:getLog.username,
        count:getLog.log.length,
        log:getLog.log
      })
   }else if(from===undefined&&to===undefined){
      getLog = await Exercise.find({_id:userId},{log:{$slice:[0, parseInt(limit)]}})
      return res.json({
        _id:getLog[0]._id,
        username:getLog[0].username,
        count:getLog[0].log.length,
        log:getLog[0].log
      })
   }else{
      getLog = await Exercise.find({_id:userId})
      return res.json({
        _id:getLog[0]._id,
        username:getLog[0].username,
        from:formattedFrom,
        to:formattedTo,
        count:getLog[0].log.length,
        log:getLog[0].log
      })
   }

  } catch (e) {
    return res.json({err_msg:"Cannot Retrieve log from database",reason:e})
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
