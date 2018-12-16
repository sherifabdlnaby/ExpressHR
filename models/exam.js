const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ExamSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        details: {
            type: String,
            required: true
        },
        user: {type: Schema.Types.ObjectId, ref: 'user'},
        questions: [
            {
                type: Schema.Types.ObjectId,
                ref: 'question'
            }
        ],
    },
    {usePushEach: true},
    {usePullEach: true},
);

mongoose.model('exam', ExamSchema);