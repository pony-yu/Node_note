/**
 * Created by pony on 16-10-3.
 */
//已经登录
function login(req, res, next) {
    if(req.session.user){
        console.log('已经登录！');
        return res.redirect('back');
    }
    next();
}
//未登录
function noLogin(req,res,next) {
    if(!req.session.user){
        console.log('未登录！！');
        return res.redirect('/login');

    }
    next();
}

exports.login=login;
exports.noLogin=noLogin;
