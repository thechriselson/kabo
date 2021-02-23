////////////
// GLOBAL //
////////////

// API Request
function onbApiRequest(url, callback, type, data) {
	let xhr = new XMLHttpRequest();
	xhr.open(type, url, true);
	xhr.responseType = "json";
	xhr.onload = () => {
		let status = xhr.status;
		if(status === 200 || status === 201) {callback(null, xhr.response)}
		else if(status === 204) {callback(null, null)}
		else {callback(status, xhr.response)}
	}
	if(data != undefined) {
		data = JSON.stringify(data);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(data)
	}
	else {xhr.send()}
}

// Format Storage Key
function onbSKey(x, id) {
	let key = "onb" + x + "";
	if(id != undefined) {key = "onb" + id + x + ""}
	return key
}

// API Data & Key
function onbApiData(e, data) {
	let ds = e.dataset;
	// format key
	let id; if(ds.onbId) {id = ds.onbId}
	let key; if(ds.onbApiKey) {key = ds.onbApiKey}
	else {return undefined}
	// placeholders
	while(key.includes("[") && key.includes("]")) {
		let a = key.split("[");
		let b = a[1].split("]");
		let split = [a[0], b[0], b[1]];
		// with id (default)
		if(id != undefined && localStorage.getItem(onbSKey(split[1], id))) {
			split[1] = localStorage.getItem(onbSKey(split[1], id));
			key = split.join("")
		}
		// without id
		else if(localStorage.getItem(onbSKey(split[1]))) {
			split[1] = localStorage.getItem(onbSKey(split[1]));
			key = split.join("")
		}
	}
	// multi-keys
	let keys = [];
	if(!key.includes("&")) {keys.push(key)}
	while(key.includes("&")) {
		let split = key.split("&");
		keys.push(split[0]);
		if(!split[1].includes("&")) {keys.push(split[1])}
		key = split[1]
	}
	keys.forEach(x => {if(data[x]) {data = data[x]}});
	// data
	return data
}

// Setup Triggers
function onbTriggers() {
	document.querySelectorAll("[data-onb-trigger]").forEach(t => {
		let ds = t.dataset;
		let tr = ds.onbTrigger.split("=");
		if(tr.length == 2 && ds.onbTarget) {
			// click
			if(tr[1] == "click") {
				t.addEventListener(tr[0], () => {
					document.querySelectorAll(ds.onbTarget).forEach(target => {target.click()})
				})
			}
			// radio
			else if(tr[1] == "radio") {t.addEventListener(tr[0], () => {
				document.querySelectorAll(ds.onbTarget).forEach(target => {
					let tDs = target.dataset;
					// section
					if(tDs.onbId == ds.onbId) {
						//template
						if(ds.onbTemplateId) {
							if(tDs.onbTemplateId == ds.onbTemplateId) {target.checked = true}
							else {target.checked = false}
						}
						else {
							if(target.checked) {target.checked = false}
							else {target.checked = true}
						}
						// group
						if(ds.onbGroup && tDs.onbGroup && tDs.onbGroup != ds.onbGroup) {
							target.checked = false}
					}
				})
			})}
			// uncheck
			else if(tr[1] == "uncheck") {
				t.addEventListener(tr[0], () => {
					document.querySelectorAll(ds.onbTarget).forEach(target => {
						if(target.dataset.onbId == ds.onbId) {target.checked = false}
					})
				})
			}
		}
	})
}

// Conditional Visibility
function onbConditions(e) {
	let id; if(e.dataset.onbId) {id = e.dataset.onbId} else {return}
	let pass = true;
	// compare
	e.dataset.onbConditions.split("&").every(condition => {
		if(!pass) {return false}
		if(condition.includes("=")) {
			let pair = condition.split("=");
			let keys = ["onb" + pair[0] + ""];
			if(e.dataset.onbId) {keys[0] = "onb" + id + pair[0] + ""}
			let minTrue = 1;
			if(keys[0].includes("*")) {
				let split = pair[0].split("*");
				if(!isNaN(split[0])) {minTrue = Number(split[0])}
				let multiKey = split[1];
				keys.pop();
				for(let i = 0; i < localStorage.length; i++) {
					if(localStorage.key(i).includes(multiKey) &&
						localStorage.key(i).includes(id)) {
						keys.push(localStorage.key(i))}}
			}
			let multiPass = [];
			keys.forEach(key => {
				if(localStorage.getItem(key) == pair[1]) {multiPass.push(true)}
				else if(pair[1].includes("!")) {
					if(localStorage.getItem(key) != pair[1].replace("!", "")) {multiPass.push(true)}}
				else if(pair[1] == "TRUE") {if(localStorage.getItem(key)) {multiPass.push(true)}}
				else if(pair[1] == "FALSE") {if(!localStorage.getItem(key)) {multiPass.push(true)}}
				else {multiPass.push(false)}
			});
			let multiPassTrue = 0;
			for(let i = 0; i < multiPass.length; i++) {if(multiPass[i]) {multiPassTrue++}}
			if(multiPassTrue >= minTrue) {return true}
			else {pass = false; return false}
		}
	});
	// display
	if(pass) {e.style.removeProperty("display")}
	else {e.style.display = "none"}
}

//////////////////////
// SETUP - POPULATE //
//////////////////////

// Populate Input
function onbPopInput(input, data) {
	let ds = input.dataset;
	let oData; if(data != undefined) {oData = onbApiData(input, data)}
	let sValue;
	if(ds.onbId) {sValue = localStorage.getItem(onbSKey(ds.onbInput, ds.onbId))}
	else {sValue = localStorage.getItem(onbSKey(ds.onbInput))}
	// text
	if(ds.onbType == "text") {if(sValue) {input.value = sValue}}
	// checkbox
	else if(ds.onbType == "checkbox") {
		if(sValue && sValue == "true") {input.checked = true}
		else if(sValue && sValue == "false") {input.checked = false}
		else if(sValue == input.value) {input.checked = true}
		else {input.checked = false}}
	// from data
	else if(oData != undefined) {
		// select
		if(ds.onbType == "select") {
			if(Array.isArray(oData)) {
				oData.forEach((option, i) => {
					input.options[i+1] = new Option(option.label, option.value);
					if(sValue && sValue == option.value) {input.options[i+1].selected = true}
				})
			}}
		// text-select
		else if(ds.onbType == "text-select") {
			if(Array.isArray(oData)) {
				oData.forEach((option, i) => {})
			}}
		// radio
		else if(ds.onbType == "radio") {
			if(sValue) {if(sValue == input.value) {input.checked = true}}
			else if(Array.isArray(oData)) {
				oData.forEach(option => {
					if(option.value == true && typeof option.label == "string") {
						if(option.label.toLowerCase() == input.value.toLowerCase()) {
							input.setAttribute("data-onb-option", "default");
							input.checked = true}}
				})
			}}
	}
}

// Populate
function onbPopulate(data) {
	document.querySelectorAll("[data-onb='section']").forEach((section, sId) => {
		// templates
		section.querySelectorAll("[data-onb='template']").forEach(template => {
			let ds = template.dataset;
			let tData = onbApiData(template, data);
			if(Array.isArray(tData)) {tData.forEach((oData, tId) => {
				let t = template;
				if(tId > 0) {t = template.cloneNode(true); template.parentNode.appendChild(t)}
				t.querySelectorAll("*").forEach(e => {
					if(e.dataset) {
						e.setAttribute("data-onb-template-id", tId);
						if(e.dataset.onbApiKey) {
							let ds = e.dataset;
							let eData = onbApiData(e, oData);
							if(ds.onbType == "text") {e.textContent = eData}
							else if(ds.onbType == "image") {e.src = eData}
							else if(ds.onbType == "radio") {e.value = eData; onbPopInput(e, oData)}
							else if(ds.onbType == "checkbox") {
								e.value = eData;
								if(ds.onbInputTemplate) {
									ds.onbInput = ds.onbInputTemplate.replace("template", eData)}
								onbPopInput(e, oData)
							}
						}
					}
				})
			})}
		});
		// inputs & triggers
		document.querySelectorAll("[data-onb-input]").forEach(input => {onbPopInput(input, data)});
		onbTriggers()
	})
}

// GET API data
document.querySelectorAll("[data-onb-api]").forEach(e => {
	let url = e.dataset.onbApi;
	// formatting
	if(url.includes("portions")) {
		url += "?dog_ids=";
		let count = 0;
		for(let i = 0; i < 10; i++) {
			if(localStorage.getItem(onbSKey("id", i))) {
				if(count == 0) {url += localStorage.getItem(onbSKey("id", i))}
				else {url += "," + localStorage.getItem(onbSKey("id", i))}
				count++
			}
			//else {break}
		}
	}
	onbApiRequest(url, (err, data) => {
		if(err != null) {console.log("Something went wrong: " + err)}
		else {onbPopulate(data)}
	}, "GET")
});

////////////
// SUBMIT //
////////////

function onbSubmitInputs(next) {
	let reqData = {"step": document.querySelector("[data-onb-step]").dataset.onbStep, "dogs": []}
	document.querySelectorAll("[data-onb='section']").forEach(section => {
		reqData.dogs.push({"id": Number(section.dataset.onbId)})
	});
	// inputs
	document.querySelectorAll("[data-onb-input]").forEach(input => {
		if(input.value != undefined && input.value != "") {
			let ds = input.dataset;
			let id; if(ds.onbId) {id = ds.onbId}
			// options
			let options = [];
			if(ds.onbInputOptions) {
				if(ds.onbInputOptions.includes("&")) {
					let x = ds.onbInputOptions;
					while(x.includes("&")) {
						let split = x.split("&");
						options.push(split[0]);
						if(!split[1].includes("&")) {
							options.push(split[1])}
						x = split[1]
					}
				}
				else {options.push(ds.onbInputOptions)}
			}
			let dogInput = true;
			let inputType = "";
			let sValue = input.value;
			let dValue = input.value;
			options.forEach(option => {
				if(option == "label") {
					if(ds.onbType == "select") {
						dValue = input.options[input.selectedIndex].textContent}
				}
				else if(option == "user") {dogInput = false}
				else if(option == "value") {inputType = "value"}
				else if(option == "null") {inputType = "null"}
			});
			// data & storage
			let store = true;
			let data = reqData;
			if(dogInput) {data.dogs.forEach(dog => {
				if(id != undefined && id == dog.id) {data = dog}})}
			// radio buttons
			if(ds.onbType == "radio") {
				if(inputType == "null" && !data.hasOwnProperty(ds.onbInput)) {
					if(id == undefined) {localStorage.setItem(onbSKey(ds.onbInput), "false")}
					else {localStorage.setItem(onbSKey(ds.onbInput, id), "false")}
					data[ds.onbInput] = null
				}
				if(input.checked == false) {store = false}
			}
			// checkboxes
			if(ds.onbType == "checkbox") {
				if(inputType == "value") {
					if(input.checked == false) {store = false}
				}
				else if(input.checked == true) {sValue = "true"; dValue = "true"}
				else {sValue = "false"; dValue = "false"}
			}
			// store
			if(store) {
				// formatting
				if(dValue == "true") {dValue = true}
				else if(dValue == "false") {dValue = false}
				else if(!isNaN(dValue)) {dValue = Number(dValue)}
				// store
				if(id == undefined) {localStorage.setItem(onbSKey(ds.onbInput), sValue)}
				else {localStorage.setItem(onbSKey(ds.onbInput, id), sValue)}
				data[ds.onbInput] = dValue;
			}
		}
	});
	// ids & checks
	reqData.dogs.forEach((dog, i) => {
		// ids
		if(localStorage.getItem(onbSKey("id", dog.id))) {
			dog.id = Number(localStorage.getItem(onbSKey("id", dog.id)))}
		else {delete dog.id}
		// if dog empty
		if(Object.keys(dog).length == 0) {delete reqData.dogs[i]}
		else if(Object.keys(dog).length == 1 && Object.keys(dog)[0] == "id") {delete reqData.dogs[i]}
	});
	if(reqData.dogs.length == 0 || reqData.dogs[0] == undefined) {delete reqData.dogs}
	// request
	let reqUrl = document.querySelector("[data-onb-submit]").dataset.onbSubmit;
	let reqType = "POST";
	if(localStorage.getItem(onbSKey("UserId"))) {
		reqUrl += "/" + localStorage.getItem(onbSKey("UserId"));
		reqType = "PUT"
	}
	console.log(reqUrl);
	console.log(reqType);
	console.log(reqData);
	onbApiRequest(reqUrl, (err, data) => {
		if(err != null) {console.log("Something went wrong: " + err)}
		else {
			if(data == null) {if(next != undefined && next.hasAttribute("data-onb-link")) {
				window.location.href = next.dataset.onbLink}}
			if(data.temp_user_id) {localStorage.setItem(onbSKey("UserId"), data.temp_user_id)}
			if(data.temp_dog_ids) {data.temp_dog_ids.forEach((dogId, i) => {
				localStorage.setItem(onbSKey("id", i), dogId)
			})}
			if(next != undefined && next.hasAttribute("data-onb-link")) {
				window.location.href = next.dataset.onbLink}
		}
	}, reqType, reqData)
}

//////////////
// DOGS +/- //
//////////////

// Update Dog Ids
function onbUpdateIds() {
	document.querySelectorAll("[data-onb='section']").forEach((section, id) => {
		section.dataset.onbId = id;
		// stored values
		section.querySelectorAll("[data-onb-input]").forEach(input => {
			let ds = input.dataset; let oldId = ds.onbId;
			if(localStorage.getItem(onbSKey(ds.onbInput, oldId))) {
				localStorage.removeItem(onbSKey(ds.onbInput, oldId));
				localStorage.setItem(onbSKey(ds.onbInput, id), input.value)
			}
			ds.onbId = i
		});
		// ids
		section.querySelectorAll("[data-onb-id]").forEach(e => {e.dataset.onbId = i})
	})
}

// Remove Dog
function onbRemoveDog(id) {
	if(id > 0) {
		document.querySelectorAll("[data-onb='section']").forEach(section => {
			// identify
			let remove = [];
			for(let i = 0; i < localStorage.length; i++) {
				if(localStorage.key(i).includes(onbSKey("", id))) {
					remove.push(localStorage.key(i))}
			}
			// remove
			remove.forEach(key => localStorage.removeItem(key));
			section.parentNode.removeChild(section);
			// update
			let activeDogs = Number(localStorage.getItem(onbSKey("ActiveDogs")));
			localStorage.setItem(onbSKey("ActiveDogs"), activeDogs - 1)
		})
	}
}

// Add Dog
function onbAddDog() {
	let id = Number(localStorage.getItem(onbSKey("ActiveDogs")));
	// section
	let newSection = document.querySelector("[data-onb='section']").cloneNode(true);
	newSection.dataset.onbId = id;
	// names
	let dog = "Dog";
	if(localStorage.getItem(onbSKey("name", id))) {
		dog = localStorage.getItem(onbSKey("name", id))}
	newSection.querySelectorAll("[data-onb='name']").forEach(name => {name.textContent = dog});
	// inputs
	newSection.querySelectorAll("[data-onb-id]").forEach(input => {
		let ds = input.dataset; ds.onbId = id;
		let sValue = localStorage.getItem(onbSKey(ds.onbInput, ds.onbId));
		// text
		if(ds.onbType == "text") {
			if(sValue) {input.value = sValue}
			else {input.value = ""}
		}
		// radio
		else if(ds.onbType == "radio") {
			if(sValue) {if(input.value == sValue) {input.checked = true}}
			else if(ds.onbOption == "default") {input.checked = true}
			else {input.checked = false}
		}
		// checkbox
		else if(ds.onbType == "checkbox") {
			if(sValue) {if(sValue == true) {input.checked = true}}
			else {input.checked = false}
		}
		// select
		else if(ds.onbType == "select") {
			if(sValue) {
				for(let i = 0; i < input.options.length; i++) {
					let option = input.options[i];
					if(option.value == sValue) {option.selected = true}
				}}
			else {input.options[0].selected = true}
		}
	});
	// buttons
	newSection.querySelectorAll("[data-onb-button]").forEach(button => {
		let ds = button.dataset; ds.onbId = id;
		// remove
		if(ds.onbButton == "dog-") {
			button.addEventListener("click", () => {onbRemoveDog(ds.onbId)})}
	});
	// conditions
	newSection.querySelectorAll("[data-onb-conditions]").forEach(e => {onbConditions(e)});
	// set
	document.querySelector("[data-onb='section']").parentNode.appendChild(newSection);
	localStorage.setItem(onbSKey("ActiveDogs"), id + 1);
	onbTriggers()
}

/////////////////////
// SETUP - INITIAL //
/////////////////////

// Disable form submissions
Webflow.push(function() {$("form[data-onb='form']").submit(function() {return false})});

// Initial Section
document.querySelectorAll("[data-onb='section']").forEach((section, id) => {
	section.setAttribute("data-onb-id", id);
	// names
	if(localStorage.getItem(onbSKey("name", id))) {
		let dog = localStorage.getItem(onbSKey("name", id));
		section.querySelectorAll("[data-onb='name']").forEach(name => {
			name.textContent = dog})}
	// ids
	section.querySelectorAll("*").forEach(e => {
		e.setAttribute("data-onb-id", id)});
	// groups
	section.querySelectorAll("[data-onb=group]").forEach((group, gId) => {
		group.querySelectorAll("[data-onb-id]").forEach(e => {
			e.setAttribute("data-onb-group", gId)})});
	// text inputs
	section.querySelectorAll("[data-onb-input][data-onb-type='text']").forEach(text => {
		let ds = text.dataset;
		if(ds.onbId && localStorage.getItem(onbSKey(ds.onbInput, ds.onbId))) {
			text.value = localStorage.getItem(onbSKey(ds.onbInput, ds.onbId))}
		else if(localStorage.getItem(onbSKey(ds.onbInput))) {
			text.value = localStorage.getItem(onbSKey(ds.onbInput))}
	})
});

// Conditional Visibility
document.querySelectorAll("[data-onb-conditions]").forEach(e => {onbConditions(e)});

// Setup Ext Buttons
document.querySelectorAll("[data-onb-button]").forEach(button => {
	if(button.dataset.onbButton == "dog+") {
		button.addEventListener("click", onbAddDog)}
	else if(button.dataset.onbButton == "next") {
		button.setAttribute("data-onb-link", button.href);
		button.href = "#";
		button.addEventListener("click", () => {onbSubmitInputs(button)})
	}
});

// Additional Sections
if(localStorage.getItem(onbSKey("ActiveDogs"))) {
	let ds = document.querySelector("[data-onb='section']").dataset;
	if(ds.onbSection && ds.onbSection.includes("user")) {}
	else {
		let activeDogs = localStorage.getItem(onbSKey("ActiveDogs"));
		localStorage.setItem(onbSKey("ActiveDogs"), 1);
		for(let i = 1; i < activeDogs; i++) {onbAddDog()}
	}
}
else {localStorage.setItem(onbSKey("ActiveDogs"), 1); onbTriggers()}

// referral codes
if(location.href.includes("?")) {
	localStorage.setItem(onbSKey("referral_code"), location.href.split("?")[1].split("=")[1])}