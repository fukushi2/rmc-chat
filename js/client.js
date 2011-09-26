$(document).ready(function(){
  var area = $("#user");
  area.hide();
 
  
  var socket = io.connect('http://testfuku.no.de');
  
  var mytweet = $("#my");
  var myname = "";
  var mycolor = "cola";
  
  //ユーザのテーマカラー
  $(".box").each(function(){
    $(this).click(function(){
    $(".box").removeClass("clicked");
    $(this).addClass("clicked");
        mycolor = $(this).attr("data-color");
      })
    });
  
  //参加
  function letsJoin(){
    $('<p>'+myname+'さん</p>').insertAfter($("#mybox"));
    socket.emit('join',{"nam":myname,"col":mycolor});
    $("#loading_text").html("<p>読込み中...</p>");
    $("#nick_btn").hide();
    $("#nick").hide();
    $("#colorful").hide();
    $("#mybox").addClass(mycolor);
  }

  //ニックネームを入れて新規参加
  $("#nick_btn").click(function(){
    var _text = $("#nick").val();
    if (util.isBlank(_text)) return;
    myname = util.toStaticHTML(_text);
    letsJoin();
  });
  

  //joinのレスポンス(ここから利用開始)
  socket.on('first_connection', function (msg) {
    //console.log("first:"+msg);
    socket.emit('first', "ababa-");
    $("#before_join").hide();
    area.fadeIn();
    $("#use_canvas").hide();
  });
  
  //ラジオボタン
  $('input[name="rdo"]:radio').change(function() {  
    if($(this).val() == "r2"){
      $("#use_canvas").show();
      $("#use_tw").hide();
    }else{
      $("#use_canvas").hide();
      $("#use_tw").show();
    }
  });
  
  
  //使わない
  socket.on('message', function (msg) {});
  
  //接続が切れた
  socket.on('disconnect', function () {
    socket.emit('disconnect', "user-end");
    $("#tweet").hide();
    $("#tw_btn").hide();
    $("<p class='text-red'>接続が切れました</p>").insertAfter(mytweet);
    $("#reload_text").show();
  });
  
  //ツイート
  $("#tw_btn").click(function(){
    var _text = $("#tweet").val();
    if (util.isBlank(_text)) return;
    var _t = util.toStaticHTML(_text);
    $("<p>"+_t+"<br><span class='time'>"+ util.timeString(new Date)+"</span></p>").insertAfter(mytweet);
    $("#tweet").val('');
    socket.emit('tweet',_t);
  });
  

  //キャンバス投稿ボタン
  $("#can_btn").click(function(){
    var data = addImageData();
    if( data != ""){
      clearCanvas();
      socket.emit('oekaki',data);
      var _id = "i_"+ Math.round(Math.random()*1E9);
      $("<p><img id="+ _id +" /><br><span class='time'>"+ util.timeString(new Date)+"</span></p>").insertAfter(mytweet);
      $(("#"+_id)).attr("src",data);
    }else{
      alert("投稿できる画像がありません");
    }
  });
  
  //キャンバスクリアボタン
  $("#can_clear_btn").click(function(){
    clearCanvas();
  });
  

  //再接続ボタン
  $("#reload_btn").click(function(){
    location.reload();
  });
  
  
});//$(ready)

//canvas描画
var can;	//キャンバス
var ctx;
var mouseX = new Array();
var mouseY = new Array();
var mouseDownFlag = false;	//マウスダウンフラグ
var lineL = 3;	//線の太さ
var touchCount = 0;
window.addEventListener("load", initcanvas ,true);
function initcanvas(){
  can = document.getElementById("mycanvas");
  ctx = can.getContext('2d');
	can.addEventListener("mousedown", mouseDownListner, false);
	can.addEventListener("mousemove", mouseMoveListner, false);
	can.addEventListener("mouseup",   mouseUpListner, false);
	can.addEventListener("mouseout",  mouseOutListner, false);
	
	can.addEventListener("touchstart", mouseDownListner, false);
	can.addEventListener("touchmove",  mouseMoveListner, false);
	can.addEventListener("touchend",   mouseUpListner, false);
	can.addEventListener("touchcancel", mouseOutListner, false);
}
function mouseDownListner(e) {
	mouseDownFlag = true;
}
function mouseMoveListner(e) {
	if (mouseDownFlag) {
		//縦スクロールをしない（iPad & iPhone）
		e.preventDefault();
		//座標調整
		adjustXY(e);
		//円を描く
		for (i = 0; i < mouseX.length; i++) {
			ctx.beginPath();
			ctx.fillStyle = "#333333";
			ctx.arc(mouseX[i], mouseY[i], lineL , 0, Math.PI * 2, false);
			ctx.fill();
		}
	}
}
function mouseUpListner(e) {
	mouseDownFlag = false;
}
function mouseOutListner(e) {
	mouseDownFlag = false;
}
//座標調整
function adjustXY(e) {
	var rect = e.target.getBoundingClientRect();
	//配列クリア
	mouseX.splice(0, mouseX.length);
	mouseY.splice(0, mouseY.length);
	//ユーザーエージェント
	var isiPad = navigator.userAgent.match(/iPad/i) != null;
	var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
	//座標取得
	if (isiPad || isiPhone) {
		//iPad & iPhone用処理
		for (i = 0; i < 5; i++) {
			if (event.touches[i]) {
				mouseX[i] = e.touches[i].pageX - rect.left;
				mouseY[i] = e.touches[i].pageY - rect.top;
			}
		}
	} else {
		//PC用処理
		mouseX[0] = e.clientX - rect.left;
		mouseY[0] = e.clientY - rect.top;
	}
}
//画像変換
function addImageData() {
	try {
		var img_png_src = can.toDataURL();
		return img_png_src;
	} catch(e) {
		alert("このブラウザでは対応できません");
		return "";
	}
}
//クリアキャンバス
function clearCanvas(){
  ctx.clearRect(0, 0, 480, 120);
}
