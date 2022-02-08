import { Component, OnInit } from '@angular/core';
import { AnyForUntypedForms } from '@angular/forms';
import * as XLSX from 'xlsx';
import { DataService } from '../_services/data.service';

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

  constructor(private _data: DataService) { }

  ngOnInit() {
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
      this.avgHrData(arrayList)
      this._data.setPbrData(arrayList);
    }
  }

  avgHrData(arr) {
    let newArr = [];
    arr.forEach((el, i) => {
      debugger;
      const dt = new Date(el.Timestamp);

      if (newArr.length == 0) {
        newArr.push(el);
      } else {
        const nADt = new Date(newArr[i].Timestamp);
        if (dt.getDate() === nADt.getDate()) {
          if (dt.getHours() === nADt.getHours()) {
            const merged = Object.entries(newArr[i]).reduce((acc, [key, value]) =>
              // if key is already in map1, add the values, otherwise, create new pair
              ({ ...acc, [key]: (acc[key] || 0) + value })
              , { ...el });
            newArr[i] = merged;
          } else {
            //if hour is different
            newArr.push(el)
          }
        } else {
          //if day is different
          newArr.push(el)
        }
      }
    });
    console.log(newArr)

    // var index = datasets.findIndex(x => x.label == k);
    // if (index === -1) {
    //   datasets.push(obj)
    // }
  }

  clearData() {
    this._data.setPbrData({});
  }

}
