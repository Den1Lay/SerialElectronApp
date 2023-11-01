window.addEventListener('load', () => {
  initRootObj();

  // const setButton = document.getElementById('btn')
  // const titleInput = document.getElementById('title')
  // setButton.addEventListener('click', () => {
  //   const title = titleInput.value
  //   window.electronAPI.setTitle(title)
  // });

  const counter = document.getElementById('counter')

  window.electronAPI.handleCounter((event, value) => {
    const oldValue = Number(counter.innerText)
    const newValue = oldValue + value
    counter.innerText = newValue
    event.sender.send('counter-value', newValue)
  })

  // Получение информации с ком порта
  window.electronAPI.serialHandler((event, value) => {
    const resArr = [];
    value.forEach(element => {
      element.forEach(el => {
        resArr.push(el);
      })
    });
    console.log('%c New Response '+(new Date()) , 'background: #222; color: #bada55');
    console.log('SerialHandler: <<-- ', getHex(resArr));
    
    let resNumber = 0;
    for(let i = 0; i < resArr.length; i++) {
      resNumber = resNumber | resArr[resArr.length-(1+i)] << (8*i);
    }
    // console.log("SerialHandler: pure ", resNumber);

    responseHandler(resArr);

  });

  const refresh_port_btn = document.getElementById('refresh_port_btn');
  refresh_port_btn.addEventListener('click', () => {
    createSelect();
  });

  const con_discon_btn = document.getElementById('con_discon_btn');
  con_discon_btn.addEventListener('click', () => {
    // disconnectFromPort()
    connectToPort();
  })

  // createSelect handler
  window.electronAPI.getPortsHandler((event, value) => {
    console.log(value);

    const select_port_wrapper = document.getElementById('select-port-wrapper');
    select_port_wrapper.innerHTML =
    `<select id="port_select" class="form-select form-select-sm port-select">
      ${value.map(el=> `<option ${el === "COM8" ? "selected":""} value="${el}">${el}</option>`)}
    </select>`;
  });


  // connectToPort handler
  window.electronAPI.openPortError((event, value) => {
    const {msg, from} = value
    window.rootObj.error = msg;
    window.rootObj.connect = false;
    console.log("Front side openPortError: ", msg);

    const port_status = document.getElementById('port_status');
    port_status.innerText = msg;
    port_status.classList = 'port-status port-status-error';
  })

  window.electronAPI.openPortSuccess(() => {
    console.log("Front side openPortSuccess");
    const port_status = document.getElementById('port_status');
    port_status.innerText = "Подключено";
    port_status.classList = 'port-status port-status-success';
    window.rootObj.connect = true;

    const con_discon_btn = document.getElementById('con_discon_btn');
    con_discon_btn.innerText = "Закрыть";
    con_discon_btn.classList = "btn btn-sm btn-light";
  })
  

  createSelect();

  // Работа с чтением и записью регистров
  const reg_1_write = document.getElementById('reg_1_write');
  reg_1_write.addEventListener('click', () => regWrite())

  const reg_1_read = document.getElementById('reg_1_read');
  reg_1_read.addEventListener('click', () => regRead())

  const scan_btn = document.getElementById('scan_btn');
  scan_btn.addEventListener('click', () => toggleScan())

  const config_btn = document.getElementById('config_btn');
  config_btn.addEventListener('click', () => configBtnHandler())

  const write_config_btn = document.getElementById('write_config_btn');
  write_config_btn.addEventListener('click', () => writeConfig())
})


function createSelect() {
  window.electronAPI.getPorts();
}

function connectToPort(altValue=null) {
  if(!window.rootObj.connect) {
    // Real connection
    const {valueAsNumber: port_baudrate_value} = document.getElementById('port-baudrate');
    let { value } = document.getElementById('port_select');
    if(altValue) value = altValue;
    console.log('value '+value);
    if(value) {
      window.electronAPI.connectToPort({value, port_baudrate_value});
    }
  
  } else {
    // Disconection
    window.electronAPI.disconnectFromPort();
    const port_status = document.getElementById('port_status');
    port_status.innerText = '';
    const con_discon_btn = document.getElementById('con_discon_btn');
    con_discon_btn.innerText = "Открыть";
    con_discon_btn.classList = "btn btn-sm btn-light";
  }
}

function initRootObj() {
  window.rootObj = {
    error: null,
    connect: false,
    readReg: null,
    scanning: false,
    stageObj: {},
    devConfData: {},
    initDevConfData: {},
    rowDevConfData: null,
    rowInitDevConfData: null,
    secondsTime: 0,
  }
}

function regWrite(pass=null, register=null) {
  // Подготовка Modbus сообщения
  
  const { value } = document.getElementById('reg_1_input');
  const hexData = value.split(' ').map(el => parseInt(el, 16));
  let writeReg = hexData[2] << 8 | hexData[3];
  let prev = hexData;

  if(pass) prev = pass;
  if(register) writeReg = register;
  // console.log(hexData);
  // console.log(getHex(hexData));
  // let prev = [0x01, 0x05, 0x00, 0x01, 0x00, 0x01];
  // (0x01)Номер устройства, (0x05)Код функции, (0x00, 0x01)Начальный адрес, 
  // (0x00, 0x01)Кол-во элементов, Далее кол-во байтов и сами данные
  
  const fullData = [0xF9, 0x10, 0x00,  0xAA, 0x00,  0x04, 0x08, 0x20, 0x39, 0x87, 0x33, 0x11, 0x0F, 0x0A, 0x10]
  // F9 10 00 AA 00 04 08 20 39 87 33 11 0F 0A 10
  // let prev = [0xF9, 0x10, 0x00, 0xAA, 0x00, 0x04, ]
  // const data = [0x08, 0x20, 0x39, 0x87, 0x33, 0x11, 0x0F, 0x0A, 0x10]; // данные для 0x00AA вместе с кол-вом байтов
  // Изменено значение 5 байта с 0х11 до 0х13 
  
  // let prev = [0xF9, 0x10, 0x00, 0x66, 0x00, 0x01] // Первичка для 0x0066
  // const data = [0x02, 0x08, 0x00]  

  // const data = [0x00, 0x08]
  // prev = prev.concat(...data);
  // Запись посылки в сообщение
  // let reduceValue = value;
  // const resByteStorage = []; // Decimal
  // while(reduceValue != 0) {
  //   const low = reduceValue & 0b11111111;
  //   reduceValue >>= 8;
  //   resByteStorage.unshift(low);
  // }

  // prev.push(resByteStorage.length);
  // prev = prev.concat(...resByteStorage);
  
  
  // Расчет CRC и подключение его к сообщению.
  const crcValue = modbusCRC(prev);
  prev = prev.concat(...crcValue);
  
  console.log("SerialHandler -->> ", getHex(prev));
  const message = new Uint8Array(prev);
  window.electronAPI.sendMessage(message);
  window.writeReg = writeReg;
  window.readReg = null;
}

function regRead(pass=null, register=null) {
  const { value } = document.getElementById("reg_1_address");
  
  let numbValue = parseInt(value, 16);
  const highPart = numbValue >> 8;
  const lowPart = numbValue & 0xFF;
  console.log(`check register hex ${toHexWithZero(highPart)} ${toHexWithZero(lowPart)}`);
  let prev = [0xF9, 0x03, highPart, lowPart, 0x00, 0x01];
  
  if(pass) prev = pass;
  if(register) numbValue = register;
  
  // let prev = [0x01, 0x01, 0x00, 0x01, 0x00, 0x01];
  const crcValue = modbusCRC(prev);
  prev = prev.concat(...crcValue);
  
  const message = new Uint8Array(prev);
  console.log("SerialHandler -->>", getHex(prev));
  window.electronAPI.sendMessage(message);
  window.readReg = numbValue;
  window.writeReg = null;
}

function responseHandler(arr) {
  // проверка CRC
  const len = arr.length
  const crc = arr[len-2] << 8 | arr[len-1];
  const checkCRC = modbusCRC(arr.slice(0, arr.length-2));
  const checkCRCDec = checkCRC[0] << 8 | checkCRC[1];
  console.log(`crc ${crc.toString(16)} checkCRC ${checkCRCDec.toString(16)}`);
  if(window.rootObj.scanning) {
    // отлавливание 12 байтов
    if(arr.length === 12) {
      // парсинг
    }
  }

  if(crc == checkCRCDec) {
    console.log("Success crc "+(new Date()));
    // разбор сообщения
    const deviceAdr = arr[0];
    const functionCode = arr[1];
    const bytesNumb = arr[2];
    if(window.readReg === 0x0100) {
      const devType = getHex(arr.slice(3, 5));
      const techNumb = getHex(arr.slice(5, 13));
      const factoryNumb = getHex(arr.slice(13, 21));
      const softVersion = getHex(arr.slice(21, 23));
      
      const consoleObj = {deviceAdr, functionCode, bytesNumb, devType, techNumb, factoryNumb, softVersion};
      console.log(consoleObj); 
      Object.keys(consoleObj).forEach(key => {
        if(typeof consoleObj[key] === 'object') {
          consoleObj[key] = parseInt(consoleObj[key].reverse().join(''), 16);
        }
      })
      
    }
    if(window.readReg === 0x00AA) {
      
      const radioFreq = getHex(arr.slice(3, 7));
      const altRadioParam = getHex(arr.slice(7, 8));
      const openWindowTime = getHex(arr.slice(8, 9));
      const scanTime = getHex(arr.slice(9, 10));
      const transmitPower = getHex(arr.slice(10, 11));
      
      const numbAltRadio = parseInt(altRadioParam, 16);
      const sf = numbAltRadio & 0b00000111;
      const bw = numbAltRadio >> 3;

      const consoleObj = {radioFreq, altRadioParamDecode: {sf, bw}, openWindowTime, scanTime, transmitPower};
      
      // console.log(consoleObj);
      
      consoleObj['radioFreq'] = parseInt(consoleObj['radioFreq'].reverse().join(''), 16);
      consoleObj.scanTime = parseInt(scanTime, 16);
      consoleObj.transmitPower = parseInt(transmitPower, 16);
      consoleObj.openWindowTime = parseInt(openWindowTime, 16);
      consoleObj.altRadioParam = parseInt(altRadioParam, 16);
      console.log(consoleObj);

      // подкидывание данных в rootObj, обновление DOM и индикация об изменениях
      (() => {
        // super();
        const { radioFreq, scanTime, transmitPower, openWindowTime, altRadioParam } = consoleObj;
        const devConfDataObj = {
          sf,
          bw,
          radioFreq,
          scanTime,
          transmitPower,
          openWindowTime,
        }

        if(Object.keys(window.rootObj.initDevConfData) < 1) {
          window.rootObj.initDevConfData = devConfDataObj;
          window.rootObj.rowInitDevConfData = arr.slice(3, 11);
          console.log("window.rootObj.rowInitDevConfData", getHex(window.rootObj.rowInitDevConfData))
          // Установка данных в init столбик
          setDOMConfigValue(devConfDataObj, 'o');
        }
        window.rootObj.devConfData = devConfDataObj;
        window.rootObj.rowDevConfData = arr.slice(3, 11);
        console.log("window.rootObj.rowDevConfData", getHex(window.rootObj.rowDevConfData))
        // Установка данных в рабочий столбик
        setDOMConfigValue(devConfDataObj, 'n');
        checkConfigDiffs();
      })();

      // const { stageRunning, stage2Comp, stage3Comp } = window.rootObj.stageObj;
      // if(stageRunning && stage2Comp && !stage3Comp) {
      //   // Логика стейдж раннера
      //   console.log(" %c STAGE 3", 'background: #1E90FF; color: #FFFAFA');
      //   window.rootObj.stageObj.stage3Comp = true;
      // }
    }
    if(window.readReg === 0x00AB) {
      const reportsNumb = getHex(arr.slice(3, 5));
      const requiredCounterNumb = getHex(arr.slice(5, 7));
      const consoleObj = {reportsNumb, requiredCounterNumb};
      // console.log(consoleObj);

      consoleObj.reportsNumb = parseInt(consoleObj.reportsNumb.reverse().join(''), 16);
      consoleObj.requiredCounterNumb = parseInt(consoleObj.requiredCounterNumb.reverse().join(''), 16);
      console.log(consoleObj);

      // const { stageRunning, stage1Comp } = window.rootObj.stageObj;
      // if(stageRunning && !stage1Comp) {
      //   // Логика стейдж раннера
      //   console.log(" %c STAGE 1", 'background: #1E90FF; color: #FFFAFA');
      //   window.rootObj.stageObj.stage1Comp = true;
      //   if(reportsNumb > 0) {
      //     // запуск Stage 2 
      //   } else {
      //     // подмена и переход 
      //     window.rootObj.stageObj.stage2Comp = true;
      //     const pass = [0xF9, 0x03, 0x00, 0xAA, 0x00, 0x01];
      //     setTimeout(() => regRead(pass, 0x00AA), 10);
      //   }
      // }
    }
    if(window.writeReg === 0x00AA) {
      if(functionCode === 0x10) {
        window.rootObj.rowDevConfData = window.rootObj.rowInitDevConfData;
        const config_btn = document.getElementById('config_btn');
        config_btn.classList = "btn btn-sm btn-light";

        const write_config_btn = document.getElementById('write_config_btn');
        write_config_btn.style.display = 'none';
        setDOMConfigValue(window.rootObj.initDevConfData, 'n');
      } else {
        console.log('%c Error write 0x00AA', "color: red;");
      }
      
    }
    
  } else {
    console.log("Wrong CRC");
  }
}

let scanTableTimer = null;
let secondsTimer = null;
function toggleScan() {
  const { scanning } = window.rootObj;
  const scan_btn = document.getElementById('scan_btn');
  if(!scanning) {
    // Включение сканирования
    const pass = [0xF9, 0x10, 0x00, 0x66, 0x00, 0x01, 0x02, 0x08, 0x00]; // Первичка для 0x0066
    setTimeout(() => regWrite(pass, 0x0066), 10);

    // Включение переодического опроса
    // scanTableTimer = setInterval(stageHandler, 1000);
    stageHandler()
    secondsTimer = setInterval(setTime, 1000);
    
    scan_btn.innerText = "Стоп"
    window.rootObj.scanning = true;
  } else {
    clearInterval(scanTableTimer);
    clearInterval(secondsTimer);
    setTime(true);
    const pass = [0xF9, 0x10, 0x00, 0x66, 0x00, 0x01, 0x02, 0x09, 0x00];
    setTimeout(() => regWrite(pass, 0x0066), 10);
    scan_btn.innerText = "Старт"
    window.rootObj.stageObj.stageRunning = false;
    window.rootObj.scanning = false;
  }
}

function stageHandler() {
  window.rootObj.stageObj.stage1Comp = false;
  window.rootObj.stageObj.stage2Comp = false;
  window.rootObj.stageObj.stage3Comp = false;

  window.rootObj.stageObj.stageRunning = true; 

  const pass = [0xF9, 0x03, 0x00, 0xAB, 0x00, 0x02]
  regRead(pass, 0x00AB);
}

function configBtnHandler() {
  const pass = [0xF9, 0x03, 0x00, 0xAA, 0x00, 0x01];
  if(!window.rootObj.stageObj.stageRunning) {
    console.log('%c CONFIG BTN HANDLER', 'background: #FF4500; color: #FFFAFA');
    regRead(pass, 0x00AA);
  }
  
}

function setTime(done=false) {
  const scan_time_label = document.getElementById('scan_time_label');
  if(done) {
    window.rootObj.secondsTime = 0;
    // scan_time_label.innerText = '00:00';
  } else {
    window.rootObj.secondsTime = window.rootObj.secondsTime+1;
    const secs = window.rootObj.secondsTime;
    // debugger
    let seconds = secs%60;
    let mins = ~~(secs/60);
    seconds = seconds < 10 ? '0'+seconds :seconds;
    mins = mins < 10 ? '0'+mins:mins;
    scan_time_label.innerText = `${mins}:${seconds}`;
    
  }
}

function writeConfig() {
  const prev = [0xF9, 0x10, 0x00,  0xAA, 0x00,  0x04, 0x08, ...window.rootObj.rowInitDevConfData];
  regWrite(prev, 0x00AA);
}