const mongoose = require('mongoose');

const FeynmanSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    concept: {
      type: String,
      required: true,
      trim: true,
    },
    transcript: [
      {
        sender: {
          type: String,
          enum: ['user', 'child'],
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
      },
    ],
    evaluation: {
      simplicityRating: { type: String },
      simplicityScore: { type: Number },
      jargonUsed: [{ type: String }],
      conceptualGaps: [{ type: String }],
      strengths: [{ type: String }],
      suggestedAnalogy: { type: String },
      summaryFeedback: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeynmanSession', FeynmanSessionSchema);
