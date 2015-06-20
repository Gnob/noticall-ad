var baseUrl = "http://127.0.0.1:3000/";

var doSignIn = function() {
	var name = $("#name").val();
	var usermail = $("#usermail").val();
	var pw = $("#pw").val();

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
