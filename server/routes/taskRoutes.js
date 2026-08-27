const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get all tasks (with optional search and priority filter)
router.get('/', async (req, res) => {
  try {
    const { search, priority } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks due today
router.get('/today', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      isCompleted: false,
      dueDate: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task status or content
router.put('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/tasks/:id/breakdown
router.post('/:id/breakdown', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
    You are a smart task assistant. The user wants to break down a main task into 3 to 5 simple, actionable, and concrete subtasks.
    
    Main Task: "${task.title}"
    ${task.description ? `Description: "${task.description}"` : ''}
    Category: "${task.category || 'General'}"
    
    Return ONLY a JSON array of objects representing the subtasks. Do not include markdown formatting or backticks.
    Each object in the array MUST have exactly one field: "title" (string).
    
    Example format:
    [
      { "title": "First subtask detail" },
      { "title": "Second subtask detail" }
    ]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Model did not return a valid JSON array");
    }

    const parsedSubtasks = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsedSubtasks)) {
      throw new Error("Parsed breakdown is not an array");
    }

    // Format and assign to task
    const formattedSubtasks = parsedSubtasks.slice(0, 5).map(item => ({
      title: item.title || item.name || String(item),
      isCompleted: false
    }));

    task.subtasks = formattedSubtasks;
    const updatedTask = await task.save();

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("AI Breakdown Error:", error);
    res.status(500).json({ message: "Failed to generate subtasks", error: error.message });
  }
});

module.exports = router;