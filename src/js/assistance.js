window.addEventListener('load', () => {
	const download_btn = document.getElementById('download_btn');
	download_btn.addEventListener('click', () => downloadArchive());

	const inputsId = ['mb_radioFreq_n', 'mb_transmitPower_n', 'mb_openWindowTime_n', 'mb_scanTime_n'];
	inputsId.forEach(id => {
		const inputDoc = document.getElementById(id);
		inputDoc.addEventListener('change', () => checkConfigChanges())
	})
})

function setBaudrateDropdown(value) {
	const port_baudrate = document.getElementById('port-baudrate');
	
	port_baudrate.value = value;
}

function setRegAddress(value) {
	const reg_1_address = document.getElementById('reg_1_address');
	reg_1_address.value = value;
}

function setMessageData(value) {
	const reg_1_input = document.getElementById('reg_1_input');
	reg_1_input.value = value;
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
		if(id_key === 'o') {
			doc.innerText = setValue;
		} else {
			doc.value = setValue;
		}
		
	})

}

function checkConfigDiffs() {
	const {initDevConfData, devConfData} =  window.rootObj;
	const check = Object.keys(devConfData).some(key => initDevConfData[key] != devConfData[key])
	
	if(check) {
		const config_btn = document.getElementById('config_btn');
		config_btn.classList = "btn btn-sm btn-warning";

		const write_new_config_btn = document.getElementById('write_new_config_btn');
		write_new_config_btn.style.display = 'block';
	}

}

function setTableData(arr) {
	// parseDate
	const serialNumb = parseInt(getHex(arr.slice(0, 4).reverse()).join(''), 16);
	const timeStamp = parseInt(getHex(arr.slice(4, 8).reverse()).join(''), 16);
	const payload = parseInt(getHex(arr.slice(8, 12).reverse()).join(''), 16);
	const timeInNiceView = get_time(timeStamp);

	
	function get_time(dec) {
		const addZero = el => (''+el).length === 1 ? '0'+el : el;
		var start_time = new Date(2000, 2, 1, 0, 0, 0, 0);
		console.log("Dec: ",dec);
		let new_date = new Date(dec*1000+start_time.getTime());
		let new_date_y = new_date.getFullYear();
		let new_date_m = 1 + new_date.getMonth();
		let new_date_d = new_date.getDate();
		let new_date_h = addZero(new_date.getHours());
		let new_date_min = addZero(new_date.getMinutes()); 
		return `${new_date_h}:${new_date_min} ${new_date_d}.${new_date_m}.${(''+new_date_y).slice(2)}`
		// console.log(new_date_y +" "+new_date_m+" "+new_date_d+" "+new_date_h);
	}

	const { tableStorage } = window.rootObj;
	let serialIsAlreadyAdded = -1;
	tableStorage.forEach(({serialNumb: sN}, i) => {
		if(sN === serialNumb) {
			serialIsAlreadyAdded = i;
		}
	});

	const resObj = {serialNumb, timeInNiceView, payload};
	if(serialIsAlreadyAdded > -1) {
		// Есть совпадение. Обновление данных
		tableStorage[serialIsAlreadyAdded] = resObj;
	} else {
		tableStorage.push(resObj);
	}
	window.rootObj.tableStorage = tableStorage;

	// render

	const payload_table_wrapper = document.getElementById('payload_table_wrapper');
	
	const innerStr = window.rootObj.tableStorage.map(({serialNumb, timeInNiceView, payload}, i)=> {
		const res =  `<div class="table-data">
			<div class="th_numb">${i}</div>
			<div class="th_serialNumb">${serialNumb}</div>
			<div class="th_fixTime">${timeInNiceView}</div>
			<div class="th_payload">${payload}</div>
		</div>`
		return res
	})
	payload_table_wrapper.innerHTML = innerStr.join('');
}

function downloadArchive() {
	// const {currentDeviceInd: cDI} = window.rootDataObj;
  // const { temp_data } = window.rootDataObj.devices[cDI];
	const workStr = '[{"serialNumb":1001,"timeInNiceView":"03:33 27.10.23","payload":8889},{"serialNumb":1002,"timeInNiceView":"01:11 27.10.23","payload":33333},{"serialNumb":1003,"timeInNiceView":"02:22 27.10.23","payload":8888}]';
	const workObj = JSON.parse(workStr, {space: 4});
	console.log(workObj);
  const resWorkbookData = {};
  resWorkbookData['A'+1] = {v:"№", w:"№", t:'s'};
  resWorkbookData['B'+1] = {v:"Серийный номер", w:"Серийный номер", t:'s'};
	resWorkbookData['C'+1] = {v:"Время фиксации", w:"Время фиксации", t:'s'};
	resWorkbookData['D'+1] = {v:"Показания", w:"Показания", t:'s'};

	const tableStorage = window.rootObj.tableStorage;
	tableStorage.forEach(({serialNumb, timeInNiceView, payload}, i) => {
		resWorkbookData['A'+(2+i)] = {v:(i+1), w: ''+(i+1), t:'n'};
		resWorkbookData['B'+(2+i)] = {v:''+serialNumb, w:''+serialNumb, t:'s'};
		resWorkbookData['C'+(2+i)] = {v:''+timeInNiceView, w:''+timeInNiceView, t:'s'};
		resWorkbookData['D'+(2+i)] = {v:''+payload, w:''+payload, t:'s'};
	})
  // const startInd = 2;
  // Object.values(temp_data)
  //   .filter((el) => el.hasOwnProperty('flow_mid'))
  //   .forEach(({flow_mid}, i) => {
  //     const temp_val = 20+i*10;
  //     const flow_val = (flow_mid/262144).toFixed(2);
  //     resWorkbookData['A'+(startInd+i)] = {v: temp_val, w:""+temp_val, t:'n'};
  //     resWorkbookData['B'+(startInd+i)] = {v: flow_val, w:""+flow_val, t:'n'};
  //   })

  resWorkbookData["!ref"] = "A1:P299";
  const resWorkbook = {
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: resWorkbookData
    }
  }

  XLSX.writeFile(resWorkbook, "Температура_время.xlsx", { compression: true })
}

const getHexArrFromInt = (int, byteLength=1) => {
	const resArr = [];
	for(let i=0; i < byteLength; i++) {
		const val = int & 0xFF;
		resArr.push(val);
		int = int >> 8;
	}
	return resArr
} 

function checkConfigChanges() {
	console.log('CHECK CONF');	
	// Получение информации с инпутов
	const {valueAsNumber: mb_radioFreq_n} = document.getElementById('mb_radioFreq_n');
	const {value: mb_sf_n} = document.getElementById('mb_sf_n');
	const {value: mb_bw_n} = document.getElementById('mb_bw_n');
	const {valueAsNumber: mb_transmitPower_n} = document.getElementById('mb_transmitPower_n');
	const {valueAsNumber: mb_openWindowTime_n} = document.getElementById('mb_openWindowTime_n');
	const {valueAsNumber: mb_scanTime_n} = document.getElementById('mb_scanTime_n');

	// Преобразование переменных к нужному виду
	const res_mb_radioFreq_n = getHexArrFromInt(mb_radioFreq_n*1000, 4);
	const sfObj = {'SF7': 1, 'SF8': 2, 'SF9': 3, 'SF10': 4, 'SF11': 5, 'SF12': 6};
	const bwObj = {'125': 0, '250': 1, '500': 2};
	const res_mb_sf_n = getHexArrFromInt(sfObj[mb_sf_n] | (bwObj[mb_bw_n] << 3));
	const res_mb_transmitPower_n = getHexArrFromInt(mb_transmitPower_n);
	const res_mb_openWindowTime_n = getHexArrFromInt(mb_openWindowTime_n);

	const res_mb_scanTime_n = getHexArrFromInt(mb_scanTime_n);

	// Здесь необходимо формировать новый row
	const newRowDevConfData = [...res_mb_radioFreq_n, ...res_mb_sf_n, ...res_mb_openWindowTime_n, ...res_mb_scanTime_n, ...res_mb_transmitPower_n];
	const devConfDataObj = {
		sf: sfObj[mb_sf_n],
		bw: bwObj[mb_bw_n],
		radioFreq: mb_radioFreq_n*1000,
		scanTime: mb_scanTime_n,
		transmitPower: mb_transmitPower_n,
		openWindowTime: mb_openWindowTime_n,
	}

	console.log("prev devConfDataObj", window.rootObj.devConfData)
	console.log("new devConfDataObj", devConfDataObj)

	console.log("prev rowDevConfData", window.rootObj.rowDevConfData);
	console.log("new rowDevConfData", newRowDevConfData);
	window.rootObj.rowDevConfData = newRowDevConfData;
	window.rootObj.devConfData = devConfDataObj;

	checkConfigDiffs();
}

function setModInputValue(value, el_id) {
	const targetDoc = document.getElementById(el_id);
	targetDoc.value = value;
	checkConfigChanges();
}












function testFunction() {
	const dev1DataObj = {
		serialNumb_1: 1001,
		timeStamp_1: get_arch_time(9, 27, 0, 0), 
		payload_1: 8888,
	}
	const dev2DataObj = {
		serialNumb_1: 1002,
		timeStamp_1: get_arch_time(9, 27, 1, 11), 
		payload_1: 33333,
	}
	const dev3DataObj = {
		serialNumb_1: 1003,
		timeStamp_1: get_arch_time(9, 27, 2, 22), 
		payload_1: 8888,
	}
	const dev4DataObj = {
		serialNumb_1: 1001,
		timeStamp_1: get_arch_time(9, 27, 3, 33), 
		payload_1: 8889,
	}

	function get_arch_time(mount, day, h, min) {
    var start_time = new Date(2000, 2, 1, 0, 0, 0, 0);
    // new Date(year, month(0-11), date (1-30), hours, minutes, seconds, ms)
    var check_time = new Date(2023, mount, day, h, min, 0, 0);
    var res_time = Math.round((check_time - start_time)/1000);
    // console.log(res_time);
		return res_time
}

	function formHexRow(workObj) {
		let mainResArr = [];

		Object.keys(workObj).forEach(key => {
			let value = workObj[key];
			const resArr = [];
			for(let i = 0; i < 4; i++) {
				const resData = value & 0xFF;
				resArr.push(resData);
				value = value >> 8;
			}
			mainResArr = mainResArr.concat(...resArr)
		})
		

		console.log("Test func  ", getHex(mainResArr).join(', 0x'));
	}

	formHexRow(dev1DataObj);
	formHexRow(dev2DataObj);
	formHexRow(dev3DataObj);
	formHexRow(dev4DataObj);

}