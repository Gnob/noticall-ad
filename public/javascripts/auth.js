var baseUrl = "http://127.0.0.1:8000/timeline/";
var username;
var password;
var loginstring;

var doJoin = function() {
	var name = $("#name").val();
	username = $("#username").val();
	password = $("#password").val();

	$.ajax({
		type : 'post',
		url : baseUrl + 'api/user/create/',
		data : {
			username : username,
			name : name,
			password : password
		},
		success : function() {
			alert("OK");
			location.href = "login.html";
		},
		error : function(msg) {
			alert("Error!");
			console.log(msg.responseText);
		},
	});
};

var goAdmin = function () {
	location.href = baseUrl + "admin/";
};


var doLogin = function() {
	username = $("#username").val();
	password = $("#password").val();

	loginstring = "Basic " + B64.encode(username + ":" + password);

	$.ajax({
		type : 'get',
		url : baseUrl + 'api/login/',
		beforeSend : function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success : function(data) {
			alert("Login Success");
			setLoginString();
			window.location = "timeline.html";
		},
		error : function() {
			alert("Error!");
		},
	});
};


var doWriteTimeline = function() {
	var msg = $("#writearea").val();
	if(msg == '') {
		alert('Must Input Message');
		return;
	}
	$.ajax({
		type: 'post',
		url: baseUrl + 'api/timeline/create/',
		data: {message:msg},
		beforeSend: function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function() {
			alert("OK");
			doReload();
		},
		error: function(msg) {
			alert("Fail to write data!\n" + msg.responseText);
		}
	});
};


var doGetTimeline = function() {
	$.ajax({
		type: 'get',
		url: baseUrl + 'api/timeline/',
		beforeSend: function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function(res) {
			for (var i in res.messages) {
				doAppend(res.messages[i]);
			}

			$("#total").html(res.total_count);
			$("#mine").html($('[name=deleteMsg]').length-1);
			$("#username").html(username);
			$("#writearea").val("");
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doAppend = function(data) {
	node = $("#msgTemplate").clone(true, true);

	$('.name', node).html(data.username);
	$('.content', node).append(data.message);
	$('.date', node).html(data.created);
	$('#likeCnt', node).append(data.liked+" ");
	if(data.isliked){
		$('#like', node)
			.off()
			.attr({
				value: data.id,
				id: "dislike",
				name: "dislike"
			})
			.on("click", doDislike)
			.children().attr("class", "glyphicon glyphicon-thumbs-down vertical-center-target");
	}
	else{
		$('#like', node).attr("value", data.id);
	}
	if(username == data.username)
		$('[name=deleteMsg]', node).attr("value", data.id);
	else
		$('[name=deleteMsg]', node).remove();

	node.show();

	$('#timelinearea').append(node);
};


var doReload = function() {
	doClear();
	doGetTimeline();
};


var doClear = function() {
	$("#timelinearea").html('');
};


var doDeleteMsg = function() {
	var id = $(this).val() + "/";

	$.ajax({
		type: 'post',
		url: baseUrl + 'api/timeline/' + id + 'delete/',
		beforeSend: function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function() {
			doReload();
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doSearchTimeline = function() {
	var search = $("#search").val();
	$.ajax({
		type: 'get',
		url: baseUrl + 'api/timeline/find/',
		data: {query:search},
		beforeSend: function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function(res) {
			doClear();
			for (var i in res.messages) {
				doAppend(res.messages[i]);
			}

			$("#total").html(res.total_count);
			$("#mine").html($('[name=deleteMsg]').length-1);
			$("#username").html(username);
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doLogout = function() {
	resetLoginString();
	window.location = "login.html";
};


var doLike = function() {
	var id = $(this).val() + '/';
	var self = $(this);

	$.ajax({
		type: 'post',
		url: baseUrl + 'api/timeline/' + id + 'like/',
		beforeSend: function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function() {
			var count = Number(self.prev().html());
			self.prev().html(count+1);
			self
				.off()
				.attr({
					id: "dislike",
					name: "dislike"
				})
				.on("click", doDislike)
				.children().attr("class", "glyphicon glyphicon-thumbs-down vertical-center-target");
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}

	});
};


var doDislike = function() {
	var id = $(this).val() + '/';
	var self = $(this);

	$.ajax({
		type: 'post',
		url: baseUrl + 'api/timeline/' + id + 'dislike/',
		beforeSend: function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function() {
			var count = Number(self.prev().html());
			self.prev().html(count-1);
			self
				.off()
				.attr({
					id: "like",
					name: "like"
				})
				.on("click", doLike)
				.children().attr("class", "glyphicon glyphicon-thumbs-up vertical-center-target");
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}

	});
};


var doGetUserInfo = function() {
	var username = $("div", this).html();
	$.ajax({
		type: 'get',
		url: baseUrl + 'api/user/profile/' + username,
		beforeSend: function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function(data) {
			$("#modalId").html(username);
			$("#modalNickname").html(data.nickname);
			$("#modalCountry").html(data.country);
			$("#modalUrl").html(data.url);
			$("#modalComment").html(data.comment);
			$("#msgModal").modal('show');
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doGetProfile = function() {
	$.ajax({
		type: 'get',
		url: baseUrl + 'api/user/profile/',
		beforeSend: function (req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function (data) {
			$("#bigid").html(data.username);
			$("#bignickname").html(data.nickname);
			$("#bigcomment").html(data.comment);
			$("#labelnickname").html(data.nickname);
			$("#labelcountry").html(data.country);
			$("#labelurl").html(data.url);
			$("#nickname").val(data.nickname);
			$("#country").val(data.country);
			$("#url").val(data.url);
			$("#comment").val(data.comment);
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doSetProfile = function() {
	var nickname = $("#nickname").val();
	var country = $("#country").val();
	var url = $("#url").val();
	var comment = $("#comment").val();

	$.ajax({
		type: 'post',
		url: baseUrl + 'api/user/profile/',
		data: {
			nickname: nickname,
			country: country,
			url: url,
			comment: comment,
		},
		beforeSend: function (req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function () {
			alert('Update Success');
			doGetProfile();
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doGetAccount = function() {
	$.ajax({
		type: 'get',
		url: baseUrl + 'api/user/profile/',
		beforeSend: function (req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function (data) {
			$("#username").val(data.username);
			doGetName();
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doGetName = function() {
	$.ajax({
		type: 'get',
		url: baseUrl + 'api/user/name/',
		beforeSend: function (req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success: function (data) {
			$("#name").val(data.name);
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};


var doSetName = function() {
	$.ajax({
		type: 'post',
		url: baseUrl + 'api/user/name/',
		beforeSend: function (req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		data: {
			name: $('#name').val(),
		},
		success: function (data) {
			alert('Success Change Name');
			doGetName();
		},
		error: function(res) {
			alert("Error!\n" + res.responseText);
		}
	});
};

// Utility Function

function setCookie(name, value, day) {
	var expire = new Date();
	expire.setDate(expire.getDate() + day);
	cookies = name + '=' + escape(value) + '; path=/ ';
	if (typeof day != 'undefined')
		cookies += ';expires=' + expire.toGMTString() + ';';
	document.cookie = cookies;
}

function getCookie(name) {
	name = name + '=';
	var cookieData = document.cookie;
	var start = cookieData.indexOf(name);
	var value = '';
	if (start != -1) {
		start += name.length;
		var end = cookieData.indexOf(';', start);
		if (end == -1)
			end = cookieData.length;
		value = cookieData.substring(start, end);
	}
	return unescape(value);
}

function getLoginString() {
	loginstring = getCookie("loginstring");
	username = getCookie("username");
}
function setLoginString() {
	setCookie("loginstring", loginstring, 1);
	setCookie("username", username, 1);
}
function resetLoginString() {
	setCookie("loginstring", "", -1);
	setCookie("username", "", -1);
}
function checkLoginString() {
	if (loginstring == "") {
		history.back();
	}
}
