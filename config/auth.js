module.exports = {
  ensureAuthenticated: function(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    req.flash('error_msg', 'Not Authorized');
    req.session.returnTo = req.originalUrl;
    res.redirect('/users/login');
  }
}