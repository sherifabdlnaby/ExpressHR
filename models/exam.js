const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ExamSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: 'user'},
        exam: {type: Schema.Types.ObjectId, ref: 'exam'},
        job: {type: Schema.Types.ObjectId, ref: 'job'},
        createdAt: {
            type: Date,
            default: Date.now
        },
        startedAt: {
            type: Date,
        },
        deadline: {
            type: Date,
            default: Date.now
        },
        questions: [
            {
                question : {
                    type: Schema.Types.ObjectId,
                    ref: 'question'
                },
                answer : {
                    type: String
                }
            }
        ],
    },
    {usePushEach: true},
    {usePullEach: true},
);

mongoose.model('exam', ExamSchema);