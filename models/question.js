const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const QuestionSchema = new Schema(
    {
        header: {
            type: String,
            required: true
        },
        correct:[ {
            type: String,
        }],
        incorrect:[ {
            type: String,
        }],
    },
        {usePushEach: true},
        {usePullEach: true},
    );

mongoose.model('question', QuestionSchema);