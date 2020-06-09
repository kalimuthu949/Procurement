import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';
import { SPComponentLoader } from "@microsoft/sp-loader";

import styles from './ProcurementOfGoodsWebPart.module.scss';
import * as strings from 'ProcurementOfGoodsWebPartStrings';

import 'jquery';
import * as moment from 'moment'
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

var ChoicesServices = [
  'Direct Award','Shortlisted tender','Public tender','Local Subsidy','Lease Agreement','iDPP','Contract Amendment'
];
var filesuploaded=0;
var fileslength=0;
var siteURL='';
var CrntUserID='';
var flgRepUser=false;
var filesotherAttachment=[];
var ProjectDetails=[];
export interface IProcurementOfGoodsWebPartProps {
  description: string;
}

export default class ProcurementOfGoodsWebPart extends BaseClientSideWebPart <IProcurementOfGoodsWebPartProps> {

  public onInit(): Promise<void> {
    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context
      });
    });
  }
  
  private readonly HtmlGoods = `
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
      <input class="form-control" type="text" id="projectNumber" value="">
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
    <div class="col-sm-6">
    <div class="form-group">
      <label>KOMP Output<span class="star">*</span></label>
      <input class="form-control" type="text" id="KompOptPT" value="">
    </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
      <label>Choices Of Services<span class="star">*</span></label>
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
</div>

`;

private readonly DirectAward=`
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
    <label>Contact Person<span class="star">*</span></label>
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
  <label>Other Attachments<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>

</div>
`;


private readonly Shortlistedtender=`
<div class='row'>    
  <div class="col-sm-6">
    <div class="form-group">
      <label>Short Description:<span class="star">*</span></label>
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
  <label>Other Attachments<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>

</div>
`;

private readonly tender=`
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
  <label>Text For Newspaper Advertisement<span class="star">*</span></label>
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
  <label>Other Attachments<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>
</div>
`;

private readonly LocalSubsidy=`

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
  <label>Commercial Suitability<span class="star">*</span></label>
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
  <label>Other Attachments<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div class="quantityFilesContainer" id="otherAttachmentFiles"></div>
</div>
</div>
</div>
`;

private readonly LeaseAgreement=`
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


</div>`;

private readonly CompanyLessorHTML=`
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
  <label>Other Attachments<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div class="quantityFilesContainer quantityFilesContainer-static" id="otherAttachmentFiles"></div>
</div>
</div>
</div>

</div>
`;

private readonly InduvLessorHTML=`
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
  <label>Other Attachments<span class="star">*</span></label>
  <div class="input-group">
  <div class="custom-file">
  <input type="file" id="others" value="" class="custom-file-input" multiple>
  <label class="custom-file-label" for="others">Choose File</label>
  </div>
  </div>
  <div class="quantityFilesContainer quantityFilesContainer-static" id="otherAttachmentFiles"></div>
</div>
</div>
</div>

</div>
`;

private readonly iDPP=`
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
`;

private readonly ContractAmendment=` 

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
      <textarea class="form-control" id="CntrctNum"></textarea>
  </div>
  </div>
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

  <div class='row'>
  <div class="col-sm-6">
      <div class="form-group">
        <label>Justification For Extension<span class="star">*</span></label>
        <textarea class="form-control" id="justification"></textarea>
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

  <div id='divForEstimation'>
  </div>


  
</div>



`;

private readonly EstimationHMTL=`

<div class='row'>
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
</div>

`;

  public render(): void {
  var that=this;
  this.domElement.innerHTML=this.HtmlGoods;
  siteURL = this.context.pageContext.site.absoluteUrl;
  getLoggedInUserDetails();
  LoadProjects();
  LoadServices(); 

  $(document).on('change','.custom-file-input',function()
    {
    if ($(this).val()) {
      var fileValue=$(this).val()
      // returns string containing everything from the end of the string 
      //   that is not a back/forward slash or an empty string on error
      //   so one can check if return_value===''
    typeof fileValue==='string' && (fileValue=fileValue.match(/[^\\\/]+$/)) && fileValue[0] || '';
    
   $(this).parent('.custom-file').find('.custom-file-label').text(fileValue[0]);
    //  $(this).parent('.custom-file').find('.custom-file-label').text($(this).val().replace(/C:\\fakepath\\/i, ''));
    }
    else {
      //alertify.set('notifier', 'position', 'top-right');
      //alertify.error('Please select file');
      $(this).parent().find('label').text('Choose File');
      
    }

  });

  $('#projectName').change(function()
  {
    $("#NameofAV").val($('#projectName option:selected').attr('proj-av'));
  });

  $(document).on('change','#others',function () 
    {
      if ($(this)[0].files.length > 0) 
      {
        for (let index = 0; index < $(this)[0].files.length; index++) 
        {
          const file = $('#others')[0].files[index];
          filesotherAttachment.push(file);
          $('#otherAttachmentFiles').append('<div class="quantityFiles">' + '<span class="upload-filename">'+file.name+'</span>' + '<a filename='+file.name+' class="clsRemove" href="#">x</a></div>');
        }
        $(this).val('');
        $(this).parent().find('label').text('Choose File');
      }
    });

    $(document).on('click', '.clsRemove', function () 
    {
      
      // var filename=$(this).attr('filename');
      var filename=$(this).parent().children()[0].innerText;
      removeOthersfile(filename);
      $(this).parent().remove();
    });


    $(document).on('blur','#EUR',function () 
    {
      if ($(this).val() >= 50000&&$('#choicesservices option:selected').val()=='Shortlisted tender') 
      {
        $('#divforJustification').show();

      } else 
      {
        $('#divforJustification').hide();
        $('#justification').val('');
        $('#justification').text('Choose File');
        
      }
    });

  $('#choicesservices').change(function()
  {
      $('#ChoicesField').html('');
      var selectedservice=$('#choicesservices option:selected').val();
        if(selectedservice=='Direct Award')
        $('#ChoicesField').html(that.DirectAward);
        else if(selectedservice=='Shortlisted tender')
        $('#ChoicesField').html(that.Shortlistedtender);
        else if(selectedservice=='Public tender')
        $('#ChoicesField').html(that.tender);
        else if(selectedservice=='Local Subsidy')
        $('#ChoicesField').html(that.LocalSubsidy);
        else if(selectedservice=='Lease Agreement')
        {
          $('#ChoicesField').html(that.LeaseAgreement);
          $('#divlessor').html('');
          //$('#divlessor').append(that.CompanyLessorHTML);
        }
        else if(selectedservice=='iDPP')
        $('#ChoicesField').html(that.iDPP);
        else if(selectedservice=='Contract Amendment')
        $('#ChoicesField').html(that.ContractAmendment);

        $( "#Fromdate" ).datepicker({autoclose:true});
        $( "#Todate" ).datepicker({autoclose:true});

        

  });

$(document).on('change','.CstExtension',function()
{
    if($("input[name='CstExtension']:checked").val()=='No Cost Extension')
    {
         $('#divForEstimation').html('');
         //$('#divForEstimation').append(that.EstimationHMTL);
    }
    else
    {
         $('#divForEstimation').html('');
         $('#divForEstimation').append(that.EstimationHMTL);
    }
    
});

$(document).on('change','.lessor',function()
{
    if($("input[name='LessorPapers']:checked").val()=='Lessor is an Individual')
    {
         $('#divlessor').html('');
         $('#divlessor').append(that.InduvLessorHTML);
    }
    else
    {
         $('#divlessor').html('');
         $('#divlessor').append(that.CompanyLessorHTML);
    }
    
});

  $('#btnSubmit').click(function()
  {

    CreateService();
  });

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

function removeOthersfile(filename)
{
  for(var i=0;i<filesotherAttachment.length;i++)
  {
    if(filesotherAttachment[i].name==filename)
    {
     // filesotherAttachment[i].remove();
     filesotherAttachment.splice(i,1);
     break;
    }
  }
}


async function LoadProjects()
  {
     await sp.web.lists.getByTitle('Projects').items.select('Title,Id,ProjectAV/Title,ProjectAV/ID,Representative/ID').expand('ProjectAV,Representative').getAll().then((allItems: any[]) => {
      for (var index = 0; index < allItems.length; index++) 
      {
        var element = allItems[index];
        for(var indexForRep = 0; indexForRep < allItems[index].Representative.length; indexForRep++)
        {
          if(CrntUserID==allItems[index].Representative[indexForRep].ID)
          {
            flgRepUser=true;
            $('#projectName').append('<option Proj-Num="' + element.ProjectNumber + '" Proj-Rp-id="' + element.Representative.ID + '" Proj-Av-id="' + element.ProjectAV.ID + '" Proj-Av="' + element.ProjectAV.Title + '"  proj-id="' + element.Id + '" value="' + element.Title + '">' + element.Title + '</option>');
            var arrRepUsers=[];
            for(var i=0;i<allItems[index].Representative.length;i++)
            {
              arrRepUsers.push(allItems[index].Representative[i].ID);
            }
            ProjectDetails.push({'PrjtcNum':element.Title,'RepId':arrRepUsers});
          }
        }
      }

      if(!flgRepUser)
        {
          AlertMessage("Access Denied");
        }

    });
  }
  function LoadServices()
  {
    var HTML='';
    $.each(ChoicesServices,function(key,val){
        HTML+='<option proj-id="' + key + '" value="' + val+ '">' + val + '</option>'
    });
    $('#choicesservices').append(HTML);
  }

  async function getLoggedInUserDetails()
  {
    
    await sp.web.currentUser.get().then((allItems: any) => 
    {
        if(allItems)
        {
          CrntUserID=allItems.Id;
        }
    }).catch(function(error){ErrorCallBack(error,'getLoggedInUserDetails')});
  }

  function isEmail(Email)
  {
    var testEmail = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
    if (testEmail.test(Email))
    return true;
    else
    return false
  }

  function CreateService()
  {

    let arrFiles=[];
    
    if(MandatoryValidation())
    {
      if($('#choicesservices option:selected').val()=='Direct Award')
      {
        if(mandatoryfordirectaward())
        {
          
          $('.loading-modal').addClass('active');
          $('body').addClass('body-hidden');

          let FromDate=(new Date(Date.parse(moment($("#Fromdate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();
          let Todate=(new Date(Date.parse(moment($("#Todate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();

          let Servicedata=
          {
            ProjectName:$("#projectName option:selected").val(),
            ProjectNumber:$("#projectNumber").val(),
            PNForZAS:$("#pnForZAS").val(),
            NameOfAV:$("#NameofAV").val(),
            AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
            RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
            KOMPOuput:$("#KompOptPT").val(),
            ConsultingFirm:$("input[name='ConsultingFirm']:checked").val(),
            ChoicesOfServices:$("#choicesservices option:selected").val(),
            NameOfConsultingFirm:$("#NameOfFirm").val(),
            AreaOfActivity:$("#AreaActivy").val(),
            TelephoneNumber:$("#TeleNumber").val(),
            ContactPerson:$("#CntctPrsn").val(),           
            EmailAddress:$("#Email").val(),
            MobileNumber:$("#MobileNumber").val(),
            FullAddress:$("#FullAddress").val(),
            ShortDesc:$("#shortDescription").val(),
            DurationFrom:FromDate,
            DurationTo:Todate
          }
          arrFiles.push({'FolderName':'EstimatedCost','files':$('#Estimation')[0].files});
          arrFiles.push({'FolderName':'Justification','files':$('#justification')[0].files});
          arrFiles.push({'FolderName':'Terms','files':$('#terms')[0].files});


          if(filesotherAttachment.length>0)
          {
            
            for(var i=0;i<filesotherAttachment.length;i++)
            {
              
              var files=[];
              files.push(filesotherAttachment[i]);
              arrFiles.push({'FolderName':'Others','files':files});
            }
            
          }

          InsertService(Servicedata,arrFiles);
        }
        
      }
      else if($('#choicesservices option:selected').val()=='Shortlisted tender')
      {
        if(mandatoryforshortlisttender())
        {
          
          $('.loading-modal').addClass('active');
          $('body').addClass('body-hidden');

          let FromDate=(new Date(Date.parse(moment($("#Fromdate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();
          let Todate=(new Date(Date.parse(moment($("#Todate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();

          let Servicedata=
          {
            ProjectName:$("#projectName option:selected").val(),
            ProjectNumber:$("#projectNumber").val(),
            PNForZAS:$("#pnForZAS").val(),
            NameOfAV:$("#NameofAV").val(),
            AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
            RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
            KOMPOuput:$("#KompOptPT").val(),
            ChoicesOfServices:$("#choicesservices option:selected").val(),
            JOD:$("#JOD").val(),
            EUR:$("#EUR").val(),
            ShortDesc:$("#shortDescription").val(),
            DurationFrom:FromDate,
            DurationTo:Todate
          }
          arrFiles.push({'FolderName':'EstimatedCost','files':$('#Estimation')[0].files});
          if($('#justification')[0].files.length>0){
          arrFiles.push({'FolderName':'Justification','files':$('#justification')[0].files});}
          arrFiles.push({'FolderName':'Terms','files':$('#terms')[0].files});
          
          if(filesotherAttachment.length>0)
          {
            
            for(var i=0;i<filesotherAttachment.length;i++)
            {
              
              var files=[];
              files.push(filesotherAttachment[i]);
              arrFiles.push({'FolderName':'Others','files':files});
            }
            
          }

          arrFiles.push({'FolderName':'ShortList','files':$('#shortlist')[0].files});
          arrFiles.push({'FolderName':'TechAssGrid','files':$('#Assessment')[0].files});

          InsertService(Servicedata,arrFiles);
        }
        
      }
      else if($('#choicesservices option:selected').val()=='Public tender')
      {
        if(mandatoryforpublictender())
        {
          $('.loading-modal').addClass('active');
          $('body').addClass('body-hidden');
          let FromDate=(new Date(Date.parse(moment($("#Fromdate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();
          let Todate=(new Date(Date.parse(moment($("#Todate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();

          let Servicedata=
          {
            ProjectName:$("#projectName option:selected").val(),
            ProjectNumber:$("#projectNumber").val(),
            PNForZAS:$("#pnForZAS").val(),
            NameOfAV:$("#NameofAV").val(),
            AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
            RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
            KOMPOuput:$("#KompOptPT").val(),
            ChoicesOfServices:$("#choicesservices option:selected").val(),
            JOD:$("#JOD").val(),
            EUR:$("#EUR").val(),
            ShortDesc:$("#shortDescription").val(),
            DurationFrom:FromDate,
            DurationTo:Todate
          }
          arrFiles.push({'FolderName':'EstimatedCost','files':$('#Estimation')[0].files});
          arrFiles.push({'FolderName':'Terms','files':$('#terms')[0].files});
          
          if(filesotherAttachment.length>0)
          {
            
            for(var i=0;i<filesotherAttachment.length;i++)
            {
              
              var files=[];
              files.push(filesotherAttachment[i]);
              arrFiles.push({'FolderName':'Others','files':files});
            }
            
          }

          arrFiles.push({'FolderName':'NewsAdvertisement','files':$('#newspaperFile')[0].files});
          arrFiles.push({'FolderName':'TechAssGrid','files':$('#Assessment')[0].files});

          InsertService(Servicedata,arrFiles);
        }
        
      }
      else if($('#choicesservices option:selected').val()=='Local Subsidy')
      {
        if(mandatoryforsubsidy())
        {
          
          $('.loading-modal').addClass('active');
          $('body').addClass('body-hidden');
          let FromDate=(new Date(Date.parse(moment($("#Fromdate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();
          let Todate=(new Date(Date.parse(moment($("#Todate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();

          let Servicedata=
          {
            ProjectName:$("#projectName option:selected").val(),
            ProjectNumber:$("#projectNumber").val(),
            PNForZAS:$("#pnForZAS").val(),
            NameOfAV:$("#NameofAV").val(),
            AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
            RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
            KOMPOuput:$("#KompOptPT").val(),
            ChoicesOfServices:$("#choicesservices option:selected").val(),
            JOD:$("#JOD").val(),
            EUR:$("#EUR").val(),
            ShortDesc:$("#shortDescription").val(),
            TelephoneNumber:$("#TeleNumber").val(),
            ContactPerson:$("#CntctPrsn").val(),           
            EmailAddress:$("#Email").val(),
            MobileNumber:$("#MobileNumber").val(),
            FullAddress:$("#FullAddress").val(),
            NameOfBeneficiary:$("#NameOfBenficiary").val(),
            DurationFrom:FromDate,
            DurationTo:Todate

          }
          arrFiles.push({'FolderName':'ProjectProposal','files':$('#Proposal')[0].files});
          arrFiles.push({'FolderName':'Budget','files':$('#Budget')[0].files});
          arrFiles.push({'FolderName':'Profile','files':$('#Profile')[0].files});
          if($('#BankDetails')[0].files.length>0)
          {
          arrFiles.push({'FolderName':'BankDetails','files':$('#BankDetails')[0].files});}
          arrFiles.push({'FolderName':'CommercialSuitability','files':$('#Suitability')[0].files});
          arrFiles.push({'FolderName':'RegCert','files':$('#Certificate')[0].files});
          if(filesotherAttachment.length>0)
          {
            
            for(var i=0;i<filesotherAttachment.length;i++)
            {
              
              var files=[];
              files.push(filesotherAttachment[i]);
              arrFiles.push({'FolderName':'Others','files':files});
            }
            
          }

          InsertService(Servicedata,arrFiles);
        }
        
      }
      else if($('#choicesservices option:selected').val()=='Lease Agreement')
      {
        if(mandatoryforLease())
        {
          
          let FromDate=(new Date(Date.parse(moment($("#Fromdate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();
          let Todate=(new Date(Date.parse(moment($("#Todate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();

          if($("input[name='LessorPapers']:checked").val()=='Lessor is an Individual')
          {
              if(mandatoryforindivual())
              {
                $('.loading-modal').addClass('active');
                $('body').addClass('body-hidden');

                let Servicedata=
                {
                  ProjectName:$("#projectName option:selected").val(),
                  ProjectNumber:$("#projectNumber").val(),
                  PNForZAS:$("#pnForZAS").val(),
                  NameOfAV:$("#NameofAV").val(),
                  AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
                  RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
                  KOMPOuput:$("#KompOptPT").val(),
                  ChoicesOfServices:$("#choicesservices option:selected").val(),
                  ShortDesc:$("#shortDescription").val(),
                  LessorPapers:$("input[name='LessorPapers']:checked").val(),
                  LessorName:$("#LessorName").val(),
                  EmailAddress:$("#Email").val(),
                  MobileNumber:$("#MobileNumber").val(),
                  FullAddress:$("#FullAddress").val(),
                  TelephoneNumber:$("#PhoneNumber").val(),
                  DurationFrom:FromDate,
                  DurationTo:Todate
                  
                }
                arrFiles.push({'FolderName':'LessorID','files':$('#LessorID')[0].files});
                arrFiles.push({'FolderName':'OwnerDocs','files':$('#OwnershipDocs')[0].files});
                arrFiles.push({'FolderName':'BankDetails','files':$('#BankDetails')[0].files});
                arrFiles.push({'FolderName':'RmoApproval','files':$('#RMOApproval')[0].files});
                arrFiles.push({'FolderName':'DirectorApproval','files':$('#DirectorApproval')[0].files});
                arrFiles.push({'FolderName':'LandScheme','files':$('#LandScheme')[0].files});

                if(filesotherAttachment.length>0)
                {
                  
                  for(var i=0;i<filesotherAttachment.length;i++)
                  {
                    
                    var files=[];
                    files.push(filesotherAttachment[i]);
                    arrFiles.push({'FolderName':'Others','files':files});
                  }
                  
                }

                InsertService(Servicedata,arrFiles);
              }
          }
          else
          {
              if(mandatoryforcompany())
              {
                $('.loading-modal').addClass('active');
                $('body').addClass('body-hidden');

                let Servicedata=
                {
                  ProjectName:$("#projectName option:selected").val(),
                  ProjectNumber:$("#projectNumber").val(),
                  PNForZAS:$("#pnForZAS").val(),
                  NameOfAV:$("#NameofAV").val(),
                  AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
                  RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
                  KOMPOuput:$("#KompOptPT").val(),
                  ChoicesOfServices:$("#choicesservices option:selected").val(),
                  ShortDesc:$("#shortDescription").val(),
                  LessorPapers:$("input[name='LessorPapers']:checked").val(),

                  NameOfConsultingFirm:$("#NameOfFirm").val(),
                  ContactPerson:$("#CntctPrsn").val(),
                  EmailAddress:$("#Email").val(),
                  MobileNumber:$("#MobileNumber").val(),
                  FullAddress:$("#FullAddress").val(),
                  TelephoneNumber:$("#PhoneNumber").val(),
                  DurationFrom:FromDate,
                  DurationTo:Todate
                }
                arrFiles.push({'FolderName':'RegCert','files':$('#RegCert')[0].files});
                arrFiles.push({'FolderName':'Profile','files':$('#Profile')[0].files});
                arrFiles.push({'FolderName':'BankDetails','files':$('#BankDetails')[0].files});       
                arrFiles.push({'FolderName':'RmoApproval','files':$('#RMOApproval')[0].files});
                arrFiles.push({'FolderName':'DirectorApproval','files':$('#DirectorApproval')[0].files});
                arrFiles.push({'FolderName':'LandScheme','files':$('#LandScheme')[0].files});
                if(filesotherAttachment.length>0)
                {
                  
                  for(var i=0;i<filesotherAttachment.length;i++)
                  {
                    
                    var files=[];
                    files.push(filesotherAttachment[i]);
                    arrFiles.push({'FolderName':'Others','files':files});
                  }
                  
                }
                InsertService(Servicedata,arrFiles);
              }
          }
        }
        
      }
      else if($('#choicesservices option:selected').val()=='iDPP')
      {
        if(mandatoryforiDPP())
        {
          $('.loading-modal').addClass('active');
          $('body').addClass('body-hidden');
          let FromDate=(new Date(Date.parse(moment($("#Fromdate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();
          let Todate=(new Date(Date.parse(moment($("#Todate").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();

          let Servicedata=
          {
            ProjectName:$("#projectName option:selected").val(),
            ProjectNumber:$("#projectNumber").val(),
            PNForZAS:$("#pnForZAS").val(),
            NameOfAV:$("#NameofAV").val(),
            AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
            RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
            KOMPOuput:$("#KompOptPT").val(),
            ChoicesOfServices:$("#choicesservices option:selected").val(),
            ShortDesc:$("#shortDescription").val(), 
            DurationFrom:FromDate,
            DurationTo:Todate           
          }
          arrFiles.push({'FolderName':'RegCert','files':$('#RegCert')[0].files});
          arrFiles.push({'FolderName':'Profile','files':$('#Profile')[0].files});
          arrFiles.push({'FolderName':'BankDetails','files':$('#BankDetails')[0].files});
          
          
          arrFiles.push({'FolderName':'CVExperts','files':$('#Experts')[0].files});
          arrFiles.push({'FolderName':'FinancialReports','files':$('#FinReport')[0].files});
          arrFiles.push({'FolderName':'AgreementConcept','files':$('#Agreement')[0].files});
          arrFiles.push({'FolderName':'Vergabedok','files':$('#Vergabedok')[0].files});
          arrFiles.push({'FolderName':'SummaryActionPlan','files':$('#Actionplan')[0].files});
          arrFiles.push({'FolderName':'CompetitionReport','files':$('#CompetitionReport')[0].files});
          arrFiles.push({'FolderName':'Budget','files':$('#Budget')[0].files});

          InsertService(Servicedata,arrFiles);
        }
        
      }
      else if($('#choicesservices option:selected').val()=='Contract Amendment')
      {
        if(mandatoryforcontract())
        {
          $('.loading-modal').addClass('active');
          $('body').addClass('body-hidden');
          let Servicedata=
                {
                  ProjectName:$("#projectName option:selected").val(),
                  ProjectNumber:$("#projectNumber").val(),
                  PNForZAS:$("#pnForZAS").val(),
                  NameOfAV:$("#NameofAV").val(),
                  AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
                  RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
                  KOMPOuput:$("#KompOptPT").val(),
                  ChoicesOfServices:$("#choicesservices option:selected").val(),
                  ShortDesc:$("#shortDescription").val(),
                  CostExtension :$("input[name='CstExtension']:checked").val(),
                  ContractNumber:$("#CntrctNum").val(),
                  NameOfConsultingFirm:$("#NameOfFirm").val(),
                  ContactPerson:$("#CntctPrsn").val(),
                  EmailAddress:$("#Email").val(),
                  MobileNumber:$("#MobileNumber").val(),
                  FullAddress:$("#FullAddress").val(),
                  TelephoneNumber:$("#TeleNumber").val(),
                  Justification:$("#justification").val()
                }
                if($("input[name='CstExtension']:checked").val()=='Cost Extension'){
                arrFiles.push({'FolderName':'EstimatedCost','files':$('#Estimation')[0].files});}

                arrFiles.push({'FolderName':'Terms','files':$('#terms')[0].files});

                InsertService(Servicedata,arrFiles);
                
        }
        
      }

    }
  }

async function InsertService(Servicedata,arrFiles)
{

     fileslength=arrFiles.length;
     await sp.web.lists.getByTitle("ProcurementService").items.add(Servicedata).then(function(data)
     {
       
       //createFolder('EstimatedCost',data.data.ID,$('#Estimation')[0].files);
      for(var i=0;i<arrFiles.length;i++)
       {
          createFolder(arrFiles[i].FolderName,data.data.ID,arrFiles[i].files);
       }

       
         
     }).catch(function(error){ErrorCallBack(error,'InsertService')});
}

async function createFolder(FolderName,ListID,files)
{
	await sp.web.folders.add("ProcurementServices/"+FolderName+"/"+ListID+"").then(function (data)
	{  
      console.log("Folder is created at " + data.data.ServerRelativeUrl);
      UploadFile(data.data.ServerRelativeUrl,files);
    	  
	}).catch(function(error){ErrorCallBack(error,'createFolder')});

}

async function UploadFile(FolderUrl,files)
{
  if(files.length>0)
  {
  await sp.web.getFolderByServerRelativeUrl(FolderUrl)
  .files.add(files[0].name, files[0], true).then(function(data)
   {
      filesuploaded++;
      console.log('Added');
      if(filesuploaded==fileslength)
      {
        $('.loading-modal').removeClass('active');
        $('body').removeClass('body-hidden');
        AlertMessage("Service Request is created in the System");
      }
  }).catch(function(error){ErrorCallBack(error,'uploadFiles')});
}
}

function AlertMessage(strMewssageEN) {

  
  
   alertify.alert().setting({
  
      'label':'OK',
  
      'message': strMewssageEN ,
  
      'onok': function(){window.location.href=siteURL+'/SitePages/RequestDashboard.aspx';} 

  
    }).show().setHeader('<em>Confirmation</em> ').set('closable', false);
  
  }

function ErrorCallBack(error,methodname)
{	
  $('.loading-modal').removeClass('active');
  alert(error+":"+methodname);
};

function MandatoryValidation()
{
	var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
	if($('#projectName option:selected').val()=='Select')
	{
		alertify.error('Please Choose Project Name');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#projectNumber").val()))
	{
		alertify.error('Please Enter Project Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#pnForZAS").val()))
	{
		alertify.error('Please Enter PN For ZAS');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#NameofAV").val()))
	{
		alertify.error('Please Enter Name of AV');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#KompOptPT").val()))
	{
		alertify.error('Please Enter KOMP Output');
		isAllValueFilled=false;
  }
  else if($('#choicesservices option:selected').val()=='Select')
	{
		alertify.error('Please Choose choices of services');
		isAllValueFilled=false;
  }
  return isAllValueFilled;
}


function mandatoryfordirectaward()
{

  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$("input[id='ConsultingFirm']").prop('checked')&&!$("input[id='Appariser']").prop('checked'))
  {
    alertify.error('Please Select Firm or Appraiser');
		isAllValueFilled=false;
  } 
  else if(!$.trim($("#NameOfFirm").val()))
	{
		alertify.error('Please Enter Name of Consulting Firm');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#AreaActivy").val()))
	{
		alertify.error('Please Enter Area Of Activity');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#FullAddress").val()))
	{
		alertify.error('Please Enter Full Address');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#CntctPrsn").val())&&$("input[name='ConsultingFirm']:checked").val()=='ConsultingFirm')
	{
		alertify.error('Please Enter Contact Person');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#TeleNumber").val()))
	{
		alertify.error('Please Enter Telephone Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Email").val()))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!isEmail($.trim($("#Email").val())))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#MobileNumber").val()))
	{
		alertify.error('Please Enter Mobile Number');
		isAllValueFilled=false;
  }

  else if(!$.trim($("#Fromdate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (From Date)');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Todate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (To Date)');
		isAllValueFilled=false;
  }
  else if((moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString())>(moment($("#Todate").val(), "MM-DD-YYYY").toISOString()))
	{
		alertify.error('From  Date Should be lesser than To date');
		isAllValueFilled=false;
	}
  else if($('#Estimation')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Estimated Cost');
		isAllValueFilled=false;
  }
  else if($('#justification')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Justification for direct award');
		isAllValueFilled=false;
  }
  else if($('#terms')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Terms of Reference');
		isAllValueFilled=false;
  }
  else if(filesotherAttachment.length<=0)
	{
		alertify.error('Please upload a file for Other Attachment');
		isAllValueFilled=false;
  }
  return isAllValueFilled;
}

function mandatoryforshortlisttender()
{

  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if($('#shortlist')[0].files.length<=0)
	{
		alertify.error('Please Select shortlist');
		isAllValueFilled=false;
  }
  else if($('#Estimation')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Estimated Cost');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#JOD").val()))
	{
		alertify.error('Please Enter JOD');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#EUR").val()))
	{
		alertify.error('Please Enter EUR');
		isAllValueFilled=false;
  }
  else if($("#EUR").val()>=50000&&$('#justification')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Justification for shortlisted tender');
		isAllValueFilled=false;
  }
  else if($('#terms')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Terms of Reference');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Fromdate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (From Date)');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Todate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (To Date)');
		isAllValueFilled=false;
  }
  else if((moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString())>(moment($("#Todate").val(), "MM-DD-YYYY").toISOString()))
	{
		alertify.error('From  Date Should be lesser than To date');
		isAllValueFilled=false;
	}
  else if($('#Assessment')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Technical Assessment Grid');
		isAllValueFilled=false;
  }  
  else if(filesotherAttachment.length<=0)
	{
		alertify.error('Please upload a file for Other Attachment');
		isAllValueFilled=false;
  }

  return isAllValueFilled;

}
function mandatoryforpublictender()
{

  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if($('#Estimation')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Estimated Cost');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#JOD").val()))
	{
		alertify.error('Please Enter JOD');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#EUR").val()))
	{
		alertify.error('Please Enter EUR');
		isAllValueFilled=false;
  }
  else if($('#terms')[0].files.length<=0)
	{
		alertify.error('Please upload a file for terms Attachment');
		isAllValueFilled=false;
  }
  else if($('#Assessment')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Technical Assessment Grid');
		isAllValueFilled=false;
  }   
  else if(!$.trim($("#Fromdate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (From Date)');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Todate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (To Date)');
		isAllValueFilled=false;
  } 
  else if((moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString())>(moment($("#Todate").val(), "MM-DD-YYYY").toISOString()))
	{
		alertify.error('From  Date Should be lesser than To date');
		isAllValueFilled=false;
  }
  else if($('#newspaperFile')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Text for newspaper advertisement');
		isAllValueFilled=false;
  }
  else if(filesotherAttachment.length<=0)
	{
		alertify.error('Please upload a file for Other Attachment');
		isAllValueFilled=false;
  }
  return isAllValueFilled;
}
function mandatoryforsubsidy()
{
  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#NameOfBenficiary").val()))
	{
		alertify.error('Please Enter Name Of Benficiary');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#FullAddress").val()))
	{
		alertify.error('Please Enter Full Address');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#TeleNumber").val()))
	{
		alertify.error('Please Enter Telephone Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#CntctPrsn").val()))
	{
		alertify.error('Please Enter Contact Person');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Email").val()))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!isEmail($.trim($("#Email").val())))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#MobileNumber").val()))
	{
		alertify.error('Please Enter Mobile Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Fromdate").val()))
	{
		alertify.error('Please Enter assignment (From Date)');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Todate").val()))
	{
		alertify.error('Please Enter assignment (To Date)');
		isAllValueFilled=false;
  }
  else if((moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString())>(moment($("#Todate").val(), "MM-DD-YYYY").toISOString()))
	{
		alertify.error('From  Date Should be lesser than To date');
		isAllValueFilled=false;
	}
  else if($('#Proposal')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Project Proposal');
		isAllValueFilled=false;
  }
  else if($('#Suitability')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Commercial Suitability');
		isAllValueFilled=false;
  }
  else if($('#Budget')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Budget Break-down');
		isAllValueFilled=false;
  }
  else if($('#Certificate')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Registration Certificate');
		isAllValueFilled=false;
  }
  else if($('#Profile')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Profile');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#JOD").val()))
	{
		alertify.error('Please Enter JOD');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#EUR").val()))
	{
		alertify.error('Please Enter EUR');
		isAllValueFilled=false;
  }
  else if($("#EUR").val()>=50000&&$('#BankDetails')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Bank Details');
		isAllValueFilled=false;
  }
  else if(filesotherAttachment.length<=0)
	{
		alertify.error('Please upload a file for Other Attachment');
		isAllValueFilled=false;
  }

  return isAllValueFilled;
}
function mandatoryforLease()
{
  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if($('#LandScheme')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Land Scheme');
		isAllValueFilled=false;
  }
  else if($('#RMOApproval')[0].files.length<=0)
	{
		alertify.error('Please upload a file for RMO Approval');
		isAllValueFilled=false;
  }
  else if($('#DirectorApproval')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Country Director Approval');
		isAllValueFilled=false;
  }
    else if(!$.trim($("#Fromdate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (From Date)');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Todate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (To Date)');
		isAllValueFilled=false;
  }
  else if((moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString())>(moment($("#Todate").val(), "MM-DD-YYYY").toISOString()))
	{
		alertify.error('From  Date Should be lesser than To date');
		isAllValueFilled=false;
	}
  else if($('#LandScheme')[0].files.length<=0)
	{
		alertify.error('Please Select Land Scheme');
		isAllValueFilled=false;
  }
  else if(!$("input[id='InduvLessor']").prop('checked')&&!$("input[id='CmpnyLessor']").prop('checked'))
  {
    alertify.error('Please Select Lessor Type');
		isAllValueFilled=false;
  }
  return isAllValueFilled;
}
function mandatoryforindivual()
{
  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$.trim($("#LessorName").val()))
	{
		alertify.error('Please Enter Lessor Name');
		isAllValueFilled=false;
  }
  else if($('#LessorID')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Lessor ID');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#FullAddress").val()))
	{
		alertify.error('Please Enter Full Address');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#PhoneNumber").val()))
	{
		alertify.error('Please Enter PhoneNumber');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Email").val()))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!isEmail($.trim($("#Email").val())))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#MobileNumber").val()))
	{
		alertify.error('Please Enter Mobile Number');
		isAllValueFilled=false;
  }
  else if($('#OwnershipDocs')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Estate Ownership Documents');
		isAllValueFilled=false;
  }
  else if($('#BankDetails')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Bank Details');
		isAllValueFilled=false;
  }
  else if(filesotherAttachment.length<=0)
	{
		alertify.error('Please upload a file for Other Attachment');
		isAllValueFilled=false;
  }
  return isAllValueFilled;
}

function mandatoryforcompany()
{
  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$.trim($("#NameOfFirm").val()))
	{
		alertify.error('Please Enter Name Of Firm');
		isAllValueFilled=false;
  }
  else if($('#RegCert')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Registration Certificate');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#FullAddress").val()))
	{
		alertify.error('Please Enter Full Address');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#TeleNumber").val()))
	{
		alertify.error('Please Enter Tele PhoneNumber');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#CntctPrsn").val()))
	{
		alertify.error('Please Enter Contact Person');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Email").val()))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!isEmail($.trim($("#Email").val())))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#MobileNumber").val()))
	{
		alertify.error('Please Enter Mobile Number');
		isAllValueFilled=false;
  }

  else if($('#Profile')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Company Profile');
		isAllValueFilled=false;
  }
  else if($('#BankDetails')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Bank Details');
		isAllValueFilled=false;
  }
  else if(filesotherAttachment.length<=0)
	{
		alertify.error('Please upload a file for Other Attachment');
		isAllValueFilled=false;
  }
  return isAllValueFilled;
}

function mandatoryforiDPP()
{
  var isAllValueFilled=true;
	if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if($('#RegCert')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Company’s Registration Certificate');
		isAllValueFilled=false;
  }
  else if($('#Profile')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Company Profile');
		isAllValueFilled=false;
  }
  else if($('#Experts')[0].files.length<=0)
	{
		alertify.error('Please upload a file for CVs of Experts');
		isAllValueFilled=false;
  }
  else if($('#BankDetails')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Bank Details');
		isAllValueFilled=false;
  }
  else if($('#FinReport')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Financial Reports');
		isAllValueFilled=false;
  }
  else if($('#Actionplan')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Summary Action Plan');
		isAllValueFilled=false;
  }
  else if($('#Agreement')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Brief concept for agreement');
		isAllValueFilled=false;
  }
  else if($('#Budget')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Budget Plan');
		isAllValueFilled=false;
  }
  else if($('#Vergabedok')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Vergabedok');
		isAllValueFilled=false;
  }
  else if($('#CompetitionReport')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Competition Report');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Fromdate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (From Date)');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Todate").val()))
	{
		alertify.error('Please Enter Duration of the assignment (To Date)');
		isAllValueFilled=false;
  }
  else if((moment($("#Fromdate").val(), "MM-DD-YYYY").toISOString())>(moment($("#Todate").val(), "MM-DD-YYYY").toISOString()))
	{
		alertify.error('From  Date Should be lesser than To date');
		isAllValueFilled=false;
	}
  return isAllValueFilled;
}

function mandatoryforcontract()
{

  var isAllValueFilled=true;
  if ($('.ajs-message').length > 0) { $('.ajs-message').remove();}
  if(!$("input[id='NoCstExtn']").prop('checked')&&!$("input[id='CstExtn']").prop('checked'))
  {
    alertify.error('Please Select Cost Extension');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#CntrctNum").val()))
	{
		alertify.error('Please Enter Contract Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#FullAddress").val()))
	{
		alertify.error('Please Enter Full Address');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#NameOfFirm").val()))
	{
		alertify.error('Please Enter Name Of Firm');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#CntctPrsn").val()))
	{
		alertify.error('Please Enter Contact Person');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#TeleNumber").val()))
	{
		alertify.error('Please Enter Telephone Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#Email").val()))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!isEmail($.trim($("#Email").val())))
	{
		alertify.error('Please Enter Valid Email');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#MobileNumber").val()))
	{
		alertify.error('Please Enter Mobile Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#justification").val()))
	{
		alertify.error('Please Enter Justification for Extension');
		isAllValueFilled=false;
  }

  else if($('#terms')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Modified Terms of Reference');
		isAllValueFilled=false;
  }
  else if($("input[name='CstExtension']:checked").val()=='Cost Extension'&&$('#Estimation')[0].files.length<=0)
	{
		alertify.error('Please upload a file for Estimated Cost for the Extension');
		isAllValueFilled=false;
  }
  return isAllValueFilled;
}
