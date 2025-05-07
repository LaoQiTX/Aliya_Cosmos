import $ from 'jquery'
// 关闭窗口功能
function closeWindow() {
	$('#operationModal').css("display", "none")
	window.close();
}

export{closeWindow}