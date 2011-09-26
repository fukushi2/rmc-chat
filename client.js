$(document).ready(function(){
  var area = $("#show");
  area.hide();
  
  var mytweet = $("#my");

  var socket = io.connect('http://testfuku.no.de');

  socket.on('first_connection', function (msg) {
    //console.log("first:"+msg);
    socket.emit('first', "ababa-");
    $("#before_join").hide();
    area.show();
  });
  
  socket.on('message', function (msg) {
    //console.log(msg);
    var _ = mytweet.html();
    mytweet.html(_+"<p>"+msg+"</p>");
  });
  
  socket.on('disconnect', function () {
    area.html('接続が切れました');
  });
  
  //ニックネームを入れて新規参加
  $("#nick_btn").click(function(){
    var _text = $("#nick").val();
    if (util.isBlank(_text)) return;
    $(this).attr("disabled","disabled");
    var _t = util.toStaticHTML(_text);
    $("#nickname").html('<p>'+_t+'さん</p>');
    socket.emit('join',_t);
  });
  
  //ツイート
  $("#tw_btn").click(function(){
    var _text = $("#tweet").val();
    if (util.isBlank(_text)) return;
    var _t = util.toStaticHTML(_text);
    var my = mytweet.html();
    mytweet.html(my + "<p>"+_t+"</p>");
    $("#tweet").val('');
    socket.emit('tweet',_t);
  });
});

