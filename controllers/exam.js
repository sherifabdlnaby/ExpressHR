const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
var multer = require('multer')
const uuidv1 = require('uuid/v1');
uuidv1(); // ⇨ '45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'


// Load Job Model
require('../models/question');
require('../models/exam');
const Question = mongoose.model('question');
const Exam = mongoose.model('exam');



// Add Exam Form
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('exam/add');
});

// Add Exam Question Form
router.get('/:id/addquestion', ensureAuthenticated, (req, res) => {
    res.render('exam/addquestion', { id : req.params.id});
});

// Add Exam Question
router.post('/:id/addquestion', ensureAuthenticated, (req, res) => {
    let errors = [];

    if (!req.body.header) {
        errors.push({text: 'Please add a header'});
    }

    if (!req.body.correct || req.body.correct.length < 1) {
        errors.push({text: 'Please add correct answers'});
    }

    if (!req.body.incorrect || req.body.incorrect.length < 1) {
        errors.push({text: 'Please add incorrect answers'});
    }

    if (errors.length > 0) {
        res.render('exam/addquestion', { errors: errors, id : req.params.id});

    } else {
        const newQuestion = {
            header: req.body.header,
            correct: req.body.correct,
            incorrect: req.body.incorrect,
        };

        new Question(newQuestion)
            .save()
            .then(question => {
                Exam.findOne({
                    _id: req.params.id
                })
                    .then(exam => {
                        exam.questions.push(question);
                        exam.save().then(exam => {
                            req.flash('success_msg', 'Question Added');
                            res.redirect('/exam/'+ req.params.id +'/addquestion/');
                        })
                    });
            });
    }
});


// View Exam
// Job Index Page
router.get('/', ensureAuthenticated, (req, res) => {
    Exam.find({'user': req.user.id})
        .populate('questions.header')
        .then(exams => {
            res.render('exam/index', {
                exams: exams
            });
        });
});

module.exports = router;