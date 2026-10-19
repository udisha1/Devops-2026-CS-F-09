const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for a task'],
    },
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
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed'],
      default: 'todo'
    },
    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false }
      }
    ],
    eisenhowerQuadrant: {
      type: String,
      enum: ['q1', 'q2', 'q3', 'q4', 'auto'],
      default: 'auto'
    }
  },
  { timestamps: true }
);

// Middleware to keep isCompleted and status in sync
TaskSchema.pre('save', function (next) {
  if (this.isModified('isCompleted') && !this.isModified('status')) {
    this.status = this.isCompleted ? 'completed' : 'todo';
  } else if (this.isModified('status') && !this.isModified('isCompleted')) {
    this.isCompleted = this.status === 'completed';
  } else if (this.status === 'completed') {
    this.isCompleted = true;
  } else if (this.isCompleted && this.status !== 'completed') {
    this.status = 'completed';
  }
  next();
});

module.exports = mongoose.model('Task', TaskSchema);