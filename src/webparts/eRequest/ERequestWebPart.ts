import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from "@microsoft/sp-loader";

import styles from './ERequestWebPart.module.scss';
import * as strings from 'ERequestWebPartStrings';

import 'jquery';
import * as moment from 'moment';
import { sp } from "@pnp/sp";
import "@pnp/polyfill-ie11"; 
import '../../ExternalRef/css/style.css';
import '../../ExternalRef/css/alertify.min.css';
import '../../ExternalRef/css/bootstrap-datepicker.min.css';
import '../../ExternalRef/js/bootstrap-datepicker.min.js';
//var moment: any =  require('../../../node_modules/moment/min/moment.min.js');
var alertify: any = require('../../ExternalRef/js/alertify.min.js');

SPComponentLoader.loadCss("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css");
declare var $;

export interface IERequestWebPartProps {
  description: string;
}

export default class ERequestWebPart extends BaseClientSideWebPart <IERequestWebPartProps> {

  public render(): void {
    this.domElement.innerHTML = `
    <div class="loading-modal"> 
    <div class="spinner-border" role="status"> 
    <span class="sr-only">Loading...</span>
  </div></div>
    <h4 class='page-heading'>E-Request</h4>
    <div class="row">
    <div class="col-sm-12">
      <div class="form-group">
        <label>E-Request Type:<span class="star">*</span></label>
        <select class="form-control" id="projectName">
          <option value="Select">Select</option>
          <option value="Goods">Goods Request</option>
          <option value="Service">Service Request</option>
          <option value="Subsidy">Local Subsidy</option>
          <option value="Lease">Lease Agreement</option>
          </select>
          </div>
        </div>
      </div>
    `;
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
