
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Adminion' });
};

exports.lobby = function(req, res){
  res.render('lobby', {title: 'Game Lobby | Adminion' });
};
