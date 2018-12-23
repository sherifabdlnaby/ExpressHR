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
        finishedAt: {
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
        noOfTotalQuestions : {
            type: Number,
            default: 0
        },
        noOfAnsweredQuestions : {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: "new",
        },
        selectedExams: [
            {
                examTemplate: {type: Schema.Types.ObjectId, ref: 'examtemplate'},
                started: {type: Boolean, default: false},
                selectedQuestions:
                [
                    {
                        question: {
                            type: Schema.Types.ObjectId,
                            ref: 'question'
                        },
                        answers: [{type: String}],
                        answer: {
                            text: {type: String}
                            , correct: {type: Boolean} }
                    }
                ]
            }
        ],
    },
    {usePushEach: true},
    {usePullEach: true},
);

mongoose.model('exam', ExamSchema);