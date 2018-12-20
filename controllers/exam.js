const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');


// Load Job Model
require('../models/job');
require('../models/exam');
require('../models/examtemplate');
const Job = mongoose.model('job');
const Exam = mongoose.model('exam');
const ExamTemplate = mongoose.model('examtemplate');


// View Exam Form
router.get('/:id/view', ensureAuthenticated, async (req, res) => {
    let exam = await Exam.findOne({
        _id: req.params.id
         })
        .populate('job');

    if (!exam || exam.user != req.user.id) {
        req.flash('error_msg', 'Not Authorized.');
        res.redirect('/');
    } else {
        res.render('exam/view', {
            exam: exam
        });
    }
});

router.get('/:id/start', ensureAuthenticated, async (req, res) => {
    let exam = await Exam.findOne({
        _id: req.params.id
    })
        .populate('job')
        .populate('selectedExams.examTemplate')
        .populate('selectedExams.selectedQuestions.question');

    if (!exam || exam.user != req.user.id) {
        req.flash('error_msg', 'Not Authorized');
        res.redirect('/');
    } else {
        // START EXAM
        if(!exam.startedAt) {
            exam.startedAt = Date.now();
            exam.save();
        }
        // TODO CHECK DEADLINE AND STUFF
        res.render('exam/start', {
            exam: exam
        });
    }
});

router.post('/:id/start', ensureAuthenticated, async (req, res, next) => {
    let exam = await Exam.findOne({
        _id: req.params.id
    })
        .populate('job')
        .populate('selectedExams.examTemplate')
        .populate('selectedExams.selectedQuestions.question');

    let selectedExamIndex;
    let selectedQuestionIndex;
    if (exam.user != req.user.id) {
        res.json({"success": false})
    } else {
        // START EXAM


        if (!exam.startedAt) {
            res.json({"error": "NOT STARTED YET!"});
        }


        // Get the question's exam
        selectedExamIndex = exam.selectedExams.findIndex((x) => x.examTemplate._id == req.body.exam_id);

        selectedQuestionIndex = exam.selectedExams[selectedExamIndex].selectedQuestions.findIndex((x) => x.question._id == req.body.question_id);

        let savedAnswer = exam.selectedExams[selectedExamIndex].selectedQuestions[selectedQuestionIndex].answer;


        // Check If Object is not Null or Empty then return false (ALREADY ANSWERED)
        if(!savedAnswer || Object.keys(savedAnswer.toObject()).length > 0){
            res.json({"success": false});
            return next();
        }

        // check if correct answer
        isCorrectAnswer = exam.selectedExams[selectedExamIndex].selectedQuestions[selectedExamIndex].question.correct.includes(req.body.answer);
        exam.selectedExams[selectedExamIndex].selectedQuestions[selectedQuestionIndex].answer = {
            text:  req.body.answer,
            correct: isCorrectAnswer
        };

        exam = await exam.save();

        res.json({"success": true, "value" : isCorrectAnswer})
    }
});



// Shuffle array (This should be in this file and better be sent to somewhere else but yea nvm...)
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}




module.exports = router;