const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const JobSchema = new Schema({
  title:{
    type: String,
    required: true
  },
  details:{
    type: String,
    required: true
  },
  user:{
    type: String,
    required:true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  applicants: {
    type: []
  },
  status: {
    type: Boolean,
    default: true
  }
});

mongoose.model('job', JobSchema);