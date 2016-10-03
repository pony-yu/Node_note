/**
 * Created by pony on 16-10-3.
 */
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');//用于解析请求体
const crypto = require('crypto');//用于加密

const mongoose = require('mongoose');
const models = require('./models/models');
const session=require('express-session');
const MongoStore=require('connect-mongo')(session);
const checkLogin=require('./checkLogin');




//连接数据库
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error', console.error.bind(console, '连接数据库失败'));

// 生成一个express实例
var app = express();

var User = models.User;
var Note = models.Note;
app.use(session({
    key:'session',
    secret:'Keboard cat ponyyu',
    cookie:{maxAge:1000*60*10},
    store:new MongoStore({db:'notes',mongooseConnection:mongoose.connection}),
    resave:false,
    saveUninitialized:true
}));

// 设置视图文件存放目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎
app.set('view engine', 'ejs');
// 设置静态文件存放目录
app.use(express.static(path.join(__dirname, 'public')));
//解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//首页路由,笔记列表
app.get('/',checkLogin.noLogin);
app.get('/', function (req, res) {
    Note.find({author:req.session.user.username}).exec(function (err, arts) {
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        res.render('index',{
            title:'笔记列表',
            user:req.session.user,
            arts:arts,
            // moment:moment
        });
    });
});
//注册路由,首先验证是否已经登录
app.get('/',checkLogin.login);
app.get('/reg', function (req, res) {
    res.render('register', {
        title: '注册',
        user: req.session.user,
        page: 'reg'
    });
});
app.post('/reg', function (req, res) {
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;

    if (password != passwordRepeat) {
        console.log('两次输入的密码不一致！');
        return res.redirect('/reg');
    }
    User.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.redirect('/reg');
        }
        if (user) {
            console.log('用户已经存在');
            return res.redirect('/reg');
        }

        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');
        var newUser = new User({
            username: username,
            password: md5password
        });

        newUser.save(function (err, doc) {
            if (err) {
                console.log(err);
                return res.redirect('/reg');

            }
            console.log('注册成功');
            newUser.password = null;
            delete  newUser.password;
            req.session.user = newUser;

            return res.redirect('/');
        });
    });

});
//登录，首先验证是否登录
app.get('/',checkLogin.login);
app.get('/login', function (req, res) {
    res.render('login', {
        title: '登录',
        user: req.session.user,
        page: 'login'
    });
});

app.post('/login', function (req, res) {
    var username = req.body.username,
        password = req.body.password;
//查看用户是否存在
    User.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return next(err);
        }
        if (!user) {
            console.log('用户不存在！');
            return res.redirect('/login');
        }
        //对密码进行md5加密，然后与数据库中的密码字段进行比较
        var md5 = crypto.createHash('md5'),
            md5password = md5.update(password).digest('hex');
        if (user.password !== md5password) {
            console.log('密码错误！');
            return res.redirect('/login');
        }
        console.log('登录成功！');
        user.password = null;
        delete user.password;
        req.session.user = user;
        return res.redirect('/');
    });
});
//退出登录
app.get('/quit', function (req, res) {
    console.log('退出成功');
    //删除session中的user字段实现退出
    req.session.user=null;
    return res.redirect('/login');
});
//发布文章
app.get('/',checkLogin.noLogin);
app.get('/post', function (req, res) {
    res.render('post', {title: '发布',user:req.session.user});
});
app.post('/post', function (req, res) {
    var note=new Note({
        title:req.body.title,
        author:req.session.user.username,
        tag:req.body.tag,
        content:req.body.content
    });

    note.save(function (err,doc)
    {
        if(err){
            console.log(err);
            return res.redirect('/post');
        }
        console.log('文章发表成功');
        return res.redirect('/');
    });

});
//笔记详情
app.get('/',checkLogin.noLogin);
app.get('/detail/:_id', function (req, res) {
    Note.findOne({_id:req.params._id}).exec(function (err, art) {
        if (err){
            console.log(err);
            return res.redirect('/');
        }
        if(art){
            res.render('detail',{
                title:'笔记详情',
                user:req.session.user,
                art:art
                // moment:moment
            });
        }
    });
});


app.listen(3000, function (req, res) {
    console.log('app is running at port 3000');
});
