var baseUrl = "http://127.0.0.1:3000";
var usermail;
var pw;

var doSignUp = function() {
	var name = $("#name").val();
	usermail = $("#usermail").val();
	pw = $("#pw").val();

	$.ajax({
		type : 'post',
		url : baseUrl + 'user/signin',
		data : {
			usermail : usermail,
			pw : pw,
		},
		success : function() {
			alert("OK");
			// location.href = "login.html";
		},
		error : function(msg) {
			alert("Error!");
			// console.log(msg.responseText);
		},
	});
};

var doSignIn = function() {
	usermail = $("#usermail").val();
	pw = $("#pw").val();

	loginstring = "Basic " + B64.encode(usermail + ":" + pw);

	$.ajax({
		type : 'post',
		url : baseUrl + 'users/signin',
		data : {
			usermail : usermail,
			pw : pw,
		},
		beforeSend : function(req) {
			req.setRequestHeader('Authorization', loginstring);
		},
		success : function(data) {
			alert("Login Success");
			setLoginString();
			// window.location = "timeline.html";
		},
		error : function() {
			alert("Error!");
		},
	});
};


var doSignOut = function() {
	$.ajax({
		type : 'get',
		url : baseUrl + '/user/signout',
		success : function(msg) {
			alert("OK");
			// location.href = "login.html";
		},
		error : function(msg) {
			alert("Error!");
			// console.log(msg.responseText);
		},
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
