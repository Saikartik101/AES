const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  sender:{
        type: String,
        required: true,
  },
  to:{
    type: String,
    required: true,
},
  text:{
    type: String,
    default: " ",
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;
