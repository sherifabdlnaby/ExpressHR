const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const JobSchema = new Schema(
    {
  title:{
    type: String,
    required: true
  },
  details:{
    type: String,
    required: true
  },
  employer:{
    type: {},
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
},
    { usePushEach: true },);

mongoose.model('job', JobSchema);