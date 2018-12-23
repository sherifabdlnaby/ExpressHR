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

router.get('/myexams', ensureAuthenticated, async (req, res) => {

    let dueExams = await Exam.find({'user': req.user.id, 'status': 'sent'})
        .sort({createdAt: 'desc'}).populate("job");
    let doneExams = await Exam.find({'user': req.user.id, 'status': 'done'})
        .sort({createdAt: 'desc'}).populate("job");

    res.render('exam/myexams', {
        dueExams: dueExams,
        doneExams: doneExams,
    });
});

// View Exam Form
router.get('/:id/view', ensureAuthenticated, async (req, res, next) => {
    let exam = await Exam.findOne({
        _id: req.params.id
    })
        .populate('job');

    if (!exam || exam.user != req.user.id) {
        req.flash('error_msg', 'Not Authorized.');
        res.redirect('/');
    } else {

        // Check Remaining Time
        var remaningTime = Math.min((exam.deadline.getTime() - Date.now()), (exam.startedAt.getTime() + exam.duration*60*1000) - Date.now())/1000 ;
        remaningTime = Math.max(remaningTime, 0);
        if (remaningTime <= 0){
            req.flash('error_msg', 'Exam is Over.');
            res.redirect('/');
            return next();
        }

        res.render('exam/view', {
            exam: exam
        });
    }
});

router.get('/:id/start', ensureAuthenticated, async (req, res, next) => {
    let exam = await Exam.findOne({
        _id: req.params.id
    })
        .populate('job')
        .populate('selectedExams.examTemplate')
        .populate('selectedExams.selectedQuestions.question');

    if (!exam || exam.user != req.user.id) {
        req.flash('error_msg', 'Not Authorized');
        res.redirect('/');
        return next();
    }

    // START EXAM
    if (!exam.startedAt) {
        exam.startedAt = Date.now();
        exam.save();
    }

    if (exam.noOfTotalQuestions - exam.noOfAnsweredQuestions == 0) {
        req.flash('error_msg', 'Exam is done and results are sent to HR.');
        res.redirect('/');
        return next();
    }

    // Check Remaining Time
    var remaningTime = Math.min((exam.deadline.getTime() - Date.now()), (exam.startedAt.getTime() + exam.duration*60*1000) - Date.now())/1000 ;
    remaningTime = Math.max(remaningTime, 0);

    if (remaningTime <= 0){
        req.flash('error_msg', 'Exam is Over.');
        res.redirect('/');
        return next();
    }

    res.render('exam/start', {
        exam: exam,
        remaningTime: remaningTime
    });

});

router.get('/:id/result', ensureAuthenticated, async (req, res, next) => {
    let exam = await Exam.findOne({
        _id: req.params.id
    })
        .populate('job')
        .populate('job.employer')
        .populate('selectedExams.examTemplate')
        .populate('selectedExams.selectedQuestions.question');

    if (!exam || exam.job.employer._id != req.user.id) {
        req.flash('error_msg', 'Not Authorized');
        res.redirect('/');
    } else {
        // START EXAM
        if (!exam.startedAt) {
            req.flash('error_msg', "User hasn't started the exam yet");
            res.redirect('/');
            return next();
        }

        var correctAnswers = 0;

        exam.selectedExams.forEach(function (selectedExam) {
            selectedExam.correctAnswers = 0;
            selectedExam.selectedQuestions.forEach(function (question) {
                if(question.answer.correct){
                    correctAnswers++;
                    selectedExam.correctAnswers++
                }
            })
        });
;

        var elapsedTime = exam.finishedAt.getMinutes() - exam.startedAt.getMinutes() ;

        res.render('exam/result', {
            exam: exam,
            correctAnswers: correctAnswers,
            elapsedTime: elapsedTime
        });
    }
});

router.post('/:id/start', ensureAuthenticated, async (req, res, next) => {
    let exam = await Exam.findOne({
        _id: req.params.id
    })
        .populate('job')
        .populate('job.applicants')
        .populate('selectedExams.examTemplate')
        .populate('selectedExams.selectedQuestions.question');


    if (exam.user != req.user.id) {
        res.json({"success": false})
        next()
    }

    if (!exam.startedAt) {
        res.json({"error": "NOT STARTED YET!"});
    }

    // Check Remaining Time
    var remaningTime = Math.min((exam.deadline.getTime() - Date.now()), (exam.startedAt.getTime() + exam.duration*60*1000) - Date.now())/1000 ;
    remaningTime = Math.max(remaningTime, 0);
    if (remaningTime <= 0){
        res.json({"error": "EXAM OVER!"});
        return next();
    }


    let selectedExamIndex;
    let selectedQuestionIndex;

    // Get the question's exam
    selectedExamIndex = exam.selectedExams.findIndex((x) => x.examTemplate._id == req.body.exam_id);

    exam.selectedExams[selectedExamIndex].started = true;

    selectedQuestionIndex = exam.selectedExams[selectedExamIndex].selectedQuestions.findIndex((x) => x.question._id == req.body.question_id);

    let savedAnswer = exam.selectedExams[selectedExamIndex].selectedQuestions[selectedQuestionIndex].answer;


    // Check If Object is not Null or Empty then return false (ALREADY ANSWERED)
    if (!savedAnswer || Object.keys(savedAnswer.toObject()).length > 0) {
        res.json({"success": false});
        return next();
    }

    // check if correct answer
    isCorrectAnswer = exam.selectedExams[selectedExamIndex].selectedQuestions[selectedExamIndex].question.correct.includes(req.body.answer);
    exam.selectedExams[selectedExamIndex].selectedQuestions[selectedQuestionIndex].answer = {
        text: req.body.answer,
        correct: isCorrectAnswer
    };

    exam.noOfAnsweredQuestions++;

    // save exam status if done
    if (exam.noOfTotalQuestions - exam.noOfAnsweredQuestions == 0) {
        exam.status = "done";
        exam.finishedAt = Date.now()
    }

    exam = await exam.save();

    res.json({
        "success": true,
        "value": isCorrectAnswer,
        "questions_left": exam.noOfTotalQuestions - exam.noOfAnsweredQuestions
    })
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