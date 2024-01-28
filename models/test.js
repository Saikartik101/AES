const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  orgname: {
    type: String, 
    required: true,
  },
  testname: {
    type: String, 
    required: true,
  },
  desc: {
    type: String, 
    required: true,
  },
  testid: {
    type: Number,
    required: true,
    unique: true,
  },
  percentage: {
    type: [Number],
    default: [],
    required: true,
  },
  questions: {
    type: [String], 
    default: [],
    required: true,
  },
  answers: {
    type: [String], 
    default: [],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Test = mongoose.model('Test', TestSchema);

module.exports = Test;
