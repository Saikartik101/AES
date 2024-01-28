const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const OrganisationSchema = new mongoose.Schema({
  orgname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

OrganisationSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
      const saltRounds = 10; 
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
    next();
  });

OrganisationSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };
const Organisation = mongoose.model('Organisation', OrganisationSchema);

module.exports = Organisation;
