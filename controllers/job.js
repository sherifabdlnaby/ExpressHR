const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');

// Load Job Model
require('../models/job');
const Job = mongoose.model('job');

// Job Index Page
router.get('/', ensureAuthenticated, (req, res) => {
  Job.find({user: req.user.id})
    .sort({createdAt:'desc'})
    .then(jobs => {
      res.render('job/index', {
        jobs:jobs
      });
    });
});

// Add Job Form
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('job/add');
});

// Edit Job Form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Job.findOne({
    _id: req.params.id
  })
  .then(job => {
    if(job.user != req.user.id){
      req.flash('error_msg', 'Not Authorized');
      res.redirect('/job');
    } else {
      res.render('job/edit', {
        job:job
      });
    }
    
  });
});

// Process Form
router.post('/', ensureAuthenticated, (req, res) => {
  let errors = [];

  if(!req.body.title){
    errors.push({text:'Please add a title'});
  }
  if(!req.body.details){
    errors.push({text:'Please add some details'});
  }

  if(errors.length > 0){
    res.render('/add', {
      errors: errors,
      title: req.body.title,
      details: req.body.details
    });
  } else {
    const newJob = {
      title: req.body.title,
      details: req.body.details,
      user: req.user.id,

    }
    new Job(newJob)
      .save()
      .then(job => {
        req.flash('success_msg', 'Video job added');
        res.redirect('/job');
      })
  }
});

// Edit Form process
router.put('/:id', ensureAuthenticated, (req, res) => {
  Job.findOne({
    _id: req.params.id
  })
  .then(job => {
    // new values
    job.title = req.body.title;
    job.details = req.body.details;

    job.save()
      .then(job => {
        req.flash('success_msg', 'Video job updated');
        res.redirect('/job');
      })
  });
});

// Delete Job
router.delete('/:id', ensureAuthenticated, (req, res) => {
  Job.remove({_id: req.params.id})
    .then(() => {
      req.flash('success_msg', 'Video job removed');
      res.redirect('/job');
    });
});

module.exports = router;