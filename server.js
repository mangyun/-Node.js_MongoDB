const express = require('express'); //express 라이브러리 참조
const app = express();
app.use(express.urlencoded({//요청 데이터 해석을 쉽게 도와줌
  extended: true
})) 
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override') //method-override 라이브러리 참조
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
app.use('/public', express.static('public'))//static파일을 보관하기위해 public폴더를 쓴다는 것을 암시

var db;
MongoClient.connect('mongodb+srv://qk1890:qwer1234@cluster0.yt3tq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function (에러, client) {
  //연결되면 할 일
  if (에러) return console.log(에러)

  db = client.db('todoapp');//todoapp이라는 db에 연결

  // db.collection('post').insertOne({이름 : 'john', _id : 20}, function(에러, 결과){//데이터 저장
  //   console.log('저장완료');
  // });

  app.listen(8080, function () { //8080포트로 연결
    console.log('listening on 8080');
  });
  
 
});


app.get('/', function (요청, 응답) { //메인 사이트 이동
  응답.render('index.ejs');
});

app.get('/write', function (요청, 응답) { //write 사이트로 이동
  응답.render('write.ejs');
});

//post 요청
app.post('/add', function (요청, 응답) {
  응답.redirect('/list') //수정되면 바로 redirect로 응답

  //counter에서 name이 게시물갯수인것을 찾아줌
  db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과){
    var 총게시물갯수 = 결과.totalPost; //가져온갯수를 변수로 할당

     //db에 저장
    db.collection('post').insertOne({ _id : 총게시물갯수 + 1, 제목 : 요청.body.title, 날짜 : 요청.body.date}, function(에러, 결과){//데이터 저장
      console.log('저장완료');

      //counter라는 콜렉션에 있는 totalPost라는 항목도 1 증가시켜야함. 하나만 업데이트, 여러개 하려면 updateMany()
      db.collection('counter').updateOne({name: '게시물갯수'}, { $inc : {totalPost:1} }, function(에러, 결과){//값을 수정할때는 $inc같은 operator를 이용해야함. 이건 1 증가이고, 다른 여러종류가 있음 
        if (에러) return console.log(에러)
      }); 
    });
  }); 
});

//list로 get요청을 접속하면
//실제 db에 저장된 데이터들로 예쁘게 꾸며진 html을 보여줌
app.get('/list', function(요청, 응답){
  //DB에 저장된 post라는 collection안의 모든 데이터를 꺼내줌
  db.collection('post').find().toArray(function(에러, 결과){
    console.log(결과);
    응답.render('list.ejs', {posts : 결과});
  }); 
});



//검색
app.get('/search', (요청, 응답)=>{

  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: 요청.query.value,
          path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    }
  ] 
  console.log(요청.query);
  db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
    console.log(결과)
    응답.render('search.ejs', {posts : 결과})
  })
})




//ajax요청으로 삭제처리
app.delete('/delete', function(요청, 응답){
  요청.body._id = parseInt(요청.body._id); //현재 ajax요청으로 int를 보냈지만 여기서 string으로 변환되었기 때문에, 다시 int로 바꿔줘야함

  db.collection('post').deleteOne(요청.body, function(에러, 결과){//요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해줌.
      응답.status(200).send({ message : '성공했습니다' }); //ajax가 실행되려면 꼭 필요한 응답. 서버가 요청을 성공했다는 의미, 고객잘못 실패는 400, 서버문제 실패는 500
  }) 
})

// detail/번호 요청을 하면 해딩상세페이지를 보여줌
app.get('/detail/:id', function(요청, 응답){ //어떤사람이 detail/번호 페이지에 접속하면
  db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){//db에서 해당 _id번호 게시물을 찾음
    응답.render('detail.ejs', { data : 결과 }) //그 결과를 detail.ejs로 보냄
  })
})

// edit/번호 해당 수정페이지 보여줌
app.get('/edit/:id', function(요청, 응답){
  db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러, 결과){
    응답.render('edit.ejs', { post : 결과 })
  })
})

app.put('/edit', function(요청, 응답){
  // edit.ejs 폼에담긴 제목, 날짜데이터를 가지고, db.collection에 업데이트함
  db.collection('post').updateOne({ _id : parseInt(요청.body.id)}, { $set : { 제목 : 요청.body.title, 날짜 : 요청.body.date }}, function(에러, 결과){
    응답.redirect('/list') //수정되면 바로 redirect로 응답
  })
})










//로그인을 위한 라이브러리 각각 첨부
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 


app.get('/login', function(요청, 응답){
  응답.render('login.ejs')
})

app.post('/login', passport.authenticate('local', { //로그인을 하면 아이디 비번 검사를 쉽게 해줌
  failureRedirect : '/fail' //로그인을 실패하면 이동
}), function(요청, 응답){ 
  응답.redirect('/')
})


//로그인해야 들어갈 수 있는 마이페이지
app.get('/mypage', 로그인했니, function (요청, 응답) { 
  응답.render('mypage.ejs', {}) 
}) 

function 로그인했니(요청, 응답, next) { 
  if (요청.user) { //아래의 passport.deserializeUser에서 가져온 결과 값
    next() //유저가 있으면 통과
  } 
  else { //없으면 로그인이 안된것임
    응답.send('로그인안하셨는데요?') 
  } 
} 












//주 기능인, 아이디 비번 검사
passport.use(new LocalStrategy({
  usernameField: 'id', //여기는 사용자가 제출한 아이디가 어디 적혔는지
  passwordField: 'pw', //여기는 사용자가 제출한 비번이 어디 적혔는지
  session: true, //여기는 세션을 만들건지
  passReqToCallback: false, //여기는 아이디/비번말고 다른 정보검사가 필요한지
}, function (입력한아이디, 입력한비번, done) { //아이디, 비번이 맞는지 db와 비교
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러) //에러 처리

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' }) //아이디가 없으면 실행
    if (입력한비번 == 결과.pw) {//아이디가 있으면, 비번비교
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));


//로그인 성공시에, 로그인 세션 저장
passport.serializeUser(function (user, done) {
  done(null, user.id)
});

//로그인한 유저의 세션아이디를 바탕으로, db에서 개인정보를 찾아줌
passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({id : 아이디}, function(에러, 결과){
    done(null, 결과) //이 결과는 요청.user에 저장됨
  })
}); 