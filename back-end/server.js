import express from "express"
import {  mongodb} from "./config.js"
import mongoose  from "mongoose"
const app = express()


mongoose
    .connect(mongodb)
    .then(()=>{
        console.log("database connected")})
        .catch((err)=>{
            console.log(err)
        })
app.get('/', (req,res) =>{
    res.send("Hello world");
})
app.listen(3000, () => {
    console.log("server listening in  3000")
})