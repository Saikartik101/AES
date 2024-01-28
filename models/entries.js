const mongoose = require('mongoose');

const EntriesSchema = new mongoose.Schema({
  name:{
        type: String,
        required: true,
  },
  testid: {
    type: Number,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
  },
  email:{
    type: String,
    required: true,
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Entries = mongoose.model('Entries', EntriesSchema);

module.exports = Entries;
