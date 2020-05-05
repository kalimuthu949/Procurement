import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './GoodsRequestWebPart.module.scss';
import * as strings from 'GoodsRequestWebPartStrings';
import { SPComponentLoader } from "@microsoft/sp-loader";

import 'jquery';
import * as moment from 'moment'
import { sp } from "@pnp/sp";
import '../../ExternalRef/css/style.css';
import '../../ExternalRef/css/alertify.min.css';
import '../../ExternalRef/css/bootstrap-datepicker.min.css';
import '../../ExternalRef/js/bootstrap-datepicker.min.js';
//var moment: any =  require('../../../node_modules/moment/min/moment.min.js');
var alertify: any = require('../../ExternalRef/js/alertify.min.js');

SPComponentLoader.loadCss("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css");
declare var $;
var filesuploaded=0;
var fileslength=0;
var siteURL = '';
export interface IGoodsRequestWebPartProps {
  description: string;
}



export default class GoodsRequestWebPart extends BaseClientSideWebPart <IGoodsRequestWebPartProps> {
  
  public onInit(): Promise<void> {
    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context
      });
    });
  }

  private readonly newGoods = ` 
  <h4 class='page-heading'>New Goods Request</h4>
  <div class="row">
  <div class="col-sm-6">
    <div class="form-group">
      <label>Project name:<span class="star">*</span></label>
      <select class="form-control" id="projectName">
        <option value="Select">Select</option>
        </select>
        </div>
      </div>

      <div class="col-sm-6">
      <div class="form-group">
      <label>Project number:<span class="star">*</span></label>
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
      <label>Short Description:<span class="star">*</span></label>
      <textarea class="form-control" id="shortDescription"></textarea>
    </div>
    </div>
    <div class="col-sm-6">
    <div class="form-group">
      <label>Specifications and Quantities:</label>     
      <div class="input-group">
      <div class="custom-file">
      <input class="custom-file-input" type="file" id="fileQuantities"  multiple>
      <label class="custom-file-label" for="fileQuantities">Choose File</label>
      </div>
      </div>
      <span id="quantityFiles"></span>
    </div>
    </div>
    </div>
    

    <div class="row">
    <div class="col-sm-3">
    <div class="form-group">
    <input class="radio-stylish" id="neutralspec" type="radio" name="Specifications" value="Neutral Specifications" checked />
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
<div class="col-sm-6">
<div class="form-group">
  <label>JOD :<span class="star">*</span></label> 
  <input class="form-control" type="Number" id="JOD" value="">
</div>
</div>
<div class="col-sm-6">

<div class="form-group">
  <label>EUR :<span class="star">*</span></label> 
  <input class="form-control" type="Number" id="EUR" value="">
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

<div class="col-sm-6">
<div class="form-group" id="divcostFile">

</div>
</div>
</div>


<div class="row">
<div class="col-sm-6">
<div class="form-group">
  <label>Shortlist :</label>
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
  <label>Text for newspaper advertisement : </label>
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
</div></div></div>


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
<label>Phone number :<span class="star">*</span></label> <input type="Number" class="contactPhoneNumber form-control" value="">
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
<label>Other attachments :</label>
<div class="input-group">      
<div class="custom-file">
<input type="file" name="myFile" id="otherAttachments" multiple class="custom-file-input">
<label class="custom-file-label" for="otherAttachments">Choose File</label>
</div>
</div><span id="otherAttachmentFiles"></span></div></div></div>
<div class="row">
<div class="col-sm-6">
<div class="form-group" id="spanKOMP" style='display:none'>
<label >KOMP :</label> <input type="text" id="KompOptPT" value="" class="form-control">
</div>
</div>
</div>
<div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
</div>`;

private readonly newdocHtml=`
<div class="row">
<div class="col-sm-6">
<div class="form-group">
<div class="input-group">
<div class="custom-file">
  <input type="file" id="nonneutralFile" class="form-control custom-file-input">
  <label class="custom-file-label" for="nonneutralFile">Attach a justification</label>
  </div>
  </div>
  </div>
  </div>
  </div>   
`;

private readonly newcostHtml=`
<div class="input-group">
<div class="custom-file">
<input type="file" id="costFile" class="custom-file-input">
<label class="custom-file-label" for="costFile">Choose File</label>
</div>
</div>
`;

  public render(): void {
    $('.pageHeader').hide();
    var that=this;
    this.domElement.innerHTML=this.newGoods;
    siteURL = this.context.pageContext.site.absoluteUrl;
    $( "#requestedDeliveryTime" ).datepicker({autoclose:true});
    LoadProjects();

    for (let index = 0; index <= 20; index++) {
      $('#requestedWarrantyTime').append('<option value="' + index + '">' + index + '</option>');
    }
   
   
    $('#btnContact').click(function(){
      addContact();
    });

    $('#projectName').change(function()
    {
      if ($("#projectName").val() == 'MWR II' || $("#projectName").val() == 'RWU II') 
      {
        $('#spanKOMP').show();
      } 
      else 
      {
        $('#komp').val('');
        $('#spanKOMP').hide();
      }
      
      $("#NameofAV").val($('#projectName option:selected').attr('proj-av'));

    });

    $(document).on('click', '.remove-contact', function () {
      $('#btnContact').show();
      var clsname = $(this).attr('data-class');
      $('.' + clsname).remove();
      if ($('.contact-details').length == 0) {
        addContact();
      }
    });

    $(document).on('change','.custom-file-input',function()
    {
    if ($(this).val()) {
      $(this).parent('.custom-file').find('.custom-file-label').text($(this).val().replace(/C:\\fakepath\\/i, ''));
    }
    else {
      alertify.set('notifier', 'position', 'top-right');
      alertify.error('Please select file');
      
    }

  });

  $('#EUR').on('blur', function () {
    if ($('#EUR').val() > 20000) {
      $('#fileShortlist').val('');
      $('#fileShortlistFileName').text('Choose File');
      $('#fileShortlist').prop("disabled", true);
    } else {
      $('#fileShortlist').prop("disabled", false);
    }
  });

  $("input[name='Specifications']").on('change', function () {
    if ($("input[name='Specifications']:checked").val() == 'Nonneutral Specifications') 
    {
      $('#divnonneutralFile').html('');
      $('#divnonneutralFile').html(that.newdocHtml);
    } else {
      $('#divnonneutralFile').html('');
    }
  });

  $('#chkMoreItem').on('change', function () {
    if ($(this).prop('checked')) 
    {
     
      $('#divcostFile').html('');
      $('#divcostFile').html(that.newcostHtml);
    } else 
    {
      $('#divcostFile').html('');
    }
  });

  $('#btnSubmit').click(function()
  {
    CreateGoodsRequest();
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

function LoadProjects()
  {
    sp.web.lists.getByTitle('Projects').items.select('Title,Id,ProjectAV/Title,ProjectAV/ID,Representative/ID').expand('ProjectAV,Representative').getAll().then((allItems: any[]) => {
      for (var index = 0; index < allItems.length; index++) 
      {
        var element = allItems[index];
        $('#projectName').append('<option Proj-Rp-id="' + element.Representative.ID + '" Proj-Av-id="' + element.ProjectAV.ID + '" Proj-Av="' + element.ProjectAV.Title + '"  proj-id="' + element.Id + '" value="' + element.Title + '">' + element.Title + '</option>');
      }
    });

    console.log(siteURL);
  }

  function addContact() {
    if ($('.contact-details').length < 3) {
      var newcontact = `<div class="contact-details clsname">
      <div class="row">
      <div class="col-sm-4">
      <div class="form-group">
      <label>Name :<span class="star">*</span></label> <input type="text" class="contactName form-control" value=""></div></div>
      <div class="col-sm-4"><div class="form-group">
      <label>Email :<span class="star">*</span></label> <input type="email" class="contactEmail form-control" value=""></div></div>
      <div class="col-sm-4"><div class="form-group">
      <label>Phone number :<span class="star">*</span></label> <input type="text" class="contactPhoneNumber form-control" value=""><span>removetag</span></div></div></div>
      </div>`;
      var clsname = 'contact-detail' + $('.contact-details').length;
      newcontact = newcontact.replace('clsname', clsname);
      newcontact = newcontact.replace('removetag', '<a class="remove-contact" data-class="' + clsname + '">X</a>');
      $('#lst-contact-details').append(newcontact);
    }
    if ($('.contact-details').length == 3) {
      $('#btnContact').hide();
    } else {
      $('#btnContact').show();
    }
  }

  function CreateGoodsRequest()
  {
    let arrFiles=[];
    if(MandatoryValidation())
    {
      
      
      let DelivertimeTime=(new Date(Date.parse(moment($("#requestedDeliveryTime").val(),"MM/DD/YYYY").format("YYYY-MM-DD")))).toISOString();

      let moreitem='No';
      if($('#chkMoreItem').prop('checked'))
      {
        moreitem='Yes';
      } 
      let Servicedata=
      {
        ProjectName:$("#projectName option:selected").val(),
        ProjectNumber:$("#projectNumber").val(),
        PNForZAS:$("#pnForZAS").val(),
        NameOfAV:$("#NameofAV").val(),
        AVNameId:$('#projectName option:selected').attr('Proj-Av-id'),
        RepresentativeId:$('#projectName option:selected').attr('Proj-Rp-id'),
        Specifications:$("input[name='Specifications']:checked").val(),
        KOMPOuput:$("#KompOptPT").val(),
        ShortDesc:$("#shortDescription").val(),
        RequestItem:moreitem,
        JOD:$("#JOD").val(),
        EUR:$("#EUR").val(),
        DeliveryTime:DelivertimeTime,
        WarrantyTime:$('#requestedWarrantyTime').val(),
        FullAddress:$('#deliveryAddress').val()
      }
      
      if($("#chkMoreItem").prop('checked'))
      {
        if($('#costFile')[0].files.length>0)
        arrFiles.push({'FolderName':'CostFile','files':$('#costFile')[0].files});
      }

      if($("input[name='Specifications']:checked").val()=='Nonneutral Specifications')
      {
        if($('#nonneutralFile')[0].files.length>0)
        arrFiles.push({'FolderName':'NeutralSpecfication','files':$('#nonneutralFile')[0].files});
      }

      if($('#newspaperFile')[0].files.length>0)
      arrFiles.push({'FolderName':'NewsAdvertisement','files':$('#newspaperFile')[0].files});

      if($('#fileQuantities')[0].files.length>0)
      arrFiles.push({'FolderName':'Quantities','files':$('#fileQuantities')[0].files});

      if($('#fileShortlist')[0].files.length>0){
      arrFiles.push({'FolderName':'ShortList','files':$('#fileShortlist')[0].files});}

      if($('#otherAttachments')[0].files.length>0)
      arrFiles.push({'FolderName':'Others','files':$('#otherAttachments')[0].files});

      InsertGoodsRequest(Servicedata,arrFiles);
    }
  }

  async function InsertGoodsRequest(Servicedata,arrFiles)
{

     fileslength=arrFiles.length;
     await sp.web.lists.getByTitle("ProcurementGoods").items.add(Servicedata).then(function(data)
     {
       
       //createFolder('EstimatedCost',data.data.ID,$('#Estimation')[0].files);
       createContact("GD-"+data.data.ID);

      for(var i=0;i<arrFiles.length;i++)
       {
          createFolder(arrFiles[i].FolderName,"GD-"+data.data.ID,arrFiles[i].files);
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
        AlertMessage("Goods Created")
      }
  }).catch(function(error){ErrorCallBack(error,'uploadFiles')});
}
}


async function createContact(ListID)
{
  
  var arrcontacts=[];
  $('.contactName').each(function(key,val)
  {
      arrcontacts.push({'Name':$(this).val(),'Email':'','Phone':''});
  });
  $('.contactEmail').each(function(key,val)
  {
      arrcontacts[key].Email=$(this).val()
  });

  $('.contactPhoneNumber').each(function(key,val)
  {
      arrcontacts[key].Phone=$(this).val()
  });

  for(var i=0;i<arrcontacts.length;i++)
  {
    let contactdata={
      ContactPerson:arrcontacts[i].Name,
      EmailAddress:arrcontacts[i].Name,
      MobileNumber:arrcontacts[i].Name,
      RefNumber:ListID
    };

    await sp.web.lists.getByTitle("ContactDetails").items.add(contactdata).then(function(data)
     {
        console.log('contact created');
     }).catch(function(error){ErrorCallBack(error,'createContact')});
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
	alert(error);
};
  
  
  function MandatoryValidation()
  {
    
  var isAllValueFilled=true;
    if($('#projectName option:selected').val()=='Select')
	{
		alertify.error('Please Choose Project Name');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#projectNumber").val()))
	{
		alertify.error('Please Enter project Number');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#pnForZAS").val()))
	{
		alertify.error('Please Enter pn For ZAS');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#NameofAV").val()))
	{
		alertify.error('Please Enter Name of AV');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#shortDescription").val()))
	{
		alertify.error('Please Enter Short Description');
		isAllValueFilled=false;
  }
  else if($('#fileQuantities')[0].files.length<=0)
	{
		alertify.error('Please Select Specifications and Quantities');
		isAllValueFilled=false;
  }  
  else if($("input[name='Specifications']:checked").val()=='Nonneutral Specifications'&&$('#nonneutralFile')[0].files.length<=0)
	{
		alertify.error('Please Select justification');
		isAllValueFilled=false;
  }
  else if($("#chkMoreItem").prop('checked')&&$('#costFile')[0].files.length<=0)
	{
		alertify.error('Please Select Attachment');
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
  else if($("#EUR").val()<='20000'&&$('#fileShortlist')[0].files.length<=0)
	{
		alertify.error('Please Select Short list');
		isAllValueFilled=false;
  } 
  else if($("#EUR").val()>='20000'&&$('#newspaperFile')[0].files.length<=0)
	{
		alertify.error('Please Select Text for newspaper advertisement');
		isAllValueFilled=false;
  } 
  else if(!$.trim($("#requestedDeliveryTime").val()))
	{
		alertify.error('Please Enter requested Delivery Time');
		isAllValueFilled=false;
  }
  else if(!$.trim($("#deliveryAddress").val()))
	{
		alertify.error('Please Enter deliveryAddress');
		isAllValueFilled=false;
  }
  else if($('#otherAttachments')[0].files.length<=0)
	{
		alertify.error('Please Select other Attachments');
		isAllValueFilled=false;
  }

  else if(!$.trim($("#KompOptPT").val())&&$("#projectName").val() == 'MWR II' || $("#projectName").val() == 'RWU II')
  {
    alertify.error('Please Enter KOMP Output');
		isAllValueFilled=false;
  }
  else
  {
    for (let index = 0; index < $('.contact-details').length; index++) {
      if (!$('.contactName')[index].value) {
        // alert('Contact name is required');
        //alertify.set('notifier', 'position', 'top-right');
        alertify.error('Please enter Contact name');
        $('.contactName:eq(' + index + ')').focus();
        isAllValueFilled=false;
        return isAllValueFilled;
      }
      if (!$('.contactEmail')[index].value) {
        // alert('Contact email is required');
        //alertify.set('notifier', 'position', 'top-right');
        alertify.error('Please enter Contact email');
        $('.contactEmail:eq(' + index + ')').focus();
        isAllValueFilled=false;
        return isAllValueFilled;
      }
      if (!$('.contactPhoneNumber')[index].value) {
        // alert('Phone number is required');
        //alertify.set('notifier', 'position', 'top-right');
        alertify.error('Please enter Phone number');
        $('.contactPhoneNumber:eq(' + index + ')').focus();
        isAllValueFilled=false;
        return isAllValueFilled;
      }
    }
  }

  return isAllValueFilled;
  }

