import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { escape } from "@microsoft/sp-lodash-subset";

import styles from "./EditrequestWebPart.module.scss";
import * as strings from "EditrequestWebPartStrings";
import { SPComponentLoader } from "@microsoft/sp-loader";

import "jquery";
import * as moment from "moment";
import { sp, EmailProperties } from "@pnp/sp";
import "@pnp/polyfill-ie11";
import "../../ExternalRef/css/style.css";
import "../../ExternalRef/css/alertify.min.css";
import "../../ExternalRef/css/bootstrap-datepicker.min.css";
import "../../ExternalRef/js/bootstrap-datepicker.min.js";
//var moment: any =  require('../../../node_modules/moment/min/moment.min.js');
var alertify: any = require("../../ExternalRef/js/alertify.min.js");
import * as html2pdf from "html2pdf.js";

SPComponentLoader.loadCss(
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
);
declare var $;

var filesuploaded = 0;
var fileslength = 0;
var siteURL = "";
var serverURL = "";
var CrntUserID = "";
var flgRepUser = false;
var formSubmitting = false;
var filesotherAttachment = [];
var ProjectDetails = [];
var filesQuantity = [];
var ProjectAvEmail = "";
var ProcuremntHeadEmail = "";
var _validFileExtensions = [".jpg", ".jpeg", ".bmp", ".gif", ".png", ".xlsx"];
var filename = "";
var RequestID = "";
var pdfdetails = [];
var ProcurementServiceFiles = [];
var arrAbtToDel = [];

var itemid;
var code;

var ChoicesServices = [
  "Direct Award",
  "Shortlisted tender",
  "Public tender",
  "Contract Amendment",
  "Request from a Framework Agreement",
];

export interface IEditrequestWebPartProps {
  description: string;
}

export default class EditrequestWebPart extends BaseClientSideWebPart<
  IEditrequestWebPartProps
> {
  public onInit(): Promise<void> {
    return super.onInit().then((_) => {
      sp.setup({
        spfxContext: this.context,
      });
    });
  }

  private readonly requestoptions = `
    
  <div class="loading-modal"> 
  <div class="spinner-border" role="status"> 
  <span class="sr-only">Loading...</span>
</div></div>
<div id="divforpdf" style="display:none;"></div>
  <h4 class='page-heading'>E-Request</h4>
  <div class="row">
  <div class="col-sm-6">
    <div class="form-group">
      <label>E-Request Type:<span class="star">*</span></label>
      <select class="form-control" id="DrpProjectName">
        <option value="Select">Select</option>
        <option value="Goods">Goods Request</option>
        <option value="Service">Service Request</option>
        <option value="Subsidy">Local Subsidy</option>
        <option value="Lease">Lease Agreement</option>
        <option value="idpp">IDPP</option>
        </select>
        </div>
      </div>
      <div id="divforsubcategory" class="col-sm-6"></div>
    </div>
    <div id='divRequest'></div> 

    
  `;

  private readonly requestcategoriesforgoods = `
    
  <div class="loading-modal"> 
  <div class="spinner-border" role="status"> 
  <span class="sr-only">Loading...</span>
</div></div>
  <!-- <div class="row"> -->
 <!-- <div class="col-sm-6"> -->
    <div class="form-group">
      <label>E-Request Categories:<span class="star">*</span></label>
      <select class="form-control" id="Drpreqcategories">
        <option value="Select">Select</option>
        <option value="goods">New Procurement of Goods</option>
        <option value="goodsamendment">Procurement of Goods Amendment</option>
        <option value="framework">Request from a Framework Agreement</option>
        </select>
        </div>
     <!-- </div> -->
   <!-- </div> -->

    
  `;

  private readonly requestcategoriesforservice = `
    
  <div class="loading-modal"> 
  <div class="spinner-border" role="status"> 
  <span class="sr-only">Loading...</span>
</div></div>
 <!-- <div class="row"> -->
 <!-- <div class="col-sm-6"> -->
    <div class="form-group">
      <label>E-Request Categories:<span class="star">*</span></label>
      <select class="form-control" id="Drpreqcategories">
        <option value="Select">Select</option>
        <option value="service">Procurement of Services</option>
        </select>
        </div>
        <!--   </div> -->
        <!--   </div> --> 

  <!--  <div id='divRequest'></div> -->
  `;

  private readonly requestcategoriesforsubsidy = `
    
  <div class="loading-modal"> 
  <div class="spinner-border" role="status"> 
  <span class="sr-only">Loading...</span>
</div></div>
 <!-- <div class="row"> 
   <div class="col-sm-12"> -->
    <div class="form-group">
      <label>E-Request Categories:<span class="star">*</span></label>
      <select class="form-control" id="Drpreqcategories">
        <option value="Select">Select</option>
        <option value="Subsidy">New Local Subsidy</option>
        <option value="Subsidyamendment">Local Subsidy Amendment</option>
        </select>
        </div>
     <!-- </div>
    </div> 
 
    <div id='divRequest'></div> -->
  `;

  private readonly requestcategoriesforlease = `
    
  <div class="loading-modal"> 
  <div class="spinner-border" role="status"> 
  <span class="sr-only">Loading...</span>
</div></div>
<!-- <div class="row">
  <div class="col-sm-12">
    <div class="form-group"> -->
      <label>E-Request Categories:<span class="star">*</span></label>
      <select class="form-control" id="Drpreqcategories">
        <option value="Select">Select</option>
        <option value="Lease">New Lease Agreement</option>
        <option value="Leaseamendment">Lease Agreement Amendment</option>
        </select>
        </div>
     <!-- </div>
    </div>

    <div id='divRequest'></div> -->
  `;

  private readonly commonHtml = `
  <div class="loading-modal"> 
  <div class="spinner-border" role="status"> 
  <span class="sr-only">Loading...</span>
</div>
</div>
  <h4 class='page-heading'>New Goods Request</h4>
  <div class="row">
  <div class="col-sm-6">
    <div class="form-group">
      <label>Project Name:<span class="star">*</span></label>
      <select class="form-control" id="projectName">
        <option value="Select">Select</option>
        </select>
        </div>
      </div>

      <div class="col-sm-6">
      <div class="form-group">
      <label>Project Number:<span class="star">*</span></label>
      <div class="numbers">
      <!--<input class="form-control" type="text" id="projectNumber" value="">-->
      <input id='txtProjectNum1' class="form-control prjctNum" type="text" readonly maxlength="2" placeholder="XX" />.
      <input id='txtProjectNum2' class="form-control prjctNum" type="text" readonly maxlength="4" placeholder="XXXX"/>.
      <input id='txtProjectNum3' class="form-control prjctNum" type="text" readonly maxlength="1" placeholder="X"/>_
      <input id='txtProjectNum4' class="form-control prjctNum" type="text"  maxlength="3" placeholder="XXX"/>.
      <input id='txtProjectNum5' class="form-control prjctNum" type="text"  maxlength="2" placeholder="XX"/>
      </div>
    </div>
    </div>
   
    </div>

    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
      <label>PN for ZAS:<span class="star">*</span></label>
      <div class="numbers">
      <!--<input class="form-control" type="text" id="pnForZAS" value="">-->
      <input id='txtpnforzas1' class="form-control prjctpnforzas" type="text" maxlength="2" placeholder="XX"/>.
      <input id='txtpnforzas2' class="form-control prjctpnforzas" type="text" maxlength="4" placeholder="XXXX"/>.
      <input id='txtpnforzas3' class="form-control prjctpnforzas" type="text" maxlength="1" placeholder="X"/>_
      <input id='txtpnforzas4' class="form-control prjctpnforzas" type="text" maxlength="3" placeholder="XXX"/>.
      <input id='txtpnforzas5' class="form-control prjctpnforzas" type="text" maxlength="2" placeholder="XX"/> 
      </div>
    </div>
    </div>
    <div class="col-sm-6">

    <div class="form-group">
      <label>Name of Budget Responsible Person (AV):<span class="star">*</span></label>
      <input class="form-control" type="text" id="NameofAV" value="" disabled>
    </div>
    </div>
    </div>
    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
    <label>KOMP Output :</label>
    <div>
    <input class="radio-stylish" type="checkbox" id="chkKomp" value="KOMP Output">
  <span class="checkbox-element"></span>
  <label class="stylish-label" for="chkKomp">KOMP</label>
    </div>
    </div>
    </div>
    <div id="divkompoutput" class="col-sm-6"></div>
  </div>
  `;

  private readonly newgoodskompcheckbox = `

  <div class="col-sm-6">
  <div class="form-group">
  <input type="text" id="percent" class="form-control" placeholder="Percentage(s)" value="">
  </div>
  </div>
  
  <div class="col-sm-6">
  <div class="form-group">
  <input type="text" id="outputnumber" class="form-control" placeholder=" Output number(s)" value="">
  </div>
  </div>
  
  `;

  /* 
  //summary
  Goods Request Html Start 
  //summary
  */
  private readonly newGoods = `
    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
      <label>Short Description:<span class="star">*</span></label>
      <textarea class="form-control" id="shortDescription"></textarea>
    </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
      <label>Specifications and Quantities:<span class="star">*</span></label>     
      <div class="input-group">
      <div class="custom-file">
      <input class="custom-file-input" type="file" id="fileQuantities"  multiple>
      <label class="custom-file-label" for="fileQuantities">Choose File</label>
      </div>
      </div>
      <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
      
      <div id="quantityFilesContainer" class="quantityFilesContainer"></div>
    </div>
    </div>
    </div>
    

    <div class="row">
    <div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish" id="neutralspec" type="radio" name="Specifications" value="Neutral Specifications" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="neutralspec">Neutral Specifications</label>
    </div>
    </div>
	
	<div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish" id="nonneutralspec" type="radio" name="Specifications" value="Nonneutral Specifications">
    <span class="radio-element"></span>
    <label class="stylish-label" for="nonneutralspec"> Nonneutral Specifications</label>
    </div>
  
    </div>
</div>

<div class="form-group" id="divnonneutralFile">

</div>

<div class="row">
<div class="col-sm-3">
<div class="form-group">
  <label>Estimated Cost :<span class="star">*</span></label> 
  <input placeholder='JOD' class="form-control" type="Number" id="JOD" value="">
</div>
</div>
<div class="col-sm-3">
<div class="form-group">
  <label>&nbsp;<span class="star"></span></label>
  <input placeholder='EUR' class="form-control" type="Number" id="EUR" value="">
  </div>
</div>

<div class="col-sm-6" id="divChkPublictender" style="display:none">
<label>&nbsp;<span class="star"></span></label>
<div class="form-group">
  <input class="radio-stylish" type="checkbox" id="chkPublictender" value="I would like to go with a public tender">
  <span class="checkbox-element"></span>
  <label class="stylish-label" for="chkPublictender">I would like to go with a public tender</label>
</div>
</div>
</div>


<div class="row">
<div class="col-sm-6">
<div class="form-group">
  <input class="radio-stylish" type="checkbox" id="chkMoreItem" value="My request contains more than one item">
  <span class="checkbox-element"></span>
  <label class="stylish-label" for="chkMoreItem">My request contains more than one item</label>
</div>
</div>

</div>
<div class="row">
<div class="col-sm-6">
<div class="form-group" id="divcostFile">

</div>
</div></div>


<div class="row">
<div class="col-sm-6">
<div class="form-group">
  <label id='lblshortlist'>Shortlist :</label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="fileShortlist" class="custom-file-input">        
  <label class="custom-file-label" id="fileShortlistFileName" for="fileShortlist">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
<div class="col-sm-6">
 <div class="form-group">
  <label>Technical Part of the Newspaper Advertisement:<span id="news-span" style="display:none" class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="newspaperFile" value="" class="custom-file-input">
  <label class="custom-file-label" for="newspaperFile">Choose File</label>
  </div>
  </div>
</div>
</div>
</div>


<div class="row">
<div class="col-sm-6">
<div class="form-group">
  <label>Requested Warranty Time :<span class="star">*</span></label>
   <select class="form-control" id="requestedWarrantyTime"></select>
</div>
</div>
  
<div class="col-sm-6">
<div class="form-group">
<label>Requested Delivery Time :<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="requestedDeliveryTime">
</div>
</div>
</div>

 
<div class="row">
<div class="col-sm-6">
<div class="form-group">
  <label>Delivery Address :<span class="star">*</span></label>
  <textarea class="form-control" id="deliveryAddress"></textarea>
</div></div>
</div>


<h4>Contact Person for Delivery :</h4>
<div id="lst-contact-details">
<div class="contact-details contact-detail0">
<div class="row">
<div class="col-sm-4">
<div class="form-group">
  <label>Name :<span class="star">*</span></label>
  <input type="text" class="contactName form-control" value="">
</div>
</div>

<div class="col-sm-4">
<div class="form-group">
<label>Email :<span class="star">*</span></label> <input type="email" class="contactEmail form-control" value="">
</div>
</div>

<div class="col-sm-4">
<div class="form-group">
<label>Phone Number :<span class="star">*</span></label> <input type="Number" class="contactPhoneNumber form-control" value="">
</div>
</div>

<div class="col-sm-3">
<!--<a class="remove-contact" data-class="contact-detail0">Remove</a>-->
</div>
</div>
</div>
</div>
<div class="form-group">
<input class="btn btn-primary" type="button" id="btnContact" value="Add contact">
</div>

<div class="row">
<div class="col-sm-6">
<div class="form-group">
<label>Other Attachments :<span class="star"></span></label>
<div class="input-group">      
<div class="custom-file">
<input type="file" name="myFile" id="others" multiple class="custom-file-input">
<label class="custom-file-label" for="others">Choose File</label>
</div>
</div>
<div><small class="text-primary">Note : Can add more than one file. </small></div>
<div class="quantityFilesContainer quantityFilesContainer-static" id="otherAttachmentFiles"></div></div></div></div>  
<div class="row">
<div class="col-sm-6">
<div class="form-group" id="spanKOMP" style='display:none'>
<label >KOMP :</label> <input type="text" id="KompOptPT" value="" class="form-control">
</div>
</div>
</div>
<div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
    <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>`;

  private readonly newdocHtml = `
<div class="row">
<div class="col-sm-6">
<div class="form-group">
<label id="lbljustification">justification<span class="star">*</span></label>
<div class="input-group">
<div class="custom-file">
  <input type="file" id="nonneutralFile" class="form-control custom-file-input">
  <label class="custom-file-label" for="nonneutralFile">Choose File</label>
  </div>
  </div>
  </div>
  </div>
  <div class="col-sm-6">
<div class="form-group">
<label id="lblVSRC">Valid Supplier’s Registration<span class="star">*</span></label>
<div class="input-group">
<div class="custom-file">
  <input type="file" id="VSRC" class="form-control custom-file-input">
  <label class="custom-file-label" for="VSRC">Choose File</label>
  </div>
  </div>
  </div>
  </div>
  </div>

  
  <div class="row">
<div class="col-sm-6">
<div class="form-group">
<label id="lblVSCP">Valid Supplier’s Company Profile<span class="star">*</span></label>
<div class="input-group">
<div class="custom-file">
  <input type="file" id="VSCP" class="form-control custom-file-input">
  <label class="custom-file-label" for="VSCP">Choose File</label>
  </div>
  </div>
  </div>
  </div>
  <div class="col-sm-6">
<div class="form-group">
<label id="lblVSSPAC">Sole Provider Certificate<span class="star">*</span></label>
<div class="input-group">
<div class="custom-file">
  <input type="file" id="VSSPAC" class="form-control custom-file-input">
  <label class="custom-file-label" for="VSSPAC">Choose File</label>
  </div>
  </div>
  </div>
  </div>
  </div>

  <div class='row'>

  <div class="col-sm-4">
    <div class="form-group">
    <label>Name Of Contact Person<span class="star">*</span></label>
    <input class="form-control" type="text" id="CntctPrsn" value="">
  </div>
    </div>

  <div class="col-sm-5">
  <div class="form-group">
  <label>Email :<span class="star">*</span></label> <input type="email" id='Email' class="form-control" value="">
  </div>
  </div>
  
  <div class="col-sm-3">
  <div class="form-group">
  <label>Mobile Number :<span class="star">*</span></label> <input type="Number" id='MobileNumber' class="form-control" value="">
  </div>
  </div>
  
</div>


`;

  private readonly newcostHtml = `
<div class="input-group">
<div class="custom-file">
<input type="file" id="costFile" class="custom-file-input">
<label class="custom-file-label" for="costFile">Choose File</label>
</div>
</div>
`;

  private readonly ProcurementofGoodsAmendment = `
<div class="row">
    <div class="col-sm-6">
    <div class="form-group">
      <label>ProSoft Number:<span class="star">*</span></label>
      <input class="form-control" type="number" id="prosoftnum" maxlength="8" value="">
    </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
     <label>Justification for Amendment:<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="justification" value="" class="custom-file-input">
     <label class="custom-file-label" for="justification">Choose File</label>
     </div>
     </div>
   </div>
   </div>
    </div>
    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
     <label id="lblNochange">Specifications and Quantities<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="fileQuantitiesNochange" value="" class="custom-file-input">
     <label class="custom-file-label" id="fileQuantitiesNochangeFileName" for="fileQuantitiesNochange">Choose File</label>
     </div>
     </div>
   </div>
   </div>
   <div class="col-sm-6">
<div class="form-group">
<label>Requested Delivery Time :<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="requestedDeliveryTime">
</div>
</div>
    </div>

    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
      <input class="radio-stylish" type="checkbox" id="chkNoChanges" value="No Changes">
      <span class="checkbox-element"></span>
      <label class="stylish-label" for="chkNoChanges">No Changes</label>
    </div>
    </div>
</div>

<div class="row">
<div class="col-sm-6">
 <div class="form-group">
  <label>Other Attachments</label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>
</div>
<div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
    <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>
`;

  private readonly RequestfromaFrameworkAgreement = `
<div class="row">
    <div class="col-sm-4">
    <div class="form-group">
      <input class="radio-stylish" type="radio" name="Agreement" id="ITFramework" value="IT Framework Agreement">
      <span class="radio-element"></span>
      <label class="stylish-label" for="ITFramework">IT Framework Agreement</label>
    </div>
    </div><div class="col-sm-4">
    <div class="form-group">
      <input class="radio-stylish" type="radio" name="Agreement" id="FurnitureFramework" value="Furniture Framework Agreement">
      <span class="radio-element"></span>
      <label class="stylish-label" for="FurnitureFramework">Furniture Framework Agreement</label>
    </div>
    </div>
    <div class="col-sm-4">
    <div class="form-group">
      <input class="radio-stylish" type="radio" name="Agreement" id="StationaryFramework" value="Stationary Framework Agreement">
      <span class="radio-element"></span>
      <label class="stylish-label" for="StationaryFramework">Stationary Framework Agreement</label>
    </div>
    </div>
  </div>

  <div class='row'> 
<div class="col-sm-3">
<div class="form-group">
<label>Estimated Cost<span class="star">*</span></label> <input type="Number"  placeholder="JOD" id='JOD' class="contactEmail form-control" value=""> 
</div>
</div>

<div class="col-sm-3">
<div class="form-group">
<label>&nbsp;<span class="star"></span></label> <input type="Number" placeholder="EUR" id='EUR' class="contactPhoneNumber form-control" value="">
</div>
</div>

<div class="col-sm-6">
 <div class="form-group">
  <label>Filled Catalogue</label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="FilledCatalogue" value="" class="custom-file-input">
  <label class="custom-file-label" for="FilledCatalogue">Choose File</label>
  </div>
  </div>
</div>
</div>
</div>

<div class='row'>
<div class="col-sm-6">
 <div class="form-group">
  <label>Additional Information<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="AdditionalInformation" value="" class="custom-file-input">
  <label class="custom-file-label" for="AdditionalInformation">Choose File</label>
  </div>
  </div>
</div>
</div>
</div>


<div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
    <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>
`;
  /* 
  //summary
  Goods Request Html End 
  //summary
  */

  /* 
  //summary
  Service Request Html Start 
  //summary
  */

  private readonly HtmlGoods = `<!--
  <div class="loading-modal"> 
  <div class="spinner-border" role="status"> 
  <span class="sr-only">Loading...</span>
</div></div>
  <h4 class='page-heading'>New Service Request</h4>
  <div class="row">
  <div class="col-sm-6">
    <div class="form-group">
      <label>Project Name:<span class="star">*</span></label>
      <select class="form-control" id="projectName">
        <option value="Select">Select</option>
        </select>
        </div>
      </div>

      <div class="col-sm-6">
      <div class="form-group">
      <label>Project Number:<span class="star">*</span></label>
      <input id='txtProjectNum1' class="form-control prjctNum" type="text" maxlength="2" />.
      <input id='txtProjectNum2' class="form-control prjctNum" type="text" maxlength="4" />.
      <input id='txtProjectNum3' class="form-control prjctNum" type="text" maxlength="1" />-
      <input id='txtProjectNum4' class="form-control prjctNum" type="text" maxlength="3" />.
      <input id='txtProjectNum5' class="form-control prjctNum" type="text" maxlength="2" />
    </div>
    </div>

    </div>

    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
      <label>PN for ZAS:<span class="star">*</span></label>
      <input class="form-control" type="text" id="pnForZAS" value="">
    </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
      <label>Name of AV:<span class="star">*</span></label>
      <input class="form-control" type="text" id="NameofAV" value="" disabled>
    </div>
    </div>
    </div>-->

    <div class="row">
    <div class="col-sm-12">
    <div class="form-group">
    <label>Please Explain Briefly Why You Need to Request to Subcontract the Service
    in Question (Rather than Implement the Service Using GIZ Staff): <span class="star">*</span></label>
    <textarea class="form-control" id="txtExplanation" rows="3"></textarea>
    </div>
    </div>
    </div>

    <div class="row">
    <!--<div class="col-sm-6">
    <div class="form-group">
      <label>KOMP Output<span class="star">*</span></label>
      <input class="form-control" type="text" id="KompOptPT" value="">
    </div>
    </div>-->
    <div class="col-sm-6">
    <div class="form-group">
      <label>Contracting Procedure<span class="star">*</span></label>
      <select class="form-control" id="choicesservices">
        <option value="Select">Select</option>
        </select>
    </div>
    </div>
    </div>

    <div id='ChoicesField'>
    </div>
    
<div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
    <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>

`;

  private readonly DirectAward = `
<div class='row'>
<div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish clsfirm" id="ConsultingFirm" type="radio" name="ConsultingFirm" value="ConsultingFirm" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="ConsultingFirm">ConsultingFirm</label>
    </div>
    </div>

    <div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish clsfirm" id="Appariser" type="radio" name="ConsultingFirm" value="Appariser"  />
    <span class="radio-element"></span>
    <label class="stylish-label" for="Appariser">Appariser</label>
    </div>
    </div>
</div>

    <div class='row'>
    <div class="col-sm-6">
    <div class="form-group">
      <label>Name Of Consulting Firm/Appariser<span class="star">*</span></label>
      <input class="form-control" type="text" id="NameOfFirm" value="">
    </div>
    </div>
    
    <div class="col-sm-6">
    <div class="form-group">
    <label>Area Of Activity<span class="star">*</span></label>
    <input class="form-control" type="text" id="AreaActivy" value="">
  </div>
    </div>
    </div>

    <div class='row'>
    <div class="col-sm-6">
    <div class="form-group">
      <label>Short Description:<span class="star">*</span></label>
      <textarea class="form-control" id="shortDescription"></textarea>
    </div>
    </div>

    <div class="col-sm-6">
    <div class="form-group">
      <label>Full Address<span class="star">*</span></label>
      <textarea class="form-control" id="FullAddress"></textarea>
    </div></div>
    </div>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
    <label>Contract Person from the Firm<span class="star">*</span></label>
    <input class="form-control" type="text" id="CntctPrsn" value="">
  </div>
    </div>

    <div class="col-sm-6">
    <div class="form-group">
    <label>Telephone Number<span class="star">*</span></label>
    <input class="form-control" type="Number" id="TeleNumber" value="">
  </div>
  </div>

    </div>

    <div class='row'>
<div class="col-sm-6">
<div class="form-group">
<label>Email :<span class="star">*</span></label> <input type="email" id='Email' id='Email' class="contactEmail form-control" value="">
</div>
</div>

<div class="col-sm-6">
<div class="form-group">
<label>Mobile Number :<span class="star">*</span></label> <input type="Number" id='MobileNumber' class="contactPhoneNumber form-control" value="">
</div>
</div>
</div>

<div class='row'>
    <div class="col-sm-6">
    <div class="form-group">
    <label>Duration of the assignment (From Date)<span class="star">*</span></label>
     <input class="form-control form-control-datepicker" type="text" id="Fromdate">
    </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
    <label>Duration of the assignment (To Date)<span class="star">*</span></label>
     <input class="form-control form-control-datepicker" type="text" id="Todate">
    </div>
    </div>
    </div>

<div class='row'>
<!--<div class="col-sm-6">
 <div class="form-group">
  <label>Estimated Cost<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Estimation" value="" class="custom-file-input">
  <label class="custom-file-label" for="Estimation">Choose File</label>
  </div>
  </div>
</div>
</div>-->

<div class="col-sm-3">
<div class="form-group">
  <label>Estimated Cost :<span class="star">*</span></label> 
  <input placeholder='JOD' class="form-control" type="Number" id="JOD" value="">
</div>
</div>
<div class="col-sm-3">
<div class="form-group">
  <label>&nbsp;<span class="star"></span></label>
  <input placeholder='EUR' class="form-control" type="Number" id="EUR" value="">
  </div>
</div>

<div class="col-sm-6" id="divForMarketSheet">
<div class="form-group">
  <label>Market Survey Sheet (showing unique characteristics) :<span class="star"></span></label>
  <input class="form-control" type="text" id="MarketSurvey" value="">
  </div>
</div>
</div>

<div class='row'>
<div class="col-sm-6">
 <div class="form-group">
  <label>Justification For Direct Award<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="justification" value="" class="custom-file-input">
  <label class="custom-file-label" for="justification">Choose File</label>
  </div>
  </div>
</div>
</div>
<div class="col-sm-6">
 <div class="form-group">
  <label>Terms Of Reference<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="terms" value="" class="custom-file-input">
  <label class="custom-file-label" for="terms">Choose File</label>
  </div>
  </div>
</div>
</div>

</div>

<div class="row">
<div class="col-sm-6">
 <div class="form-group">
  <label>Other Attachments<span class="star"></span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>
</div>
`;

  private readonly Shortlistedtender = `
<div class='row'>    
  <div class="col-sm-6">
    <div class="form-group">
      <label>Short Description of the Requested Service:<span class="star">*</span></label>
      <textarea class="form-control" id="shortDescription"></textarea>
  </div>
  </div>
  

  <div class="col-sm-6">
    <div class="form-group">
     <label>Shortlist<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="shortlist" value="" class="custom-file-input">
     <label class="custom-file-label" for="shortlist">Choose File</label>
     </div>
     </div>
   </div>
   </div>

</div>

  <div class='row'> 
  <div class="col-sm-6">
 <div class="form-group">
  <label>Estimated Cost<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Estimation" value="" class="custom-file-input">
  <label class="custom-file-label" for="Estimation">Choose File</label>
  </div>
  </div>
</div>
</div>

<div class="col-sm-3">
<div class="form-group">
<label>&nbsp;<span class="star"></span></label> <input type="Number"  placeholder="JOD" id='JOD' class="contactEmail form-control" value=""> 
</div>
</div>

<div class="col-sm-3">
<div class="form-group">
<label>&nbsp;<span class="star"></span></label> <input type="Number" placeholder="EUR" id='EUR' class="contactPhoneNumber form-control" value="">
</div>
</div>
</div>



<div class='row'>

<div class="col-sm-6">
 <div class="form-group">
  <label>Terms Of Reference<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="terms" value="" class="custom-file-input">
  <label class="custom-file-label" for="terms">Choose File</label>
  </div>
  </div>
</div>
</div>

<div class="col-sm-6">
<div class="form-group" id='divforJustification' style='display:none'>
 <label>Justification For Shortlisted Tender<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="justification" value="" class="custom-file-input">
 <label class="custom-file-label" for="justification">Choose File</label>
 </div>
 </div>
</div>
</div>

</div>

<div class='row'>
<div class="col-sm-6">
<div class="form-group">
<label>Duration of the assignment (From Date)<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="Fromdate">
 <span class="star">Note:please refer to the corresponding SLA</span>
</div>
</div>
<div class="col-sm-6">
<div class="form-group">
<label>Duration of the assignment (To Date)<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="Todate">
</div>
</div>
</div>

<div class='row'>
<div class="col-sm-6">
<div class="form-group">
 <label>Technical Assessment Grid<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="Assessment" value="" class="custom-file-input">
 <label class="custom-file-label" for="Assessment">Choose File</label>
 </div>
 </div>
</div>
</div>

<div class="col-sm-6">
 <div class="form-group">
  <label>Other Attachments<span class="star"></span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>

</div>
`;

  private readonly tender = `
<div class='row'>
<div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish" id="ConsultingFirm" type="radio" name="ConsultingFirm" value="ConsultingFirm" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="ConsultingFirm">ConsultingFirm</label>
    </div>
    </div>

    <div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish" id="Appariser" type="radio" name="ConsultingFirm" value="Appariser"  />
    <span class="radio-element"></span>
    <label class="stylish-label" for="Appariser">Appariser</label>
    </div>
    </div>
</div>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
      <label>Short Description of the Requested Service:<span class="star">*</span></label>
      <textarea class="form-control" id="shortDescription"></textarea>
  </div>
  </div>
  <div class="col-sm-6">
  <div class="form-group">
    <label>Grid for Assessing the Eligibility of Consulting Firms:<span class="star">*</span></label>
    <input class="form-control" id="gridforassess">
</div>
</div>
</div> 
<div class='row'>
<div class="col-sm-6">
 <div class="form-group">
  <label>Estimated Cost<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Estimation" value="" class="custom-file-input">
  <label class="custom-file-label" for="Estimation">Choose File</label>
  </div>
  </div>
</div>
</div>

<div class="col-sm-3">
<div class="form-group">
<label>&nbsp;<span class="star"></span></label> <input type="Number" id='JOD' placeholder='JOD' class="contactEmail form-control" value="">
</div>
</div>

<div class="col-sm-3">
<div class="form-group">
<label>&nbsp;<span class="star"></span></label> <input type="Number" id='EUR' placeholder='EUR'  class="contactPhoneNumber form-control" value="">
</div>
</div>
</div>

<div class='row'>

<div class="col-sm-6">
 <div class="form-group">
  <label>Terms Of Reference<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="terms" value="" class="custom-file-input">
  <label class="custom-file-label" for="terms">Choose File</label>
  </div>
  </div>
</div>
</div>

<div class="col-sm-6">
<div class="form-group">
 <label>Technical Assessment Grid<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="Assessment" value="" class="custom-file-input">
 <label class="custom-file-label" for="Assessment">Choose File</label>
 </div>
 </div>
</div>

</div>


</div>
<div class='row'>
<div class="col-sm-6">
<div class="form-group">
<label>Duration of the assignment (From Date)<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="Fromdate">
</div>
</div>
<div class="col-sm-6">
<div class="form-group">
<label>Duration of the assignment (To Date)<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="Todate">
</div>
</div>
</div>

<div class='row'>
<div class="col-sm-6">
 <div class="form-group">
  <label>Technical Part of the Newspaper Advertisement<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="newspaperFile" value="" class="custom-file-input">
  <label class="custom-file-label" for="newspaperFile">Choose File</label>
  </div>
  </div>
</div>
</div>
<div class="col-sm-6">
 <div class="form-group">
  <label>Other Attachments<span class="star"></span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>
</div>
`;

  private readonly ContractAmendment = ` 

<div class='row'>
   
<div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish CstExtension" id="NoCstExtn" type="radio" name="CstExtension" value="No Cost Extension" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="NoCstExtn">No Cost Extension</label>
    </div>
    </div>

    <div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish CstExtension" id="CstExtn" type="radio" name="CstExtension" value="Cost Extension" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="CstExtn">Cost Extension</label>
    </div>
    </div>

</div>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
      <label>Contract Number<span class="star">*</span></label>
      <!--<textarea class="form-control" id="CntrctNum"></textarea>-->
      <input class="form-control" type="number" id="CntrctNum" maxlength="10" />
  </div>
  </div>
  <div class="col-sm-6">
  <div class="form-group">
    <label>Short Description of the Requested Service:<span class="star">*</span></label>
    <textarea class="form-control" id="shortDescription"></textarea>
</div>
</div> 
</div>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
      <label>Full Address<span class="star">*</span></label>
      <textarea class="form-control" id="FullAddress"></textarea>
  </div>
  </div>
  <div class="col-sm-6">
    <div class="form-group">
    <label>Name Of Consulting Firm / Appraiser<span class="star">*</span></label>
    <input class="form-control" type="text" id="NameOfFirm" value="">
  </div>
  </div> 
</div>

<div class='row'>

<div class="col-sm-3">
<div class="form-group">
    <label>Contact Person<span class="star">*</span></label>
    <input class="form-control" type="text" id="CntctPrsn" value="">
    <div> <small class="text-primary">Note:In case of Firm please indicate name of contact person</small> </div>
  </div>
</div>
<div class="col-sm-3">
    <div class="form-group">
    <label>Telephone Number<span class="star">*</span></label>
    <input class="form-control" type="Number" id="TeleNumber" value="">
  </div>
  </div> 
  <div class="col-sm-3">
  <div class="form-group">
  <label>Email :<span class="star">*</span></label> <input type="email" id='Email' class="contactEmail form-control" value="">
  </div>
  </div>
  
  <div class="col-sm-3">
  <div class="form-group">
  <label>Mobile Number :<span class="star">*</span></label> <input type="Number" id='MobileNumber' class="contactPhoneNumber form-control" value="">
  </div>
  </div>
  </div>
  <!--<div class="row">
  <div class="col-sm-12">
  <div class="form-group">
  <span class="star">Note:In case of Firm please indicate name of contact person</span></div></div>
  </div>-->
  <div class='row'>
  <!--<div class="col-sm-6">
      <div class="form-group">
        <label>Justification For Extension<span class="star">*</span></label>
        <textarea class="form-control" id="justification"></textarea>
    </div>
    </div>-->

    <div class="col-sm-6">
    <div class="form-group">
     <label>Justification for Extension</label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="justification" value="" class="custom-file-input">
     <label class="custom-file-label" for="justification">Choose File</label>
     </div>
     </div>
   </div>
   </div>

    <div class="col-sm-6">
    <div class="form-group">
     <label>Modified Terms of Reference<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="terms" value="" class="custom-file-input">
     <label class="custom-file-label" for="terms">Choose File</label>
     </div>
     </div>
    </div>
    </div> 

  </div>

  <div class="row">
  <div class="col-sm-6">
  <div class="form-group">
   <label>Financial status of the done payments<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="Financialstatus" value="" class="custom-file-input">
   <label class="custom-file-label" for="Financialstatus">Choose File</label>
   </div>
   </div>
 </div>
  </div>
  <div id='divForEstimation'>
  </div>
  </div>
  <div class="row">
  <div class="col-sm-6">
    <div class="form-group">
      <input class="radio-stylish" type="checkbox" id="chkfinstatus" value="no payments were done">
      <span class="checkbox-element"></span>
      <label class="stylish-label" for="chkfinstatus">no payments were done</label>
    </div>
    </div>

  </div>
</div>
`;

  private readonly EstimationHMTL = `


<div class="col-sm-6">
 <div class="form-group">
  <label>Estimated Cost for the Extension<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Estimation" value="" class="custom-file-input">
  <label class="custom-file-label" for="Estimation">Choose File</label>
  </div>
  </div>
</div>


`;

  private readonly serviceRequestfromaFrameworkAgreement = `
<div class="row">
    <div class="col-sm-6">
    <div class="form-group">
    <input class="radio-stylish clsAgreement" id="EventFramework" type="radio" name="Agreement" value="Events Management Framework Agreement" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="EventFramework">Events Management Framework Agreement</label>
    </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
    <input class="radio-stylish clsAgreement" id="LegalFramework" type="radio" name="Agreement" value="Legal Services Framework Agreement" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="LegalFramework">Legal Services Framework Agreement</label>
    </div>
    </div>
</div>

<div class="row"> 
<div class="col-sm-3">
<div class="form-group">
<label>Estimated Cost<span class="star">*</span></label> <input type="Number" placeholder="JOD" id="JOD" class="contactEmail form-control" value=""> 
</div>
</div>

<div class="col-sm-3">
<div class="form-group">
<label>&nbsp;<span class="star"></span></label> <input type="Number" placeholder="EUR" id="EUR" class="contactPhoneNumber form-control" value="">
</div>
</div>
<div class='row' id='divforAgreement'>
</div>
</div>
<div class='row'>
<div class="col-sm-6">
 <div class="form-group">
  <label>Other Attachments</label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>
</div>
`;

  private readonly Htmlforfilledrequest = `
<div class="col-sm-6">
 <div class="form-group">
  <label>Terms Of Reference<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="terms" value="" class="custom-file-input">
  <label class="custom-file-label" for="terms">Choose File</label>
  </div>
  </div>
</div>
</div>`;
  private readonly Htmlforterms = `
<div class="col-sm-6">
<div class="form-group">
 <label>Filled Request Form for Legal Services<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="FilledRequest" value="" class="custom-file-input">
 <label class="custom-file-label" for="FilledRequest">Choose File</label>
 </div>
 </div>
</div>
</div>
`;
  /* 
  //summary
  Service Request Html End 
  //summary
  */

  /* 
  //summary
  subsidy Request Html start 
  //summary
  */
  private readonly LocalSubsidy = `

 <div class='row'>
 <div class="col-sm-6">
     <div class="form-group">
       <label>Short Description of the Requested Local Subsidy:<span class="star">*</span></label>
       <textarea class="form-control" id="shortDescription"></textarea>
   </div>
   </div>
   <div class="col-sm-6">
     <div class="form-group">
     <label>Name Of Beneficiary<span class="star">*</span></label>
     <input class="form-control" type="text" id="NameOfBenficiary" value="">
   </div>
   </div>
 
 </div>
 
 <div class='row'>
 <div class="col-sm-6">
     <div class="form-group">
       <label>Full Address<span class="star">*</span></label>
       <textarea class="form-control" id="FullAddress"></textarea>
   </div>
   </div>
   <div class="col-sm-6">
     <div class="form-group">
     <label>Telephone Number<span class="star">*</span></label>
     <input class="form-control" type="Number" id="TeleNumber" value="">
   </div>
   </div>
   
 </div>
 
 <div class='row'>
 
 <div class="col-sm-4">
 <div class="form-group">
     <label>Name Of Contact Person<span class="star">*</span></label>
     <input class="form-control" type="text" id="CntctPrsn" value="">
   </div>
 </div>
 
   <div class="col-sm-4">
   <div class="form-group">
   <label>Email :<span class="star">*</span></label> <input type="email" id='Email' class="contactEmail form-control" value="">
   </div>
   </div>
   
   <div class="col-sm-4">
   <div class="form-group">
   <label>Mobile Number :<span class="star">*</span></label> <input type="Number" id='MobileNumber' class="contactPhoneNumber form-control" value="">
   </div>
   </div>
   
 </div>
 
 <div class='row'>
 <div class="col-sm-6">
 <div class="form-group">
 <label>Duration of the assignment (From Date)<span class="star">*</span></label>
  <input class="form-control form-control-datepicker" type="text" id="Fromdate">
 </div>
 </div>
 <div class="col-sm-6">
 <div class="form-group">
 <label>Duration of the assignment (To Date)<span class="star">*</span></label>
  <input class="form-control form-control-datepicker" type="text" id="Todate">
 </div>
 </div>
 </div>
 
 <div class='row'>
 
 <div class="col-sm-6">
  <div class="form-group">
   <label>Project Proposal<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="Proposal" value="" class="custom-file-input">
   <label class="custom-file-label" for="Proposal">Choose File</label>
   </div>
   </div>
   </div>
   </div>
 
 <div class="col-sm-6">
  <div class="form-group">
   <label>Commercial & Legal Suitability Check<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="Suitability" value="" class="custom-file-input">
   <label class="custom-file-label" for="Suitability">Choose File</label>
   </div>
   </div>
   </div>
   </div>
 
 </div>
 
 <div class='row'>
 
 <div class="col-sm-6">
  <div class="form-group">
   <label>Budget Break-down<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="Budget" value="" class="custom-file-input">
   <label class="custom-file-label" for="Budget">Choose File</label>
   </div>
   </div></div></div>
 <div class="col-sm-6">
  <div class="form-group">
   <label>Registration Certificate<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="Certificate" value="" class="custom-file-input">
   <label class="custom-file-label" for="Certificate">Choose File</label>
   </div>
   </div></div></div>
   
 </div>
 
 <div class='row'> 
 <div class="col-sm-6">
 <div class="form-group">
 <label>Profile<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="Profile" value="" class="custom-file-input">
 <label class="custom-file-label" for="Profile">Choose File</label>
 </div>
 </div>
 </div>
 </div>
 
 <div class="col-sm-3">
 <div class="form-group">
 <label>Value of Local Subsidy:<span class="star">*</span></label> <input type="Number" id='JOD' placeholder='JOD' class="contactEmail form-control" value="">
 </div>
 </div>
 
 <div class="col-sm-3">
 <div class="form-group">
 <label>Value of Local Subsidy:<span class="star">*</span></label> <input type="Number" placeholder='EUR'  id='EUR' class="contactPhoneNumber form-control" value="">
 </div>
 </div>
 </div>
 
 <div class='row'>
 <div class="col-sm-6">
 <div class="form-group">
  <label>Bank Details<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="BankDetails" value="" class="custom-file-input">
  <label class="custom-file-label" for="BankDetails">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 <div class="col-sm-6">
  <div class="form-group">
   <label>Checklist for HQ Approval<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="HQApproval" value="" class="custom-file-input">
   <label class="custom-file-label" for="HQApproval">Choose File</label>
   </div>
   </div></div></div>
   </div>
   <div class='row'>

   <div class="col-sm-6">
  <div class="form-group">
   <label>Approval from the Prime Minister/ Authorized Ministry<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="MinisterApproval" value="" class="custom-file-input">
   <label class="custom-file-label" for="MinisterApproval">Choose File</label>
   </div>
   </div></div></div>

 <div class="col-sm-6">
  <div class="form-group">
   <label>Other Attachments<span class="star"></span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="others" value="" class="custom-file-input" multiple>
   <label class="custom-file-label" for="others">Choose File</label>
   </div>
   </div>
   <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
   <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
 </div>
 </div>
 </div>

 <div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
    <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>

 `;

  private readonly Localsubsidyamendment = `
 <div class="row">

    <div class="col-sm-6">
    <div class="form-group">
      <label>Local Subsidy CoSoft Number:<span class="star">*</span></label>
      <input class="form-control" type="number" id="cosoftnum" maxlength="8" value="">
    </div>
    </div>

    <div class="col-sm-6">
    <div class="form-group">
     <label>Prime Minister approval for the additional budget:<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="MinisterApproval" value="" class="custom-file-input">
     <label class="custom-file-label" for="MinisterApproval">Choose File</label>
     </div>
     </div>
   </div>
   </div>

    </div>
    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
     <label>Justification for Amendment:<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="justification" value="" class="custom-file-input">
     <label class="custom-file-label" for="justification">Choose File</label>
     </div>
     </div>
   </div>
   </div>

    <div class="col-sm-6">
  <div class="form-group">
   <label>Modified Project Proposal (signed and stamped):<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="Proposal" value="" class="custom-file-input">
   <label class="custom-file-label" for="Proposal">Choose File</label>
   </div>
   </div>
   </div>
   </div>

    </div>

    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
     <label>Modified Budget Breakdown (signed and stamped):<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="Budget" value="" class="custom-file-input">
     <label class="custom-file-label" for="Budget">Choose File</label>
     </div>
     </div></div></div>
    </div>

    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
     <label>Financial status of the done payments:<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="Financialstatus" value="" class="custom-file-input">
     <label class="custom-file-label" for="Financialstatus">Choose File</label>
     </div>
     </div>
   </div>
    </div>
    </div>
    <div class="row">
    <div class="col-sm-6">
      <div class="form-group">
        <input class="radio-stylish" type="checkbox" id="chkfinstatus" value="no payments were done">
        <span class="checkbox-element"></span>
        <label class="stylish-label" for="chkfinstatus">no payments were done</label>
      </div>
      </div>
  
    </div>

    <div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
    <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>
 `;
  /* 
  //summary
  subsidy Request Html End 
  //summary
  */

  /* 
  //summary
  Lease Request Html Start 
  //summary
  */
  private readonly HtmlForLeaseandsubsidy = `
 <div class="loading-modal"> 
 <div class="spinner-border" role="status"> 
 <span class="sr-only">Loading...</span>
</div></div>
 <h4 class='page-heading'>New Service Request</h4>
 <div class="row">
 <div class="col-sm-6">
   <div class="form-group">
     <label>Project Name:<span class="star">*</span></label>
     <select class="form-control" id="projectName">
       <option value="Select">Select</option>
       </select>
       </div>
     </div>

     <div class="col-sm-6">
     <div class="form-group">
     <label>Project Number:<span class="star">*</span></label>
     <!--<input class="form-control" type="text" id="projectNumber" value="">-->
     <input id='txtProjectNum1' class="form-control prjctNum" type="text" maxlength="2" />.
     <input id='txtProjectNum2' class="form-control prjctNum" type="text" maxlength="4" />.
     <input id='txtProjectNum3' class="form-control prjctNum" type="text" maxlength="1" />-
     <input id='txtProjectNum4' class="form-control prjctNum" type="text" maxlength="3" />.
     <input id='txtProjectNum5' class="form-control prjctNum" type="text" maxlength="2" />
   </div>
   </div>

   </div>

   <div class="row">
   <div class="col-sm-6">
   <div class="form-group">
     <label>PN for ZAS:<span class="star">*</span></label>
     <input class="form-control" type="text" id="pnForZAS" value="">
   </div>
   </div>
   <div class="col-sm-6">
   <div class="form-group">
     <label>Name of AV:<span class="star">*</span></label>
     <input class="form-control" type="text" id="NameofAV" value="" disabled>
   </div>
   </div>
   </div>

   <div class="row">
   <div class="col-sm-12">
   <div class="form-group">
     <label>KOMP Output<span class="star">*</span></label>
     <input class="form-control" type="text" id="KompOptPT" value="">
   </div>
   </div>
   </div>

   <div id='ChoicesField'>
   
   </div>
   
<div class="form-group" id='btnfinal'>
   <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
   <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>

`;

  private readonly LeaseAgreement = `
<div class='row'>

<div class="col-sm-6">
    <div class="form-group">
      <label>Short Description:<span class="star">*</span></label>
      <textarea class="form-control" id="shortDescription"></textarea>
  </div>
  </div>

  <div class="col-sm-6">
<div class="form-group">
 <label>Land Scheme<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="LandScheme" value="" class="custom-file-input">
 <label class="custom-file-label" for="LandScheme">Choose File</label>
 </div>
 </div>
</div></div>

</div>

<div class='row'>
<div class="col-sm-6">
<div class="form-group">
 <label>RMO Approval<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="RMOApproval" value="" class="custom-file-input">
 <label class="custom-file-label" for="RMOApproval">Choose File</label>
 </div>
 </div>
</div>
</div>

<div class="col-sm-6">
 <div class="form-group">
  <label>Country Director Approval<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="DirectorApproval" value="" class="custom-file-input">
  <label class="custom-file-label" for="DirectorApproval">Choose File</label>
  </div>
  </div>
</div>
</div>
</div>

<div class='row'>
<div class="col-sm-6">
<div class="form-group">
<label>Duration of the lease (From Date)<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="Fromdate">
</div>
</div>
<div class="col-sm-6">
<div class="form-group">
<label>Duration of the lease (To Date)<span class="star">*</span></label>
 <input class="form-control form-control-datepicker" type="text" id="Todate">
</div>
</div>
</div>

<div class='row'>
<div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish lessor" id="InduvLessor" type="radio" name="LessorPapers" value="Lessor is an Individual" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="InduvLessor">Lessor is an Individual</label>
    </div>
    </div>

    <div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish lessor" id="CmpnyLessor" type="radio" name="LessorPapers" value="Lessor is a Company" />
    <span class="radio-element"></span>
    <label class="stylish-label" for="CmpnyLessor">Lessor is a Company</label>
    </div>
    </div>


</div>

<div id='divlessor'>
</div>
<div class="form-group" id='btnfinal'>
   <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
   <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>

`;

  private readonly CompanyLessorHTML = `
<div id='DivCmpnyLessor'>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
      <label>Name Of Firm<span class="star">*</span></label>
      <input class="form-control" type="text" id="NameOfFirm" value="">
  </div>
  </div>

  <div class="col-sm-6">
<div class="form-group">
 <label>Registration Certificate<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="RegCert" value="" class="custom-file-input">
 <label class="custom-file-label" for="RegCert">Choose File</label>
 </div>
 </div>
</div></div>

</div>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
      <label>Full Address<span class="star">*</span></label>
      <textarea class="form-control" id="FullAddress"></textarea>
  </div>
  </div>
  <div class="col-sm-6">
    <div class="form-group">
    <label>Telephone Number<span class="star">*</span></label>
    <input class="form-control" type="Number" id="TeleNumber" value="">
  </div>
  </div>
  
</div>

<div class='row'>

<div class="col-sm-6">
    <div class="form-group">
    <label>Name Of Contact Person<span class="star">*</span></label>
    <input class="form-control" type="text" id="CntctPrsn" value="">
  </div>
    </div>

  <div class="col-sm-3">
  <div class="form-group">
  <label>Email :<span class="star">*</span></label> <input type="email" id='Email' class="contactEmail form-control" value="">
  </div>
  </div>
  
  <div class="col-sm-3">
  <div class="form-group">
  <label>Mobile Number :<span class="star">*</span></label> <input type="Number" id='MobileNumber' class="contactPhoneNumber form-control" value="">
  </div>
  </div>
  
</div>

<div class='row'>

<div class="col-sm-6">
 <div class="form-group">
  <label>Company Profile<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Profile" value="" class="custom-file-input">
  <label class="custom-file-label" for="Profile">Choose File</label>
  </div>
  </div>
</div>
</div>
<div class="col-sm-6">
<div class="form-group">
 <label>Bank Details<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="BankDetails" value="" class="custom-file-input">
 <label class="custom-file-label" for="BankDetails">Choose File</label>
 </div>
 </div>
</div>
</div>
</div>

<div class='row'>
<div class="col-sm-6">
 <div class="form-group">
  <label>Other Attachments<span class="star"></span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
  <div class="quantityFilesContainer quantityFilesContainer-static" id="otherAttachmentFiles"></div>
</div>
</div>
</div>

</div>
`;

  private readonly InduvLessorHTML = `
<div id='DivInduvLessor'>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
      <label>Lessor Name<span class="star">*</span></label>
      <input class="form-control" type="text" id="LessorName" value="">
  </div>
  </div>

  <div class="col-sm-6">
<div class="form-group">
 <label>Lessor ID<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="LessorID" value="" class="custom-file-input">
 <label class="custom-file-label" for="LessorID">Choose File</label>
 </div>
 </div>
</div></div>

</div>

<div class='row'>
<div class="col-sm-6">
    <div class="form-group">
      <label>Full Address<span class="star">*</span></label>
      <textarea class="form-control" id="FullAddress"></textarea>
  </div>
  </div>
  <div class="col-sm-6">
    <div class="form-group">
    <label>Phone Number<span class="star">*</span></label>
    <input class="form-control" type="Number" id="PhoneNumber" value="">
  </div>
  </div>
  
</div>

<div class='row'>

  <div class="col-sm-6">
  <div class="form-group">
  <label>Email :<span class="star">*</span></label> <input type="email" id='Email' class="contactEmail form-control" value="">
  </div>
  </div>
  
  <div class="col-sm-6">
  <div class="form-group">
  <label>Mobile Number :<span class="star">*</span></label> <input type="Number" id='MobileNumber' class="contactPhoneNumber form-control" value="">
  </div>
  </div>
  
</div>

<div class='row'>

<div class="col-sm-6">
 <div class="form-group">
  <label>Estate Ownership Documents<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="OwnershipDocs" value="" class="custom-file-input">
  <label class="custom-file-label" for="OwnershipDocs">Choose File</label>
  </div>
  </div>
</div>
</div>
<div class="col-sm-6">
<div class="form-group">
 <label>Bank Details<span class="star">*</span></label>
 <div class="input-group">
 <div class="custom-file">
 <input type="file" id="BankDetails" value="" class="custom-file-input">
 <label class="custom-file-label" for="BankDetails">Choose File</label>
 </div>
 </div>
</div>
</div>
</div>
<div class='row'>
<div class="col-sm-6">
 <div class="form-group">
  <label>Other Attachments<span class="star"></span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div> <small class="text-primary">Note : Can add more than one file. </small> </div>
  <div class="quantityFilesContainer quantityFilesContainer-static" id="otherAttachmentFiles"></div>
</div>
</div>
</div>

</div>
`;

  private readonly Leaseamendment = `
<div class="row">

    <div class="col-sm-6">
    <div class="form-group">
      <label>Lease Agreement CoSoft Number:<span class="star">*</span></label>
      <input class="form-control" type="number" id="cosoftnum" maxlength="8" value="">
    </div>
    </div>

    <div class="col-sm-6">
    <div class="form-group">
     <label>Justification for amendment</label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="justification" value="" class="custom-file-input">
     <label class="custom-file-label" for="justification">Choose File</label>
     </div>
     </div>
   </div>
   </div>

    </div>

    <div class="row">
    <div class="col-sm-6">
    <div class="form-group">
     <label>Financial status of the done payments:<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="Financialstatus" value="" class="custom-file-input">
     <label class="custom-file-label" for="Financialstatus">Choose File</label>
     </div>
     </div>
   </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
     <label>Modified offer by the lessor (signed and stamped) :<span class="star">*</span></label>
     <div class="input-group">
     <div class="custom-file">
     <input type="file" id="offer" value="" class="custom-file-input">
     <label class="custom-file-label" for="offer">Choose File</label>
     </div>
     </div></div></div>
    </div>
    <div class="row">
    <div class="col-sm-6">
      <div class="form-group">
        <input class="radio-stylish" type="checkbox" id="chkfinstatus" value="no payments were done">
        <span class="checkbox-element"></span>
        <label class="stylish-label" for="chkfinstatus">no payments were done</label>
      </div>
      </div>
  
    </div>

    <div class="form-group" id='btnfinal'>
   <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
   <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>


`;

  /* 
  //summary
  Lease Request Html End 
  //summary
  */

  /* 
  //summary
  IDPP Request Html start 
  //summary
*/

  //! Kali changes
  private readonly iDPP = `
 <div class='row'>
 <div class="col-sm-6">
     <div class="form-group">
       <label>Short Description:<span class="star">*</span></label>
       <textarea class="form-control" id="shortDescription"></textarea>
   </div>
   </div>
 </div>
 
 <div class='row'>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Company’s Registration Certificate<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="RegCert" value="" class="custom-file-input">
  <label class="custom-file-label" for="RegCert">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 <div class="col-sm-6">
  <div class="form-group">
   <label>Company Profile<span class="star">*</span></label>
   <div class="input-group">
   <div class="custom-file">
   <input type="file" id="Profile" value="" class="custom-file-input">
   <label class="custom-file-label" for="Profile">Choose File</label>
   </div>
   </div>
 </div>
 </div>
 
 </div>
 
 <div class='row'>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>CVs Of Experts<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Experts" value="" class="custom-file-input">
  <label class="custom-file-label" for="Experts">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Bank Details<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="BankDetails" value="" class="custom-file-input">
  <label class="custom-file-label" for="BankDetails">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 </div>
 
 <div class='row'>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Financial Reports<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="FinReport" value="" class="custom-file-input">
  <label class="custom-file-label" for="FinReport">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Summary Action Plan<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Actionplan" value="" class="custom-file-input">
  <label class="custom-file-label" for="Actionplan">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 </div>
 
 <div class='row'>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Brief concept For Agreement<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Agreement" value="" class="custom-file-input">
  <label class="custom-file-label" for="Agreement">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Budget Plan<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Budget" value="" class="custom-file-input">
  <label class="custom-file-label" for="Budget">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 </div>
 
 <div class='row'>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Vergabedok<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="Vergabedok" value="" class="custom-file-input">
  <label class="custom-file-label" for="Vergabedok">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 <div class="col-sm-6">
 <div class="form-group">
  <label>Competition Report <span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="CompetitionReport" value="" class="custom-file-input">
  <label class="custom-file-label" for="CompetitionReport">Choose File</label>
  </div>
  </div>
 </div>
 </div>
 
 </div>
 
 <div class='row'>
 <div class="col-sm-6">
 <div class="form-group">
 <label>Duration of the assignment (From Date)<span class="star">*</span></label>
  <input class="form-control form-control-datepicker" type="text" id="Fromdate">
 </div>
 </div>
 <div class="col-sm-6">
 <div class="form-group">
 <label>Duration of the assignment (To Date)<span class="star">*</span></label>
  <input class="form-control form-control-datepicker" type="text" id="Todate">
 </div>
 </div>
 </div>
 <div class="form-group" id='btnfinal'>
 <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
 <input class="btn btn-secondary" type="button" id="btnCancel" value="Cancel">
</div>
 `;
  /*
    //summary
  IDPP Request Html End 
  //summary
  */
  public render(): void {
    $(".pageHeader").hide();
    var that = this;
    this.domElement.innerHTML = this.requestoptions;
    siteURL = this.context.pageContext.site.absoluteUrl;
    serverURL = this.context.pageContext.site.serverRelativeUrl;

    itemid = getUrlParameter("itemid");
    code = getUrlParameter("code");

    LoadFileTypes();
    window.addEventListener("beforeunload", function (e) {
      /*if (!formSubmitting)
        {
            return undefined;
        }

        var confirmationMessage = 'It looks like you have been editing something. '
                                + 'If you leave before saving, your changes will be lost.';

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.*/
    });

    $("#DrpProjectName").change(async function () {
      formSubmitting = true;
      var requestHtml = "";
      $("#divRequest").html("");
      $("#divforsubcategory").html("");
      var projectname = $("#DrpProjectName option:selected").val();

      if (projectname == "Goods") requestHtml = that.requestcategoriesforgoods;
      else if (projectname == "Service")
        requestHtml = that.requestcategoriesforservice;
      else if (projectname == "Subsidy")
        requestHtml = that.requestcategoriesforsubsidy;
      else if (projectname == "Lease")
        requestHtml = that.requestcategoriesforlease;
      else if (projectname == "idpp") {
        requestHtml = that.commonHtml + that.iDPP;
      } else if (projectname == "Select") {
        requestHtml = "";
      }

      if (projectname != "idpp") {
        $("#divforsubcategory").html("");
        $("#divforsubcategory").html(requestHtml);
      } else {
        $("#divRequest").html("");
        $("#divRequest").html(requestHtml);
        await getLoggedInUserDetails();
        await LoadProjects();
      }

      if (projectname == "idpp") {
        //for the purpose of idpp option
        $("#Fromdate").datepicker({
          autoclose: true,
          daysOfWeekDisabled: [5, 6],
        });
        $("#Todate").datepicker({
          autoclose: true,
          daysOfWeekDisabled: [5, 6],
        });
      }
      if (projectname == "idpp") $(".page-heading").text("IDPP");
    });

    $(document).on("change", "#Drpreqcategories", async function () {
      formSubmitting = true;
      var requestHtml = "";
      var projectname = $("#Drpreqcategories option:selected").val();
      if (projectname == "goods") requestHtml = that.commonHtml + that.newGoods;
      else if (projectname == "goodsamendment")
        requestHtml = that.commonHtml + that.ProcurementofGoodsAmendment;
      else if (projectname == "framework")
        requestHtml = that.commonHtml + that.RequestfromaFrameworkAgreement;
      else if (projectname == "service")
        requestHtml = that.commonHtml + that.HtmlGoods;
      else if (projectname == "Subsidy")
        requestHtml = that.commonHtml + that.LocalSubsidy;
      else if (projectname == "Subsidyamendment")
        requestHtml = that.commonHtml + that.Localsubsidyamendment;
      else if (projectname == "Lease")
        requestHtml = that.commonHtml + that.LeaseAgreement;
      else if (projectname == "Leaseamendment")
        requestHtml = that.commonHtml + that.Leaseamendment;
      else requestHtml = "";

      $("#divRequest").html("");
      $("#divRequest").html(requestHtml);

      if (projectname == "goods")
        $(".page-heading").text("New Procurement of Goods");
      else if (projectname == "goodsamendment")
        $(".page-heading").text("Procurement of Goods Amendment");
      else if (projectname == "framework")
        $(".page-heading").text("Request from a Framework Agreement");
      else if (projectname == "service")
        $(".page-heading").text("Procurement of Services");
      else if (projectname == "Subsidy") {
        $(".page-heading").text("New Local Subsidy");
        $("#Fromdate").datepicker({
          autoclose: true,
          daysOfWeekDisabled: [5, 6],
        });
        $("#Todate").datepicker({
          autoclose: true,
          daysOfWeekDisabled: [5, 6],
        });
      } else if (projectname == "Subsidyamendment") {
        $(".page-heading").text("Local Subsidy Amendment");
      } else if (projectname == "Lease") {
        $(".page-heading").text("New Lease Agreement");
        $("#Fromdate").datepicker({ autoclose: true });
        $("#Todate").datepicker({ autoclose: true });
      } else if (projectname == "Leaseamendment") {
        $(".page-heading").text("Lease Agreement Amendment");
      }

      if (projectname == "Lease") {
        $("#ChoicesField").html("");
        $("#ChoicesField").html(that.LeaseAgreement);
        $("#Fromdate").datepicker({ autoclose: true });
        $("#Todate").datepicker({ autoclose: true });
      } else if (projectname == "Subsidy") {
        $("#ChoicesField").html("");
        $("#ChoicesField").html(that.LocalSubsidy);
        $("#Fromdate").datepicker({ autoclose: true });
        $("#Todate").datepicker({ autoclose: true });
      }

      await getLoggedInUserDetails();
      await LoadProjects();
      await LoadServices();

      $("#requestedDeliveryTime").datepicker({
        autoclose: true,
        daysOfWeekDisabled: [5, 6],
      });
      for (let index = 0; index <= 20; index++) {
        $("#requestedWarrantyTime").append(
          '<option value="' + index + '">' + index + "</option>"
        );
      }
    });

    /* 
    //Summary
    New Goods Request Events start 
    //Summary
    */
    $(document).on("change", "#projectName", function () {
      /*if ($("#projectName").val() == 'MWR II' || $("#projectName").val() == 'RWU II') 
      {
        $('#spanKOMP').show();
      } 
      else 
      {
        $('#komp').val('');
        $('#spanKOMP').hide();
      }*/

      $("#NameofAV").val($("#projectName option:selected").attr("proj-av"));
      ProjectAvEmail = $("#projectName option:selected").attr("proj-av-email");
      ProcuremntHeadEmail = $("#projectName option:selected").attr(
        "proj-HOP-email"
      );
      var PrjctNum = $("#projectName option:selected").attr("Proj-Num");
      var PrjctNum1 = PrjctNum.split("-");
      var PrjctNum2 = PrjctNum1[0].split(".");
      var PrjctNum3 = PrjctNum1[1].split(".");
      $("#txtProjectNum1").val(PrjctNum2[0]);
      $("#txtProjectNum2").val(PrjctNum2[1]);
      $("#txtProjectNum3").val(PrjctNum2[2]);
      $("#txtProjectNum4").val(PrjctNum3[0]);
      $("#txtProjectNum5").val(PrjctNum3[1]);
    });

    $(document).on("change", "input[name='Specifications']", function () {
      if (
        $("input[name='Specifications']:checked").val() ==
        "Nonneutral Specifications"
      ) {
        $("#divnonneutralFile").html("");
        $("#divnonneutralFile").html(that.newdocHtml);
      } else {
        $("#divnonneutralFile").html("");
      }
    });

    $(document).on("change", "#chkMoreItem", function () {
      if ($(this).prop("checked")) {
        $("#divcostFile").html("");
        $("#divcostFile").html(that.newcostHtml);
      } else {
        $("#divcostFile").html("");
      }
    });

    $(document).on("click", "#btnContact", function () {
      addContact();
    });

    $(document).on("click", ".clsRemove", function () {
      console.log(filesQuantity);
      //var filename=$(this).attr('filename');
      var filename = $(this).parent().children()[0].innerText;
      removeQuantityfile(filename);
      $(this).parent().remove();
    });

    $(document).on("click", ".clsothersRemove", function () {
      var filename = $(this).parent().children()[0].innerText;
      removeOthersfile(filename);
      $(this).parent().remove();
    });

    $(document).on("click", ".clsdeleteattachment", function () {
      var filename = $(this).parent().children()[0].innerText;
      arrAbtToDel.push({
        FolderName: "OthersOrQuantity",
        files: "N/A",
        previousfileid: $(this).attr("fileid"),
      });
      $(this).parent().remove();
    });

    $(document).on("change", "#fileQuantities", function () {
      if ($(this)[0].files.length > 0) {
        for (let index = 0; index < $(this)[0].files.length; index++) {
          const file = $("#fileQuantities")[0].files[index];
          if (ValidateSingleInput($("#fileQuantities")[0])) {
            filesQuantity.push(file);
            $("#quantityFilesContainer").append(
              '<div class="quantityFiles">' +
                '<span class="upload-filename">' +
                file.name +
                "</span>" +
                "<a filename='" +
                file.name +
                "' class=clsRemove href='#'>x</a></div>"
            );
          }
        }
        $(this).val("");
        $(this).parent().find("label").text("Choose File");
      }
    });

    $(document).on("change", "#others", function () {
      if ($(this)[0].files.length > 0) {
        for (let index = 0; index < $(this)[0].files.length; index++) {
          const file = $("#others")[0].files[index];
          if (ValidateSingleInput($("#others")[0])) {
            filesotherAttachment.push(file);
            $("#otherAttachmentFiles").append(
              '<div class="quantityFiles">' +
                "<span class=upload-filename>" +
                file.name +
                "</span>" +
                "<a filename='" +
                file.name +
                "' class=clsothersRemove href='#'>x</a></div>"
            );
          }
        }
        $(this).val("");
        $(this).parent().find("label").text("Choose File");
      }
    });

    $(document).on("click", ".remove-contact", function () {
      $("#btnContact").show();
      var clsname = $(this).attr("data-class");
      $("." + clsname).remove();
      if ($(".contact-details").length == 0) {
        addContact();
      }
    });
    /* 
    //Summary
    New Goods Request Events End 
    //Summary
    */

    /* 
    //Summary
    service Request Events Start 
    //Summary
    */
    $(document).on("change", "#choicesservices", function () {
      $("#ChoicesField").html("");
      var selectedservice = $("#choicesservices option:selected").val();
      if (selectedservice == "Direct Award")
        $("#ChoicesField").html(that.DirectAward);
      else if (selectedservice == "Shortlisted tender")
        $("#ChoicesField").html(that.Shortlistedtender);
      else if (selectedservice == "Public tender")
        $("#ChoicesField").html(that.tender);
      else if (selectedservice == "Local Subsidy")
        $("#ChoicesField").html(that.LocalSubsidy);
      else if (selectedservice == "Lease Agreement") {
        $("#ChoicesField").html(that.LeaseAgreement);
        $("#divlessor").html("");
        //$('#divlessor').append(that.CompanyLessorHTML);
      } else if (selectedservice == "iDPP") $("#ChoicesField").html(that.iDPP);
      else if (selectedservice == "Contract Amendment")
        $("#ChoicesField").html(that.ContractAmendment);
      else if (selectedservice == "Request from a Framework Agreement")
        $("#ChoicesField").html(that.serviceRequestfromaFrameworkAgreement);

      $("#Fromdate").datepicker({
        autoclose: true,
        daysOfWeekDisabled: [5, 6],
      });
      $("#Todate").datepicker({ autoclose: true, daysOfWeekDisabled: [5, 6] });
    });

    $(document).on("change", ".CstExtension", function () {
      if (
        $("input[name='CstExtension']:checked").val() == "No Cost Extension"
      ) {
        $("#divForEstimation").html("");
        //$('#divForEstimation').append(that.EstimationHMTL);
      } else {
        $("#divForEstimation").html("");
        $("#divForEstimation").append(that.EstimationHMTL);
      }
    });

    $(document).on("change", ".lessor", function () {
      if (
        $("input[name='LessorPapers']:checked").val() ==
        "Lessor is an Individual"
      ) {
        $("#divlessor").html("");
        $("#divlessor").append(that.InduvLessorHTML);
      } else {
        $("#divlessor").html("");
        $("#divlessor").append(that.CompanyLessorHTML);
      }
    });

    $(document).on("change", ".clsAgreement", function () {
      if (
        $("input[name='Agreement']:checked").val() ==
        "Events Management Framework Agreement"
      ) {
        $("#divforAgreement").html("");
        $("#divforAgreement").html(that.Htmlforfilledrequest);
        $("#JOD").val("");
        $("#EUR").val("");
        $("#JOD").prop("disabled", false);
        $("#EUR").prop("disabled", false);
      } else {
        $("#divforAgreement").html("");
        $("#divforAgreement").html(that.Htmlforterms);
        $("#JOD").val("");
        $("#EUR").val("");
        $("#JOD").prop("disabled", true);
        $("#EUR").prop("disabled", true);
      }
    });

    /* 
    //Summary
    service  Request Events End 
    //Summary
    */

    /* 
    //Summary
    Common Events start.. 
    //Summary
    */
    $(document).on("change", ".custom-file-input", function () {
      if (ValidateSingleInput($(this)[0])) {
        if ($(this).val()) {
          var fileValue = $(this).val();
          // returns string containing everything from the end of the string
          //   that is not a back/forward slash or an empty string on error
          //   so one can check if return_value===''
          (typeof fileValue === "string" &&
            (fileValue = fileValue.match(/[^\\\/]+$/)) &&
            fileValue[0]) ||
            "";

          $(this)
            .parent(".custom-file")
            .find(".custom-file-label")
            .text(fileValue[0]);
        } else {
          //alertify.set('notifier', 'position', 'top-right');
          //alertify.error('Please select file');
          $(this).parent().find("label").text("Choose File");
        }
      }
    });

    $(document).on("click", "#btnSubmit", function () {
      formSubmitting = false;
      if ($("#Drpreqcategories option:selected").val() == "goods")
        CreateGoodsRequest();
      else if ($("#Drpreqcategories option:selected").val() == "goodsamendment")
        creategoodsamendment();
      else if ($("#Drpreqcategories option:selected").val() == "framework")
        createrequestframework();
      else if ($("#Drpreqcategories option:selected").val() == "service")
        CreateService();
      else if ($("#Drpreqcategories option:selected").val() == "Subsidy")
        CreateSubsidy();
      else if (
        $("#Drpreqcategories option:selected").val() == "Subsidyamendment"
      )
        CreateSubsidyAmendemnt();
      else if ($("#Drpreqcategories option:selected").val() == "Lease")
        CreateLeaseAgreement();
      else if ($("#Drpreqcategories option:selected").val() == "Leaseamendment")
        CreateLeaseamendment();
      else if ($("#DrpProjectName option:selected").val() == "idpp")
        createIdpp();
    });

    $(document).on("click", "#btnCancel", function () {
      window.location.href = siteURL + "/SitePages/RequestDashboard.aspx";
    });

    $(document).on("blur", "#EUR", function () {
      if ($("#DrpProjectName option:selected").val() == "Goods") {
        if ($("#EUR").val() > 20000) {
          $("#fileShortlist").val("");
          $("#fileShortlistFileName").text("Choose File");
          $("#fileShortlist").prop("disabled", true);
          $("#lblshortlist").text("Shortlist : (Not Selectable)");
          $("#divChkPublictender").hide();
          $("#news-span").show();
        } else if ($("#EUR").val() <= 20000) {
          $("#fileShortlist").prop("disabled", false);
          $("#lblshortlist").text("Shortlist :");
          $("#divChkPublictender").show();
          $("#chkPublictender").prop("checked", false);
          $("#news-span").hide();
        }
      } else if ($("#DrpProjectName option:selected").val() == "Service") {
        if (
          $(this).val() >= 50000 &&
          $("#choicesservices option:selected").val() == "Shortlisted tender"
        ) {
          $("#divforJustification").show();
        } else {
          $("#divforJustification").hide();
          $("#justification").val("");
          $("#justification").text("Choose File");
        }
      }
    });

    $(document).on("keyup", ".prjctNum", function () {
      if (this.value.length == this.maxLength) {
        var $next = $(this).next(".prjctNum");
        if ($next.length) $(this).next(".prjctNum").focus();
        else $(this).blur();
      }
    });

    $(document).on("keyup", ".prjctpnforzas", function () {
      if (this.value.length == this.maxLength) {
        var $next = $(this).next(".prjctpnforzas");
        if ($next.length) $(this).next(".prjctpnforzas").focus();
        else $(this).blur();
      }
    });

    $(document).on("change", "#chkKomp", function () {
      if ($(this).prop("checked")) {
        $("#divkompoutput").html("");
        $("#divkompoutput").html(that.newgoodskompcheckbox);
      } else {
        $("#divkompoutput").html("");
      }
    });

    $(document).on("change", "#chkPublictender", function () {
      if ($("#chkPublictender").prop("checked")) {
        $("#fileShortlist").val("");
        $("#fileShortlistFileName").text("Choose File");
        $("#fileShortlist").prop("disabled", true);
        $("#lblshortlist").text("Shortlist : (Not Selectable)");
      } else {
        $("#fileShortlist").prop("disabled", false);
        $("#lblshortlist").text("Shortlist :");
        $("#divChkPublictender").show();
        $("#chkPublictender").prop("checked", false);
      }
    });

    $(document).on("change", "#chkNoChanges", function () {
      if ($("#chkNoChanges").prop("checked")) {
        $("#fileQuantitiesNochange").val("");
        $("#fileQuantitiesNochangeFileName").text("Choose File");
        $("#fileQuantitiesNochange").prop("disabled", true);
        $("#lblNochange").text(
          "Specifications and Quantities:(Not Selectable)"
        );
      } else {
        $("#fileQuantitiesNochange").prop("disabled", false);
        $("#lblNochange").html(
          "Specifications and Quantities:<span class='star'>*</span>"
        );
      }
    });

    $(document).on("change", ".clsfirm", function () {
      if ($("input[name='ConsultingFirm']:checked").val() != "ConsultingFirm") {
        $("#CntctPrsn").val("");
        $("#CntctPrsn").prop("disabled", true);
      } else {
        $("#CntctPrsn").val("");
        $("#CntctPrsn").prop("disabled", false);
      }
    });
    /* 
    //Summary
    Common Events End... 
    //Summary
    */
    if(code)
    {
      if (code.toLowerCase() == "goods") FetchGoodsDetails();
      else if (code.toLowerCase() == "service") FetchserviceDetails();
      else if (code.toLowerCase() == "subsidy") FetchLocalSubsidy();
      else if (code.toLowerCase() == "lease") FetchLeaseAgreement();
      else if (code.toLowerCase() == "idpp") Fetchidpp();
    }
    else
    {
      AlertMessage("No Records Found");
    }

  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}

/* 
//summary
goods request fucntionalities start
//summary 
*/

function addContact() {
  if ($(".contact-details").length < 3) {
    var newcontact = `<div class="contact-details clsname">
    <div class="row">
    <div class="col-sm-4">
    <div class="form-group">
    <label>Name :<span class="star">*</span></label> <input type="text" class="contactName form-control" value=""></div></div>
    <div class="col-sm-4"><div class="form-group">
    <label>Email :<span class="star">*</span></label> <input type="email" class="contactEmail form-control" value=""></div></div>
    <div class="col-sm-4"><div class="form-group">
    <label>Phone number :<span class="star">*</span></label> <input type="text" class="contactPhoneNumber form-control" value=""><span class='cross-pos'>removetag</span></div></div></div>
    </div>`;
    var clsname = "contact-detail" + $(".contact-details").length;
    newcontact = newcontact.replace("clsname", clsname);
    newcontact = newcontact.replace(
      "removetag",
      '<a class="remove-contact" data-class="' + clsname + '">X</a>'
    );
    $("#lst-contact-details").append(newcontact);
  }
  if ($(".contact-details").length == 3) {
    $("#btnContact").hide();
  } else {
    $("#btnContact").show();
  }
}

function removeQuantityfile(filename) {
  for (var i = 0; i < filesQuantity.length; i++) {
    if (filesQuantity[i].name == filename) {
      ///filesQuantity[i].remove();
      filesQuantity.splice(i, 1);
      break;
    }
  }
}

function removeOtherfile(filename) {
  for (var i = 0; i < filesotherAttachment.length; i++) {
    if (filesotherAttachment[i].name == filename) {
      ///filesQuantity[i].remove();
      filesotherAttachment.splice(i, 1);
      break;
    }
  }
}

function CreateGoodsRequest() {
  let arrFiles = [];
  if (MandatoryValidation()) {
    $(".loading-modal").addClass("active");
    $("body").addClass("body-hidden");

    let DelivertimeTime = new Date(
      Date.parse(
        moment($("#requestedDeliveryTime").val(), "MM/DD/YYYY").format(
          "YYYY-MM-DD"
        )
      )
    ).toISOString();

    let moreitem = "No";
    if ($("#chkMoreItem").prop("checked")) {
      moreitem = "Yes";
    }

    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }
    let Servicedata = {
      ProjectName: $("#projectName option:selected").val(),
      ProjectNumber: projectNumber,
      PNForZAS: txtpnForZAS,
      NameOfAV: $("#NameofAV").val(),
      AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
      //  ,
      RepresentativeId: {
        results: ProjectDetails[ProjectIndex].RepId,
      },
      Specifications: $("input[name='Specifications']:checked").val(),
      KOMPOuput: $("#KompOptPT").val(),
      GoodsCategory: $("#Drpreqcategories option:selected").val(),
      ShortDesc: $("#shortDescription").val(),
      RequestItem: moreitem,
      JOD: $("#JOD").val(),
      EUR: $("#EUR").val(),
      isPublictender: $("#chkPublictender").prop("checked"),
      DeliveryTime: DelivertimeTime,
      WarrantyTime: $("#requestedWarrantyTime option:selected").val(),
      FullAddress: $("#deliveryAddress").val(),
      ContactPersonName: $("#CntctPrsn").val(),
      PersonEmail: $("#Email").val(),
      PersonMobile: $("#MobileNumber").val(),
      isKompOutput: $("#chkKomp").prop("checked"),
      kompPercent: $("#percent").val(),
      KompOutputNumber: $("#outputnumber").val(),
    };

    if ($("#chkMoreItem").prop("checked")) {
      if ($("#costFile")[0].files.length > 0)
        arrFiles.push({
          FolderName: "CostFile",
          files: $("#costFile")[0].files,
          previousfileid: $("label[for='costFile']").attr("previousfileid"),
        });
    }

    if (
      $("input[name='Specifications']:checked").val() ==
      "Nonneutral Specifications"
    ) {
      if ($("#nonneutralFile")[0].files.length > 0)
        arrFiles.push({
          FolderName: "NeutralSpecfication",
          files: $("#nonneutralFile")[0].files,
          previousfileid: $("label[for='nonneutralFile']").attr(
            "previousfileid"
          ),
        });

      if ($("#VSRC")[0].files.length > 0)
        arrFiles.push({
          FolderName: "VSRC",
          files: $("#VSRC")[0].files,
          previousfileid: $("label[for='VSRC']").attr("previousfileid"),
        });
      if ($("#VSCP")[0].files.length > 0)
        arrFiles.push({
          FolderName: "VSCP",
          files: $("#VSCP")[0].files,
          previousfileid: $("label[for='VSCP']").attr("previousfileid"),
        });
      if ($("#VSSPAC")[0].files.length > 0)
        arrFiles.push({
          FolderName: "VSSPAC",
          files: $("#VSSPAC")[0].files,
          previousfileid: $("label[for='VSSPAC']").attr("previousfileid"),
        });
    }

    if ($("#newspaperFile")[0].files.length > 0)
      arrFiles.push({
        FolderName: "NewsAdvertisement",
        files: $("#newspaperFile")[0].files,
        previousfileid: $("label[for='newspaperFile']").attr("previousfileid"),
      });

    if (filesQuantity.length > 0) {
      for (var i = 0; i < filesQuantity.length; i++) {
        var files = [];
        files.push(filesQuantity[i]);
        arrFiles.push({ FolderName: "Quantities", files: files });
      }
    }

    if ($("#fileShortlist")[0].files.length > 0) {
      arrFiles.push({
        FolderName: "ShortList",
        files: $("#fileShortlist")[0].files,
        previousfileid: $("label[for='fileShortlist']").attr("previousfileid"),
      });
    }

    if (filesotherAttachment.length > 0) {
      for (var i = 0; i < filesotherAttachment.length; i++) {
        var files = [];
        files.push(filesotherAttachment[i]);
        arrFiles.push({ FolderName: "Others", files: files });
      }
    }

    pdfdetails = [];
    pdfdetails.push({
      Title: "Project Name",
      Value: $("#projectName option:selected").val(),
    });
    pdfdetails.push({ Title: "Project Number", Value: projectNumber });
    pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
    pdfdetails.push({
      Title: "Name of Budget Responsible Person (AV)",
      Value: $("#NameofAV").val(),
    });
    if ($("#chkKomp").prop("checked")) {
      pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
      pdfdetails.push({
        Title: "KompOutput Number",
        Value: $("#outputnumber").val(),
      });
      pdfdetails.push({
        Title: "KompOutput Percent",
        Value: $("#percent").val(),
      });
    }
    pdfdetails.push({
      Title: "Short Description",
      Value: $("#shortDescription").val(),
    });

    if (
      $("input[name='Specifications']:checked").val() ==
      "Nonneutral Specifications"
    ) {
      pdfdetails.push({
        Title: "Name Of Contact Person",
        Value: $("#CntctPrsn").val(),
      });
      pdfdetails.push({ Title: "Email", Value: $("#Email").val() });
      pdfdetails.push({
        Title: "Mobile Number",
        Value: $("#MobileNumber").val(),
      });
    }

    pdfdetails.push({ Title: "JOD", Value: $("#JOD").val() });
    pdfdetails.push({ Title: "EUR", Value: $("#EUR").val() });
    pdfdetails.push({
      Title: "Requested Warranty Time",
      Value: $("#requestedWarrantyTime").val(),
    });
    pdfdetails.push({
      Title: "Requested Delivery Time",
      Value: $("#requestedDeliveryTime").val(),
    });

    $(".custom-file-input").each(function () {
      if ($(this)[0].files.length > 0) {
        var name = $(this)
          .parent()
          .parent()
          .parent()[0]
          .children[0].innerText.split(":");
        pdfdetails.push({ Title: name[0], Value: "Attached" });
      }
    });
    //createpdf(pdfdetails);
    InsertGoodsRequest(Servicedata, arrFiles);
  } else {
    formSubmitting = true;
  }
}
function creategoodsamendment() {
  let arrFiles = [];
  if (mandatoryvalidationforgoodsamendment()) {
    $(".loading-modal").addClass("active");
    $("body").addClass("body-hidden");
    let DelivertimeTime = new Date(
      Date.parse(
        moment($("#requestedDeliveryTime").val(), "MM/DD/YYYY").format(
          "YYYY-MM-DD"
        )
      )
    ).toISOString();
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }

    let kompoutput = "No";
    if ($("#chkKomp").prop("checked")) {
      kompoutput = "Yes";
    }

    let Servicedata = {
      ProjectName: $("#projectName option:selected").val(),
      ProjectNumber: projectNumber,
      PNForZAS: txtpnForZAS,
      NameOfAV: $("#NameofAV").val(),
      AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
      RepresentativeId: {
        results: ProjectDetails[ProjectIndex].RepId,
      },
      isKompOutput: $("#chkKomp").prop("checked"),
      GoodsCategory: $("#Drpreqcategories option:selected").val(),
      kompPercent: $("#percent").val(),
      KompOutputNumber: $("#outputnumber").val(),
      ProsoftNumber: $("#prosoftnum").val(),
      DeliveryTime: DelivertimeTime,
      isNoChange: $("#chkNoChanges").prop("checked"),
    };

    if ($("#justification")[0].files.length > 0)
      arrFiles.push({
        FolderName: "Justification",
        files: $("#justification")[0].files,
        previousfileid: $("label[for='justification']").attr("previousfileid"),
      });

    if ($("#fileQuantitiesNochange")[0].files.length > 0)
      arrFiles.push({
        FolderName: "AmendmentSpecfications",
        files: $("#fileQuantitiesNochange")[0].files,
        previousfileid: $("label[for='fileQuantitiesNochange']").attr(
          "previousfileid"
        ),
      });

    if (filesotherAttachment.length > 0) {
      for (var i = 0; i < filesotherAttachment.length; i++) {
        var files = [];
        files.push(filesotherAttachment[i]);
        arrFiles.push({ FolderName: "Others", files: files });
      }
    }

    pdfdetails = [];
    pdfdetails.push({
      Title: "Project Name",
      Value: $("#projectName option:selected").val(),
    });
    pdfdetails.push({ Title: "Project Number", Value: projectNumber });
    pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
    pdfdetails.push({
      Title: "Name of Budget Responsible Person (AV)",
      Value: $("#NameofAV").val(),
    });
    if ($("#chkKomp").prop("checked")) {
      pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
      pdfdetails.push({
        Title: "KompOutput Number",
        Value: $("#outputnumber").val(),
      });
      pdfdetails.push({
        Title: "KompOutput Percent",
        Value: $("#percent").val(),
      });
    }
    pdfdetails.push({
      Title: "Pro Soft Number",
      Value: $("#prosoftnum").val(),
    });
    pdfdetails.push({
      Title: "Requested Delivery Time",
      Value: $("#requestedDeliveryTime").val(),
    });
    $(".custom-file-input").each(function () {
      if ($(this)[0].files.length > 0) {
        var name = $(this)
          .parent()
          .parent()
          .parent()[0]
          .children[0].innerText.split(":");
        pdfdetails.push({ Title: name[0], Value: "Attached" });
      }
    });
    //createpdf(pdfdetails);

    InsertGoodsRequest(Servicedata, arrFiles);
  }
}
function createrequestframework() {
  let arrFiles = [];
  if (mandatoryvalidationforrequestframeworkagreement()) {
    $(".loading-modal").addClass("active");
    $("body").addClass("body-hidden");
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }
    let Servicedata = {
      ProjectName: $("#projectName option:selected").val(),
      ProjectNumber: projectNumber,
      PNForZAS: txtpnForZAS,
      NameOfAV: $("#NameofAV").val(),
      AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
      RepresentativeId: {
        results: ProjectDetails[ProjectIndex].RepId,
      },
      isKompOutput: $("#chkKomp").prop("checked"),
      GoodsCategory: $("#Drpreqcategories option:selected").val(),
      kompPercent: $("#percent").val(),
      KompOutputNumber: $("#outputnumber").val(),
      JOD: $("#JOD").val(),
      EUR: $("#EUR").val(),
      Agreement: $("input[name='Agreement']:checked").val(),
    };

    if ($("#FilledCatalogue")[0].files.length > 0)
      arrFiles.push({
        FolderName: "FilledCatalogue",
        files: $("#FilledCatalogue")[0].files,
        previousfileid: $("label[for='FilledCatalogue']").attr(
          "previousfileid"
        ),
      });

    if ($("#AdditionalInformation")[0].files.length > 0)
      arrFiles.push({
        FolderName: "AdditionalInformation",
        files: $("#AdditionalInformation")[0].files,
        previousfileid: $("label[for='AdditionalInformation']").attr(
          "previousfileid"
        ),
      });

    pdfdetails = [];
    pdfdetails.push({
      Title: "Project Name",
      Value: $("#projectName option:selected").val(),
    });
    pdfdetails.push({ Title: "Project Number", Value: projectNumber });
    pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
    pdfdetails.push({
      Title: "Name of Budget Responsible Person (AV)",
      Value: $("#NameofAV").val(),
    });
    if ($("#chkKomp").prop("checked")) {
      pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
      pdfdetails.push({
        Title: "KompOutput Number",
        Value: $("#outputnumber").val(),
      });
      pdfdetails.push({
        Title: "KompOutput Percent",
        Value: $("#percent").val(),
      });
    }
    pdfdetails.push({
      Title: "Agreement Type",
      Value: $("input[name='Agreement']:checked").val(),
    });
    pdfdetails.push({ Title: "JOD", Value: $("#JOD").val() });
    pdfdetails.push({ Title: "EUR", Value: $("#EUR").val() });
    $(".custom-file-input").each(function () {
      if ($(this)[0].files.length > 0) {
        var name = $(this)
          .parent()
          .parent()
          .parent()[0]
          .children[0].innerText.split(":");
        pdfdetails.push({ Title: name[0], Value: "Attached" });
      }
    });

    InsertGoodsRequest(Servicedata, arrFiles);
  }
}
async function InsertGoodsRequest(Servicedata, arrFiles) {
  fileslength = arrFiles.length;
  await sp.web.lists
    .getByTitle("ProcurementGoods")
    .items.getById(itemid)
    .update(Servicedata)
    .then(async function (data) {
      var updatedfiles = [];
      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].files.length > 0) {
          updatedfiles.push(arrFiles[i]);
        }
      }
      arrFiles = updatedfiles;
      fileslength = arrFiles.length;

      if (arrFiles.length <= 0) Showpopup();

      //await createpdf(pdfdetails, "GD-" + data.data.ID);
      await deletefile(arrFiles);
      await deletefile(arrAbtToDel);
      
      if ($("#Drpreqcategories option:selected").val() == "goods")
      await createContact("GD-" + itemid);

      for (var i = 0; i < arrFiles.length; i++) {
        await createFolder(
          arrFiles[i].FolderName,
          "GD-" + itemid,
          arrFiles[i].files
        );
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "Insertgoodsrequest");
    });
}

async function createContact(ListID) {
  var arrcontacts = [];
  await $(".contactName").each(async function (key, val) {
    arrcontacts.push({
      Name: $(this).val(),
      Email: "",
      Phone: "",
      id: $(this).attr("data-id"),
    });
  });
  await $(".contactEmail").each(async function (key, val) {
    arrcontacts[key].Email = $(this).val();
  });

  await $(".contactPhoneNumber").each(async function (key, val) {
    arrcontacts[key].Phone = $(this).val();
  });

  for (var i = 0; i < arrcontacts.length; i++) {
    let contactdata = {
      ContactPerson: arrcontacts[i].Name,
      EmailAddress: arrcontacts[i].Email,
      MobileNumber: arrcontacts[i].Phone,
      RefNumber: ListID,
    };

    await sp.web.lists
      .getByTitle("ContactDetails")
      .items.getById(arrcontacts[i].id)
      .update(contactdata)
      .then(async function (data) {
        await console.log("contact created");
      })
      .catch(async function (error) {
        await sp.web.lists
          .getByTitle("ContactDetails")
          .items.add(contactdata)
          .then(async function (data) {
            await console.log("contact created");
          })
          .catch(function (error) {
            ErrorCallBack(error, "createContact");
          });
      });
  }
}

function MandatoryValidation() {
  var isAllValueFilled = true;

  var isprojectnumberempty = $(".prjctNum").filter(function () {
    return this.value == "";
  });

  var isprojectpnforzasempty = $(".prjctpnforzas").filter(function () {
    return this.value == "";
  });

  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }

  if ($("#projectName option:selected").val() == "Select") {
    alertify.error("Please Choose Project Name");
    isAllValueFilled = false;
  } else if (isprojectnumberempty.length > 0) {
    alertify.error("Please Enter valid Project Number");
    isAllValueFilled = false;
  } else if (isprojectpnforzasempty.length > 0) {
    alertify.error("Please Enter valid PN For ZAS");
    isAllValueFilled = false;
  } else if (!$.trim($("#NameofAV").val())) {
    /*else if(!$.trim($("#pnForZAS").val()))
  {
    alertify.error('Please Enter PN For ZAS');
    isAllValueFilled=false;
  }*/
    alertify.error("Please Enter Name of AV");
    isAllValueFilled = false;
  } else if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description");
    isAllValueFilled = false;
  } else if (
    filesQuantity.length <= 0 &&
    $("#quantityFilesContainer")[0].children.length <= 0
  ) {
    alertify.error("Please upload a file for Specifications and Quantities");
    isAllValueFilled = false;
  } else if (
    !$("input[id='nonneutralspec']").prop("checked") &&
    !$("input[id='neutralspec']").prop("checked")
  ) {
    alertify.error("Please Select Specifications");
    isAllValueFilled = false;
  } else if (
    $("input[name='Specifications']:checked").val() ==
      "Nonneutral Specifications" &&
    $("#nonneutralFile")[0].files.length <= 0 &&
    $("label[for='nonneutralFile']").text() == "Choose File"
  ) {
    alertify.error("Please Select Justification");
    isAllValueFilled = false;
  } else if (
    $("input[name='Specifications']:checked").val() ==
      "Nonneutral Specifications" &&
    $("#VSRC")[0].files.length <= 0 &&
    $("label[for='VSRC']").text() == "Choose File"
  ) {
    alertify.error("Please Select Valid Supplier’s Registration Certificate");
    isAllValueFilled = false;
  } else if (
    $("input[name='Specifications']:checked").val() ==
      "Nonneutral Specifications" &&
    $("#VSCP")[0].files.length <= 0 &&
    $("label[for='VSCP']").text() == "Choose File"
  ) {
    alertify.error("Please Select “Valid Supplier’s Company Profile");
    isAllValueFilled = false;
  } else if (
    $("input[name='Specifications']:checked").val() ==
      "Nonneutral Specifications" &&
    $("#VSSPAC")[0].files.length <= 0 &&
    $("label[for='VSSPAC']").text() == "Choose File"
  ) {
    alertify.error(
      "Please Select Valid Supplier’s Sole Provider Authorization Certificate"
    );
    isAllValueFilled = false;
  }else if ($("input[name='Specifications']:checked").val() ==
  "Nonneutral Specifications" &&!$.trim($("#CntctPrsn").val())) {
    alertify.error("Please Enter Name Of Contact Person");
    isAllValueFilled = false;
  } else if ($("input[name='Specifications']:checked").val() ==
  "Nonneutral Specifications" &&!$.trim($("#Email").val())) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if ($("input[name='Specifications']:checked").val() ==
  "Nonneutral Specifications" &&!isEmail($.trim($("#Email").val()))) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if ($("input[name='Specifications']:checked").val() ==
  "Nonneutral Specifications" &&!$.trim($("#MobileNumber").val())) {
    alertify.error("Please Enter Mobile Number");
    isAllValueFilled = false;
  }
  else if (
    $("#chkMoreItem").prop("checked") &&
    $("#costFile")[0].files.length <= 0 &&
    $("label[for='costFile']").text() == "Choose File"
  ) {
    alertify.error("Please Select Attachment");
    isAllValueFilled = false;
  } else if (!$.trim($("#JOD").val())) {
    alertify.error("Please Enter JOD");
    isAllValueFilled = false;
  } else if (!$.trim($("#EUR").val())) {
    alertify.error("Please Enter EUR");
    isAllValueFilled = false;
  } else if (
    $("#EUR").val() <= 20000 &&
    $("#fileShortlist")[0].files.length <= 0 &&
    $("label[for='fileShortlist']").text() == "Choose File" &&
    !$("#chkPublictender").prop("checked")
  ) {
    alertify.error("Please upload a file for Shortlist");
    isAllValueFilled = false;
  } else if (
    $("#EUR").val() >= 20000 &&
    $("#newspaperFile")[0].files.length <= 0 &&
    $("label[for='newspaperFile']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Text for Newspaper Advertisement");
    isAllValueFilled = false;
  } else if (!$.trim($("#requestedDeliveryTime").val())) {
    alertify.error("Please Enter requested Delivery Time");
    isAllValueFilled = false;
  } else if (!$.trim($("#deliveryAddress").val())) {
    alertify.error("Please Enter Delivery Address");
    isAllValueFilled = false;
  } else {
    for (let index = 0; index < $(".contact-details").length; index++) {
      if (!$(".contactName")[index].value) {
        // alert('Contact name is required');
        //alertify.set('notifier', 'position', 'top-right');
        alertify.error("Please enter Contact Name");
        $(".contactName:eq(" + index + ")").focus();
        isAllValueFilled = false;
        return isAllValueFilled;
      }
      if (!$(".contactEmail")[index].value) {
        // alert('Contact email is required');
        //alertify.set('notifier', 'position', 'top-right');
        alertify.error("Please enter Contact Email");
        $(".contactEmail:eq(" + index + ")").focus();
        isAllValueFilled = false;
        return isAllValueFilled;
      }
      if (!isEmail($(".contactEmail")[index].value)) {
        // alert('Contact email is required');
        //alertify.set('notifier', 'position', 'top-right');
        alertify.error("Please enter valid Contact Email");
        $(".contactEmail:eq(" + index + ")").focus();
        isAllValueFilled = false;
        return isAllValueFilled;
      }
      if (!$(".contactPhoneNumber")[index].value) {
        // alert('Phone number is required');
        //alertify.set('notifier', 'position', 'top-right');
        alertify.error("Please enter Phone Number");
        $(".contactPhoneNumber:eq(" + index + ")").focus();
        isAllValueFilled = false;
        return isAllValueFilled;
      }
    }

    /*if (filesotherAttachment.length <= 0&&$("#otherAttachmentFiles")[0].children.length<=0) {
      alertify.error("Please upload a file for Other Attachments");
      isAllValueFilled = false;
      return isAllValueFilled;
    }*/

    /*if($.trim($("#KompOptPT").val())==''&&($("#projectName").val() == 'MWR II' || $("#projectName").val() == 'RWU II'))
    {
      alertify.error('Please Enter KOMP Output');
      isAllValueFilled=false;
      return isAllValueFilled;
    }*/
  }

  return isAllValueFilled;
}

function mandatoryvalidationforgoodsamendment() {
  var isAllValueFilled = true;
  var isprojectnumberempty = $(".prjctNum").filter(function () {
    return this.value == "";
  });

  var isprojectpnforzasempty = $(".prjctpnforzas").filter(function () {
    return this.value == "";
  });

  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }

  if ($("#projectName option:selected").val() == "Select") {
    alertify.error("Please Choose Project Name");
    isAllValueFilled = false;
  } else if (isprojectnumberempty.length > 0) {
    alertify.error("Please Enter valid Project Number");
    isAllValueFilled = false;
  } else if (isprojectpnforzasempty.length > 0) {
    alertify.error("Please Enter valid PN For ZAS");
    isAllValueFilled = false;
  } else if (!$.trim($("#NameofAV").val())) {
    /*else if(!$.trim($("#pnForZAS").val()))
  {
    alertify.error('Please Enter PN For ZAS');
    isAllValueFilled=false;
  }*/
    alertify.error("Please Enter Name of AV");
    isAllValueFilled = false;
  } else if (!$.trim($("#prosoftnum").val())) {
    alertify.error("Please Enter ProSoft Number");
    isAllValueFilled = false;
  } else if (
    $("#justification")[0].files.length <= 0 &&
    $("label[for='justification']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Justification for Amendment");
    isAllValueFilled = false;
  } else if (
    $("#fileQuantitiesNochange")[0].files.length <= 0 &&
    $("label[for='fileQuantitiesNochange']").text() == "Choose File" &&
    !$("#chkNoChanges").prop("checked")
  ) {
    alertify.error("Please upload a file for Specifications and Quantities");
    isAllValueFilled = false;
  } else if (!$.trim($("#requestedDeliveryTime").val())) {
    alertify.error("Please Enter requested Delivery Time");
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}

function mandatoryvalidationforrequestframeworkagreement() {
  var isAllValueFilled = true;
  var isprojectnumberempty = $(".prjctNum").filter(function () {
    return this.value == "";
  });

  var isprojectpnforzasempty = $(".prjctpnforzas").filter(function () {
    return this.value == "";
  });
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }

  if ($("#projectName option:selected").val() == "Select") {
    alertify.error("Please Choose Project Name");
    isAllValueFilled = false;
  } else if (isprojectnumberempty.length > 0) {
    alertify.error("Please Enter valid Project Number");
    isAllValueFilled = false;
  } else if (isprojectpnforzasempty.length > 0) {
    alertify.error("Please Enter valid PN For ZAS");
    isAllValueFilled = false;
  } else if (!$.trim($("#NameofAV").val())) {
    /*else if(!$.trim($("#pnForZAS").val()))
  {
    alertify.error('Please Enter PN For ZAS');
    isAllValueFilled=false;
  }*/
    alertify.error("Please Enter Name of AV");
    isAllValueFilled = false;
  } else if ($("input[name='Agreement']:checked").length == 0) {
    alertify.error("Please choose any one of the Agreement");
    isAllValueFilled = false;
  } else if (!$.trim($("#JOD").val())) {
    alertify.error("Please Enter JOD");
    isAllValueFilled = false;
  } else if (!$.trim($("#EUR").val())) {
    alertify.error("Please Enter EUR");
    isAllValueFilled = false;
  } else if (
    $("input[name='Agreement']:checked").val() ==
      "Furniture Framework Agreement" &&
    $("#AdditionalInformation")[0].files.length <= 0 &&
    $("label[for='AdditionalInformation']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Additional Information");
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}
/* 
//summary
goods request fucntionalities End
//summary 
*/

/* 
//summary
service request fucntionalities Start
//summary 
*/

async function LoadServices() {
  var HTML = "";
  await $.each(ChoicesServices, function (key, val) {
    HTML +=
      '<option proj-id="' + key + '" value="' + val + '">' + val + "</option>";
  });
  await $("#choicesservices").append(HTML);
}

function CreateService() {
  let arrFiles = [];

  if (MandatoryValidationForService()) {
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }

    pdfdetails = [];
    pdfdetails.push({
      Title: "Project Name",
      Value: $("#projectName option:selected").val(),
    });
    pdfdetails.push({ Title: "Project Number", Value: projectNumber });
    pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
    pdfdetails.push({
      Title: "Name of Budget Responsible Person (AV)",
      Value: $("#NameofAV").val(),
    });
    if ($("#chkKomp").prop("checked")) {
      pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
      pdfdetails.push({
        Title: "KompOutput Number",
        Value: $("#outputnumber").val(),
      });
      pdfdetails.push({
        Title: "KompOutput Percent",
        Value: $("#percent").val(),
      });
    }

    if ($("#choicesservices option:selected").val() == "Direct Award") {
      if (mandatoryfordirectaward()) {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");

        let FromDate = new Date(
          Date.parse(
            moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();
        let Todate = new Date(
          Date.parse(
            moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();

        let Servicedata = {
          ProjectName: $("#projectName option:selected").val(),
          ProjectNumber: projectNumber,
          PNForZAS: txtpnForZAS,
          NameOfAV: $("#NameofAV").val(),
          AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
          //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
          RepresentativeId: {
            results: ProjectDetails[ProjectIndex].RepId,
          },
          KOMPOuput: $("#KompOptPT").val(),
          Explanation: $("#txtExplanation").val(),
          ConsultingFirm: $("input[name='ConsultingFirm']:checked").val(),
          ChoicesOfServices: $("#choicesservices option:selected").val(),
          ServiceCategory: $("#Drpreqcategories option:selected").val(),
          NameOfConsultingFirm: $("#NameOfFirm").val(),
          AreaOfActivity: $("#AreaActivy").val(),
          TelephoneNumber: $("#TeleNumber").val(),
          ContactPerson: $("#CntctPrsn").val(),
          EmailAddress: $("#Email").val(),
          MobileNumber: $("#MobileNumber").val(),
          FullAddress: $("#FullAddress").val(),
          ShortDesc: $("#shortDescription").val(),
          DurationFrom: FromDate,
          DurationTo: Todate,
          JOD: $("#JOD").val(),
          EUR: $("#EUR").val(),
          MarketSurvey:$("#MarketSurvey").val(),
          isKompOutput: $("#chkKomp").prop("checked"),
          kompPercent: $("#percent").val(),
          KompOutputNumber: $("#outputnumber").val(),
        };
        if ($("#justification")[0].files.length > 0) {
          arrFiles.push({
            FolderName: "Justification",
            files: $("#justification")[0].files,
            previousfileid: $("label[for='justification']").attr(
              "previousfileid"
            ),
          });
        }
        if ($("#terms")[0].files.length > 0) {
          arrFiles.push({
            FolderName: "Terms",
            files: $("#terms")[0].files,
            previousfileid: $("label[for='terms']").attr("previousfileid"),
          });
        }

        if (filesotherAttachment.length > 0) {
          for (var i = 0; i < filesotherAttachment.length; i++) {
            var files = [];
            files.push(filesotherAttachment[i]);
            arrFiles.push({ FolderName: "Others", files: files });
          }
        }

        pdfdetails.push({
          Title: "Name Of Consulting Firm/Appariser",
          Value: $("#NameOfFirm").val(),
        });
        pdfdetails.push({
          Title: "Area Of Activity",
          Value: $("#AreaActivy").val(),
        });
        pdfdetails.push({
          Title: "Short Description",
          Value: $("#shortDescription").val(),
        });
        pdfdetails.push({
          Title: "Full Address",
          Value: $("#FullAddress").val(),
        });
        pdfdetails.push({
          Title: "Contract Person from the Firm",
          Value: $("#CntctPrsn").val(),
        });
        pdfdetails.push({
          Title: "Telephone Number",
          Value: $("#TeleNumber").val(),
        });
        pdfdetails.push({ Title: "Email", Value: $("#Email").val() });
        pdfdetails.push({
          Title: "Mobile Number",
          Value: $("#MobileNumber").val(),
        });
        pdfdetails.push({
          Title: "Duration of the assignment (From Date)",
          Value: $("#Fromdate").val(),
        });
        pdfdetails.push({
          Title: "Duration of the assignment (To Date)",
          Value: $("#Todate").val(),
        });
        pdfdetails.push({ Title: "JOD", Value: $("#JOD").val() });
        pdfdetails.push({ Title: "EUR", Value: $("#EUR").val() });
        $(".custom-file-input").each(function () {
          if ($(this)[0].files.length > 0) {
            var name = $(this)
              .parent()
              .parent()
              .parent()[0]
              .children[0].innerText.split(":");
            pdfdetails.push({ Title: name[0], Value: "Attached" });
          }
        });
        //createpdf(pdfdetails);
        InsertService(Servicedata, arrFiles);
      } else {
        formSubmitting = true;
      }
    } else if (
      $("#choicesservices option:selected").val() == "Shortlisted tender"
    ) {
      if (mandatoryforshortlisttender()) {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");

        let FromDate = new Date(
          Date.parse(
            moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();
        let Todate = new Date(
          Date.parse(
            moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();

        let Servicedata = {
          ProjectName: $("#projectName option:selected").val(),
          ProjectNumber: projectNumber,
          PNForZAS: txtpnForZAS,
          NameOfAV: $("#NameofAV").val(),
          AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
          //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
          RepresentativeId: {
            results: ProjectDetails[ProjectIndex].RepId,
          },
          //KOMPOuput:$("#KompOptPT").val(),
          isKompOutput: $("#chkKomp").prop("checked"),
          kompPercent: $("#percent").val(),
          KompOutputNumber: $("#outputnumber").val(),
          Explanation: $("#txtExplanation").val(),
          ChoicesOfServices: $("#choicesservices option:selected").val(),
          ServiceCategory: $("#Drpreqcategories option:selected").val(),
          JOD: $("#JOD").val(),
          EUR: $("#EUR").val(),
          ShortDesc: $("#shortDescription").val(),
          DurationFrom: FromDate,
          DurationTo: Todate,
        };
        arrFiles.push({
          FolderName: "EstimatedCost",
          files: $("#Estimation")[0].files,
          previousfileid: $("label[for='terms']").attr("previousfileid"),
        });
        if ($("#justification")[0].files.length > 0) {
          arrFiles.push({
            FolderName: "Justification",
            files: $("#justification")[0].files,
            previousfileid: $("label[for='terms']").attr("previousfileid"),
          });
        }
        arrFiles.push({
          FolderName: "Terms",
          files: $("#terms")[0].files,
          previousfileid: $("label[for='terms']").attr("previousfileid"),
        });

        if (filesotherAttachment.length > 0) {
          for (var i = 0; i < filesotherAttachment.length; i++) {
            var files = [];
            files.push(filesotherAttachment[i]);
            arrFiles.push({ FolderName: "Others", files: files });
          }
        }

        arrFiles.push({
          FolderName: "ShortList",
          files: $("#shortlist")[0].files,
        });
        arrFiles.push({
          FolderName: "TechAssGrid",
          files: $("#Assessment")[0].files,
        });

        pdfdetails.push({
          Title: "Short Description of the Requested Service",
          Value: $("#shortDescription").val(),
        });
        pdfdetails.push({
          Title: "Duration of the assignment (From Date)",
          Value: $("#Fromdate").val(),
        });
        pdfdetails.push({
          Title: "Duration of the assignment (To Date)",
          Value: $("#Todate").val(),
        });
        pdfdetails.push({ Title: "JOD", Value: $("#JOD").val() });
        pdfdetails.push({ Title: "EUR", Value: $("#EUR").val() });
        $(".custom-file-input").each(function () {
          if ($(this)[0].files.length > 0) {
            var name = $(this)
              .parent()
              .parent()
              .parent()[0]
              .children[0].innerText.split(":");
            pdfdetails.push({ Title: name[0], Value: "Attached" });
          }
        });
        //createpdf(pdfdetails);

        InsertService(Servicedata, arrFiles);
      } else {
        formSubmitting = true;
      }
    } else if ($("#choicesservices option:selected").val() == "Public tender") {
      if (mandatoryforpublictender()) {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        let FromDate = new Date(
          Date.parse(
            moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();
        let Todate = new Date(
          Date.parse(
            moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();

        let Servicedata = {
          ProjectName: $("#projectName option:selected").val(),
          ProjectNumber: projectNumber,
          PNForZAS: txtpnForZAS,
          NameOfAV: $("#NameofAV").val(),
          AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
          //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
          RepresentativeId: {
            results: ProjectDetails[ProjectIndex].RepId,
          },
          //KOMPOuput:$("#KompOptPT").val(),
          isKompOutput: $("#chkKomp").prop("checked"),
          kompPercent: $("#percent").val(),
          KompOutputNumber: $("#outputnumber").val(),
          Explanation: $("#txtExplanation").val(),
          ChoicesOfServices: $("#choicesservices option:selected").val(),
          ServiceCategory: $("#Drpreqcategories option:selected").val(),
          ConsultingFirm: $("input[name='ConsultingFirm']:checked").val(),
          JOD: $("#JOD").val(),
          EUR: $("#EUR").val(),
          ShortDesc: $("#shortDescription").val(),
          Assessgrid:$("#gridforassess").val(),
          DurationFrom: FromDate,
          DurationTo: Todate,
        };
        arrFiles.push({
          FolderName: "EstimatedCost",
          files: $("#Estimation")[0].files,
          previousfileid: $("label[for='Estimation']").attr("previousfileid"),
        });
        arrFiles.push({
          FolderName: "Terms",
          files: $("#terms")[0].files,
          previousfileid: $("label[for='terms']").attr("previousfileid"),
        });

        if (filesotherAttachment.length > 0) {
          for (var i = 0; i < filesotherAttachment.length; i++) {
            var files = [];
            files.push(filesotherAttachment[i]);
            arrFiles.push({ FolderName: "Others", files: files });
          }
        }

        arrFiles.push({
          FolderName: "NewsAdvertisement",
          files: $("#newspaperFile")[0].files,
          previousfileid: $("label[for='newspaperFile']").attr(
            "previousfileid"
          ),
        });
        arrFiles.push({
          FolderName: "TechAssGrid",
          files: $("#Assessment")[0].files,
          previousfileid: $("label[for='Assessment']").attr("previousfileid"),
        });

        pdfdetails.push({
          Title: "Short Description of the Requested Service",
          Value: $("#shortDescription").val(),
        });
        pdfdetails.push({
          Title: "Duration of the assignment (From Date)",
          Value: $("#Fromdate").val(),
        });
        pdfdetails.push({
          Title: "Duration of the assignment (To Date)",
          Value: $("#Todate").val(),
        });
        pdfdetails.push({ Title: "JOD", Value: $("#JOD").val() });
        pdfdetails.push({ Title: "EUR", Value: $("#EUR").val() });
        $(".custom-file-input").each(function () {
          if ($(this)[0].files.length > 0) {
            var name = $(this)
              .parent()
              .parent()
              .parent()[0]
              .children[0].innerText.split(":");
            pdfdetails.push({ Title: name[0], Value: "Attached" });
          }
        });
        //createpdf(pdfdetails);

        InsertService(Servicedata, arrFiles);
      } else {
        formSubmitting = true;
      }
    } else if ($("#choicesservices option:selected").val() == "Local Subsidy") {
      if (mandatoryforsubsidy()) {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        let FromDate = new Date(
          Date.parse(
            moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();
        let Todate = new Date(
          Date.parse(
            moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();

        let Servicedata = {
          ProjectName: $("#projectName option:selected").val(),
          ProjectNumber: projectNumber,
          PNForZAS: $("#pnForZAS").val(),
          NameOfAV: $("#NameofAV").val(),
          AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
          //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
          RepresentativeId: {
            results: ProjectDetails[ProjectIndex].RepId,
          },
          //KOMPOuput:$("#KompOptPT").val(),
          isKompOutput: $("#chkKomp").prop("checked"),
          kompPercent: $("#percent").val(),
          KompOutputNumber: $("#outputnumber").val(),
          Explanation: $("#txtExplanation").val(),
          ChoicesOfServices: $("#choicesservices option:selected").val(),
          ServiceCategory: $("#Drpreqcategories option:selected").val(),
          JOD: $("#JOD").val(),
          EUR: $("#EUR").val(),
          ShortDesc: $("#shortDescription").val(),
          TelephoneNumber: $("#TeleNumber").val(),
          ContactPerson: $("#CntctPrsn").val(),
          EmailAddress: $("#Email").val(),
          MobileNumber: $("#MobileNumber").val(),
          FullAddress: $("#FullAddress").val(),
          NameOfBeneficiary: $("#NameOfBenficiary").val(),
          DurationFrom: FromDate,
          DurationTo: Todate,
        };
        arrFiles.push({
          FolderName: "ProjectProposal",
          files: $("#Proposal")[0].files,
        });
        arrFiles.push({ FolderName: "Budget", files: $("#Budget")[0].files });
        arrFiles.push({ FolderName: "Profile", files: $("#Profile")[0].files });
        if ($("#BankDetails")[0].files.length > 0) {
          arrFiles.push({
            FolderName: "BankDetails",
            files: $("#BankDetails")[0].files,
          });
        }
        arrFiles.push({
          FolderName: "CommercialSuitability",
          files: $("#Suitability")[0].files,
        });
        arrFiles.push({
          FolderName: "RegCert",
          files: $("#Certificate")[0].files,
        });
        if (filesotherAttachment.length > 0) {
          for (var i = 0; i < filesotherAttachment.length; i++) {
            var files = [];
            files.push(filesotherAttachment[i]);
            arrFiles.push({ FolderName: "Others", files: files });
          }
        }

        InsertService(Servicedata, arrFiles);
      } else {
        formSubmitting = true;
      }
    } else if (
      $("#choicesservices option:selected").val() == "Lease Agreement"
    ) {
      if (mandatoryforLease()) {
        let FromDate = new Date(
          Date.parse(
            moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();
        let Todate = new Date(
          Date.parse(
            moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();

        if (
          $("input[name='LessorPapers']:checked").val() ==
          "Lessor is an Individual"
        ) {
          if (mandatoryforindivual()) {
            $(".loading-modal").addClass("active");
            $("body").addClass("body-hidden");

            let Servicedata = {
              ProjectName: $("#projectName option:selected").val(),
              ProjectNumber: projectNumber,
              PNForZAS: $("#pnForZAS").val(),
              NameOfAV: $("#NameofAV").val(),
              AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
              //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
              RepresentativeId: {
                results: ProjectDetails[ProjectIndex].RepId,
              },
              KOMPOuput: $("#KompOptPT").val(),
              Explanation: $("#txtExplanation").val(),
              ChoicesOfServices: $("#choicesservices option:selected").val(),
              ServiceCategory: $("#Drpreqcategories option:selected").val(),
              ShortDesc: $("#shortDescription").val(),
              LessorPapers: $("input[name='LessorPapers']:checked").val(),
              LessorName: $("#LessorName").val(),
              EmailAddress: $("#Email").val(),
              MobileNumber: $("#MobileNumber").val(),
              FullAddress: $("#FullAddress").val(),
              TelephoneNumber: $("#PhoneNumber").val(),
              DurationFrom: FromDate,
              DurationTo: Todate,
            };
            arrFiles.push({
              FolderName: "LessorID",
              files: $("#LessorID")[0].files,
            });
            arrFiles.push({
              FolderName: "OwnerDocs",
              files: $("#OwnershipDocs")[0].files,
            });
            arrFiles.push({
              FolderName: "BankDetails",
              files: $("#BankDetails")[0].files,
            });
            arrFiles.push({
              FolderName: "RmoApproval",
              files: $("#RMOApproval")[0].files,
            });
            arrFiles.push({
              FolderName: "DirectorApproval",
              files: $("#DirectorApproval")[0].files,
            });
            arrFiles.push({
              FolderName: "LandScheme",
              files: $("#LandScheme")[0].files,
            });

            if (filesotherAttachment.length > 0) {
              for (var i = 0; i < filesotherAttachment.length; i++) {
                var files = [];
                files.push(filesotherAttachment[i]);
                arrFiles.push({ FolderName: "Others", files: files });
              }
            }

            InsertService(Servicedata, arrFiles);
          } else {
            formSubmitting = true;
          }
        } else {
          if (mandatoryforcompany()) {
            $(".loading-modal").addClass("active");
            $("body").addClass("body-hidden");

            let Servicedata = {
              ProjectName: $("#projectName option:selected").val(),
              ProjectNumber: projectNumber,
              PNForZAS: $("#pnForZAS").val(),
              NameOfAV: $("#NameofAV").val(),
              AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
              //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
              RepresentativeId: {
                results: ProjectDetails[ProjectIndex].RepId,
              },
              KOMPOuput: $("#KompOptPT").val(),
              ChoicesOfServices: $("#choicesservices option:selected").val(),
              ServiceCategory: $("#Drpreqcategories option:selected").val(),
              ShortDesc: $("#shortDescription").val(),
              LessorPapers: $("input[name='LessorPapers']:checked").val(),

              NameOfConsultingFirm: $("#NameOfFirm").val(),
              ContactPerson: $("#CntctPrsn").val(),
              EmailAddress: $("#Email").val(),
              MobileNumber: $("#MobileNumber").val(),
              FullAddress: $("#FullAddress").val(),
              TelephoneNumber: $("#PhoneNumber").val(),
              DurationFrom: FromDate,
              DurationTo: Todate,
            };
            arrFiles.push({
              FolderName: "RegCert",
              files: $("#RegCert")[0].files,
            });
            arrFiles.push({
              FolderName: "Profile",
              files: $("#Profile")[0].files,
            });
            arrFiles.push({
              FolderName: "BankDetails",
              files: $("#BankDetails")[0].files,
            });
            arrFiles.push({
              FolderName: "RmoApproval",
              files: $("#RMOApproval")[0].files,
            });
            arrFiles.push({
              FolderName: "DirectorApproval",
              files: $("#DirectorApproval")[0].files,
            });
            arrFiles.push({
              FolderName: "LandScheme",
              files: $("#LandScheme")[0].files,
            });
            if (filesotherAttachment.length > 0) {
              for (var i = 0; i < filesotherAttachment.length; i++) {
                var files = [];
                files.push(filesotherAttachment[i]);
                arrFiles.push({ FolderName: "Others", files: files });
              }
            }
            InsertService(Servicedata, arrFiles);
          } else {
            formSubmitting = true;
          }
        }
      } else {
        formSubmitting = true;
      }
    } else if ($("#choicesservices option:selected").val() == "iDPP") {
      if (mandatoryforiDPP()) {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        let FromDate = new Date(
          Date.parse(
            moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();
        let Todate = new Date(
          Date.parse(
            moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
          )
        ).toISOString();

        let Servicedata = {
          ProjectName: $("#projectName option:selected").val(),
          ProjectNumber: projectNumber,
          PNForZAS: $("#pnForZAS").val(),
          NameOfAV: $("#NameofAV").val(),
          AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
          //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
          RepresentativeId: {
            results: ProjectDetails[ProjectIndex].RepId,
          },
          KOMPOuput: $("#KompOptPT").val(),
          Explanation: $("#txtExplanation").val(),
          ChoicesOfServices: $("#choicesservices option:selected").val(),
          ServiceCategory: $("#Drpreqcategories option:selected").val(),
          ShortDesc: $("#shortDescription").val(),
          DurationFrom: FromDate,
          DurationTo: Todate,
        };
        arrFiles.push({ FolderName: "RegCert", files: $("#RegCert")[0].files });
        arrFiles.push({ FolderName: "Profile", files: $("#Profile")[0].files });
        arrFiles.push({
          FolderName: "BankDetails",
          files: $("#BankDetails")[0].files,
        });

        arrFiles.push({
          FolderName: "CVExperts",
          files: $("#Experts")[0].files,
        });
        arrFiles.push({
          FolderName: "FinancialReports",
          files: $("#FinReport")[0].files,
        });
        arrFiles.push({
          FolderName: "AgreementConcept",
          files: $("#Agreement")[0].files,
        });
        arrFiles.push({
          FolderName: "Vergabedok",
          files: $("#Vergabedok")[0].files,
        });
        arrFiles.push({
          FolderName: "SummaryActionPlan",
          files: $("#Actionplan")[0].files,
        });
        arrFiles.push({
          FolderName: "CompetitionReport",
          files: $("#CompetitionReport")[0].files,
        });
        arrFiles.push({ FolderName: "Budget", files: $("#Budget")[0].files });

        InsertService(Servicedata, arrFiles);
      } else {
        formSubmitting = true;
      }
    } else if (
      $("#choicesservices option:selected").val() == "Contract Amendment"
    ) {
      if (mandatoryforcontract()) {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        let Servicedata = {
          ProjectName: $("#projectName option:selected").val(),
          ProjectNumber: projectNumber,
          PNForZAS: txtpnForZAS,
          NameOfAV: $("#NameofAV").val(),
          AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
          //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
          RepresentativeId: {
            results: ProjectDetails[ProjectIndex].RepId,
          },
          //KOMPOuput:$("#KompOptPT").val(),
          isKompOutput: $("#chkKomp").prop("checked"),
          kompPercent: $("#percent").val(),
          KompOutputNumber: $("#outputnumber").val(),
          Explanation: $("#txtExplanation").val(),
          ChoicesOfServices: $("#choicesservices option:selected").val(),
          ServiceCategory: $("#Drpreqcategories option:selected").val(),
          ShortDesc: $("#shortDescription").val(),
          CostExtension: $("input[name='CstExtension']:checked").val(),
          ContractNumber: $("#CntrctNum").val(),
          NameOfConsultingFirm: $("#NameOfFirm").val(),
          ContactPerson: $("#CntctPrsn").val(),
          EmailAddress: $("#Email").val(),
          MobileNumber: $("#MobileNumber").val(),
          FullAddress: $("#FullAddress").val(),
          TelephoneNumber: $("#TeleNumber").val(),
          //Justification:$("#justification").val()
          PaymentStatus: $("#chkfinstatus").prop("checked"),
        };
        if ($("#justification")[0].files.length > 0)
          arrFiles.push({
            FolderName: "Justification",
            files: $("#justification")[0].files,
            previousfileid: $("label[for='justification']").attr(
              "previousfileid"
            ),
          });

        if ($("#Financialstatus")[0].files.length > 0)
          arrFiles.push({
            FolderName: "Financialstatus",
            files: $("#Financialstatus")[0].files,
            previousfileid: $("label[for='Financialstatus']").attr(
              "previousfileid"
            ),
          });

        if ($("input[name='CstExtension']:checked").val() == "Cost Extension") {
          arrFiles.push({
            FolderName: "EstimatedCost",
            files: $("#Estimation")[0].files,
            previousfileid: $("label[for='Estimation']").attr("previousfileid"),
          });
        }

        arrFiles.push({
          FolderName: "Terms",
          files: $("#terms")[0].files,
          previousfileid: $("label[for='terms']").attr("previousfileid"),
        });

        pdfdetails.push({
          Title: "Name Of Consulting Firm/Appariser",
          Value: $("#NameOfFirm").val(),
        });
        pdfdetails.push({
          Title: "Short Description of the Requested Service",
          Value: $("#shortDescription").val(),
        });
        pdfdetails.push({
          Title: "Full Address",
          Value: $("#FullAddress").val(),
        });
        pdfdetails.push({
          Title: "Contract Person from the Firm",
          Value: $("#CntctPrsn").val(),
        });
        pdfdetails.push({
          Title: "Telephone Number",
          Value: $("#TeleNumber").val(),
        });
        pdfdetails.push({ Title: "Email", Value: $("#Email").val() });
        pdfdetails.push({
          Title: "Mobile Number",
          Value: $("#MobileNumber").val(),
        });

        $(".custom-file-input").each(function () {
          if ($(this)[0].files.length > 0) {
            var name = $(this)
              .parent()
              .parent()
              .parent()[0]
              .children[0].innerText.split(":");
            pdfdetails.push({ Title: name[0], Value: "Attached" });
          }
        });
        //createpdf(pdfdetails);
        InsertService(Servicedata, arrFiles);
      } else {
        formSubmitting = true;
      }
    } else if (
      $("#choicesservices option:selected").val() ==
      "Request from a Framework Agreement"
    ) {
      if (mandatoryvalidationforservicerequestframeworkagreement()) {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        let Servicedata = {
          ProjectName: $("#projectName option:selected").val(),
          ProjectNumber: projectNumber,
          PNForZAS: txtpnForZAS,
          NameOfAV: $("#NameofAV").val(),
          AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
          RepresentativeId: {
            results: ProjectDetails[ProjectIndex].RepId,
          },
          ChoicesOfServices: $("#choicesservices option:selected").val(),
          ServiceCategory: $("#Drpreqcategories option:selected").val(),
          isKompOutput: $("#chkKomp").prop("checked"),
          kompPercent: $("#percent").val(),
          KompOutputNumber: $("#outputnumber").val(),
          Explanation: $("#txtExplanation").val(),
          JOD: $("#JOD").val(),
          EUR: $("#EUR").val(),
          Agreement: $("input[name='Agreement']:checked").val(),
        };

        if (
          $("input[name='Agreement']:checked").val() ==
          "Legal Services Framework Agreement"
        ) {
          arrFiles.push({
            FolderName: "FilledRequest",
            files: $("#FilledRequest")[0].files,
            previousfileid: $("label[for='justification']").attr(
              "previousfileid"
            ),
          });
        }

        if (
          $("input[name='Agreement']:checked").val() ==
          "Events Management Framework Agreement"
        ) {
          arrFiles.push({
            FolderName: "Terms",
            files: $("#terms")[0].files,
            previousfileid: $("label[for='justification']").attr(
              "previousfileid"
            ),
          });
        }

        if (filesotherAttachment.length > 0) {
          for (var i = 0; i < filesotherAttachment.length; i++) {
            var files = [];
            files.push(filesotherAttachment[i]);
            arrFiles.push({ FolderName: "Others", files: files });
          }
        }

        pdfdetails.push({
          Title: "Agreement Type",
          Value: $("input[name='Agreement']:checked").val(),
        });
        pdfdetails.push({ Title: "JOD", Value: $("#JOD").val() });
        pdfdetails.push({ Title: "EUR", Value: $("#EUR").val() });
        $(".custom-file-input").each(function () {
          if ($(this)[0].files.length > 0) {
            var name = $(this)
              .parent()
              .parent()
              .parent()[0]
              .children[0].innerText.split(":");
            pdfdetails.push({ Title: name[0], Value: "Attached" });
          }
        });
        //createpdf(pdfdetails);

        InsertService(Servicedata, arrFiles);
      }
    }
  } else {
    formSubmitting = true;
  }
}

async function InsertService(Servicedata, arrFiles) {
  fileslength = arrFiles.length;
  await sp.web.lists
    .getByTitle("ProcurementService")
    .items.getById(itemid)
    .update(Servicedata)
    .then(async function (data) {
      var updatedfiles = [];
      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].files.length > 0) {
          updatedfiles.push(arrFiles[i]);
        }
      }
      arrFiles = updatedfiles;
      fileslength = arrFiles.length;

      if (arrFiles.length <= 0) Showpopup();

      //await createpdf(pdfdetails, "SR-" + data.data.ID);
      await deletefile(arrFiles);
      await deletefile(arrAbtToDel);

      for (var i = 0; i < arrFiles.length; i++) {
        createFolder(arrFiles[i].FolderName, itemid, arrFiles[i].files);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "InsertService");
    });
}

function MandatoryValidationForService() {
  var isAllValueFilled = true;
  var isprojectnumberempty = $(".prjctNum").filter(function () {
    return this.value == "";
  });

  var isprojectpnforzasempty = $(".prjctpnforzas").filter(function () {
    return this.value == "";
  });
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if ($("#projectName option:selected").val() == "Select") {
    alertify.error("Please Choose Project Name");
    isAllValueFilled = false;
  } else if (isprojectnumberempty.length > 0) {
    alertify.error("Please Enter valid Project Number");
    isAllValueFilled = false;
  } else if (isprojectpnforzasempty.length > 0) {
    alertify.error("Please Enter valid PN For ZAS");
    isAllValueFilled = false;
  } else if (!$.trim($("#NameofAV").val())) {
    /*else if(!$.trim($("#pnForZAS").val()))
  {
    alertify.error('Please Enter PN For ZAS');
    isAllValueFilled=false;
  }*/
    alertify.error("Please Enter Name of AV");
    isAllValueFilled = false;
  }else if (!$.trim($("#txtExplanation").val())&&$("#DrpProjectName option:selected").val()=="Service") {
    alertify.error("Please Enter Request to Subcontract the Service in Question");
    isAllValueFilled = false;
  }
  else if ($("#choicesservices option:selected").val() == "Select") {
    alertify.error("Please Choose Contracting Procedure");
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}

function mandatoryfordirectaward() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (
    !$("input[id='ConsultingFirm']").prop("checked") &&
    !$("input[id='Appariser']").prop("checked")
  ) {
    alertify.error("Please Select Firm or Appraiser");
    isAllValueFilled = false;
  } else if (!$.trim($("#NameOfFirm").val())) {
    alertify.error("Please Enter Name of Consulting Firm");
    isAllValueFilled = false;
  } else if (!$.trim($("#AreaActivy").val())) {
    alertify.error("Please Enter Area Of Activity");
    isAllValueFilled = false;
  } else if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description");
    isAllValueFilled = false;
  } else if (!$.trim($("#FullAddress").val())) {
    alertify.error("Please Enter Full Address");
    isAllValueFilled = false;
  } else if (
    !$.trim($("#CntctPrsn").val()) &&
    $("input[name='ConsultingFirm']:checked").val() == "ConsultingFirm"
  ) {
    alertify.error("Please Enter Contact Person");
    isAllValueFilled = false;
  } else if (!$.trim($("#TeleNumber").val())) {
    alertify.error("Please Enter Telephone Number");
    isAllValueFilled = false;
  } else if (!$.trim($("#Email").val())) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!isEmail($.trim($("#Email").val()))) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!$.trim($("#MobileNumber").val())) {
    alertify.error("Please Enter Mobile Number");
    isAllValueFilled = false;
  } else if (!$.trim($("#Fromdate").val())) {
    alertify.error("Please Enter Duration of the assignment (From Date)");
    isAllValueFilled = false;
  } else if (!$.trim($("#Todate").val())) {
    alertify.error("Please Enter Duration of the assignment (To Date)");
    isAllValueFilled = false;
  } else if (
    moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString() >
    moment($("#Todate").val(), "MM-DD-YYYY").toISOString()
  ) {
    alertify.error("From  Date Should be lesser than To date");
    isAllValueFilled = false;
  } else if (!$.trim($("#JOD").val())) {
    /*else if($('#Estimation')[0].files.length<=0)
  {
    alertify.error('Please upload a file for Estimated Cost');
    isAllValueFilled=false;
  }*/
    alertify.error("Please Enter JOD");
    isAllValueFilled = false;
  } else if (!$.trim($("#EUR").val())) {
    alertify.error("Please Enter EUR");
    isAllValueFilled = false;
  } else if ($("#EUR").val()>8000 && !$("#MarketSurvey").val()) {
    alertify.error("Please Enter Market Survey Sheet");
    isAllValueFilled = false;
  }
  else if (
    $("#justification")[0].files.length <= 0 &&
    $("label[for='justification']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Justification for direct award");
    isAllValueFilled = false;
  } else if (
    $("#terms")[0].files.length <= 0 &&
    $("label[for='terms']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Terms of Reference");
    isAllValueFilled = false;
  } /*else if (filesotherAttachment.length <= 0&&$("#otherAttachmentFiles")[0].children.length<=0) {
    alertify.error("Please upload a file for Other Attachment");
    isAllValueFilled = false;
  }*/
  return isAllValueFilled;
}

function mandatoryforshortlisttender() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description of the Requested Service");
    isAllValueFilled = false;
  } else if ($("#shortlist")[0].files.length <= 0) {
    alertify.error("Please Select shortlist");
    isAllValueFilled = false;
  } else if (
    $("#Estimation")[0].files.length <= 0 &&
    $("label[for='Estimation']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Estimated Cost");
    isAllValueFilled = false;
  } else if (!$.trim($("#JOD").val())) {
    alertify.error("Please Enter JOD");
    isAllValueFilled = false;
  } else if (!$.trim($("#EUR").val())) {
    alertify.error("Please Enter EUR");
    isAllValueFilled = false;
  } else if (
    $("#EUR").val() >= 50000 &&
    $("#justification")[0].files.length <= 0 &&
    $("label[for='justification']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Justification for shortlisted tender"
    );
    isAllValueFilled = false;
  } else if (
    $("#terms")[0].files.length <= 0 &&
    $("label[for='terms']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Terms of Reference");
    isAllValueFilled = false;
  } else if (!$.trim($("#Fromdate").val())) {
    alertify.error("Please Enter Duration of the assignment (From Date)");
    isAllValueFilled = false;
  } else if (!$.trim($("#Todate").val())) {
    alertify.error("Please Enter Duration of the assignment (To Date)");
    isAllValueFilled = false;
  } else if (
    moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString() >
    moment($("#Todate").val(), "MM-DD-YYYY").toISOString()
  ) {
    alertify.error("From  Date Should be lesser than To date");
    isAllValueFilled = false;
  } else if (
    $("#Assessment")[0].files.length <= 0 &&
    $("label[for='Assessment']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Technical Assessment Grid");
    isAllValueFilled = false;
  } /*else if (filesotherAttachment.length <= 0&&$("#otherAttachmentFiles")[0].children.length<=0) {
    alertify.error("Please upload a file for Other Attachment");
    isAllValueFilled = false;
  }*/

  return isAllValueFilled;
}
function mandatoryforpublictender() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (
    !$("input[id='ConsultingFirm']").prop("checked") &&
    !$("input[id='Appariser']").prop("checked")
  ) {
    alertify.error("Please Select Firm or Appraiser");
    isAllValueFilled = false;
  } else if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description");
    isAllValueFilled = false;
  }else if (!$.trim($("#gridforassess").val())&&$("input[id='ConsultingFirm']").prop("checked")) {
    alertify.error("Please Enter Grid for Assessing the Eligibility of Consulting Firms");
    isAllValueFilled = false;
  }
  else if (
    $("#Estimation")[0].files.length <= 0 &&
    $("label[for='Estimation']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Estimated Cost");
    isAllValueFilled = false;
  } else if (!$.trim($("#JOD").val())) {
    alertify.error("Please Enter JOD");
    isAllValueFilled = false;
  } else if (!$.trim($("#EUR").val())) {
    alertify.error("Please Enter EUR");
    isAllValueFilled = false;
  } else if (
    $("#terms")[0].files.length <= 0 &&
    $("label[for='terms']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for terms Attachment");
    isAllValueFilled = false;
  } else if (
    $("#Assessment")[0].files.length <= 0 &&
    $("label[for='Assessment']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Technical Assessment Grid");
    isAllValueFilled = false;
  } else if (!$.trim($("#Fromdate").val())) {
    alertify.error("Please Enter Duration of the assignment (From Date)");
    isAllValueFilled = false;
  } else if (!$.trim($("#Todate").val())) {
    alertify.error("Please Enter Duration of the assignment (To Date)");
    isAllValueFilled = false;
  } else if (
    moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString() >
    moment($("#Todate").val(), "MM-DD-YYYY").toISOString()
  ) {
    alertify.error("From  Date Should be lesser than To date");
    isAllValueFilled = false;
  } else if (
    $("#newspaperFile")[0].files.length <= 0 &&
    $("label[for='newspaperFile']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Text for newspaper advertisement");
    isAllValueFilled = false;
  } /*else if (filesotherAttachment.length <= 0&&$("#otherAttachmentFiles")[0].children.length<=0) {
    alertify.error("Please upload a file for Other Attachment");
    isAllValueFilled = false;
  }*/
  return isAllValueFilled;
}
function mandatoryforLease() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description");
    isAllValueFilled = false;
  } else if (
    $("#LandScheme")[0].files.length <= 0 &&
    $("label[for='LandScheme']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Land Scheme");
    isAllValueFilled = false;
  } else if (
    $("#RMOApproval")[0].files.length <= 0 &&
    $("label[for='RMOApproval']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for RMO Approval");
    isAllValueFilled = false;
  } else if (
    $("#DirectorApproval")[0].files.length <= 0 &&
    $("label[for='DirectorApproval']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Country Director Approval");
    isAllValueFilled = false;
  } else if (!$.trim($("#Fromdate").val())) {
    alertify.error("Please Enter Duration of the assignment (From Date)");
    isAllValueFilled = false;
  } else if (!$.trim($("#Todate").val())) {
    alertify.error("Please Enter Duration of the assignment (To Date)");
    isAllValueFilled = false;
  } else if (
    moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString() >
    moment($("#Todate").val(), "MM-DD-YYYY").toISOString()
  ) {
    alertify.error("From  Date Should be lesser than To date");
    isAllValueFilled = false;
  } else if (
    $("#LandScheme")[0].files.length <= 0 &&
    $("label[for='LandScheme']").text() == "Choose File"
  ) {
    alertify.error("Please Select Land Scheme");
    isAllValueFilled = false;
  } else if (
    !$("input[id='InduvLessor']").prop("checked") &&
    !$("input[id='CmpnyLessor']").prop("checked")
  ) {
    alertify.error("Please Select Lessor Type");
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}
function mandatoryforindivual() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#LessorName").val())) {
    alertify.error("Please Enter Lessor Name");
    isAllValueFilled = false;
  } else if (
    $("#LessorID")[0].files.length <= 0 &&
    $("label[for='LessorID']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Lessor ID");
    isAllValueFilled = false;
  } else if (!$.trim($("#FullAddress").val())) {
    alertify.error("Please Enter Full Address");
    isAllValueFilled = false;
  } else if (!$.trim($("#PhoneNumber").val())) {
    alertify.error("Please Enter PhoneNumber");
    isAllValueFilled = false;
  } else if (!$.trim($("#Email").val())) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!isEmail($.trim($("#Email").val()))) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!$.trim($("#MobileNumber").val())) {
    alertify.error("Please Enter Mobile Number");
    isAllValueFilled = false;
  } else if (
    $("#OwnershipDocs")[0].files.length <= 0 &&
    $("label[for='OwnershipDocs']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Estate Ownership Documents");
    isAllValueFilled = false;
  } else if (
    $("#BankDetails")[0].files.length <= 0 &&
    $("label[for='BankDetails']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Bank Details");
    isAllValueFilled = false;
  } /*else if (filesotherAttachment.length <= 0&&$("#otherAttachmentFiles")[0].children.length<=0) {
    alertify.error("Please upload a file for Other Attachment");
    isAllValueFilled = false;
  }*/
  return isAllValueFilled;
}

function mandatoryforcompany() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#NameOfFirm").val())) {
    alertify.error("Please Enter Name Of Firm");
    isAllValueFilled = false;
  } else if (
    $("#RegCert")[0].files.length <= 0 &&
    $("label[for='RegCert']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Registration Certificate");
    isAllValueFilled = false;
  } else if (!$.trim($("#FullAddress").val())) {
    alertify.error("Please Enter Full Address");
    isAllValueFilled = false;
  } else if (!$.trim($("#TeleNumber").val())) {
    alertify.error("Please Enter Tele PhoneNumber");
    isAllValueFilled = false;
  } else if (!$.trim($("#CntctPrsn").val())) {
    alertify.error("Please Enter Contact Person");
    isAllValueFilled = false;
  } else if (!$.trim($("#Email").val())) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!isEmail($.trim($("#Email").val()))) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!$.trim($("#MobileNumber").val())) {
    alertify.error("Please Enter Mobile Number");
    isAllValueFilled = false;
  } else if (
    $("#Profile")[0].files.length <= 0 &&
    $("label[for='Profile']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Company Profile");
    isAllValueFilled = false;
  } else if (
    $("#BankDetails")[0].files.length <= 0 &&
    $("label[for='BankDetails']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Bank Details");
    isAllValueFilled = false;
  } /*else if (filesotherAttachment.length <= 0&&$("#otherAttachmentFiles")[0].children.length<=0) {
    alertify.error("Please upload a file for Other Attachment");
    isAllValueFilled = false;
  }*/
  return isAllValueFilled;
}

function mandatoryforiDPP() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description");
    isAllValueFilled = false;
  } else if (
    $("#RegCert")[0].files.length <= 0 &&
    $("label[for='RegCert']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Company’s Registration Certificate"
    );
    isAllValueFilled = false;
  } else if (
    $("#Profile")[0].files.length <= 0 &&
    $("label[for='Profile']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Company Profile");
    isAllValueFilled = false;
  } else if (
    $("#Experts")[0].files.length <= 0 &&
    $("label[for='Experts']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for CVs of Experts");
    isAllValueFilled = false;
  } else if (
    $("#BankDetails")[0].files.length <= 0 &&
    $("label[for='BankDetails']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Bank Details");
    isAllValueFilled = false;
  } else if (
    $("#FinReport")[0].files.length <= 0 &&
    $("label[for='FinReport']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Financial Reports");
    isAllValueFilled = false;
  } else if (
    $("#Actionplan")[0].files.length <= 0 &&
    $("label[for='Actionplan']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Summary Action Plan");
    isAllValueFilled = false;
  } else if (
    $("#Agreement")[0].files.length <= 0 &&
    $("label[for='Agreement']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Brief concept for agreement");
    isAllValueFilled = false;
  } else if (
    $("#Budget")[0].files.length <= 0 &&
    $("label[for='Budget']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Budget Plan");
    isAllValueFilled = false;
  } else if (
    $("#Vergabedok")[0].files.length <= 0 &&
    $("label[for='Vergabedok']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Vergabedok");
    isAllValueFilled = false;
  } else if (
    $("#CompetitionReport")[0].files.length <= 0 &&
    $("label[for='CompetitionReport']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Competition Report");
    isAllValueFilled = false;
  } else if (!$.trim($("#Fromdate").val())) {
    alertify.error("Please Enter Duration of the assignment (From Date)");
    isAllValueFilled = false;
  } else if (!$.trim($("#Todate").val())) {
    alertify.error("Please Enter Duration of the assignment (To Date)");
    isAllValueFilled = false;
  } else if (
    moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString() >
    moment($("#Todate").val(), "MM-DD-YYYY").toISOString()
  ) {
    alertify.error("From  Date Should be lesser than To date");
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}

function mandatoryforcontract() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (
    !$("input[id='NoCstExtn']").prop("checked") &&
    !$("input[id='CstExtn']").prop("checked")
  ) {
    alertify.error("Please Select Cost Extension");
    isAllValueFilled = false;
  } else if (!$.trim($("#CntrctNum").val())) {
    alertify.error("Please Enter Contract Number");
    isAllValueFilled = false;
  } else if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description");
    isAllValueFilled = false;
  } else if (!$.trim($("#FullAddress").val())) {
    alertify.error("Please Enter Full Address");
    isAllValueFilled = false;
  } else if (!$.trim($("#NameOfFirm").val())) {
    alertify.error("Please Enter Name Of Firm");
    isAllValueFilled = false;
  } /*else if (!$.trim($("#CntctPrsn").val())) {
    alertify.error("Please Enter Contact Person");
    isAllValueFilled = false;
  } */ else if (
    !$.trim($("#TeleNumber").val())
  ) {
    alertify.error("Please Enter Telephone Number");
    isAllValueFilled = false;
  } else if (!$.trim($("#Email").val())) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!isEmail($.trim($("#Email").val()))) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!$.trim($("#MobileNumber").val())) {
    alertify.error("Please Enter Mobile Number");
    isAllValueFilled = false;
  } else if (
    $("#terms")[0].files.length <= 0 &&
    $("label[for='terms']").text() == "Choose File"
  ) {
    /*else if(!$.trim($("#justification").val()))
  {
    alertify.error('Please Enter Justification for Extension');
    isAllValueFilled=false;
  }*/
    alertify.error("Please upload a file for Modified Terms of Reference");
    isAllValueFilled = false;
  } else if (
    $("input[name='CstExtension']:checked").val() == "Cost Extension" &&
    $("#Estimation")[0].files.length <= 0 &&
    $("label[for='Estimation']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Estimated Cost for the Extension");
    isAllValueFilled = false;
  } else if (
    !$("#chkfinstatus").prop("checked") &&
    $("#Financialstatus")[0].files.length <= 0 &&
    $("label[for='Financialstatus']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Financial status of the done payments"
    );
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}

function mandatoryvalidationforservicerequestframeworkagreement() {
  var isAllValueFilled = true;

  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }

  if ($("input[name='Agreement']:checked").length == 0) {
    alertify.error("Please choose any one of the Agreement");
    isAllValueFilled = false;
  } else if (
    !$.trim($("#JOD").val()) &&
    $("#EventFramework:checked").val() ==
      "Events Management Framework Agreement"
  ) {
    alertify.error("Please Enter JOD");
    isAllValueFilled = false;
  } else if (
    !$.trim($("#EUR").val()) &&
    $("#EventFramework:checked").val() ==
      "Events Management Framework Agreement"
  ) {
    alertify.error("Please Enter EUR");
    isAllValueFilled = false;
  } else if (
    $("input[name='Agreement']:checked").val() ==
    "Events Management Framework Agreement"
  ) {
    if (
      $("#terms")[0].files.length <= 0 &&
      $("label[for='terms']").text() == "Choose File"
    ) {
      alertify.error("Please upload a file for Terms Of Reference");
      isAllValueFilled = false;
    }
  } else if (
    $("input[name='Agreement']:checked").val() ==
    "Legal Services Framework Agreement"
  ) {
    if (
      $("#FilledRequest")[0].files.length <= 0 &&
      $("label[for='FilledRequest']").text() == "Choose File"
    ) {
      alertify.error(
        "Please upload a file for Filled Request Form for Legal Services"
      );
      isAllValueFilled = false;
    }
  }
  return isAllValueFilled;
}
/* 
//summary
service request fucntionalities End
//summary 
*/

/* 
//summary
Lease request fucntionalities start
//summary 
*/

function CreateLeaseAgreement() {
  let arrFiles = [];

  if (MandatoryValidationForService()) {
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }

    pdfdetails = [];
    pdfdetails.push({
      Title: "Project Name",
      Value: $("#projectName option:selected").val(),
    });
    pdfdetails.push({ Title: "Project Number", Value: projectNumber });
    pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
    pdfdetails.push({
      Title: "Name of Budget Responsible Person (AV)",
      Value: $("#NameofAV").val(),
    });
    if ($("#chkKomp").prop("checked")) {
      pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
      pdfdetails.push({
        Title: "KompOutput Number",
        Value: $("#outputnumber").val(),
      });
      pdfdetails.push({
        Title: "KompOutput Percent",
        Value: $("#percent").val(),
      });
    }
    pdfdetails.push({
      Title: "Short Description",
      Value: $("#shortDescription").val(),
    });
    pdfdetails.push({
      Title: "Duration of the lease (From Date)",
      Value: $("#Fromdate").val(),
    });
    pdfdetails.push({
      Title: "Duration of the lease (To Date)",
      Value: $("#Todate").val(),
    });

    if (mandatoryforLease()) {
      let FromDate = new Date(
        Date.parse(
          moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
        )
      ).toISOString();
      let Todate = new Date(
        Date.parse(
          moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
        )
      ).toISOString();

      if (
        $("input[name='LessorPapers']:checked").val() ==
        "Lessor is an Individual"
      ) {
        if (mandatoryforindivual()) {
          $(".loading-modal").addClass("active");
          $("body").addClass("body-hidden");

          let Servicedata = {
            ProjectName: $("#projectName option:selected").val(),
            ProjectNumber: projectNumber,
            PNForZAS: txtpnForZAS,
            NameOfAV: $("#NameofAV").val(),
            AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
            //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
            RepresentativeId: {
              results: ProjectDetails[ProjectIndex].RepId,
            },
            KOMPOuput: $("#KompOptPT").val(),
            //ChoicesOfServices:$("#choicesservices option:selected").val(),
            ShortDesc: $("#shortDescription").val(),
            LessorPapers: $("input[name='LessorPapers']:checked").val(),
            LeaseAgreementCategory: $(
              "#Drpreqcategories option:selected"
            ).val(),
            LessorName: $("#LessorName").val(),
            EmailAddress: $("#Email").val(),
            MobileNumber: $("#MobileNumber").val(),
            FullAddress: $("#FullAddress").val(),
            TelephoneNumber: $("#PhoneNumber").val(),
            DurationFrom: FromDate,
            DurationTo: Todate,
          };
          arrFiles.push({
            FolderName: "LessorID",
            files: $("#LessorID")[0].files,
            previousfileid: $("label[for='LessorID']").attr("previousfileid"),
          });
          arrFiles.push({
            FolderName: "OwnerDocs",
            files: $("#OwnershipDocs")[0].files,
            previousfileid: $("label[for='OwnershipDocs']").attr(
              "previousfileid"
            ),
          });
          arrFiles.push({
            FolderName: "BankDetails",
            files: $("#BankDetails")[0].files,
            previousfileid: $("label[for='BankDetails']").attr(
              "previousfileid"
            ),
          });
          arrFiles.push({
            FolderName: "RmoApproval",
            files: $("#RMOApproval")[0].files,
            previousfileid: $("label[for='RMOApproval']").attr(
              "previousfileid"
            ),
          });
          arrFiles.push({
            FolderName: "DirectorApproval",
            files: $("#DirectorApproval")[0].files,
            previousfileid: $("label[for='DirectorApproval']").attr(
              "previousfileid"
            ),
          });
          arrFiles.push({
            FolderName: "LandScheme",
            files: $("#LandScheme")[0].files,
            previousfileid: $("label[for='LandScheme']").attr("previousfileid"),
          });

          if (filesotherAttachment.length > 0) {
            for (var i = 0; i < filesotherAttachment.length; i++) {
              var files = [];
              files.push(filesotherAttachment[i]);
              arrFiles.push({ FolderName: "Others", files: files });
            }
          }

          pdfdetails.push({
            Title: "Full Address",
            Value: $("#FullAddress").val(),
          });
          pdfdetails.push({
            Title: "Lessor Name",
            Value: $("#LessorName").val(),
          });
          pdfdetails.push({
            Title: "Telephone Number",
            Value: $("#TeleNumber").val(),
          });
          pdfdetails.push({ Title: "Email", Value: $("#Email").val() });
          pdfdetails.push({
            Title: "Mobile Number",
            Value: $("#MobileNumber").val(),
          });
          $(".custom-file-input").each(function () {
            if ($(this)[0].files.length > 0) {
              var name = $(this)
                .parent()
                .parent()
                .parent()[0]
                .children[0].innerText.split(":");
              pdfdetails.push({ Title: name[0], Value: "Attached" });
            }
          });
          //createpdf(pdfdetails);

          InsertLease(Servicedata, arrFiles);
        } else {
          formSubmitting = true;
        }
      } else {
        if (mandatoryforcompany()) {
          $(".loading-modal").addClass("active");
          $("body").addClass("body-hidden");

          let Servicedata = {
            ProjectName: $("#projectName option:selected").val(),
            ProjectNumber: projectNumber,
            PNForZAS: txtpnForZAS,
            NameOfAV: $("#NameofAV").val(),
            AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
            //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
            RepresentativeId: {
              results: ProjectDetails[ProjectIndex].RepId,
            },
            KOMPOuput: $("#KompOptPT").val(),
            //ChoicesOfServices:$("#choicesservices option:selected").val(),
            LeaseAgreementCategory: $(
              "#Drpreqcategories option:selected"
            ).val(),
            ShortDesc: $("#shortDescription").val(),
            LessorPapers: $("input[name='LessorPapers']:checked").val(),

            NameOfConsultingFirm: $("#NameOfFirm").val(),
            ContactPerson: $("#CntctPrsn").val(),
            EmailAddress: $("#Email").val(),
            MobileNumber: $("#MobileNumber").val(),
            FullAddress: $("#FullAddress").val(),
            TelephoneNumber: $("#PhoneNumber").val(),
            DurationFrom: FromDate,
            DurationTo: Todate,
          };
          arrFiles.push({
            FolderName: "RegCert",
            files: $("#RegCert")[0].files,
            previousfileid: $("label[for='RegCert']").attr("previousfileid"),
          });
          arrFiles.push({
            FolderName: "Profile",
            files: $("#Profile")[0].files,
            previousfileid: $("label[for='Profile']").attr("previousfileid"),
          });
          arrFiles.push({
            FolderName: "BankDetails",
            files: $("#BankDetails")[0].files,
            previousfileid: $("label[for='BankDetails']").attr(
              "previousfileid"
            ),
          });
          arrFiles.push({
            FolderName: "RmoApproval",
            files: $("#RMOApproval")[0].files,
            previousfileid: $("label[for='RMOApproval']").attr(
              "previousfileid"
            ),
          });
          arrFiles.push({
            FolderName: "DirectorApproval",
            files: $("#DirectorApproval")[0].files,
            previousfileid: $("label[for='DirectorApproval']").attr(
              "previousfileid"
            ),
          });
          arrFiles.push({
            FolderName: "LandScheme",
            files: $("#LandScheme")[0].files,
            previousfileid: $("label[for='LandScheme']").attr("previousfileid"),
          });
          if (filesotherAttachment.length > 0) {
            for (var i = 0; i < filesotherAttachment.length; i++) {
              var files = [];
              files.push(filesotherAttachment[i]);
              arrFiles.push({ FolderName: "Others", files: files });
            }
          }

          pdfdetails.push({
            Title: "Full Address",
            Value: $("#FullAddress").val(),
          });
          pdfdetails.push({
            Title: "Name Of Firm",
            Value: $("#NameOfFirm").val(),
          });
          pdfdetails.push({
            Title: "Name Of Contact Person",
            Value: $("#CntctPrsn").val(),
          });
          pdfdetails.push({
            Title: "Telephone Number",
            Value: $("#TeleNumber").val(),
          });
          pdfdetails.push({ Title: "Email", Value: $("#Email").val() });
          pdfdetails.push({
            Title: "Mobile Number",
            Value: $("#MobileNumber").val(),
          });
          $(".custom-file-input").each(function () {
            if ($(this)[0].files.length > 0) {
              var name = $(this)
                .parent()
                .parent()
                .parent()[0]
                .children[0].innerText.split(":");
              pdfdetails.push({ Title: name[0], Value: "Attached" });
            }
          });
          //createpdf(pdfdetails);
          InsertLease(Servicedata, arrFiles);
        } else {
          formSubmitting = true;
        }
      }
    } else {
      formSubmitting = true;
    }
  } else {
    formSubmitting = true;
  }
}

function CreateLeaseamendment() {
  let arrFiles = [];

  if (MandatoryValidationForService()) {
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }

    if (mandatoryforleaseamendment()) {
      $(".loading-modal").addClass("active");
      $("body").addClass("body-hidden");

      let Servicedata = {
        ProjectName: $("#projectName option:selected").val(),
        ProjectNumber: projectNumber,
        PNForZAS: txtpnForZAS,
        NameOfAV: $("#NameofAV").val(),
        AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
        //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
        RepresentativeId: {
          results: ProjectDetails[ProjectIndex].RepId,
        },
        //KOMPOuput:$("#KompOptPT").val(),
        //ChoicesOfServices:$("#choicesservices option:selected").val(),
        LeaseAgreementCategory: $("#Drpreqcategories option:selected").val(),
        isKompOutput: $("#chkKomp").prop("checked"),
        kompPercent: $("#percent").val(),
        KompOutputNumber: $("#outputnumber").val(),
        CoSoftNumber: $("#cosoftnum").val(),
        PaymentStatus: $("#chkfinstatus").prop("checked"),
      };

      if ($("#offer")[0].files.length > 0)
        arrFiles.push({
          FolderName: "ModifiedOffer",
          files: $("#offer")[0].files,
          previousfileid: $("label[for='offer']").attr("previousfileid"),
        });

      if ($("#justification")[0].files.length > 0)
        arrFiles.push({
          FolderName: "Justification",
          files: $("#justification")[0].files,
          previousfileid: $("label[for='justification']").attr(
            "previousfileid"
          ),
        });

      if ($("#Financialstatus")[0].files.length > 0)
        arrFiles.push({
          FolderName: "Financialstatus",
          files: $("#Financialstatus")[0].files,
          previousfileid: $("label[for='Financialstatus']").attr(
            "previousfileid"
          ),
        });

      pdfdetails = [];
      pdfdetails.push({
        Title: "Project Name",
        Value: $("#projectName option:selected").val(),
      });
      pdfdetails.push({ Title: "Project Number", Value: projectNumber });
      pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
      pdfdetails.push({
        Title: "Name of Budget Responsible Person (AV)",
        Value: $("#NameofAV").val(),
      });
      if ($("#chkKomp").prop("checked")) {
        pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
        pdfdetails.push({
          Title: "KompOutput Number",
          Value: $("#outputnumber").val(),
        });
        pdfdetails.push({
          Title: "KompOutput Percent",
          Value: $("#percent").val(),
        });
      }
      pdfdetails.push({
        Title: "Lease Agreement CoSoft Number",
        Value: $("#cosoftnum").val(),
      });

      $(".custom-file-input").each(function () {
        if ($(this)[0].files.length > 0) {
          var name = $(this)
            .parent()
            .parent()
            .parent()[0]
            .children[0].innerText.split(":");
          pdfdetails.push({ Title: name[0], Value: "Attached" });
        }
      });
      //createpdf(pdfdetails);
      InsertLease(Servicedata, arrFiles);
    } else {
      formSubmitting = true;
    }
  } else {
    formSubmitting = true;
  }
}

function mandatoryforleaseamendment() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#cosoftnum").val())) {
    alertify.error("Please Enter Lease Agreement CoSoft Number");
    isAllValueFilled = false;
  } else if (
    $("#justification")[0].files.length <= 0 &&
    $("label[for='justification']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Justification for amendment"
    );
    isAllValueFilled = false;
  } else if (
    $("#offer")[0].files.length <= 0 &&
    $("label[for='offer']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Modified offer by the lessor");
    isAllValueFilled = false;
  } else if (
    !$("#chkfinstatus").prop("checked") &&
    $("#Financialstatus")[0].files.length <= 0 &&
    $("label[for='Financialstatus']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Financial status of the done payments"
    );
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}

async function InsertLease(Servicedata, arrFiles) {
  fileslength = arrFiles.length;
  await sp.web.lists
    .getByTitle("LeaseAgreement")
    .items.getById(itemid)
    .update(Servicedata)
    .then(async function (data) {
      //createFolder('EstimatedCost',data.data.ID,$('#Estimation')[0].files);
      //await createpdf(pdfdetails, "LA-" +itemid);
      var updatedfiles = [];
      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].files.length > 0) {
          updatedfiles.push(arrFiles[i]);
        }
      }
      arrFiles = updatedfiles;
      fileslength = arrFiles.length;

      if (arrFiles.length <= 0) Showpopup();

      await deletefile(arrFiles);
      await deletefile(arrAbtToDel);
      for (var i = 0; i < arrFiles.length; i++) {
        createFolder(arrFiles[i].FolderName, "LA-" + itemid, arrFiles[i].files);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "InsertLease");
    });
}

/* 
//summary
Lease request fucntionalities End
//summary 
*/

/* 
//summary
subsidy request fucntionalities End
//summary 
*/

function CreateSubsidy() {
  let arrFiles = [];

  if (MandatoryValidationForService()) {
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }

    if (mandatoryforsubsidy()) {
      $(".loading-modal").addClass("active");
      $("body").addClass("body-hidden");
      let FromDate = new Date(
        Date.parse(
          moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
        )
      ).toISOString();
      let Todate = new Date(
        Date.parse(
          moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
        )
      ).toISOString();

      let Servicedata = {
        ProjectName: $("#projectName option:selected").val(),
        ProjectNumber: projectNumber,
        PNForZAS: txtpnForZAS,
        NameOfAV: $("#NameofAV").val(),
        AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
        //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
        RepresentativeId: {
          results: ProjectDetails[ProjectIndex].RepId,
        },
        //KOMPOuput:$("#KompOptPT").val(),
        //ChoicesOfServices:$("#choicesservices option:selected").val(),
        isKompOutput: $("#chkKomp").prop("checked"),
        SubsidyCategory: $("#Drpreqcategories option:selected").val(),
        kompPercent: $("#percent").val(),
        KompOutputNumber: $("#outputnumber").val(),
        JOD: $("#JOD").val(),
        EUR: $("#EUR").val(),
        ShortDesc: $("#shortDescription").val(),
        TelephoneNumber: $("#TeleNumber").val(),
        ContactPerson: $("#CntctPrsn").val(),
        EmailAddress: $("#Email").val(),
        MobileNumber: $("#MobileNumber").val(),
        FullAddress: $("#FullAddress").val(),
        NameOfBeneficiary: $("#NameOfBenficiary").val(),
        DurationFrom: FromDate,
        DurationTo: Todate,
      };
      arrFiles.push({
        FolderName: "ProjectProposal",
        files: $("#Proposal")[0].files,
      });
      arrFiles.push({
        FolderName: "Budget",
        files: $("#Budget")[0].files,
        previousfileid: $("label[for='Budget']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "Profile",
        files: $("#Profile")[0].files,
        previousfileid: $("label[for='Profile']").attr("previousfileid"),
      });
      if ($("#BankDetails")[0].files.length > 0) {
        arrFiles.push({
          FolderName: "BankDetails",
          files: $("#BankDetails")[0].files,
          previousfileid: $("label[for='BankDetails']").attr("previousfileid"),
        });
      }
      arrFiles.push({
        FolderName: "CommercialSuitability",
        files: $("#Suitability")[0].files,
        previousfileid: $("label[for='Suitability']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "RegCert",
        files: $("#Certificate")[0].files,
        previousfileid: $("label[for='Certificate']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "HQApproval",
        files: $("#HQApproval")[0].files,
        previousfileid: $("label[for='HQApproval']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "MinisterApproval",
        files: $("#MinisterApproval")[0].files,
        previousfileid: $("label[for='MinisterApproval']").attr(
          "previousfileid"
        ),
      });
      if (filesotherAttachment.length > 0) {
        for (var i = 0; i < filesotherAttachment.length; i++) {
          var files = [];
          files.push(filesotherAttachment[i]);
          arrFiles.push({ FolderName: "Others", files: files });
        }
      }

      pdfdetails = [];
      pdfdetails.push({
        Title: "Project Name",
        Value: $("#projectName option:selected").val(),
      });
      pdfdetails.push({ Title: "Project Number", Value: projectNumber });
      pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
      pdfdetails.push({
        Title: "Name of Budget Responsible Person (AV)",
        Value: $("#NameofAV").val(),
      });
      if ($("#chkKomp").prop("checked")) {
        pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
        pdfdetails.push({
          Title: "KompOutput Number",
          Value: $("#outputnumber").val(),
        });
        pdfdetails.push({
          Title: "KompOutput Percent",
          Value: $("#percent").val(),
        });
      }
      pdfdetails.push({
        Title: "Name Of Beneficiary",
        Value: $("#NameOfBenficiary").val(),
      });
      pdfdetails.push({
        Title: "Short Description of the Requested Local Subsidy",
        Value: $("#shortDescription").val(),
      });
      pdfdetails.push({
        Title: "Full Address",
        Value: $("#FullAddress").val(),
      });
      pdfdetails.push({
        Title: "Contract Person from the Firm",
        Value: $("#CntctPrsn").val(),
      });
      pdfdetails.push({
        Title: "Telephone Number",
        Value: $("#TeleNumber").val(),
      });
      pdfdetails.push({ Title: "Email", Value: $("#Email").val() });
      pdfdetails.push({
        Title: "Mobile Number",
        Value: $("#MobileNumber").val(),
      });
      pdfdetails.push({
        Title: "Duration of the assignment (From Date)",
        Value: $("#Fromdate").val(),
      });
      pdfdetails.push({
        Title: "Duration of the assignment (To Date)",
        Value: $("#Todate").val(),
      });
      pdfdetails.push({ Title: "JOD", Value: $("#JOD").val() });
      pdfdetails.push({ Title: "EUR", Value: $("#EUR").val() });

      $(".custom-file-input").each(function () {
        if ($(this)[0].files.length > 0) {
          var name = $(this)
            .parent()
            .parent()
            .parent()[0]
            .children[0].innerText.split(":");
          pdfdetails.push({ Title: name[0], Value: "Attached" });
        }
      });
      //createpdf(pdfdetails);
      InsertSubsidy(Servicedata, arrFiles);
    } else {
      formSubmitting = true;
    }
  } else {
    formSubmitting = true;
  }
}

function CreateSubsidyAmendemnt() {
  let arrFiles = [];

  if (MandatoryValidationForService()) {
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }

    if (mandatoryforsubsidyamendment()) {
      $(".loading-modal").addClass("active");
      $("body").addClass("body-hidden");
      let Servicedata = {
        ProjectName: $("#projectName option:selected").val(),
        ProjectNumber: projectNumber,
        PNForZAS: txtpnForZAS,
        NameOfAV: $("#NameofAV").val(),
        AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
        //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
        RepresentativeId: {
          results: ProjectDetails[ProjectIndex].RepId,
        },
        //KOMPOuput:$("#KompOptPT").val(),
        //ChoicesOfServices:$("#choicesservices option:selected").val(),
        SubsidyCategory: $("#Drpreqcategories option:selected").val(),
        isKompOutput: $("#chkKomp").prop("checked"),
        kompPercent: $("#percent").val(),
        KompOutputNumber: $("#outputnumber").val(),
        CoSoftNumber: $("#cosoftnum").val(),
        PaymentStatus: $("#chkfinstatus").prop("checked"),
      };

      if ($("#justification")[0].files.length > 0)
        arrFiles.push({
          FolderName: "Justification",
          files: $("#justification")[0].files,
          previousfileid: $("label[for='justification']").attr(
            "previousfileid"
          ),
        });

      if ($("#Proposal")[0].files.length > 0)
        arrFiles.push({
          FolderName: "ProjectProposal",
          files: $("#Proposal")[0].files,
          previousfileid: $("label[for='Proposal']").attr("previousfileid"),
        });

      if ($("#Budget")[0].files.length > 0)
        arrFiles.push({
          FolderName: "Budget",
          files: $("#Budget")[0].files,
          previousfileid: $("label[for='Budget']").attr("previousfileid"),
        });

      if ($("#Financialstatus")[0].files.length > 0)
        arrFiles.push({
          FolderName: "Financialstatus",
          files: $("#Financialstatus")[0].files,
          previousfileid: $("label[for='Financialstatus']").attr(
            "previousfileid"
          ),
        });

      if ($("#MinisterApproval")[0].files.length > 0)
        arrFiles.push({
          FolderName: "MinisterApproval",
          files: $("#MinisterApproval")[0].files,
          previousfileid: $("label[for='MinisterApproval']").attr(
            "previousfileid"
          ),
        });

      pdfdetails = [];
      pdfdetails.push({
        Title: "Project Name",
        Value: $("#projectName option:selected").val(),
      });
      pdfdetails.push({ Title: "Project Number", Value: projectNumber });
      pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
      pdfdetails.push({
        Title: "Name of Budget Responsible Person (AV)",
        Value: $("#NameofAV").val(),
      });
      if ($("#chkKomp").prop("checked")) {
        pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
        pdfdetails.push({
          Title: "KompOutput Number",
          Value: $("#outputnumber").val(),
        });
        pdfdetails.push({
          Title: "KompOutput Percent",
          Value: $("#percent").val(),
        });
      }
      pdfdetails.push({
        Title: "Local Subsidy CoSoft Number",
        Value: $("#cosoftnum").val(),
      });
      $(".custom-file-input").each(function () {
        if ($(this)[0].files.length > 0) {
          var name = $(this)
            .parent()
            .parent()
            .parent()[0]
            .children[0].innerText.split(":");
          pdfdetails.push({ Title: name[0], Value: "Attached" });
        }
      });

      //createpdf(pdfdetails);
      InsertSubsidy(Servicedata, arrFiles);
    } else {
      formSubmitting = true;
    }
  } else {
    formSubmitting = true;
  }
}

async function InsertSubsidy(Servicedata, arrFiles) {
  fileslength = arrFiles.length;
  await sp.web.lists
    .getByTitle("LocalSubsidy")
    .items.getById(itemid)
    .update(Servicedata)
    .then(async function (data) {
      //createFolder('EstimatedCost',data.data.ID,$('#Estimation')[0].files);
      //await createpdf(pdfdetails, "LS-" + data.data.ID);
      var updatedfiles = [];
      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].files.length > 0) {
          updatedfiles.push(arrFiles[i]);
        }
      }
      arrFiles = updatedfiles;
      fileslength = arrFiles.length;

      if (arrFiles.length <= 0) Showpopup();

      await deletefile(arrFiles);
      await deletefile(arrAbtToDel);

      for (var i = 0; i < arrFiles.length; i++) {
        createFolder(arrFiles[i].FolderName, "LS-" + itemid, arrFiles[i].files);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "InsertSubsidy");
    });
}

function mandatoryforsubsidy() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#shortDescription").val())) {
    alertify.error("Please Enter Short Description");
    isAllValueFilled = false;
  } else if (!$.trim($("#NameOfBenficiary").val())) {
    alertify.error("Please Enter Name Of Benficiary");
    isAllValueFilled = false;
  } else if (!$.trim($("#FullAddress").val())) {
    alertify.error("Please Enter Full Address");
    isAllValueFilled = false;
  } else if (!$.trim($("#TeleNumber").val())) {
    alertify.error("Please Enter Telephone Number");
    isAllValueFilled = false;
  } else if (!$.trim($("#CntctPrsn").val())) {
    alertify.error("Please Enter Contact Person");
    isAllValueFilled = false;
  } else if (!$.trim($("#Email").val())) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!isEmail($.trim($("#Email").val()))) {
    alertify.error("Please Enter Valid Email");
    isAllValueFilled = false;
  } else if (!$.trim($("#MobileNumber").val())) {
    alertify.error("Please Enter Mobile Number");
    isAllValueFilled = false;
  } else if (!$.trim($("#Fromdate").val())) {
    alertify.error("Please Enter assignment (From Date)");
    isAllValueFilled = false;
  } else if (!$.trim($("#Todate").val())) {
    alertify.error("Please Enter assignment (To Date)");
    isAllValueFilled = false;
  } else if (
    moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString() >
    moment($("#Todate").val(), "MM-DD-YYYY").toISOString()
  ) {
    alertify.error("From  Date Should be lesser than To date");
    isAllValueFilled = false;
  } else if (
    $("#Proposal")[0].files.length <= 0 &&
    $("label[for='Proposal']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Project Proposal");
    isAllValueFilled = false;
  } else if (
    $("#Suitability")[0].files.length <= 0 &&
    $("label[for='Suitability']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Commercial Suitability");
    isAllValueFilled = false;
  } else if (
    $("#Budget")[0].files.length <= 0 &&
    $("label[for='Budget']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Budget Break-down");
    isAllValueFilled = false;
  } else if (
    $("#Certificate")[0].files.length <= 0 &&
    $("label[for='Certificate']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Registration Certificate");
    isAllValueFilled = false;
  } else if (
    $("#Profile")[0].files.length <= 0 &&
    $("label[for='Profile']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Profile");
    isAllValueFilled = false;
  } else if (!$.trim($("#JOD").val())) {
    alertify.error("Please Enter JOD");
    isAllValueFilled = false;
  } else if (!$.trim($("#EUR").val())) {
    alertify.error("Please Enter EUR");
    isAllValueFilled = false;
  } else if (
    $("#EUR").val() >= 50000 &&
    $("#BankDetails")[0].files.length <= 0 &&
    $("label[for='BankDetails']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Bank Details");
    isAllValueFilled = false;
  } else if (
    $("#HQApproval").val() >= 50000 &&
    $("#BankDetails")[0].files.length <= 0 &&
    $("label[for='BankDetails']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Checklist for HQ Approval");
    isAllValueFilled = false;
  } else if (
    $("#MinisterApproval")[0].files.length <= 0 &&
    $("label[for='MinisterApproval']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Approval from the Prime Minister/ Authorized Ministry"
    );
    isAllValueFilled = false;
  } /*else if (filesotherAttachment.length <= 0&&$("#otherAttachmentFiles")[0].children.length<=0) {
    alertify.error("Please upload a file for Other Attachment");
    isAllValueFilled = false;
  }*/

  return isAllValueFilled;
}

function mandatoryforsubsidyamendment() {
  var isAllValueFilled = true;
  if ($(".ajs-message").length > 0) {
    $(".ajs-message").remove();
  }
  if (!$.trim($("#cosoftnum").val())) {
    alertify.error("Please Enter Local Subsidy CoSoft Number");
    isAllValueFilled = false;
  } else if (
    $("#MinisterApproval")[0].files.length <= 0 &&
    $("label[for='MinisterApproval']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Prime Minister approval for the additional budget"
    );
    isAllValueFilled = false;
  } else if (
    $("#justification")[0].files.length <= 0 &&
    $("label[for='justification']").text() == "Choose File"
  ) {
    alertify.error("Please upload a file for Justification for Amendment");
    isAllValueFilled = false;
  } else if (
    $("#Budget")[0].files.length <= 0 &&
    $("label[for='Budget']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Modified Budget Breakdown (signed and stamped)"
    );
    isAllValueFilled = false;
  } else if (
    !$("#chkfinstatus").prop("checked") &&
    $("#Financialstatus")[0].files.length <= 0 &&
    $("label[for='Financialstatus']").text() == "Choose File"
  ) {
    alertify.error(
      "Please upload a file for Financial status of the done payments"
    );
    isAllValueFilled = false;
  }
  return isAllValueFilled;
}

/* 
//summary
subsidy request fucntionalities End
//summary 
*/

function createIdpp() {
  let arrFiles = [];

  if (MandatoryValidationForService()) {
    let projectNumber =
      $("#txtProjectNum1").val() +
      "." +
      $("#txtProjectNum2").val() +
      "." +
      $("#txtProjectNum3").val() +
      "-" +
      $("#txtProjectNum4").val() +
      "." +
      $("#txtProjectNum5").val();
    let txtpnForZAS =
      $("#txtpnforzas1").val() +
      "." +
      $("#txtpnforzas2").val() +
      "." +
      $("#txtpnforzas3").val() +
      "-" +
      $("#txtpnforzas4").val() +
      "." +
      $("#txtpnforzas5").val();
    var ProjectIndex;
    for (var prNum = 0; prNum < ProjectDetails.length; prNum++) {
      if (
        ProjectDetails[prNum].PrjtcNum ==
        $("#projectName option:selected").val()
      ) {
        ProjectIndex = prNum;
        break;
      }
    }
    if (mandatoryforiDPP()) {
      $(".loading-modal").addClass("active");
      $("body").addClass("body-hidden");
      let FromDate = new Date(
        Date.parse(
          moment($("#Fromdate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
        )
      ).toISOString();
      let Todate = new Date(
        Date.parse(
          moment($("#Todate").val(), "MM/DD/YYYY").format("YYYY-MM-DD")
        )
      ).toISOString();

      let Servicedata = {
        ProjectName: $("#projectName option:selected").val(),
        ProjectNumber: projectNumber,
        PNForZAS: txtpnForZAS,
        NameOfAV: $("#NameofAV").val(),
        AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
        //RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
        RepresentativeId: {
          results: ProjectDetails[ProjectIndex].RepId,
        },
        //KOMPOuput:$("#KompOptPT").val(),
        //ChoicesOfServices:$("#choicesservices option:selected").val(),
        isKompOutput: $("#chkKomp").prop("checked"),
        kompPercent: $("#percent").val(),
        KompOutputNumber: $("#outputnumber").val(),
        ShortDesc: $("#shortDescription").val(),
        DurationFrom: FromDate,
        DurationTo: Todate,
      };
      arrFiles.push({
        FolderName: "RegCert",
        files: $("#RegCert")[0].files,
        previousfileid: $("label[for='RegCert']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "Profile",
        files: $("#Profile")[0].files,
        previousfileid: $("label[for='Profile']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "BankDetails",
        files: $("#BankDetails")[0].files,
        previousfileid: $("label[for='BankDetails']").attr("previousfileid"),
      });

      arrFiles.push({
        FolderName: "CVExperts",
        files: $("#Experts")[0].files,
        previousfileid: $("label[for='CVExperts']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "FinancialReports",
        files: $("#FinReport")[0].files,
        previousfileid: $("label[for='FinReport']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "AgreementConcept",
        files: $("#Agreement")[0].files,
        previousfileid: $("label[for='Agreement']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "Vergabedok",
        files: $("#Vergabedok")[0].files,
        previousfileid: $("label[for='Vergabedok']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "SummaryActionPlan",
        files: $("#Actionplan")[0].files,
        previousfileid: $("label[for='Actionplan']").attr("previousfileid"),
      });
      arrFiles.push({
        FolderName: "CompetitionReport",
        files: $("#CompetitionReport")[0].files,
        previousfileid: $("label[for='CompetitionReport']").attr(
          "previousfileid"
        ),
      });
      arrFiles.push({
        FolderName: "Budget",
        files: $("#Budget")[0].files,
        previousfileid: $("label[for='Budget']").attr("previousfileid"),
      });

      pdfdetails = [];
      pdfdetails.push({
        Title: "Project Name",
        Value: $("#projectName option:selected").val(),
      });
      pdfdetails.push({ Title: "Project Number", Value: projectNumber });
      pdfdetails.push({ Title: "PN for ZAS", Value: txtpnForZAS });
      pdfdetails.push({
        Title: "Name of Budget Responsible Person (AV)",
        Value: $("#NameofAV").val(),
      });
      if ($("#chkKomp").prop("checked")) {
        pdfdetails.push({ Title: "Komp Output", Value: "Checked" });
        pdfdetails.push({
          Title: "KompOutput Number",
          Value: $("#outputnumber").val(),
        });
        pdfdetails.push({
          Title: "KompOutput Percent",
          Value: $("#percent").val(),
        });
      }
      pdfdetails.push({
        Title: "Short Description",
        Value: $("#shortDescription").val(),
      });
      pdfdetails.push({
        Title: "Duration of the assignment (From Date)",
        Value: $("#Fromdate").val(),
      });
      pdfdetails.push({
        Title: "Duration of the assignment (To Date)",
        Value: $("#Todate").val(),
      });

      $(".custom-file-input").each(function () {
        if ($(this)[0].files.length > 0) {
          var name = $(this)
            .parent()
            .parent()
            .parent()[0]
            .children[0].innerText.split(":");
          pdfdetails.push({ Title: name[0], Value: "Attached" });
        }
      });
      //createpdf(pdfdetails);

      InsertIdpp(Servicedata, arrFiles);
    } else {
      formSubmitting = true;
    }
  } else {
    formSubmitting = true;
  }
}

async function InsertIdpp(Servicedata, arrFiles) {
  fileslength = arrFiles.length;
  await sp.web.lists
    .getByTitle("IDPP")
    .items.getById(itemid)
    .update(Servicedata)
    .then(async function (data) {
      //createFolder('EstimatedCost',data.data.ID,$('#Estimation')[0].files);
      //await createpdf(pdfdetails, "idpp-" + itemid);
      var updatedfiles = [];
      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].files.length > 0) {
          updatedfiles.push(arrFiles[i]);
        }
      }
      arrFiles = updatedfiles;
      fileslength = arrFiles.length;

      if (arrFiles.length <= 0) Showpopup();

      await deletefile(arrFiles);
      await deletefile(arrAbtToDel);

      for (var i = 0; i < arrFiles.length; i++) {
        createFolder(
          arrFiles[i].FolderName,
          "IDP-" + itemid,
          arrFiles[i].files
        );
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "InsertIdpp");
    });
}

/* 
//summary
common fucntionalities were written start
//summary 
*/

async function createFolder(FolderName, ListID, files) {
  await sp.web
    .getFolderByServerRelativeUrl(
      "ProcurementServices/" + FolderName + "/" + ListID + ""
    )
    .get()
    .then(async function (data) {
      //alert("Folder is already created at " + data.ServerRelativeUrl);
      await UploadFile(data.ServerRelativeUrl, files);
    })
    .catch(async function (error) {
      await sp.web.folders
        .add("ProcurementServices/" + FolderName + "/" + ListID + "")
        .then(async function (data) {
          console.log("Folder is created at " + data.data.ServerRelativeUrl);
          await UploadFile(data.data.ServerRelativeUrl, files);
        })
        .catch(function (error) {
          ErrorCallBack(error, "createFolder");
        });
      //alert("Folder is already not created at that folder");
    });
}

async function UploadFile(FolderUrl, files) {
  if (files.length > 0) {
    await sp.web
      .getFolderByServerRelativeUrl(FolderUrl)
      .files.add(files[0].name, files[0], true)
      .then(async function (data) {
        filesuploaded++;
        console.log("Added");
        if (filesuploaded == fileslength) {
          $(".loading-modal").removeClass("active");
          $("body").removeClass("body-hidden");
          Showpopup();
        }
      })
      .catch(function (error) {
        ErrorCallBack(error, "uploadFiles");
      });
  }
}

function isEmail(Email) {
  var testEmail = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
  if (testEmail.test(Email)) return true;
  else return false;
}

function removeOthersfile(filename) {
  for (var i = 0; i < filesotherAttachment.length; i++) {
    if (filesotherAttachment[i].name == filename) {
      //filesotherAttachment[i].remove();
      filesotherAttachment.splice(i, 1);
      break;
    }
  }
}

async function getLoggedInUserDetails() {
  await sp.web.currentUser
    .get()
    .then(async (allItems: any) => {
      if (allItems) {
         CrntUserID = allItems.Id;
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "getLoggedInUserDetails");
    });
}

async function LoadProjects() {
  await sp.web.lists
    .getByTitle("Projects")
    .items.select(
      "Title,Id,ProjectNumber,ProjectAV/Title,ProjectAV/ID,ProjectAV/EMail,Representative/ID,HeadOfProcurement/ID,HeadOfProcurement/EMail"
    )
    .expand("ProjectAV,Representative,HeadOfProcurement")
    .get()
    .then(async function (allItems) {
      for (var index = 0; index < allItems.length; index++) {
        var element = allItems[index];

        for (
          var indexForRep = 0;
          indexForRep < allItems[index].Representative.length;
          indexForRep++
        ) {
          if (CrntUserID == allItems[index].Representative[indexForRep].ID) {
            flgRepUser = true;
            $("#projectName").append(
              '<option Proj-Num="' +
                element.ProjectNumber +
                '" Proj-Av-email="' +
                element.ProjectAV.EMail +
                '" Proj-Av-id="' +
                element.ProjectAV.ID +
                '" Proj-HOP-email="' +
                element.HeadOfProcurement.EMail +
                '" Proj-Av="' +
                element.ProjectAV.Title +
                '"  proj-id="' +
                element.Id +
                '" value="' +
                element.Title +
                '">' +
                element.Title +
                "</option>"
            );
            var arrRepUsers = [];
            for (var i = 0; i < allItems[index].Representative.length; i++) {
              arrRepUsers.push(allItems[index].Representative[i].ID);
            }
            await ProjectDetails.push({
              PrjtcNum: element.Title,
              RepId: arrRepUsers,
            });
          }
        }
      }

      if (!flgRepUser) {
        await AlertMessage("Access Denied");
      }
    });
}

async function LoadFileTypes() {
  await sp.web
    .getList("" + serverURL + "/Lists/FileTypes")
    .items.select("Title")
    .get()
    .then(async (allItems: any[]) => {
      _validFileExtensions = [];
      for (var index = 0; index < allItems.length; index++) {
        _validFileExtensions.push("." + allItems[index].Title);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadFileTypes");
    });
}

function Showpopup() {
  $(".loading-modal").removeClass("active");
  $("body").removeClass("body-hidden");
  var projectname = $("#DrpProjectName option:selected").val();
  if (projectname == "Goods")
    AlertMessage("Goods Request is updated in the System");
  else if (projectname == "Service")
    AlertMessage("Service Request is updated in the System");
  else if (projectname == "Lease")
    AlertMessage("Lease Agreement Request is updated in the System");
  else if (projectname == "Subsidy")
    AlertMessage("Local Subsidy Request is updated in the System");
  else if (projectname == "idpp")
    AlertMessage("Idpp Request is updated in the System");
}

function AlertMessage(strMewssageEN) {
  alertify
    .alert()
    .setting({
      label: "OK",

      message: strMewssageEN,

      onok: function () {
        window.location.href = siteURL + "/SitePages/RequestDashboard.aspx";
      },
    })
    .show()
    .setHeader("<em>Confirmation</em> ")
    .set("closable", false);
}
async function sendnewrequestmail(touser, ccuser) {
  var maildetails = {
    To: [touser],
    CC: [ccuser],
    Subject: "This email is about...",
    Body: "Here is the body for New request",
  };
  await sendemail(maildetails);
}

async function sendemail(maildetails) {
  let emailProps: EmailProperties = maildetails;

  await sp.utility
    .sendEmail(emailProps)
    .then((_) => {
      console.log("Email Sent!");
    })
    .catch(function (error) {
      ErrorCallBack(error, "sendemail");
    });
}

function ValidateSingleInput(oInput) {
  if (oInput.type == "file") {
    var sFileName = oInput.value;
    if (sFileName.length > 0) {
      var blnValid = false;
      for (var j = 0; j < _validFileExtensions.length; j++) {
        var sCurExtension = _validFileExtensions[j];
        if (
          sFileName
            .substr(
              sFileName.length - sCurExtension.length,
              sCurExtension.length
            )
            .toLowerCase() == sCurExtension.toLowerCase()
        ) {
          blnValid = true;
          break;
        }
      }

      if (!blnValid) {
        alertify.error(
          "Sorry allowed extensions are: " + _validFileExtensions.join(", ")
        );
        oInput.value = "";
        return false;
      }
    }
  }
  return true;
}

async function createpdf(pdfdetails, filename) {
  var HTMLGoods = "";
  HTMLGoods +=
    '<div class="" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">New Request Details</h4></div><div class="modal-body">';
  for (var i = 0; i < pdfdetails.length; i++) {
    HTMLGoods +=
      '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">' +
      pdfdetails[i].Title +
      '</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
      pdfdetails[i].Value +
      "</p></div></div>";
  }
  HTMLGoods += '</div><div class="modal-footer" ></div></div></div></div>';
  $("#divforpdf").html("");
  $("#divforpdf").html(HTMLGoods);

  var opt = {
    margin: 1,
    filename: "myfile.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  $("#divforpdf").show();
  let elem = document.getElementById("divforpdf");
  await html2pdf()
    .from(elem)
    .set(opt)
    .outputPdf("arraybuffer")
    .then((result) => {
      // handle your result here...
      $("#divforpdf").hide();
      uploadpdf(result, filename);
    })
    .catch(function (error) {
      ErrorCallBack(error, "html2pdf");
    });
}

async function uploadpdf(result, filename) {
  await sp.web
    .getFolderByServerRelativeUrl("NewRequests")
    .files.add(filename + ".pdf", result, true)
    .then(async function (data) {
      await updatemetadata(data);
    })
    .catch(function (error) {
      ErrorCallBack(error, "uploadpdf");
    });
}

async function updatemetadata(data) {
  await data.file.listItemAllFields
    .get()
    .then(async function (listItemAllFields) {
      await updatepdf(listItemAllFields);
    })
    .catch(function (error) {
      ErrorCallBack(error, "dataFiles");
    });
}

async function updatepdf(listItemAllFields) {
  var RequestType = $("#Drpreqcategories option:selected").text();
  if (!$("#Drpreqcategories option:selected").val()) RequestType = "IDPP";

  var hstrydata = {
    RequestType: RequestType,
    AVNameId: $("#projectName option:selected").attr("Proj-Av-id"),
  };
  await sp.web.lists
    .getByTitle("NewRequests")
    .items.getById(listItemAllFields.Id)
    .update(hstrydata)
    .then(async function (results) {
      await console.log("pdf generated");
    })
    .catch(function (error) {
      ErrorCallBack(error, "files");
    });
}

async function ErrorCallBack(error, methodname) {
  try {
    var Title = $("#Drpreqcategories option:selected").text();
    if (!Title) Title = "IDPP";

    var errordata = {
      Error: error.message,
      MethodName: methodname,
      Title: Title,
    };
    await sp.web.lists
      .getByTitle("ErrorLog")
      .items.add(errordata)
      .then(async function (data) {
        $(".loading-modal").removeClass("active");
        $("body").removeClass("body-hidden");
        AlertMessage("Something went wrong.please contact system admin");
      });
  } catch (e) {
    //alert(e.message);
    $(".loading-modal").removeClass("active");
    $("body").removeClass("body-hidden");
    AlertMessage("Something went wrong.please contact system admin");
  }
}

function getUrlParameter(param) {
  var url = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
  for (var i = 0; i < url.length; i++) {
    var urlparam = url[i].split("=");
    if (urlparam[0] == param) {
      return urlparam[1];
    }
  }
}

/* 
//summary
common fucntionalities were written End
//summary 
*/

/*
//summary
Edit functionality Start
//summary
*/

async function getAllFolders() {
  await sp.web
    .getFolderByServerRelativeUrl("ProcurementServices")
    .expand("Files,Files/ID,Folders/Folders/Files")
    .get()
    .then(async (allItems: any[]) => {
      console.log(allItems);
      if (allItems) {
        ProcurementServiceFiles = allItems;
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "getAllFolders");
    });
}

async function FetchListitems(Listname, columns, lookup, ID) {
  var itemsdata = await sp.web.lists
    .getByTitle(Listname)
    .items.select(columns)
    .orderBy("Modified", false)
    .expand(lookup)
    .top(5000)
    .getById(ID)
    .get()
    .then(async (allItems: any[]) => {
      return allItems;
    })
    .catch(function (error) {
      ErrorCallBack(error, "FetchListitems");
    });

  return itemsdata;
}

async function FetchGoodsDetails() {
  var columns =
    "ProjectName,ProjectNumber,ID,AVName/ID,Representative/ID,Specifications,RequestItem,PNForZAS,NameOfAV,AssignedTo1/Title,AssignedTo1/ID,RequestStatus/ID,RequestStatus/Title,Author/Title,Author/ID,Created,Modified,KompOutputNumber,kompPercent,isKompOutput,Specifications,ShortDesc,RequestItem,JOD,EUR,DeliveryTime,WarrantyTime,FullAddress,ContactPersonName,PersonEmail,PersonMobile,ProsoftNumber,Agreement,GoodsCategory,StatusSummary,isPublictender,isNoChange";
  var lookup = "AssignedTo1,AVName,Representative,RequestStatus,Author";
  var ID = itemid;
  var listname = "ProcurementGoods";

  $(".loading-modal").addClass("active");
  $("body").addClass("body-hidden");


  var goodsdetails = [];
  goodsdetails.push(await FetchListitems(listname, columns, lookup, ID));

  $("#DrpProjectName").val("Goods");
  $("#DrpProjectName").trigger("change");

  $("#Drpreqcategories").val(goodsdetails[0].GoodsCategory);
  $("#Drpreqcategories").trigger("change");

  BindCommonvalues(goodsdetails);

  if (goodsdetails[0].GoodsCategory == "goods") {


    
    if (goodsdetails[0].Specifications == "Nonneutral Specifications") {
      //$("#nonneutralspec").trigger("click");
      $("#nonneutralspec").prop("checked",true);
    } else if (goodsdetails[0].Specifications == "Neutral Specifications") {
      //$("#neutralspec").trigger("click");
      $("#neutralspec").prop("checked",true);
    }

    $("input[name='Specifications']").trigger("change");
    $("#shortDescription").val(goodsdetails[0].ShortDesc);
    $("#CntctPrsn").val(goodsdetails[0].ContactPersonName);
    $("#Email").val(goodsdetails[0].PersonEmail);
    $("#MobileNumber").val(goodsdetails[0].PersonMobile);
    $("#JOD").val(goodsdetails[0].JOD);
    $("#EUR").val(goodsdetails[0].EUR);

    if (goodsdetails[0].EUR <= 20000) {
      $("#fileShortlist").prop("disabled", false);
      $("#lblshortlist").text("Shortlist :");
      $("#divChkPublictender").show();
      $("#news-span").hide();
    } else {
      $("#fileShortlist").val("");
      $("#fileShortlistFileName").text("Choose File");
      $("#fileShortlist").prop("disabled", true);
      $("#lblshortlist").text("Shortlist : (Not Selectable)");
      $("#divChkPublictender").hide();
      $("#news-span").show();
    }
    $(goodsdetails[0].isPublictender);
    {
      $("#chkPublictender").prop("checked", true);
      $("#fileShortlist").val("");
      $("#fileShortlistFileName").text("Choose File");
      $("#fileShortlist").prop("disabled", true);
      $("#lblshortlist").text("Shortlist : (Not Selectable)");
      $("#divChkPublictender").show();
    }

    if (goodsdetails[0].RequestItem == "Yes") {
      $("#chkMoreItem").trigger("click");
    }
    $("#requestedDeliveryTime").val(
      moment(goodsdetails[0].DeliveryTime).format("MM/DD/YYYY")
    );
    $("#deliveryAddress").val(goodsdetails[0].FullAddress);
  } else if (goodsdetails[0].GoodsCategory == "goodsamendment") {
    $("#prosoftnum").val(goodsdetails[0].ProsoftNumber);
    $("#requestedDeliveryTime").val(
      moment(goodsdetails[0].DeliveryTime).format("MM/DD/YYYY")
    );
    if (goodsdetails[0].isNoChange == true) {
      $("#chkNoChanges").prop("checked", true);
      $("#chkNoChanges").trigger("change");
    } else {
      $("#chkNoChanges").prop("checked", false);
    }
  } else if (goodsdetails[0].GoodsCategory == "framework") {
    $("#JOD").val(goodsdetails[0].JOD);
    $("#EUR").val(goodsdetails[0].EUR);

    if (goodsdetails[0].Agreement == "IT Framework Agreement")
      $("#ITFramework").prop("checked", true);
    else if (goodsdetails[0].Agreement == "Furniture Framework Agreement")
      $("#FurnitureFramework").prop("checked", true);
    else if (goodsdetails[0].Agreement == "Stationary Framework Agreement")
      $("#StationaryFramework").prop("checked", true);
  }
  await getAllFolders();
  await getfiles(goodsdetails[0].GoodsCategory, "GD-" + itemid);
  await getContacts("GD-" + itemid);

  $("#projectName").val(goodsdetails[0].ProjectName);
  $("#requestedWarrantyTime").val(goodsdetails[0].WarrantyTime);
  $(".loading-modal").removeClass("active");
  $("body").removeClass("body-hidden");
}

async function FetchserviceDetails() {
  var columns =
    "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,ConsultingFirm,ChoicesOfServices,NameOfConsultingFirm,AreaOfActivity,TelephoneNumber,ContactPerson,EmailAddress,MobileNumber,FullAddress,ShortDesc,DurationFrom,DurationTo,JOD,EUR,isKompOutput,KompOutputNumber,kompPercent,NameOfBeneficiary,CostExtension,ContractNumber,PaymentStatus,StatusSummary,Agreement,ServiceCategory,Explanation,Assessgrid";
  var lookup = "AssignedTo1,AVName,Representative,RequestStatus,Author,MarketSurvey";
  var ID = itemid;
  var listname = "ProcurementService";
  $(".loading-modal").addClass("active");
  $("body").addClass("body-hidden");

  var servicedetails = [];
  servicedetails.push(await FetchListitems(listname, columns, lookup, ID));

  $("#DrpProjectName").val(code);
  $("#DrpProjectName").trigger("change");

  if (servicedetails[0].ServiceCategory)
    $("#Drpreqcategories").val(servicedetails[0].ServiceCategory);
  else $("#Drpreqcategories").val("service");

  $("#Drpreqcategories").trigger("change");

  BindCommonvalues(servicedetails);
  if (servicedetails[0].Explanation) {
    $("#txtExplanation").val(servicedetails[0].Explanation);
  }
  await getAllFolders();
  $("#choicesservices").val(servicedetails[0].ChoicesOfServices);
  $("#choicesservices").trigger("change");
  if ($("#choicesservices option:selected").val() == "Direct Award") {
    $(
      "input[name='ConsultingFirm'][value='" +
        servicedetails[0].ConsultingFirm +
        "']"
    ).prop("checked", true);
    $("#NameOfFirm").val(servicedetails[0].NameOfConsultingFirm);
    $("#AreaActivy").val(servicedetails[0].AreaOfActivity);
    $("#shortDescription").val(servicedetails[0].ShortDesc);
    $("#FullAddress").val(servicedetails[0].FullAddress);

    if (servicedetails[0].ConsultingFirm == "ConsultingFirm") {
      $("#CntctPrsn").val(servicedetails[0].ContactPerson);
    } else {
      $("#CntctPrsn").val("");
      $("#CntctPrsn").prop("disabled", true);
    }

    $("#TeleNumber").val(servicedetails[0].TelephoneNumber);
    $("#Email").val(servicedetails[0].EmailAddress);
    $("#MobileNumber").val(servicedetails[0].MobileNumber);
    $("#Fromdate").val(
      moment(servicedetails[0].DurationFrom).format("MM/DD/YYYY")
    );
    $("#Todate").val(moment(servicedetails[0].DurationTo).format("MM/DD/YYYY"));
    $("#JOD").val(servicedetails[0].JOD);
    $("#EUR").val(servicedetails[0].EUR);
    $("#MarketSurvey").val(servicedetails[0].MarketSurvey);
  } else if (
    $("#choicesservices option:selected").val() == "Shortlisted tender"
  ) {
    $("#shortDescription").val(servicedetails[0].ShortDesc);
    $("#Fromdate").val(
      moment(servicedetails[0].DurationFrom).format("MM/DD/YYYY")
    );
    $("#Todate").val(moment(servicedetails[0].DurationTo).format("MM/DD/YYYY"));
    $("#JOD").val(servicedetails[0].JOD);
    $("#EUR").val(servicedetails[0].EUR);
  } else if ($("#choicesservices option:selected").val() == "Public tender") {
    $(
      "input[name='ConsultingFirm'][value='" +
        servicedetails[0].ConsultingFirm +
        "']"
    ).prop("checked", true);
    $("#shortDescription").val(servicedetails[0].ShortDesc);
    $("#Fromdate").val(
      moment(servicedetails[0].DurationFrom).format("MM/DD/YYYY")
    );
    $("#Todate").val(moment(servicedetails[0].DurationTo).format("MM/DD/YYYY"));
    $("#gridforassess").val(servicedetails[0].Assessgrid),
    $("#JOD").val(servicedetails[0].JOD);
    $("#EUR").val(servicedetails[0].EUR);
  } else if (
    $("#choicesservices option:selected").val() == "Contract Amendment"
  ) {
    $(
      "input[name='CstExtension'][value='" +
        servicedetails[0].CostExtension +
        "']"
    ).prop("checked", true);
    $(".CstExtension").trigger("change");
    if (servicedetails[0].PaymentStatus) {
      $("#chkfinstatus").prop("checked", true);
    }
    $("#NameOfFirm").val(servicedetails[0].NameOfConsultingFirm);
    $("#CntrctNum").val(servicedetails[0].ContractNumber);
    $("#shortDescription").val(servicedetails[0].ShortDesc);
    $("#FullAddress").val(servicedetails[0].FullAddress);
    $("#CntctPrsn").val(servicedetails[0].ContactPerson);
    $("#TeleNumber").val(servicedetails[0].TelephoneNumber);
    $("#Email").val(servicedetails[0].EmailAddress);
    $("#MobileNumber").val(servicedetails[0].MobileNumber);
  } else if (
    $("#choicesservices option:selected").val() ==
    "Request from a Framework Agreement"
  ) {
    $(
      "input[name='Agreement'][value='" + servicedetails[0].Agreement + "']"
    ).prop("checked", true);
    $(".clsAgreement").trigger("change");
    $("#JOD").val(servicedetails[0].JOD);
    $("#EUR").val(servicedetails[0].EUR);
  }

  await getfiles("service", itemid);

  $("#projectName").val(servicedetails[0].ProjectName);
  $("#requestedWarrantyTime").val(servicedetails[0].WarrantyTime);

  $(".loading-modal").removeClass("active");
  $("body").removeClass("body-hidden");
}


async function FetchLocalSubsidy() {
  var columns =
    "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,SubsidyCategory,isKompOutput,KompOutputNumber,kompPercent,JOD,EUR,ShortDesc,TelephoneNumber,ContactPerson,EmailAddress,MobileNumber,FullAddress,NameOfBeneficiary,DurationFrom,DurationTo,CoSoftNumber,PaymentStatus,CoSoftNumber,StatusSummary";
  var lookup = "AssignedTo1,AVName,Representative,RequestStatus,Author";
  var ID = itemid;
  var listname = "LocalSubsidy";

  $(".loading-modal").addClass("active");
  $("body").addClass("body-hidden");

  var subsidydetails = [];
  subsidydetails.push(await FetchListitems(listname, columns, lookup, ID));

  $("#DrpProjectName").val(code);
  $("#DrpProjectName").trigger("change");

  if (subsidydetails[0].SubsidyCategory)
    $("#Drpreqcategories").val(subsidydetails[0].SubsidyCategory);

  $("#Drpreqcategories").trigger("change");

  BindCommonvalues(subsidydetails);
  await getAllFolders();
  await getfiles("Subsidy", "LS-" + itemid);

  if (subsidydetails[0].SubsidyCategory == "Subsidy") {
    $("#NameOfBenficiary").val(subsidydetails[0].NameOfBeneficiary);
    $("#shortDescription").val(subsidydetails[0].ShortDesc);
    $("#FullAddress").val(subsidydetails[0].FullAddress);
    $("#CntctPrsn").val(subsidydetails[0].ContactPerson);
    $("#TeleNumber").val(subsidydetails[0].TelephoneNumber);
    $("#Email").val(subsidydetails[0].EmailAddress);
    $("#MobileNumber").val(subsidydetails[0].MobileNumber);
    $("#Fromdate").val(
      moment(subsidydetails[0].DurationFrom).format("MM/DD/YYYY")
    );
    $("#Todate").val(moment(subsidydetails[0].DurationTo).format("MM/DD/YYYY"));
    $("#JOD").val(subsidydetails[0].JOD);
    $("#EUR").val(subsidydetails[0].EUR);
  } else if (subsidydetails[0].SubsidyCategory == "Subsidyamendment") {
    $("#cosoftnum").val(subsidydetails[0].CoSoftNumber);

    if (subsidydetails[0].PaymentStatus)
      $("#chkfinstatus").prop("checked", true);
  }

  $("#projectName").val(subsidydetails[0].ProjectName);
  $(".loading-modal").removeClass("active");
  $("body").removeClass("body-hidden");
}

async function FetchLeaseAgreement() {
  var columns =
    "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,ShortDesc,LessorPapers,LessorName,EmailAddress,MobileNumber,FullAddress,TelephoneNumber,DurationFrom,DurationTo,NameOfConsultingFirm,ContactPerson,CoSoftNumber,LeaseAgreementCategory,StatusSummary";

  var lookup = "AssignedTo1,AVName,Representative,RequestStatus,Author";
  var ID = itemid;
  var listname = "LeaseAgreement";
  $(".loading-modal").addClass("active");
  $("body").addClass("body-hidden");
  var Leasedetails = [];
  Leasedetails.push(await FetchListitems(listname, columns, lookup, ID));

  $("#DrpProjectName").val(code);
  $("#DrpProjectName").trigger("change");

  if (Leasedetails[0].LeaseAgreementCategory)
    $("#Drpreqcategories").val(Leasedetails[0].LeaseAgreementCategory);

  $("#Drpreqcategories").trigger("change");

  BindCommonvalues(Leasedetails);
  await getAllFolders();
  if (Leasedetails[0].LeaseAgreementCategory == "Lease") {
    $("#shortDescription").val(Leasedetails[0].ShortDesc);
    $("#Fromdate").val(
      moment(Leasedetails[0].DurationFrom).format("MM/DD/YYYY")
    );
    $("#Todate").val(moment(Leasedetails[0].DurationTo).format("MM/DD/YYYY"));
    $(
      "input[name='LessorPapers'][value='" + Leasedetails[0].LessorPapers + "']"
    ).prop("checked", true);
    $(".lessor").trigger("change");
    $("#NameOfFirm").val(Leasedetails[0].NameOfConsultingFirm);
    $("#LessorName").val(Leasedetails[0].LessorName);
    $("#FullAddress").val(Leasedetails[0].FullAddress);
    $("#CntctPrsn").val(Leasedetails[0].ContactPerson);
    $("#TeleNumber").val(Leasedetails[0].TelephoneNumber);
    $("#PhoneNumber").val(Leasedetails[0].TelephoneNumber);
    $("#Email").val(Leasedetails[0].EmailAddress);
    $("#MobileNumber").val(Leasedetails[0].MobileNumber);
  } else if (Leasedetails[0].LeaseAgreementCategory == "Leaseamendment") {
    $("#cosoftnum").val(Leasedetails[0].CoSoftNumber);

    if (Leasedetails[0].PaymentStatus) $("#chkfinstatus").prop("checked", true);
  }
  await getfiles("Lease", "LA-" + itemid);
  $("#projectName").val(Leasedetails[0].ProjectName);
  $(".loading-modal").removeClass("active");
  $("body").removeClass("body-hidden");
}

async function Fetchidpp() {
  var columns =
    "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,ShortDesc,DurationFrom,DurationTo,StatusSummary";

  var lookup = "AssignedTo1,AVName,Representative,RequestStatus,Author";
  var ID = itemid;
  var listname = "idpp";
  $(".loading-modal").addClass("active");
  $("body").addClass("body-hidden");
  var idppdetails = [];
  idppdetails.push(await FetchListitems(listname, columns, lookup, ID));

  $("#DrpProjectName").val(code);
  $("#DrpProjectName").trigger("change");

  BindCommonvalues(idppdetails);

  await getAllFolders();
  await getfiles("idpp", "IDP-" + itemid);
  $("#shortDescription").val(idppdetails[0].ShortDesc);
  $("#Fromdate").val(moment(idppdetails[0].DurationFrom).format("MM/DD/YYYY"));
  $("#Todate").val(moment(idppdetails[0].DurationTo).format("MM/DD/YYYY"));
  $("#projectName").val(idppdetails[0].ProjectName);
  $(".loading-modal").removeClass("active");
  $("body").removeClass("body-hidden");
}

async function getContacts(ID) {
  var contacts = await sp.web.lists
    .getByTitle("ContactDetails")
    .items.select("ID,ContactPerson,EmailAddress,MobileNumber,RefNumber")
    .filter("RefNumber eq '" + ID + "'")
    .get()
    .then(async function (data) {
      for (var i = 1; i < data.length; i++) {
        $("#btnContact").trigger("click");
      }
      for (var i = 0; i < data.length; i++) {
        $(".contact-detail" + i + "").attr("data-id", data[i].ID);
        $(".contact-detail" + i + " .contactName").val(data[i].ContactPerson);
        $(".contact-detail" + i + " .contactName").attr("data-id", data[i].ID);
        $(".contact-detail" + i + " .contactEmail").val(data[i].EmailAddress);
        $(".contact-detail" + i + " .contactPhoneNumber").val(
          data[i].MobileNumber
        );
      }
    })
    .catch(async function (error) {
      await ErrorCallBack(error, "getContacts");
    });
}

function getfiles(category, gdsID) {
  let Files = [];
  let otherFiles = [];
  let Quantities = [];
  let NeutralSpecfication = [];
  /* goods first option only done*/
  if (category == "goods") {
    Files.push({
      Name: "CostFile",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "CostFile",
      ID: "costFile",
      FileID: "N/A",
    });
    Files.push({
      Name: "ShortList",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "ShortList",
      ID: "fileShortlist",
      FileID: "N/A",
    });
    Files.push({
      Name: "NewsAdvertisement",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Technical Part of the Newspaper Advertisement",
      ID: "newspaperFile",
      FileID: "N/A",
    });
    Files.push({
      Name: "Quantities",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Specifications and Quantities",
      ID: "fileQuantities",
      FileID: "N/A",
    });
    Files.push({
      Name: "Others",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Other Attachments",
      ID: "others",
      FileID: "N/A",
    });
    Files.push({
      Name: "NeutralSpecfication",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Nonneutral Specifications",
      ID: "nonneutralFile",
      FileID: "N/A",
    });
    Files.push({
      Name: "VSRC",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Valid Supplier’s Registration",
      ID: "VSRC",
      FileID: "N/A",
    });
    Files.push({
      Name: "VSCP",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Valid Supplier’s Company Profile",
      ID: "VSCP",
      FileID: "N/A",
    });
    Files.push({
      Name: "VSSPAC",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Sole Provider Certificate",
      ID: "VSSPAC",
      FileID: "N/A",
    });
  } else if (category == "goodsamendment") {
    Files.push({
      Name: "AmendmentSpecfications",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Specifications and Quantities",
      ID: "fileQuantitiesNochange",
      FileID: "N/A",
    });
    Files.push({
      Name: "Others",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Other Attachments",
      ID: "others",
      FileID: "N/A",
    });
    Files.push({
      Name: "Justification",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Justification for Amendment",
      ID: "justification",
      FileID: "N/A",
    });
  } else if (category == "framework") {
    Files.push({
      Name: "AdditionalInformation",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Additional Information",
      ID: "AdditionalInformation",
      FileID: "N/A",
    });
    Files.push({
      Name: "FilledCatalogue",
      FileName: "N/A",
      FileURl: "N/A",
      displayName: "Filled Catalogue",
      ID: "FilledCatalogue",
      FileID: "N/A",
    });
  } else if (category == "service") {
    Files.push({
      Name: "EstimatedCost",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Estimated Cost",
      ID: "Estimation",
      FileID: "N/A",
    });
    Files.push({
      Name: "Justification",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Justification",
      ID: "justification",
      FileID: "N/A",
    });
    Files.push({
      Name: "Terms",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Terms Of Reference",
      ID: "terms",
      FileID: "N/A",
    });
    Files.push({
      Name: "Others",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Other Attachments",
      ID: "terms",
      FileID: "N/A",
    });
    Files.push({
      Name: "ShortList",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "ShortList",
      ID: "shortlist",
      FileID: "N/A",
    });
    Files.push({
      Name: "TechAssGrid",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Technical Assessment Grid",
      ID: "Assessment",
      FileID: "N/A",
    });
    Files.push({
      Name: "NewsAdvertisement",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Technical Part of the Newspaper Advertisement",
      ID: "newspaperFile",
      FileID: "N/A",
    });
    Files.push({
      Name: "FilledRequest",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Filled Request Form for Legal Services",
      ID: "FilledRequest",
      FileID: "N/A",
    });
    Files.push({
      Name: "Financialstatus",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Financial status of the done payments",
      ID: "Financialstatus",
      FileID: "N/A",
    });
  } else if (category == "Subsidy") {
    Files.push({
      Name: "Others",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Other Attachments",
      ID: "others",
      FileID: "N/A",
    });
    Files.push({
      Name: "ProjectProposal",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Project Proposal",
      ID: "Proposal",
      FileID: "N/A",
    });
    Files.push({
      Name: "Budget",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Budget Break-down",
      ID: "Budget",
      FileID: "N/A",
    });
    Files.push({
      Name: "Profile",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Profile",
      ID: "Profile",
      FileID: "N/A",
    });
    Files.push({
      Name: "BankDetails",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Bank Details",
      ID: "BankDetails",
      FileID: "N/A",
    });
    Files.push({
      Name: "CommercialSuitability",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Commercial & Legal Suitability Check",
      ID: "Suitability",
      FileID: "N/A",
    });
    Files.push({
      Name: "RegCert",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Registration Certificate",
      ID: "Certificate",
      FileID: "N/A",
    });
    Files.push({
      Name: "MinisterApproval",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Approval from the Prime Minister/ Authorized Ministry",
      ID: "MinisterApproval",
      FileID: "N/A",
    });
    Files.push({
      Name: "HQApproval",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Checklist for HQ Approval",
      ID: "HQApproval",
      FileID: "N/A",
    });

    Files.push({
      Name: "MinisterApproval",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Prime Minister approval for the additional budget",
      ID: "MinisterApproval",
      FileID: "N/A",
    });
    Files.push({
      Name: "Justification",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Justification for Amendment",
      ID: "justification",
      FileID: "N/A",
    });
    Files.push({
      Name: "Budget",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Modified Budget Breakdown (signed and stamped)",
      ID: "Budget",
      FileID: "N/A",
    });
    Files.push({
      Name: "ProjectProposal",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Modified Project Proposal (signed and stamped)",
      ID: "Proposal",
      FileID: "N/A",
    });
    Files.push({
      Name: "Financialstatus",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Financial status of the done payments",
      ID: "Financialstatus",
      FileID: "N/A",
    });
  } else if (category == "Lease") {
    Files.push({
      Name: "Profile",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Company Profile",
      ID: "Profile",
      FileID: "N/A",
    });
    Files.push({
      Name: "RegCert",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Registration Certificate",
      ID: "RegCert",
      FileID: "N/A",
    });
    Files.push({
      Name: "LessorID",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Lessor ID",
      ID: "LessorID",
      FileID: "N/A",
    });
    Files.push({
      Name: "OwnerDocs",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Estate Ownership Documents",
      ID: "OwnershipDocs",
      FileID: "N/A",
    });
    Files.push({
      Name: "BankDetails",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Bank Details",
      ID: "BankDetails",
      FileID: "N/A",
    });
    Files.push({
      Name: "DirectorApproval",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Country Director Approval",
      ID: "DirectorApproval",
      FileID: "N/A",
    });
    Files.push({
      Name: "LandScheme",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Land Scheme",
      ID: "LandScheme",
      FileID: "N/A",
    });
    Files.push({
      Name: "RmoApproval",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Rmo Approval",
      ID: "RMOApproval",
      FileID: "N/A",
    });
    Files.push({
      Name: "Others",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Other Attachments",
      ID: "others",
      FileID: "N/A",
    });

    Files.push({
      Name: "ModifiedOffer",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Modified offer by the lessor",
      ID: "offer",
      FileID: "N/A",
    });
    Files.push({
      Name: "Justification",
      FileName: "N/A",
      FileURl: "N/A",
      displayname:
        "Justification for amendment",
      ID: "justification",
      FileID: "N/A",
    });
    Files.push({
      Name: "Financialstatus",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Financial status of the done payments",
      ID: "Financialstatus",
      FileID: "N/A",
    });
  } else if (category == "idpp") {
    Files.push({
      Name: "Budget",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Budget Plan",
      ID: "Budget",
      FileID: "N/A",
    });
    Files.push({
      Name: "Profile",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Company Profile",
      ID: "Profile",
      FileID: "N/A",
    });
    Files.push({
      Name: "BankDetails",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Bank Details",
      ID: "BankDetails",
      FileID: "N/A",
    });
    Files.push({
      Name: "RegCert",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Company’s Registration Certificate",
      ID: "RegCert",
      FileID: "N/A",
    });
    Files.push({
      Name: "CVExperts",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "CVs Of Experts",
      ID: "Experts",
      FileID: "N/A",
    });
    Files.push({
      Name: "FinancialReports",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Financial Reports",
      ID: "FinReport",
      FileID: "N/A",
    });
    Files.push({
      Name: "AgreementConcept",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Brief concept For Agreement",
      ID: "Agreement",
      FileID: "N/A",
    });
    Files.push({
      Name: "Vergabedok",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Vergabedok",
      ID: "Vergabedok",
      FileID: "N/A",
    });
    Files.push({
      Name: "SummaryActionPlan",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Summary Action Plan",
      ID: "Actionplan",
      FileID: "N/A",
    });
    Files.push({
      Name: "CompetitionReport",
      FileName: "N/A",
      FileURl: "N/A",
      displayname: "Competition Report",
      ID: "CompetitionReport",
      FileID: "N/A",
    });
  }

  $.each(Files, async function (key, val) {
    for (var i = 0; i < ProcurementServiceFiles["Folders"].length; i++) {
      if (ProcurementServiceFiles["Folders"][i].Name == val.Name) {
        for (
          var j = 0;
          j < ProcurementServiceFiles["Folders"][i].Folders.length;
          j++
        ) {
          if (ProcurementServiceFiles["Folders"][i].Folders[j].Name == gdsID) {
            for (
              var k = 0;
              k < ProcurementServiceFiles["Folders"][i].Folders[j].Files.length;
              k++
            ) {
              if (ProcurementServiceFiles["Folders"][i].Name == "Others") {
                otherFiles.push({
                  displayname: "Other Attachments",
                  Name:
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[k]
                      .Name,
                  Url:
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[k]
                      .ServerRelativeUrl,
                  FileID:
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[k]
                      .UniqueId,
                });
              } else if (
                ProcurementServiceFiles["Folders"][i].Name == "Quantities"
              ) {
                Quantities.push({
                  displayname: "Specifications and Quantities",
                  Name:
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[k]
                      .Name,
                  Url:
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[k]
                      .ServerRelativeUrl,
                  FileID:
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[k]
                      .UniqueId,
                });
              } else {
                Files[key].FileName =
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                    k
                  ].Name;
                Files[key].FileURl =
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                    k
                  ].ServerRelativeUrl;
                Files[key].FileID =
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                    k
                  ].UniqueId;
              }
            }
          }
        }
      }
    }
  });

  BindFiles(Files);
  BindmulitpleFiles(otherFiles, "otherAttachmentFiles");
  BindmulitpleFiles(Quantities, "quantityFilesContainer");
}

function BindFiles(files) {
  for (var i = 0; i < files.length; i++) {
    if (files[i].FileName != "N/A") {
      $("label[for='" + files[i].ID + "']").text(files[i].FileName);
      $("label[for='" + files[i].ID + "']").attr(
        "PreviousFileId",
        files[i].FileID
      );
    }
  }
}

async function BindmulitpleFiles(files, elementId) {
  var html = "";
  for (var i = 0; i < files.length; i++) {
    html +=
      '<div class="quantityFiles"><span class="upload-filename">' +
      files[i].Name +
      '</span><a filename="' +
      files[i].Name +
      '" class="clsdeleteattachment" fileid="' +
      files[i].FileID +
      '" href="#">x</a></div>';
  }

  $("#" + elementId + "").html("");
  $("#" + elementId + "").html(html);
}

async function deletefile(files) {
  for (var i = 0; i < files.length; i++) {
    if (files[i].previousfileid != "N/A" && files[i].previousfileid) {
      await sp.web
        .getFileById(files[i].previousfileid)
        .delete()
        .then(async () => {
          console.log("File Deleted");
        })
        .catch(async function (error) {
          await ErrorCallBack(error, "deletefile");
        });
    }
  }
}

async function BindCommonvalues(requestdetails) {
  if (requestdetails[0].ProjectNumber) {
    var PrjctNum = requestdetails[0].ProjectNumber;
    var PrjctNum1 = PrjctNum.split("-");
    var PrjctNum2 = PrjctNum1[0].split(".");
    var PrjctNum3 = PrjctNum1[1].split(".");
    $("#txtProjectNum1").val(PrjctNum2[0]);
    $("#txtProjectNum2").val(PrjctNum2[1]);
    $("#txtProjectNum3").val(PrjctNum2[2]);
    $("#txtProjectNum4").val(PrjctNum3[0]);
    $("#txtProjectNum5").val(PrjctNum3[1]);
  }
  if (requestdetails[0].PNForZAS) {
    var PNForZAS = requestdetails[0].PNForZAS;
    var PNForZAS1 = PrjctNum.split("-");
    var PNForZAS2 = PrjctNum1[0].split(".");
    var PNForZAS3 = PrjctNum1[1].split(".");
    $("#txtpnforzas1").val(PNForZAS2[0]);
    $("#txtpnforzas2").val(PNForZAS2[1]);
    $("#txtpnforzas3").val(PNForZAS2[2]);
    $("#txtpnforzas4").val(PNForZAS3[0]);
    $("#txtpnforzas5").val(PNForZAS3[1]);
  }
  $("#NameofAV").val(requestdetails[0].NameOfAV);
  if (requestdetails[0].isKompOutput == true) {
    $("#chkKomp").trigger("click");
    $("#outputnumber").val(requestdetails[0].KompOutputNumber);
    $("#percent").val(requestdetails[0].kompPercent);
  }
}
