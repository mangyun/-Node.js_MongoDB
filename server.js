const express = require('express'); //express 라이브러리 참조
const app = express();
app.use(express.urlencoded({
  extended: true
})) //요청 데이터 해석을 쉽게 도와줌
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

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
  응답.sendFile(__dirname + '/index.html');
});

app.get('/write', function (요청, 응답) { //write 사이트로 이동
  응답.sendFile(__dirname + '/write.html')
});

//post 요청
app.post('/add', function (요청, 응답) {
  응답.send('전송완료')
  //db에 저장
  db.collection('post').insertOne({제목 : 요청.body.title, 날짜 : 요청.body.date}, function(에러, 결과){//데이터 저장
    console.log('저장완료');
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