var qiniu = require('qiniu');
var express = require('express');
var config = require('./config.js');
var bodyParser = require('body-parser');
var logger = require('morgan');
var crypto = require('crypto');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');// 首先引入 mongoose 这个模块
var app = express();

mongoose.connect('mongodb://localhost/classroom4');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
app.use(logger('dev'));//日记
app.use(bodyParser.json());//json分析
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());//cookie分析



//app.configure(function() {
    app.use(express.static(__dirname + '/'));
//});


app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

//app.use(express.urlencoded());
app.use('/bower_components', express.static(__dirname + '/../bower_components'));
app.use('/src', express.static(__dirname + '/../src'));

app.use(session({
  secret: 'myuser',
  key: 'user',//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  //通过设置 cookie 的 maxAge 值设定 cookie 的生存期，
  //这里我们设置 cookie 的生存期为 30 天
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    db: 'UserManage',
    host: 'localhost',
    port: 27017
  })
}));

var Cat = mongoose.model('Cat', {email: String, name: String, password:String});
var Admin = mongoose.model('admin', {
  name: String, 
  size: String, 
  link: String,
  url: String
});


/*
// 没有挂载路径的中间件，应用的每个请求都会执行该中间件
app.use(function (req, res, next) {
  console.log('Now Time:', Date.now());
  var email = "admin@gmail.com";
  var name = "admin";
  var md5 = crypto.createHash('md5');
  var password = md5.update("winssps..").digest('hex');
  Cat.findOne({email:email},function(err,user) {
    if(user) {
        console.log("用户已存在");
    }
    else {
        console.log("还未有任何用户");
        var kitty = new Cat({
            email : email,
            name : name,
            password: password
        });
        kitty.save(function(err) {
            console.log("第一个存入系统管理员账户");
        });     
    }
  });
  next();
});*/




app.get('/uptoken', function(req, res, next) {
    var token = uptoken.token();
    res.header("Cache-Control", "max-age=0, private, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    if (token) {
        res.json({
            uptoken: token
        });
    }
});

app.post('/downtoken', function(req, res) {

    var key = req.body.key,
        domain = req.body.domain;

    //trim 'http://'
    if (domain.indexOf('http://') != -1) {
        domain = domain.substr(7);
    }
    //trim 'https://'
    if (domain.indexOf('https://') != -1) {
        domain = domain.substr(8);
    }
    //trim '/' if the domain's last char is '/'
    if (domain.lastIndexOf('/') === domain.length - 1) {
        domain = domain.substr(0, domain.length - 1);
    }

    var baseUrl = qiniu.rs.makeBaseUrl(domain, key);
    var deadline = 3600 + Math.floor(Date.now() / 1000);

    baseUrl += '?e=' + deadline;
    var signature = qiniu.util.hmacSha1(baseUrl, config.SECRET_KEY);
    var encodedSign = qiniu.util.base64ToUrlSafe(signature);
    var downloadToken = config.ACCESS_KEY + ':' + encodedSign;

    if (downloadToken) {
        res.json({
            downtoken: downloadToken,
            url: baseUrl + '&token=' + downloadToken
        })
    }
});

app.get('/', function(req, res) {
    res.render('index.html', {
        domain: config.Domain,
        uptoken_url: config.Uptoken_Url,
        user: req.session.user
    });

});

app.get('/multiple', function(req, res) {
    res.render('multiple.html', {
        domain: config.Domain,
        uptoken_url: config.Uptoken_Url,
        user: req.session.user
    });
});

app.get('/userlogout', function(req, res) {
  req.session.user = null;
  res.redirect('/');//登陆成功后跳转到主页
});

app.get('/renlist', function(req, res) {//更新数据

    Admin.find({}, function(err,files) {
      res.send(files);
    });
});


app.post('/admin/user', function(req, res) {//登录数据

   var email = req.body.email;
  //生成密码的 md5 值
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('hex');
  //检查用户是否存在
  Cat.findOne({email:email}, function (err,user) {
      if (err) {
        console.log(err);
      }
      //检查密码是否一致
      if(user != null)
        if (user.password != password) {

      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
      res.redirect('/');//登陆成功后跳转到主页
    });
});

app.post('/fileMessage', function(req, res) {

    var filename = req.body.filename;
    var filesize = req.body.filesize;
    var filelink = req.body.link;
    var fileurl = req.body.url;

    var kitty = new Admin({
        name: filename,
        size: filesize,
        link: filelink,
        url: fileurl
    });
    kitty.save(function(err) {
            console.log("文件信息存入");
      Admin.find({}, function(err,files) {
          res.send(files);
        });
      });  
});


qiniu.conf.ACCESS_KEY = config.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.SECRET_KEY;

var uptoken = new qiniu.rs.PutPolicy(config.Bucket_Name);


app.listen(config.Port, function() {
    host = "127.0.0.1";
    console.log('Listening on http://%s:%s', host, config.Port);
});
