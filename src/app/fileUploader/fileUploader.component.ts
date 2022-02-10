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
  hourlyData: boolean = true;
  pbrNo: number;

  constructor(private _data: DataService) { }

  ngOnInit() {
    this._data.getPbrNo().subscribe(res => {
      this.pbrNo = res;
    })
  }

  setHourly(event) {
    this.hourlyData = event.checked;
    this._data.setPbrGroupedHrly(this.hourlyData);
  }

  addFile(event) {
    this.file = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(this.file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary", cellText: false, cellDates: true });
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
      //console.log(XLSX.utils.sheet_to_json(worksheet, { raw: true }));
      var arrayList = XLSX.utils.sheet_to_json(worksheet, { raw: true, dateNF: 'yyyy-mm-dd' });
      const pbrNo = loDash.nth(loDash.keys(arrayList[0]), 1)[3];
      this._data.setPbrNo(pbrNo);
      if (this.pbrNo) {
        if (this.hourlyData) {
          const newArray = this.processData(arrayList);
          this._data.setPbrData(newArray);
        } else {
          var resultArray = arrayList.map((item: any) => {
            return {
              'Timestamp': item.Timestamp,
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
  }

  processData(arrayList) {
    let newArray = [];
    const pbrNo = this.pbrNo;
      const groupedByDay = this.groupByDay(arrayList);
      groupedByDay.forEach(el => {
        const groupedByHour = this.groupByHr(el);
        groupedByHour.forEach(it => {

          const reduced = it.reduce((acc, val) => {
            let time = val.Timestamp.getHours();
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
              Timestamp: item.Timestamp,
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
