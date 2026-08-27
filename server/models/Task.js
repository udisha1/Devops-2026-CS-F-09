const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: [true, 'Task title is required'],
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    category: { 
      type: String, 
      default: 'General' 
    },
    dueDate: {
      type: Date
    },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High'], 
      default: 'Medium' 
    },
    isCompleted: { 
      type: Boolean, 
      default: false 
    },
    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);