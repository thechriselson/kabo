// Populate Options

function onbPopulateInput(input, data) {
	let preSelect = localStorage.getItem("onb" + input.dataset.onbId + input.dataset.onbInput + "");
	// text
	if(input.dataset.onbType == "text" && preSelect) {input.value = preSelect}
	// radio
	else if(input.dataset.onbType == "radio") {
		if(preSelect) {if(preSelect == input.value) {input.checked = true}}
		else if(data && data[input.dataset.onbApiKey]) {
			if(typeof data[input.dataset.onbApiKey] == "string") {}
			else {data[input.dataset.onbApiKey].forEach((option) => {
				if(option.value == true && typeof option.label == "string") {
					if(option.label.toLowerCase() == input.value.toLowerCase()) {
						input.setAttribute("data-onb-option", "default");
						input.checked = true
					}
				}
			})}
		}
	}
	// checkbox
	else if(input.dataset.onbType == "checkbox") {
		if(preSelect && preSelect == "true") {input.checked = true}
		else {input.checked = false}
	}
	// populate
	else if(data && data[input.dataset.onbApiKey]) {
		// select
		if(input.dataset.onbType == "select") {
			data[input.dataset.onbApiKey].forEach((option, i) => {
				input.options[i+1] = new Option(option.label, option.value);
				if(preSelect && preSelect == option.value) {input.options[i+1].selected = true}
			})
		}
		// text-select
		else if(input.dataset.onbType == "text-select") {
			data[input.dataset.onbApiKey].forEach((option, i) => {})
		}
	}
}

function onbSetupInputs(data) {
	document.querySelectorAll("[data-onb='template']").forEach((template) => {
		if(data[template.dataset.onbApiKey]) {
			data[template.dataset.onbApiKey].forEach((tData, i) => {
				let curTemplate = template;
				if(i > 0) {
					curTemplate = template.cloneNode(true);
					template.parentNode.appendChild(curTemplate)
				}
				curTemplate.querySelectorAll("[data-onb-api-key]").forEach((e) => {
					// text
					if(e.dataset.onbType == "text") {e.textContent = tData[e.dataset.onbApiKey]}
					// image
					else if(e.dataset.onbType == "image") {}
					// radio
					else if(e.dataset.onbType == "radio") {
						e.value = tData[e.dataset.onbApiKey];
						onbPopulateInput(e, tData)
					}
					// checkbox
					else if(e.dataset.onbType == "checkbox") {
						e.dataset.onbInput = e.dataset.onbInputTemplate.replace("template", tData[e.dataset.onbApiKey]);
						onbPopulateInput(e, tData)
					}
				})
			})
		}
	});
	document.querySelectorAll("[data-onb-input]").forEach((input) => {onbPopulateInput(input, data)})
}

// API Requests
function onbApiRequest(url, callback, type, data) {
	let xhr = new XMLHttpRequest();
	xhr.open(type, url, true);
	xhr.responseType = "json";
	xhr.onload = () => {
		let status = xhr.status;
		if(status === 200 || status === 201) {callback(null, xhr.response)}
		else {callback(status, xhr.response)}
	}
	if(data) {
		data = JSON.stringify(data);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(data)
	}
	else {xhr.send()}
}

// GET API Data
document.querySelectorAll("[data-onb-api]").forEach((apiObj) => {
	onbApiRequest(apiObj.dataset.onbApi, (err, data) => {
		if(err !== null) {console.log("Something went wrong: " + err)}
		else {onbSetupInputs(data)}
	}, "GET")
});

// Next Step
function onbNextStep(trigger) {
	// object
	let dataObj = {"step": document.querySelector("[data-onb-step]").dataset.onbStep, "dogs": []}
	document.querySelectorAll("[data-onb='section']").forEach((section) => {
		dataObj.dogs.push({"id": Number(section.dataset.onbId)})
	});
	// inputs
	document.querySelectorAll("[data-onb-input]").forEach((input) => {
		dataObj.dogs.forEach((dog) => {
			if(input.dataset.onbId == dog.id && input.value != "" && input.value != undefined) {
				let store = true;
				// radio
				//if(input.dataset.onbType == "radio" && input.checked == false) {store = false}
				if(input.dataset.onbType == "radio") {
					if(!dog[input.dataset.onbInput]) {dog[input.dataset.onbInput] = null}
					if(input.checked == false) {store = false}
				}
				// store
				if(store) {
					let value = input.value
					// formatting
					if(value == "true") {value = true}
					else if(value == "false") {value = false}
					else if(!isNaN(value)) {value = Number(value)}
					if(input.dataset.onbType == "checkbox") {
						if(input.checked == true) {value = true}
						else {value = false}
					}
					else if(input.dataset.onbType == "radio") {}
					console.log(value);
					// store
					localStorage.setItem("onb" + dog.id + input.dataset.onbInput + "", value);
					dog[input.dataset.onbInput] = value;
				}
			}
		})
	});
	// ids
	dataObj.dogs.forEach((dog) => {
		if(localStorage.getItem("onb" + dog.id + "id")) {
			dog.id = Number(localStorage.getItem("onb" + dog.id + "id"))}
		else {delete dog.id}
	});
	// request
	let dataUrl = trigger.dataset.onbNext;
	let requestType = "POST";
	if(localStorage.getItem("onbUserId")) {
		dataUrl += "/" + localStorage.getItem("onbUserId");
		requestType = "PUT"
	}
	console.log(requestType);
	console.log(dataUrl);
	console.log(dataObj);
	onbApiRequest(dataUrl, (err, data) => {
		if(err != null) {console.log("Something went wrong: " + err)}
		else {
			console.log(data);
			if(data.temp_user_id) {localStorage.setItem("onbUserId", data.temp_user_id)}
			if(data.temp_dog_ids) {data.temp_dog_ids.forEach((dogId, i) => {
				localStorage.setItem("onb" + i + "id", dogId)
			})}
			window.location.href = trigger.dataset.onbLink
		}
	}, requestType, dataObj)
}

// Adding/Removing Dogs

function onbUpdateIds() {
	document.querySelectorAll("[data-onb='section']").forEach((section, i) => {
		// section
		section.dataset.onbId = i;
		// inputs
		section.querySelectorAll("[data-onb-input]").forEach((input) => {
			// stored values
			let oldId = input.dataset.onbId;
			if(localStorage.getItem("onb" + oldId + input.dataset.onbInput + "")) {
				localStorage.removeItem("onb" + oldId + input.dataset.onbInput + "");
				localStorage.setItem("onb" + i + input.dataset.onbInput + "", input.value)
			}
			input.dataset.onbId = i
		});
		// buttons
		section.querySelectorAll("[data-onb-button]").forEach((button) => {
			button.dataset.onbId = i})
	})
}

function onbRemoveDog(id) {
	if(id > 0) {
		document.querySelectorAll("[data-onb='section']").forEach((section) => {
			if(section.dataset.onbId == id) {
				// identify
				let remove = [];
				for(let i = 0; i < localStorage.length; i++) {
					if(localStorage.key(i).includes("onb" + id)) {
						remove.push(localStorage.key(i))}
				}
				// remove
				remove.forEach((key) => {localStorage.removeItem(key)});
				section.parentNode.removeChild(section);
				// update
				let activeDogs = Number(localStorage.getItem("onbActiveDogs"));
				localStorage.setItem("onbActiveDogs", activeDogs - 1)
			}
		})
	}
}

function onbAddDog() {
	let activeDogs = Number(localStorage.getItem("onbActiveDogs"));
	// section
	let newSection = document.querySelector("[data-onb='section']").cloneNode(true);
	newSection.dataset.onbId = activeDogs;
	// names
	let dogsName = "Dog";
	if(localStorage.getItem("onb" + activeDogs + "name")) {
		dog = localStorage.getItem("onb" + activeDogs + "name")}
	newSection.querySelectorAll("[data-onb='name']").forEach((name) => {name.textContent = dogsName});
	// inputs
	newSection.querySelectorAll("[data-onb-input]").forEach((input) => {
		input.dataset.onbId = activeDogs;
		let preSelect = localStorage.getItem("onb" + input.dataset.onbId + input.dataset.onbInput + "");
		// text
		if(input.dataset.onbType == "text") {
			if(preSelect) {input.value = preSelect}
			else {input.value = ""}
		}
		// radio
		else if(input.dataset.onbType == "radio") {
			if(preSelect) {if(preSelect == input.value) {input.checked = true}}
			else if(input.dataset.onbOption == "default") {input.checked = true}
			else {input.checked = false}
		}
		// checkbox
		else if(input.dataset.onbType == "checkbox") {
			if(preSelect) {if(preSelect == true) {input.checked = true}}
			else {input.checked = false}
		}
		// select
		else if(input.dataset.onbType == "select") {
			if(preSelect) {input.options.forEach((option) => {
				if(option.value == preSelect) {option.selected = true}})}
			else {input.options[0].selected = true}
		}
	});
	// buttons
	newSection.querySelectorAll("[data-onb-button]").forEach((button) => {
		button.dataset.onbId = activeDogs;
		// remove
		if(button.dataset.onbButton == "dog-") {
			button.addEventListener("click", () => {onbRemoveDog(button.dataset.onbId)})}
	});
	// set
	document.querySelector("[data-onb='section']").parentNode.appendChild(newSection);
	localStorage.setItem("onbActiveDogs", activeDogs + 1)
}

// Initial Section
document.querySelectorAll("[data-onb='section']").forEach((section, i) => {
	section.setAttribute("data-onb-id", i);
	// names
	if(localStorage.getItem("onb" + i + "name")) {
		let dogName = localStorage.getItem("onb" + i + "name");
		section.querySelectorAll("[data-onb='name']").forEach((name) => {
			name.textContent = dogName})
	}
	// inputs
	section.querySelectorAll("[data-onb-input]").forEach((input) => {
		input.setAttribute("data-onb-id", i)});
	// buttons
	section.querySelectorAll("[data-onb-button]").forEach((button) => {
		button.setAttribute("data-onb-id", i)})
});

// Non-Section Buttons
document.querySelectorAll("[data-onb-button]").forEach((button) => {
	if(button.dataset.onbButton == "dog+") {
		button.addEventListener("click", () => {onbAddDog()})}
	else if(button.dataset.onbButton == "next") {
		button.setAttribute("data-onb-link", button.href);
		button.href = "#";
		button.addEventListener("click", () => {onbNextStep(button)})
	}
});

// Additonal Sections
if(localStorage.getItem("onbActiveDogs")) {
	let activeDogs = localStorage.getItem("onbActiveDogs");
	localStorage.setItem("onbActiveDogs", 1);
	for(let i = 1; i < activeDogs; i++) {onbAddDog()}
}
else {localStorage.setItem("onbActiveDogs", 1)}