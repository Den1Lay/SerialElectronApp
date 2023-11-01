function setBaudrateDropdown(value) {
	const port_baudrate = document.getElementById('port-baudrate');
	
	port_baudrate.value = value;
}

function setRegAddress(value) {
	const reg_1_address = document.getElementById('reg_1_address');
	reg_1_address.value = value;
}

function getHex(ar) {
	return ar.map(el => {
		const elHex = el.toString(16).toUpperCase();
		return elHex.length < 2 ? "0"+elHex : elHex;
	})
}

function toHexWithZero(str) {
	const el = str.toString(16).toUpperCase();
	return el.length < 2 ? "0"+el : el;
}

function setDOMConfigValue(devConfDataObj, id_key) {
	Object.keys(devConfDataObj).forEach((key) => {
		const doc_id = `mb_${key}_${id_key}`;
		const doc = document.getElementById(doc_id);
		let setValue = devConfDataObj[key];
		switch (key) {
			case 'radioFreq':
				setValue = setValue/1000;
				break
			case 'sf':
				setValue = `SF${6+setValue}`;
				break
			case 'bw':
				const table = ['125', '250', '500'];
				setValue = table[setValue];
				break
			default:
				break
		}
		doc.innerText = setValue;
	})

}

function checkConfigDiffs() {
	const {initDevConfData, devConfData} =  window.rootObj;
	const check = Object.keys(devConfData).some(key => initDevConfData[key] != devConfData[key])
	
	if(check) {
		const config_btn = document.getElementById('config_btn');
		config_btn.classList = "btn btn-sm btn-warning";

		const write_config_btn = document.getElementById('write_config_btn');
		write_config_btn.style.display = 'block';
	}

}

