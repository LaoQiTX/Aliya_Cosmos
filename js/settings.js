// 点击Settings按钮
$("#settings").on("tap", function() {
	$("#settingspop").css('display', 'flex')
})

// 从本地存储获取已保存的用户名
const savedUsername = localStorage.getItem('AliyaCalledMe');
if (savedUsername) {
	$('#username').val(savedUsername);
}

function saveUsername() {
	var username = document.getElementById('username').value.trim();
	if (username) {
		localStorage.setItem('AliyaCalledMe', username);
		closeModal();
		alert('用户名已保存！');
		location.reload()
	} else {
		alert('请输入有效的用户名');
	}
}

if (localStorage.getItem("conversation_id") == null) {
	localStorage.setItem("conversation_id", "")
}
