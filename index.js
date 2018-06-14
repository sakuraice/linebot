const linebot = require('linebot');//引包
const express = require('express');
var firebase = require('firebase');

//firebase的設定
var config = {
    apiKey: "AIzaSyAxzdilvqZCVXdPjAMnnQzTLyCvvFntmlk",
    authDomain: "fishfirebase.firebaseapp.com",
    databaseURL: "https://fishfirebase.firebaseio.com",
    projectId: "fishfirebase",
    storageBucket: "fishfirebase.appspot.com",
    messagingSenderId: "180099572080"
  };
//firebase
firebase.initializeApp(config);
var database = firebase.database();
//var storage = firebase.storage();

//linebot的設定，需要下面三個才能使用linebot
const bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

const app = express();
const linebotParser = bot.parser();
//首頁的get方法，開啟首頁會看到Hello World
app.get('/',function(req,res){
	res.send('Hello World');
});
//upload頁面的get，呼叫/public/index.html檔案
app.get('/upload', function (req,res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.post('/linewebhook', linebotParser);//這裡linebot只寫了post而沒有寫get是因為linebot只需要做服務調用，而不是一個網頁

bot.on('message', function (event) {//linebot的接收訊息方法，event是回傳的值，可以用event.message.type來判斷傳來的訊息是什麼型態
	switch (event.message.type){
		case 'text' ://判斷是text型態
			var setname = '/setname';//這裡是指令的宣告，/setname是使用者輸入的指令
			var setprofession = '/setprofession';//同上
			var message = event.message.text;//這裡接收到text的主要訊息(文字)
			var add = "add";//同上指令的宣告
			var order = "order";//同上指令的宣告
			var research = 0;//旗標，判斷是否有重複的指令

			
			if(message.search(setname) != -1){//如果有找到這段指令
				event.source.profile().then(function (profile) {//對firebases內的資料做更新
				var name = message.substring(setname.length +1 , message.length);
				var ref = database.ref('/user/' + profile.userId);
				var firebasevalue = {
                           		userId: profile.userId,
                           		userName: name,
                        	};
				ref.update(firebasevalue);
				event.reply(name + '名字設定好了');//event.reply()是linebot回覆的方法
				});
				break;
			}else if(message.search(setprofession)!= -1){//如果有找到這段指令
				event.source.profile().then(function (profile) {
				var profession = message.substring(setprofession.length +1 , message.length);
				var ref = database.ref('/user/' + profile.userId);
				var firebasevalue = {
                           		userId: profile.userId,
                           		profession: profession,
                        	};
				ref.update(firebasevalue);
				event.reply(profession + '職業設定好了');
				});
				break;
			}else if (message.search(add) !=-1 && message.search(order)!= -1){//手動新增指令，可以讓使用者自己增加指令
            	var ref = database.ref('/order/');
            	var addOrder = message.substring(message.search(add) + add.length +1 , message.search(order) -1);//擷取add後面，order前面的字串
            	var addAnswer = message.substring(message.search(order) + order.length + 1, message.length);//擷取order後面的字串直到結尾
            	if (addAnswer.trim() === ''  || addOrder.trim() === '' || message.search(order) - message.search(add) < 0){//如果接收到的資料中有空，則會回傳看不懂
            		event.reply('你說的 ' + message + ' 我看不懂，請說人話');
				} else {//如果都不是空的
                    var lineOrder = {
                        order: addOrder,
                        answer: addAnswer,
                    };
                    ref.on('value', gotData);
                    function gotData(snap) {
                        var data = snap.val();
                        var keys = Object.keys(data);
                        for (var i = 0; i < keys.length; i++) {//先用迴圈跑完所有指令，看有沒有相同的指令
                            var k = keys[i];
                            if (addOrder === data[k].order) {
                                research = 1;//有相同指令就改變旗標，然後跳出迴圈
                                break;
                            }
                        }
                    }
                    if (research===1){
                        event.reply('有重複指令，請重新命名指令');
					} else {
                        ref.push(lineOrder);
                        event.reply('你新增的指令是：' + addOrder + "\n你新增的回覆是：" + addAnswer);
                        break;//這裡的break是防止程式繼續執行到下面的defult
					}
                }
        	}else {

			}
        	
			switch (event.message.text){
				case '/userid' :
					event.source.profile().then(function(profile){
						return event.reply(profile.userId);
					});
					break;
				case '/username' :
					event.source.profile().then(function(profile){
						return event.reply(profile.displayName);
					});
					break;
				case 'order' : 
					event.reply('指令:' + '\n/userid' + '\n/username' + '\norder' + '\nsignup' + '\nimage' + '\nmusic' + '\nupload' + '\nimage_DragonNest1' + '\n新增的指令' + '\n新增指令範例：\nadd 指令 order 回覆');
					break;
				case 'signup':
					event.source.profile().then(function (profile) {
						var ref = database.ref('/user');
						var value = {
							userId: profile.userId,
							profession: '尚未設定',
							LineName: profile.displayName,
							userName: '尚未設定'
						};
						ref.push(value);
					return event.reply('初始化完成，接下去設定職業與名稱' + '\n 指令為 : ' + '\n /setprofession 職業名稱' + '\n /setname 名字' + '\n profile');
					});
					break;
				case 'profile' :
					event.source.profile().then(function(profile){
						var ref = database.ref('/user/' +profile.userId );
						ref.once('value',function(snapshot){
							return event.reply('Profile : ' + '\n profession : ' +snapshot.val().profession + '\n userName : ' + snapshot.val().userName);
						});
					});
					break;
				case 'image' :
					return event.reply({
					type: 'image',
					originalContentUrl: 'https://firebasestorage.googleapis.com/v0/b/fishfirebase.appspot.com/o/test%2F%E6%9C%AA%E5%91%BD%E5%90%8D.jpg?alt=media&token=42094ccf-614b-479d-ab81-3d7f7a0d056e',
					previewImageUrl: 'https://firebasestorage.googleapis.com/v0/b/fishfirebase.appspot.com/o/test%2F%E6%9C%AA%E5%91%BD%E5%90%8D.jpg?alt=media&token=42094ccf-614b-479d-ab81-3d7f7a0d056e'
					});
					break;
				case 'image_DragonNest1' :
					return event.reply({
					type: 'image',
					originalContentUrl: 'https://drive.google.com/file/d/0B5kIgJG6-IgNX1dNZ3VMZXNOQjg/view',
					previewImageUrl: 'https://drive.google.com/file/d/0B5kIgJG6-IgNX1dNZ3VMZXNOQjg/view'
					});
					break;
				case 'music':
					return event.reply({
					type: 'audio',
					originalContentUrl: 'https://firebasestorage.googleapis.com/v0/b/fishfirebase.appspot.com/o/test%2F03.%E3%82%B3%E3%83%88%E3%83%80%E3%83%9E%E7%B4%AC%E3%81%90%E6%9C%AA%E6%9D%A5.mp3?alt=media&token=bfccdba8-860b-44df-9a7c-766c9a7e1fd7',
					duration: 330000
					});
					break;
				case '妹妹' :
					event.reply('抱歉，你搜尋不到這個詞');
					break;
				case 'upload':
					event.source.profile().then(function(profile){
                        var ref = database.ref('/storage');
                        ref.on('value',gotData);
                        function gotData(snap) {
                            var data = snap.val();
                            var keys = Object.keys(data);
                            var string = '上傳頁面：https://webapiforline3.herokuapp.com/upload \n';
                            for (var i = 0;i<keys.length;i++) {
                                var k = keys[i];
                                var DataDownloadUrl = data[k].DataDownloadUrl;
                                var DataName = data[k].DataName;
                                string += DataName + "\n" + DataDownloadUrl + "\n";
                            }
                            event.reply(string);
                        }
					});
					break;
				case '新增的指令' :
					var ref = database.ref('/order');
					ref.on('value',function(snapshot){
						var data = snapshot.val();
						var keys = Object.keys(data);
						var orderList = '';
						for (var i = 0;i<keys.length;i++){
							var k = keys[i];
							orderList += data[k].order + '\n';
						}
						event.reply(orderList);
					});
					break;
                default:
                	//手動新增回覆指令
                	var ref = database.ref('/order');
                	var ans = '';//儲存回覆的指令
                	var a = 0;//旗標，判斷資料庫是否有這條指令
                    ref.on('value',function(snap){
                    	var data = snap.val();
                    	var keys = Object.keys(data);
                    	for (var i = 0;i<keys.length;i++){
                    		var k = keys[i];
                    		if (message === data[k].order){//判斷使用者輸入的文字是否有在資料庫中
                    			a = 1;//有的情況
                    			ans = data[k].answer;//將回覆存在ans中
                    			break;//找到相應的指令就跳出迴圈
							}
						}
						if (a==1){//有指令->回覆
                            event.reply(ans);
						} else {//沒指令->預設回覆
                    		event.reply('你說的 ' + message + ' 我看不懂，請說人話oh');
						}
					});
					break;
			}
			
			break;
		case 'sticker' :
			event.reply({
				type: 'sticker',
				packageId: 1,
				stickerId: 1
			});
			break;
		case 'image' :
			//var ref = storage.ref('/linebot');
			//var refchild = ref.child('text.jpg');
			//refchild.put(event.message.image).then(function(snapshot){
			//	event.reply(snapshot.downloadurl);
            //});
            event.reply('傳一個圖片給我幹啥');
			break;
		default:
			event.reply('Unknow message');
			break;
	}
	//event.reply(event.message.text).then(function (data) {
	//	console.log('Success', data);
	//}).catch(function (error) {
	//	console.log('Error', error);
	//});
});

app.listen(process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
