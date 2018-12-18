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
    type: [
      {
        user : { type: Schema.Types.ObjectId, ref: 'user' },
        cv  : {},
        status: { type: String, default: "new"},
      }
    ]
  },
  status: {
    type: Boolean,
    default: true
  }
},
    { usePushEach: true },
    { usePullEach: true },);

mongoose.model('job', JobSchema);