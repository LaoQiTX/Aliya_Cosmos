function sendPost(question) {
	var url = localStorage.getItem("Cosmos_userURL");
	var key = localStorage.getItem("Cosmos_userKEY");
	if (url == null || key == null) {
		alert("请配置好url和key！");
		return;
	}
	var tkey = `Bearer ${key}`;
	var username = localStorage.getItem("AliyaCalledMe");
	if (localStorage.getItem("conversation_id") == null) {
		conversation_id = "";
	} else {
		conversation_id = localStorage.getItem("conversation_id");
	}

	// console.log(username)
	// console.log(question)
	// console.log(conversation_id)
	var settings = {
		"url": url,
		"method": "POST",
		"timeout": 0,
		"headers": {
			"Authorization": tkey,
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			"inputs": {
				"user_name": username
			},
			"query": question,
			"response_mode": "blocking",
			"conversation_id": conversation_id,
			"user": username
		}),
	};

	$.ajax(settings).done(function(response) {
		// console.log(response);
		// 服务器返回新的 conversation_id 时才存储
		if (response.conversation_id !== conversation_id) {
			localStorage.setItem("conversation_id", response.conversation_id);
		}
		var answer = response.answer
		if (answer.search("|") !== -1) {
			var answer_arr = answer.split("|")

			function task(i) {
				setTimeout(function() {
					addMessage(answer_arr[i], false)
				}, 2000 * i);
			}

			for (var i = 0; i < answer_arr.length; i++) {
				console.log(answer_arr[i])
				task(i)
			}
		} else {
			addMessage(response.answer, false);
		}
	});
}