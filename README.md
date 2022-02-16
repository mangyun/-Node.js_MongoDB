# MongoDB_WEP
- Node.js와 MongoDB를 이용해 DB에 저장되는 나만의 계획 웹사이트  
- 데이터베이스와 서버를 공부해본 김에, 간단하게 쓸만한 기능으로 만들어보았다.


<br>


## 주요 라이브러리
```js
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
```

<br>


## MongoDB 서버
- 밑그림은 마지막까지의 과정을 거쳐 남아있는 데이터베이스 상태이다.
![image](https://user-images.githubusercontent.com/88188850/154270183-9f352c0c-aed1-4a30-94d0-aa70ad860feb.png)

```js
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
```

<br>



## 각 주요 코드



### 1. 기본화면
![image](https://user-images.githubusercontent.com/88188850/154263029-511182e4-605d-4056-8d4a-14a7bc751312.png)

<br>


### 2. 계획 세우자!(계획작성)
![image](https://user-images.githubusercontent.com/88188850/154263387-3d922b31-5ad9-42d9-b95e-54f41ddd2e05.png)
```js
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
```

<br>



### 3. 하기는 할거지!(계획목록)
![image](https://user-images.githubusercontent.com/88188850/154263905-ec94f712-c8c7-444e-86d7-1537163be88d.png)
```js
//list로 get요청을 접속하면
//실제 db에 저장된 데이터들로 예쁘게 꾸며진 html을 보여줌
app.get('/list', function(요청, 응답){
  //DB에 저장된 post라는 collection안의 모든 데이터를 꺼내줌
  db.collection('post').find().toArray(function(에러, 결과){
    console.log(결과);
    응답.render('list.ejs', {posts : 결과});
  }); 
});
```

<br>



### 4. 수정기능(등산하기 -> 제주도 한라산 등반)
![image](https://user-images.githubusercontent.com/88188850/154264134-b6a115cf-c0f1-4f2e-8501-6a2686492920.png)
```js
$('.edit').click(function(e){
      window.location.href = '/edit/' + e.target.dataset.id;
    });

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
```

<br>


### 5. 삭제기능(제주도여행 삭제)
![image](https://user-images.githubusercontent.com/88188850/154264314-888b50e8-bc02-4246-94ed-717543399c40.png)
```js
$('.edit').click(function(e){
      window.location.href = '/edit/' + e.target.dataset.id;
    });

    $('.delete').click(function(e){ //클릭할때마다 ajax요청
      var 글번호 = e.target.dataset.id //현재 내가 누른 e.target의 dataset.id를 가져옴
      var 지금누른거 = $(this); //지금 이벤트가 동작하는 곳, 보통은 위의 e.target 비슷함

      $.ajax({
        method : 'DELETE',
        url : '/delete',
        data : {_id : 글번호}
      }).done(function(결과){
        //server.js에서 200을 응답해 ajax요청이 성공하면, <li>요소를 안보이게 제거해주기
        지금누른거.parent('li').fadeOut(); //지금누른거의 부모중 li를 서서히 사라지게함
        
      }).fail(function(xhr, textStatus, errorThrown){ //server.js에서 400이나 500을 응답해 실패시, 실행
        console.log(xhr, textStatus, errorThrown);
      })
    });

//ajax요청으로 삭제처리
app.delete('/delete', function(요청, 응답){
  요청.body._id = parseInt(요청.body._id); //현재 ajax요청으로 int를 보냈지만 여기서 string으로 변환되었기 때문에, 다시 int로 바꿔줘야함

  db.collection('post').deleteOne(요청.body, function(에러, 결과){//요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해줌.
      응답.status(200).send({ message : '성공했습니다' }); //ajax가 실행되려면 꼭 필요한 응답. 서버가 요청을 성공했다는 의미, 고객잘못 실패는 400, 서버문제 실패는 500
  }) 
})
```

<br>


### 6. 검색기능(제주)
![image](https://user-images.githubusercontent.com/88188850/154264407-1a6d4d29-3f56-4005-b1d9-1a4f2b9e26c7.png)
```js
$('#search').click(function(){
      var 입력한값 = $('#search-input').val();
      window.location.replace('/search?value=' + 입력한값)
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
```































