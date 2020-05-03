import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from "@microsoft/sp-loader";
import styles from './ViewRequestWebPart.module.scss';
import * as strings from 'ViewRequestWebPartStrings';
import { sp } from "@pnp/sp";
import "jquery"; 
require("bootstrap");
SPComponentLoader.loadCss("https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css");
SPComponentLoader.loadScript("https://cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js");
import '../../ExternalRef/css/style.css';  
declare var $;
var list = {
  ProcurementGoods: 'Procurement Goods'
};

export interface IViewRequestWebPartProps {
  description: string;
}

export default class ViewRequestWebPart extends BaseClientSideWebPart<IViewRequestWebPartProps> {
  public onInit(): Promise<void> {
    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context
      });
    });
  }
  public render(): void {
    this.domElement.innerHTML = `
    <table style="width:100%" id="FilesTable">
  <thead>
    <th>Project Name</th>
    <th>Project No</th>
    <th>Short Description</th>
    <th>Requested Warranty Time</th>
    <th>PNforZAS</th>
    <th>EstimatedcostJOD</th>
    <th>EstimatedcostEUR</th>
    <th>Specifications</th>
    <th>News paper advertisement</th>
  </thead>
  <tbody id="tblBody"></tbody>
</table>`;

    this.fetchData();

  } 
  async fetchData() {
    await sp.web.lists.getByTitle(list.ProcurementGoods).items.getAll().then((allItems: any[]) => {
      for (var index = 0; index < allItems.length; index++) {
        var element = allItems[index];
        $('#tblBody').append('<tr><td>' + element.ProjectName + '</td><td>' + element.ProjectNumber + '</td><td>' + element.ShortDescription + '</td><td>' + element.RequestedWarrantyTime + '</td><td>' + element.PNforZAS + '</td><td>' + element.EstimatedcostJOD + '</td><td>' + element.EstimatedcostEUR + '</td><td><a target="_blank" href="' + element.Specifications + '">' + element.Specifications + '</a></td><td><a target="_blank" href="' + element.EstimatedcostEUR + '">' + element.EstimatedcostEUR + '</a></td></tr>')
      }
    });
    var oTable = $("#FilesTable").DataTable( {
      columnDefs: [
      {"className": "dt-center", "targets": "_all"}
    ]
  })
  
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
