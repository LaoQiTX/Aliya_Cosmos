// 初始化连接功能
function initConnection() {
	localStorage.removeItem("conversation_id");
	localStorage.removeItem("AliyaCalledMe")
	alert("连接已初始化！");
	document.getElementById('operationModal').style.display = 'none';
}

// 关闭配置URL窗口功能
function closeWindow_URL() {
	$("#settingURL").css("display", "none")
}


// Operation
// 显示/隐藏模态框
document.getElementById('Operation').addEventListener('click', function(e) {
	e.stopPropagation();
	document.getElementById('operationModal').style.display = 'flex';
});

// 点击遮罩层关闭
document.querySelector('#operationModal').addEventListener('click', function(e) {
	if (e.target === this) {
		this.style.display = 'none';
	}
});
