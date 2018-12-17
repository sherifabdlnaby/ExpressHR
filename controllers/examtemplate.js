const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
var multer = require('multer')
const uuidv1 = require('uuid/v1');
uuidv1(); // ⇨ '45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'


// Load Job Model
require('../models/question');
require('../models/examtemplate');
const Question = mongoose.model('question');
const ExamTemplate = mongoose.model('examtemplate');



// Add ExamTemplate Form
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('examtemplate/add');
});

// Add Exam
router.post('/', ensureAuthenticated, (req, res) => {
    let errors = [];

    if (!req.body.title) {
        errors.push({text: 'Please add a title'});
    }
    if (!req.body.details) {
        errors.push({text: 'Please add some details'});
    }
    if (!req.body.type) {
        errors.push({text: 'Please add some details'});
    }

    if (errors.length > 0) {
        res.render('/add', {
            errors: errors,
            title: req.body.title,
            details: req.body.details,
            type: req.body.type
        });
    } else {
        const newExamTemplate = {
            title: req.body.title,
            details: req.body.details,
            type: req.body.type,
            user: req.user.id,
            questions : []
        };
        new ExamTemplate(newExamTemplate)
            .save()
            .then(examtemplate => {
                req.flash('success_msg', 'Exam Added, Go add questions.');
                res.redirect('/examtemplate');
            })
    }
});

// Add ExamTemplate Question Form
router.get('/:id/addquestion', ensureAuthenticated, (req, res) => {
    res.render('examtemplate/addquestion', { id : req.params.id});
});

// Add ExamTemplate Question
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
        res.render('examtemplate/addquestion', { errors: errors, id : req.params.id});

    } else {
        req.body.correct.pop();
        req.body.incorrect.pop();
        const newQuestion = {
            header: req.body.header,
            correct: req.body.correct,
            incorrect: req.body.incorrect,
        };

        new Question(newQuestion)
            .save()
            .then(question => {
                ExamTemplate.findOne({
                    _id: req.params.id
                })
                    .then(examtemplate => {
                        if(examtemplate.user == req.user.id) {
                            examtemplate.questions.push(question);
                            examtemplate.save().then(examtemplate => {
                                req.flash('success_msg', 'Question Added');
                                res.redirect('/examtemplate/' + req.params.id + '/addquestion/');
                            })
                        }else{
                            req.flash('error_msg', 'Not Authorized');
                            res.redirect('/');
                        }
                    });
            });
    }
});


// View ExamTemplate
// Job Index Page
router.get('/', ensureAuthenticated, (req, res) => {
    ExamTemplate.find({'user': req.user.id})
        .populate('questions')
        .then(examtemplates => {
            res.render('examtemplate/index', {
                examtemplates: examtemplates
            });
        });
});


router.get('/view/:id/', ensureAuthenticated, (req, res) => {
    ExamTemplate.findOne({
        _id: req.params.id
    })
    .populate('questions')
    .then(examtemplate => {
        if (examtemplate.user != req.user.id) {
            req.flash('error_msg', 'Not Authorized');
            res.redirect('/');
        } else {
            res.render('examtemplate/view', {
                examtemplate: examtemplate
            });
        }
    });
});

module.exports = router;