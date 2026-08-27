const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const { GoogleGenerativeAI } = require("@google/generative-ai");

const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const Task = require('./models/Task');
const cron = require('node-cron');

const app = express();


app.use(express.json());
app.use(cors());


app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
  res.send('TaskFlow API is running...');
});

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
    
    if (!text) {
         return res.status(400).json({ error: "Please provide task text" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });


    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[today.getDay()];
    const currentDateStr = today.toISOString().split('T')[0];

    const prompt = `
    You are a smart task assistant. The user will provide a raw sentence describing a task.
    Extract the task details and return ONLY a valid JSON object. Do not use markdown blocks.
    
    Rules:
    1. "title": A clean, actionable task name.
    2. "category": Choose one: "Work", "Personal", "Study", or "General".
    3. "priority": Choose one: "High", "Medium", or "Low" based on urgency words.
    4. "dueDate": Extract the due date as an ISO 8601 string (e.g. "YYYY-MM-DDT00:00:00.000Z") if a due date is specified or implied (like "tomorrow", "this friday", "by next monday", "in 3 days"). If no due date is mentioned, set it to null.
    
    Context:
    Today is ${currentDay}, Date: ${currentDateStr}
    
    User Input: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
 
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Model did not return a valid JSON structure");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    if (parsedData.priority) {
      const p = parsedData.priority.toLowerCase();
      if (p.includes('high')) {
        parsedData.priority = 'High';
      } else if (p.includes('low')) {
        parsedData.priority = 'Low';
      } else {
        parsedData.priority = 'Medium';
      }
    } else {
      parsedData.priority = 'Medium';
    }

    if (parsedData.dueDate) {
      const parsedDate = new Date(parsedData.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        parsedData.dueDate = parsedDate.toISOString();
      } else {
        parsedData.dueDate = null;
      }
    } else {
      parsedData.dueDate = null;
    }

    res.json(parsedData);


  

  } catch (error) {
    console.error("=== ERROR DEBUG INFO ===");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    
    if (error.status) {
      console.error("API HTTP Status Code:", error.status);
    }
    if (error.errorDetails) {
      console.error("API Error Details:", JSON.stringify(error.errorDetails, null, 2));
    }

    if (error.code) {
      console.error("System/Network Error Code:", error.code);
    }
    
    
    if (error instanceof SyntaxError) {
      console.error("JSON Syntax Error - occurred during JSON.parse()");
    }
    
    console.error("Stack Trace:", error.stack);
    console.error("=========================");
    
    res.status(500).json({ 
      error: "Failed to parse task",
      message: error.message 
    });
  }
});

// Daily Morning Task Reminder Scheduler
async function sendDailyReminders() {
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

    if (tasks.length === 0) {
      console.log("[Scheduler] No tasks due today.");
      return;
    }

    console.log(`[Scheduler] Found ${tasks.length} tasks due today.`);

    // Log to console
    const taskListStr = tasks.map(t => `- [${t.priority}] ${t.title} (${t.category})`).join('\n');
    console.log(`\n========================================\n🌅 TODAY'S TASK REMINDERS:\n${taskListStr}\n========================================\n`);

    // Optional: Send to Discord Webhook if configured in .env
    if (process.env.DISCORD_WEBHOOK_URL) {
      const embeds = tasks.map(t => {
        let color = 16776960; // Yellow (Medium)
        if (t.priority === 'High') color = 16711680; // Red (High)
        if (t.priority === 'Low') color = 65280; // Green (Low)
        return {
          title: t.title,
          description: `**Category:** ${t.category}\n**Priority:** ${t.priority}`,
          color: color
        };
      });

      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: "🌅 **Good Morning! Here are your tasks due today:**",
          embeds: embeds
        })
      });
      console.log("[Scheduler] Discord notification sent successfully.");
    }
  } catch (err) {
    console.error("[Scheduler] Error in sendDailyReminders:", err.message);
  }
}

// Schedule tasks to run every day at 8:00 AM
cron.schedule('0 8 * * *', () => {
  console.log('[Scheduler] Running daily morning reminder cron job...');
  sendDailyReminders();
});

// Run a check 5 seconds after server startup for testing/visibility
setTimeout(() => {
  console.log('[Scheduler] Running initial task check on startup...');
  sendDailyReminders();
}, 5000);