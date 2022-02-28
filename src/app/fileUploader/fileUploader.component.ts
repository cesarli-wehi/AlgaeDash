import { Component, OnInit } from '@angular/core';
import { AnyForUntypedForms } from '@angular/forms';
import * as XLSX from 'xlsx';
import { DataService } from '../_services/data.service';
import * as loDash from 'lodash';

@Component({
  selector: 'app-fileUploader',
  templateUrl: './fileUploader.component.html',
  styleUrls: ['./fileUploader.component.css']
})
export class FileUploaderComponent implements OnInit {

  title = 'XlsRead';
  file: File;
  arrayBuffer: any;
  fileList: any
  hourlyData: boolean = false;
  dailyData: boolean = true;
  pbrNo: number;
  arrayList = new Array();

  constructor(private _data: DataService) { }

  ngOnInit() {
    this._data.getPbrNo().subscribe(res => {
      this.pbrNo = res;
    })
  }

  setDaily(event) {
    this.dailyData = event.checked;
    this._data.setPbrGroupedDaily(this.dailyData);
    if(this.dailyData) {
      this.hourlyData = false;
    }
  }

  setHourly(event) {
    this.hourlyData = event.checked;
    this._data.setPbrGroupedHrly(this.hourlyData);
    if(this.hourlyData) {
      this.dailyData = false;
    }
  }

  async addFile(event) {
    this.readFiles(event);
  }

  async readFiles(event) {
    let filePromises = [];
    Array.from(event.target.files).forEach((file: File) => {
      let filePromise = new Promise(resolve => {
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (e) => {
          this.arrayBuffer = fileReader.result;
          var data = new Uint8Array(this.arrayBuffer);
          var arr = new Array();
          for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
          var bstr = arr.join("");
          var workbook = XLSX.read(bstr, { type: "binary", cellText: false, cellDates: true });
          var first_sheet_name = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[first_sheet_name];
          let entries = Object.entries(workbook.Sheets)[0];
          let row = Object.keys(entries[1])[0];
          let num = row.replace(/[^0-9]/g, '');
          let range = parseInt(num) - 1;
          //console.log(XLSX.utils.sheet_to_json(worksheet, { raw: true }));
          var jsonSheet = XLSX.utils.sheet_to_json(worksheet, {
            raw: true,
            dateNF: 'yyyy-mm-dd',
            blankrows: false,
            range: range
          });
          this.arrayList = this.arrayList.concat(jsonSheet);
          resolve (fileReader.result);
        }
      });
      filePromises.push(filePromise);
    })
    Promise.all(filePromises).then(() => this.convertFileToData());
    
  }

  convertFileToData() {
    const pbrNo = loDash.nth(loDash.keys(this.arrayList[0]), 1)[3];
    this._data.setPbrNo(pbrNo);
    if (this.pbrNo) {
      if (this.dailyData) {
        const newArray = this.processDataDaily(this.arrayList);
        this._data.setPbrData(newArray);
      }else if (this.hourlyData) {
        const newArray = this.processDataHourly(this.arrayList);
        this._data.setPbrData(newArray);
      } else {
        var resultArray = this.arrayList.map((item: any) => {
          return {
            'Timestamp': new Date(item.Timestamp).toLocaleString('en-GB'),
            'CO2injection [off/ON]': item[`PBR${pbrNo}_CO2injection [off/ON]`],
            'Circ.Pump [Hz]': item[`PBR${pbrNo}_Circ.Pump [Hz]`],
            'Darktank [m3]': item[`PBR${pbrNo}_Darktank [m3]`],
            'Flow [l/min]': item[`PBR${pbrNo}_Flow [l/min]`],
            'Input LDO [ppm]': item[`PBR${pbrNo}_Input LDO [ppm]`],
            'Input [pH]': item[`PBR${pbrNo}_Input [pH]`],
            'Input [°C]': item[`PBR${pbrNo}_Input [°C]`],
            'Light [umol/m2/s]': item[`PBR${pbrNo}_Light [umol/m2/s]`],
            'Output LDO [ppm]': item[`PBR${pbrNo}_Output LDO [ppm]`],
            'Output [pH]': item[`PBR${pbrNo}_Output [pH]`],
            'Output [°C]': item[`PBR${pbrNo}_Output [°C]`],
            'Circ.Pump [A]': item[`PBR${pbrNo}_Circ.Pump [A]`],
          }
        });
        this._data.setPbrData(resultArray);
      }
    }
  }

  processDataHourly(arrayList) {
    let newArray = [];
    const pbrNo = this.pbrNo;
    const groupedByDay = this.groupByDay(arrayList);
    groupedByDay.forEach(el => {
      const groupedByHour = this.groupByHr(el);
      groupedByHour.forEach(it => {

        const reduced = it.reduce((acc, val) => {
          let time = new Date(val.Timestamp).getHours();
          if (!acc[time]) {
            acc[time] = { ...val, count: 1 }
            return acc;
          }
          acc[time][`PBR${pbrNo}_CO2injection [off/ON]`] || val[`PBR${pbrNo}_CO2injection [off/ON]`];
          acc[time][`PBR${pbrNo}_Circ.Pump [A]`] += val[`PBR${pbrNo}_Circ.Pump [A]`];
          acc[time][`PBR${pbrNo}_Circ.Pump [Hz]`] += val[`PBR${pbrNo}_Circ.Pump [Hz]`];
          acc[time][`PBR${pbrNo}_Darktank [m3]`] += val[`PBR${pbrNo}_Darktank [m3]`];
          acc[time][`PBR${pbrNo}_Flow [l/min]`] += val[`PBR${pbrNo}_Flow [l/min]`];
          acc[time][`PBR${pbrNo}_Input LDO [ppm]`] += val[`PBR${pbrNo}_Input LDO [ppm]`];
          acc[time][`PBR${pbrNo}_Input [pH]`] += val[`PBR${pbrNo}_Input [pH]`];
          acc[time][`PBR${pbrNo}_Input [°C]`] += val[`PBR${pbrNo}_Input [°C]`];
          acc[time][`PBR${pbrNo}_Light [umol/m2/s]`] += val[`PBR${pbrNo}_Light [umol/m2/s]`];
          acc[time][`PBR${pbrNo}_Output LDO [ppm]`] += val[`PBR${pbrNo}_Output LDO [ppm]`];
          acc[time][`PBR${pbrNo}_Output [pH]`] += val[`PBR${pbrNo}_Output [pH]`];
          acc[time][`PBR${pbrNo}_Output [°C]`] += val[`PBR${pbrNo}_Output [°C]`];
          acc[time].count += 1;
          return acc;
        }, {});

        const result = Object.keys(reduced).map(function (k) {
          const item = reduced[k];
          return {
            Timestamp: new Date(item.Timestamp).toLocaleString('en-GB'),
            'CO2injection [off/ON]': item[`PBR${pbrNo}_CO2injection [off/ON]`],
            'Circ.Pump [Hz]': item[`PBR${pbrNo}_Circ.Pump [Hz]`] / item.count,
            'Darktank [m3]': item[`PBR${pbrNo}_Darktank [m3]`] / item.count,
            'Flow [l/min]': item[`PBR${pbrNo}_Flow [l/min]`] / item.count,
            'Input LDO [ppm]': item[`PBR${pbrNo}_Input LDO [ppm]`] / item.count,
            'Input [pH]': item[`PBR${pbrNo}_Input [pH]`] / item.count,
            'Input [°C]': item[`PBR${pbrNo}_Input [°C]`] / item.count,
            'Light [umol/m2/s]': item[`PBR${pbrNo}_Light [umol/m2/s]`] / item.count,
            'Output LDO [ppm]': item[`PBR${pbrNo}_Output LDO [ppm]`] / item.count,
            'Output [pH]': item[`PBR${pbrNo}_Output [pH]`] / item.count,
            'Output [°C]': item[`PBR${pbrNo}_Output [°C]`] / item.count,
            'Circ.Pump [A]': item[`PBR${pbrNo}_Circ.Pump [A]`] / item.count,
          }
        })
        newArray = newArray.concat(result);
      });
    });
    return newArray;
  }

  processDataDaily(arrayList) {
    let newArray = [];
    const pbrNo = this.pbrNo;
    const groupedByDay = this.groupByDate(arrayList);
    groupedByDay.forEach(it => {
        const reduced = it.reduce((acc, val) => {
          let time = new Date(val.Timestamp).getDay();
          if (!acc[time]) {
            acc[time] = { ...val, count: 1 }
            return acc;
          }
          acc[time][`PBR${pbrNo}_CO2injection [off/ON]`] || val[`PBR${pbrNo}_CO2injection [off/ON]`];
          acc[time][`PBR${pbrNo}_Circ.Pump [A]`] += val[`PBR${pbrNo}_Circ.Pump [A]`];
          acc[time][`PBR${pbrNo}_Circ.Pump [Hz]`] += val[`PBR${pbrNo}_Circ.Pump [Hz]`];
          acc[time][`PBR${pbrNo}_Darktank [m3]`] += val[`PBR${pbrNo}_Darktank [m3]`];
          acc[time][`PBR${pbrNo}_Flow [l/min]`] += val[`PBR${pbrNo}_Flow [l/min]`];
          acc[time][`PBR${pbrNo}_Input LDO [ppm]`] += val[`PBR${pbrNo}_Input LDO [ppm]`];
          acc[time][`PBR${pbrNo}_Input [pH]`] += val[`PBR${pbrNo}_Input [pH]`];
          acc[time][`PBR${pbrNo}_Input [°C]`] += val[`PBR${pbrNo}_Input [°C]`];
          acc[time][`PBR${pbrNo}_Light [umol/m2/s]`] += val[`PBR${pbrNo}_Light [umol/m2/s]`];
          acc[time][`PBR${pbrNo}_Output LDO [ppm]`] += val[`PBR${pbrNo}_Output LDO [ppm]`];
          acc[time][`PBR${pbrNo}_Output [pH]`] += val[`PBR${pbrNo}_Output [pH]`];
          acc[time][`PBR${pbrNo}_Output [°C]`] += val[`PBR${pbrNo}_Output [°C]`];
          acc[time].count += 1;
          return acc;
        }, {});

        const result = Object.keys(reduced).map(function (k) {
          const item = reduced[k];
          return {
            Timestamp: new Date(item.Timestamp).toLocaleDateString('en-GB'),
            'CO2injection [off/ON]': item[`PBR${pbrNo}_CO2injection [off/ON]`],
            'Circ.Pump [Hz]': item[`PBR${pbrNo}_Circ.Pump [Hz]`] / item.count,
            'Darktank [m3]': item[`PBR${pbrNo}_Darktank [m3]`] / item.count,
            'Flow [l/min]': item[`PBR${pbrNo}_Flow [l/min]`] / item.count,
            'Input LDO [ppm]': item[`PBR${pbrNo}_Input LDO [ppm]`] / item.count,
            'Input [pH]': item[`PBR${pbrNo}_Input [pH]`] / item.count,
            'Input [°C]': item[`PBR${pbrNo}_Input [°C]`] / item.count,
            'Light [umol/m2/s]': item[`PBR${pbrNo}_Light [umol/m2/s]`] / item.count,
            'Output LDO [ppm]': item[`PBR${pbrNo}_Output LDO [ppm]`] / item.count,
            'Output [pH]': item[`PBR${pbrNo}_Output [pH]`] / item.count,
            'Output [°C]': item[`PBR${pbrNo}_Output [°C]`] / item.count,
            'Circ.Pump [A]': item[`PBR${pbrNo}_Circ.Pump [A]`] / item.count,
          }
        })
        newArray = newArray.concat(result);
        console.log(result)
      });
    return newArray;
  }

  groupByDate(arr) {
    const result = loDash.groupBy(arr, (el) => {
      let date = new Date(el.Timestamp);
      return new Date (date.getFullYear(), date.getMonth(), date.getDay());
    });
    return loDash.toArray(result)
  }

  groupByDay(arr) {
    const result = loDash.groupBy(arr, (el) => {
      return new Date(el.Timestamp).getDay();
    });
    return loDash.toArray(result)
  }

  groupByHr(arr) {
    const result = loDash.groupBy(arr, (el) => {
      return new Date(el.Timestamp).getHours();
    });
    //console.log(result);
    return loDash.toArray(result)
  }

  clearData() {
    this._data.setPbrData({});
    this.file = null;
    this.arrayBuffer = null;
    this.fileList = null;
  }

}
