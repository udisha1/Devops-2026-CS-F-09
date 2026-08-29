const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const FeynmanSession = require('../models/FeynmanSession');
const auth = require('../middleware/auth');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST api/feynman/interruption
// @desc    Generate a child-like question based on explanation progress
// @access  Private
router.post('/interruption', auth, async (req, res) => {
  try {
    const { concept, explanationSoFar, history } = req.body;
    if (!concept || !explanationSoFar) {
      return res.status(400).json({ error: "Missing concept or explanation" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
    You are a curious, simple-minded 10-year-old child listening to an explanation.
    The user is trying to explain the concept: "${concept}".
    
    Here is what they have explained so far:
    "${explanationSoFar}"

    Context of past questions and answers:
    ${JSON.stringify(history || [])}

    Your task:
    Ask a short, curious, child-like question (maximum 15-20 words) that:
    1. Points out jargon they used without explaining (e.g. if they say "database", ask "Wait, what's a database? Is it like a box?").
    2. Or asks "Why?" about a logical step they skipped.
    3. Do NOT sound like an expert. Do NOT use complex terms.
    4. Keep it very conversational, direct, and child-like.
    5. Output ONLY the question. Do not add quotes, markdown, or introductory text.
    `;

    const result = await model.generateContent(prompt);
    const questionText = result.response.text().trim();
    
    res.json({ question: questionText });
  } catch (err) {
    console.error("Feynman interruption error:", err.message);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

// @route   POST api/feynman/evaluate
// @desc    Evaluate the complete explanation and save the session
// @access  Private
router.post('/evaluate', auth, async (req, res) => {
  try {
    const { concept, transcript } = req.body;
    if (!concept || !transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: "Concept and transcript are required" });
    }

    const fullDialogue = transcript
      .map(item => `${item.sender === 'user' ? 'User' : 'Child'}: ${item.text}`)
      .join('\n');

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
    You are an expert educator evaluating a student's explanation using the Feynman Technique.
    The concept being explained is: "${concept}".
    
    Here is the complete dialogue transcript between the User and the curious Child persona:
    ${fullDialogue}

    Provide a diagnostic feedback report in valid JSON format.
    Do NOT include markdown block markers (like \`\`\`json) in your response, just return the JSON text.

    The JSON must match the following structure:
    {
      "simplicityRating": "Grade School" | "High School" | "University Level" | "Professional Level",
      "simplicityScore": <number between 1 and 100 representing how simple and jargon-free the explanation is>,
      "jargonUsed": [<array of jargon words or phrases the user used without explaining them simply>],
      "conceptualGaps": [<array of key details or aspects of the concept the user missed or got wrong>],
      "strengths": [<array of things the user explained well, or great analogies they used>],
      "suggestedAnalogy": "<a simple, creative, everyday metaphor/analogy to help explain this concept to a novice>",
      "summaryFeedback": "<a paragraph of encouraging, constructive feedback summarizing their understanding>"
    }
    `;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text().trim();
    
    // Clean up potential markdown formatting if model didn't obey
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    let evaluation;
    try {
      evaluation = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse evaluation JSON. Raw response:", rawText);
      throw new Error("Evaluation did not return valid JSON");
    }

    // Save to database
    const newSession = new FeynmanSession({
      user: req.user.id,
      concept,
      transcript,
      evaluation
    });

    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (err) {
    console.error("Feynman evaluation error:", err.message);
    res.status(500).json({ error: "Failed to evaluate explanation", details: err.message });
  }
});

// @route   GET api/feynman/history
// @desc    Get user's Feynman sessions history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await FeynmanSession.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-transcript'); // omit transcripts for listing to reduce payload size
    res.json(sessions);
  } catch (err) {
    console.error("Feynman history error:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// @route   GET api/feynman/history/:id
// @desc    Get a specific Feynman session
// @access  Private
router.get('/history/:id', auth, async (req, res) => {
  try {
    const session = await FeynmanSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  } catch (err) {
    console.error("Feynman session detail error:", err.message);
    res.status(500).json({ error: "Failed to fetch session detail" });
  }
});

// @route   DELETE api/feynman/history/:id
// @desc    Delete a Feynman session
// @access  Private
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const result = await FeynmanSession.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!result) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("Feynman delete error:", err.message);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

module.exports = router;
