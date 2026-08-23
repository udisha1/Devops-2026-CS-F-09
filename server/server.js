const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/tasks', taskRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('TaskFlow API is running...');
});

// Port & DB Connection
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });

  
app.post('/api/parse-task', async (req, res) => {
  try {
    const { text } = req.body;
    
    
    const parsedTask = {
      title: text,
      description: "Parsed via Smart Task Entry",
      priority: "Medium Priority",
      category: "General"
    };

    res.json(parsedTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to parse task" });
  }
});