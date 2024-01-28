const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: " ",
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
      const saltRounds = 10; 
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
    next();
  });

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };
const User = mongoose.model('User', UserSchema);

module.exports = User;
