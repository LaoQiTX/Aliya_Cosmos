// 设置url
function settingURL() {
	$("#settingURL").css("display", "flex");
}

// 保存url和key到浏览器
function saveKey() {
	var userURL = $("#userURL").val()
	var userKEY = $("#userKey").val()
	if (userURL !== null || userKEY !== null) {
		alert("保存成功！")
		console.log(userURL, userKEY)
		localStorage.setItem("Cosmos_userURL", userURL);
		localStorage.setItem("Cosmos_userKEY", userKEY);
	} else {
		alert("请输入URL和Key!若有不知道如何获取URL和Key可以看看文档！")
	}
}

// 将url放入输入框
if (localStorage.getItem("Cosmos_userURL") != null || localStorage.getItem("Cosmos_userKEY") != null) {
	$("#userURL").val(localStorage.getItem("Cosmos_userURL"));
	$("#userKey").val(localStorage.getItem("Cosmos_userKEY"));
}