// 点击Settings按钮
$("#settings").on("tap", function() {
	$("#settingspop").css('display', 'flex')
})

// 从本地存储获取已保存的用户名
let savedUsername = localStorage.getItem('AliyaCalledMe');
if (savedUsername) {
	$('#username').val(savedUsername);
}

function saveUsername() {
	var username = document.getElementById('username').value.trim();
	if (username) {
		localStorage.setItem('AliyaCalledMe', username);
		closeModal();
		alert('用户名已保存！');
		savedUsername = localStorage.getItem('AliyaCalledMe');
		// location.reload()
	} else {
		alert('请输入有效的用户名');
	}
}

if (localStorage.getItem("conversation_id") == null) {
	localStorage.setItem("conversation_id", "")
}
function showInputDialog() {
    return new Promise(resolve => {
        const modal = document.getElementById('settingspop');
        modal.style.display = 'flex';

        document.getElementById("save-btn").onclick = function () {
            saveUsername();
			resolve(); 
			closeInputDialog();
        };
    });
}


function closeInputDialog() {
    return new Promise(resolve => {
        const modal = document.getElementById('settingspop');
        modal.style.display = 'none';
        setTimeout(resolve, 300); // 让动画有时间完成
    });
}
