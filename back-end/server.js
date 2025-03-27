import express from "express"
import { mongodb } from "./config.js"
import mongoose from "mongoose"
import cors from "cors"
import authRoutes from "./routes/auth.js"
import bedRoutes from "./routes/beds.js"
import equipmentRoutes from "./routes/equipment.js"

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
mongoose
    .connect(mongodb)
    .then(() => {
        console.log("Database connected")
    })
    .catch((err) => {
        console.log(err)
    })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/beds', bedRoutes)
app.use('/api/equipment', equipmentRoutes)

app.get('/', (req, res) => {
    res.send("Hospital Tracker API")
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})