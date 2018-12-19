const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ExamSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: 'user'},
        job: {type: Schema.Types.ObjectId, ref: 'job'},
        createdAt: {
            type: Date,
            default: Date.now
        },
        startedAt: {
            type: Date,
            default: null
        },
        deadline: {
            type: Date,
            default: Date.now
        },
        duration : {
            type: Number,
            default: 30
        },
        selectedExams: [
            {
                examTemplate: {type: Schema.Types.ObjectId, ref: 'examtemplate'},
                selectedQuestions:
                [
                    {
                        question: {
                            type: Schema.Types.ObjectId,
                            ref: 'question'
                        },
                        answers: [{type: String}],
                        answer: {type: String}
                    }
                ]
            }
        ],
    },
    {usePushEach: true},
    {usePullEach: true},
);

mongoose.model('exam', ExamSchema);