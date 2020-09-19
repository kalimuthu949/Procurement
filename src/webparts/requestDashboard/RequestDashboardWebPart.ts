import { Version } from "@microsoft/sp-core-library";
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { escape, each, findIndex } from "@microsoft/sp-lodash-subset";

import styles from "./RequestDashboardWebPart.module.scss";
import * as strings from "RequestDashboardWebPartStrings";

import { SPComponentLoader } from "@microsoft/sp-loader";

import "jquery";
import * as moment from "moment";
import "datatables";
import { sp, EmailProperties } from "@pnp/sp";
import "../../ExternalRef/css/style.css";
import "../../ExternalRef/css/alertify.min.css";
import "../../ExternalRef/css/bootstrap-datepicker.min.css";
import "../../ExternalRef/js/bootstrap-datepicker.min.js";
import "../../ExternalRef/js/bootstrap.min.js";
import "../../../node_modules/datatables/media/css/jquery.dataTables.min.css";
import * as Excel from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
var alertify: any = require("../../ExternalRef/js/alertify.min.js");
var FileSaver: any = require("file-saver");

//var html2pdf = require('html2pdf.js');
//import {html2pdf,html2canvas,jsPDF} from 'html2pdf.js';
//import * as html2pdf from '../../../node_modules/jspdf-html2canvas/dist/bundle.js';
//import * as jsPDF from '../../../node_modules/jspdf/dist/jspdf.min.js';

import * as html2pdf from "html2pdf.js";

SPComponentLoader.loadCss(
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
);

declare var $;
var flgProcurementTeam = false;
var flgSystemAdmin = false;
var LoggedUserEmail = "";
var LoggedUserName = "";
var CrntUserID = "";
var GoodsRequest = [];
var ServiceRequest = [];
var LocalSubsidyItems = [];
var LeaseAgreementItems = [];
var IdppItems = [];
var ProcurementServiceFiles = [];
var filename = "";
var siteURL = "";
var Users = "";
var statusHtml = "";
var flgRepUser = false;
var oTablegoods;
var oTableservice;
var oTablesubsidy;
var oTablelease;
var oTableidpp;
var Procurementusers = [];
var sheetNames = [];
var isHOD = false;
var isProcurementAdmin=false;

/* start Html for status change in popup*/
var htmlforstatuschange = `
<div class="row goods-details">
<div class="col-sm-3">
<h5 class="goods-label">Date</h5>
</div><div class="col-sm-1 text-center">:</div>
<div class="col-sm-6">
<input class="form-control form-control-datepicker" type="text" id="requestedDate">
</div>
</div></br>
<div class="row goods-details">
<div class="col-sm-3">
<h5 class="goods-label">Notes</h5>
</div><div class="col-sm-1 text-center">:</div>
<div class="col-sm-6">
<textarea id="txtNotes" style="margin: 0px; width: 345px; height: 85px;"></textarea>
</div>
</div>
`;
/* end Html for status change in popup*/

export interface IRequestDashboardWebPartProps {
  description: string;
}

export default class RequestDashboardWebPart extends BaseClientSideWebPart<
  IRequestDashboardWebPartProps
> {
  public onInit(): Promise<void> {
    return super.onInit().then((_) => {
      sp.setup({
        spfxContext: this.context,
      });
    });
  }

  public render(): void {
    LoggedUserEmail = this.context.pageContext.user.email;
    LoggedUserName = this.context.pageContext.user.displayName;
    var that = this;
    siteURL = this.context.pageContext.site.absoluteUrl;
    this.domElement.innerHTML = `
    

    <div class="loading-modal"> 
    <div class="spinner-border" role="status"> 
    <span class="sr-only">Loading...</span>
    </div>
    </div>

    <ul class="nav nav-tabs">
    <li class="active"><a href="#home" data-toggle="tab">Goods Request</a></li>
    <li><a href="#menu1" data-toggle="tab">Service Request</a></li>
    <li><a href="#menu2" data-toggle="tab">Local Subsidy</a></li>
    <li><a href="#menu3" data-toggle="tab">Lease Agreement</a></li>
    <li><a href="#menu4" data-toggle="tab">IDPP</a></li>
    </ul>

    <div class='tab-content'> 
    <div id='home' class='tab-pane fade in active tab-panel'>
    
    <div class='btnDiv'> 
    <div>
    <input class="btn btn-primary" type='button' id='btnGoods' value='Create Goods Request'>
    <input class="btn btn-primary btnExcel" type='button' id='btnExcel' value='Excel'>
    <input class="btn btn-primary btnHODExcel" type='button' data-type="goods" id='btnHODExcel' value='Excel'>
    </div>
    </div>
    
    <div id='GoodsTable'>
    <label>Status:</label>
    <select id='drpStatusforgoods' class="clsStatus">
    <option value="select">Select</option>
    </select>
    <table id="Goods" class="display" style="width:100%">
    <thead>
    <tr>
    <th>Id</th>
    <th>Project Name</th>
    <th>Project Number</th>
    <th>Name Of AV</th>
    <th>Date of Request</th>
    <th>Assigned To</th> 
    <th>Status</th>
    <th>StatusText</th>
    <th>Action</th>
    </tr>
    </thead>
    <tbody id='tblGoods'>
    </tbody>
    </table>
    </div> 
 
    </div> 
    
    <div id='menu1' class='tab-pane fade tab-panel'>    
    
    <div class='btnDiv'>
    <div>
    <input class="btn btn-primary" type='button' id='btnService' value='Create Service Request'>
    <input class="btn btn-primary btnExcel" type='button' id='btnExcel' value='Excel'>
    <input class="btn btn-primary btnHODExcel" type='button' data-type="service" id='btnHODExcel' value='Excel'>
    </div>
    </div>
   
    <div id='ServiceTable'>
    <label>Status:</label>
    <select id='drpStatusforservice' class="clsStatus">
    <option value="select">Select</option>
    </select>
    <table id="Service" class="display" style="width:100%">
    <thead>
    <tr>
    <th>Id</th>
    <th>Project Name</th>
    <th>Project Number</th>
    <th>Name Of AV</th>
    <th>Date of Request</th>
    <th>Assigned To</th>
    <th>Status</th>
    <th>StatusText</th>
    <th style="width:80px !important">Action</th>
    </tr>
    </thead>
    <tbody id='tblService'>
    </tbody>
    </table>
    </div>
    
    </div>
    
    <div id='menu2' class='tab-pane fade tab-panel'>    
    
    <div class='btnDiv'>
    <div>
    <input class="btn btn-primary" type='button' id='btnSubsidy' value='Create Local Subsidy'>
    <input class="btn btn-primary btnExcel" type='button' id='btnExcel' value='Excel'>
    <input class="btn btn-primary btnHODExcel" type='button' data-type="subsidy" id='btnHODExcel' value='Excel'>
    </div>
    </div>
   
    <div id='SubsidyTable'>
    <label>Status:</label>
    <select id='drpStatusforsubsidy' class="clsStatus">
    <option value="select">Select</option>
    </select>
    <table id="Subsidy" class="display" style="width:100%">
    <thead>
    <tr>
    <th>Id</th>
    <th>Project Name</th>
    <th>Project Number</th>
    <th>Name Of AV</th>
    <th>Date of Request</th>
    <th>Assigned To</th>
    <th>Status</th>
    <th>StatusText</th>
    <th style="width:80px !important">Action</th>
    </tr>
    </thead>
    <tbody id='tblSubsidy'>
    </tbody>
    </table>
    </div>
    
    </div> 
    

    <div id='menu3' class='tab-pane fade tab-panel'>    
    
    <div class='btnDiv'>
    <div>
    <input class="btn btn-primary" type='button' id='btnLease' value='Create Lease Agreement'>
    <input class="btn btn-primary btnExcel" type='button' id='btnExcel' value='Excel'>
    <input class="btn btn-primary btnHODExcel" type='button' data-type="lease" id='btnHODExcel' value='Excel'>
    </div>
    </div>
   
    <div id='LeaseTable'>
    <label>Status:</label>
    <select id='drpStatusforlease' class="clsStatus">
    <option value="select">Select</option>
    </select>
    <table id="Lease" class="display" style="width:100%">
    <thead>
    <tr>
    <th>Id</th>
    <th>Project Name</th>
    <th>Project Number</th>
    <th>Name Of AV</th>
    <th>Date of Request</th>
    <th>Assigned To</th>
    <th>Status</th>
    <th>StatusText</th>
    <th style="width:80px !important">Action</th>
    </tr>
    </thead>
    <tbody id='tblLease'>
    </tbody>
    </table>
    </div>
    
    </div>
    
    <div id='menu4' class='tab-pane fade tab-panel'>    
    
    <div class='btnDiv'>
    <div>
    <input class="btn btn-primary" type='button' id='btnIdpp' value='Create IDPP'>
    <input class="btn btn-primary btnExcel" type='button' id='btnExcel' value='Excel'>
    <input class="btn btn-primary btnHODExcel" type='button' data-type="idpp" id='btnHODExcel' value='Excel'>
    </div>
    </div>
   
    <div id='idppTable'>
    <label>Status:</label>
    <select id='drpStatusforidpp' class="clsStatus">
    <option value="select">Select</option>
    </select>
    <table id="idpp" class="display" style="width:100%">
    <thead>
    <tr>
    <th>Id</th>
    <th>Project Name</th>
    <th>Project Number</th>
    <th>Name Of AV</th>
    <th>Date of Request</th>
    <th>Assigned To</th>
    <th>Status</th>
    <th>StatusText</th>
    <th style="width:80px !important">Action</th>
    </tr>
    </thead>
    <tbody id='tblidpp'>
    </tbody>
    </table>
    </div>
    
    </div> 
    
    </div>


    
    




    <div class="modal fade" id="myModal" role="dialog">
    <div class="modal-dialog">
      <!-- Modal content-->
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">&times;</button>
          <h4 class="modal-title" id='ProjectDetails'>Goods and Service</h4>
        </div>
        <div class="modal-body" id='modalbody'>
          <p>Some text in the modal.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
      
    </div>
  </div>

  <div class="modal fade" id="myModalEdit" role="dialog">
  <div class="modal-dialog">
  
    <!-- Modal content-->
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title" id='EditDetails'>Edit Record</h4>
      </div>
      <div class="modal-body" id='modalbodyEdit'>
        <p>Some text in the modal.</p>
      </div>
      <div class="modal-footer" id='divforbtn'>
        <button type="button" class="btn btn-default" data-dismiss="modal" id='btnUpdate'>Update</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
    
  </div>
</div>


    `;
    //$('#GoodsTable').hide();
    getLoggedInUserDetails();
    LoadAdminTeam();
    getAllFolders();
    LoadProcurementTeamMembers();
    LoadHeadofProcurementTeamMembers();
    LoadProcurementAdmin();
    LoadStatus();
    LoadProjects();
    LoadProcurementTeam();
    LoadGoodsRequest();
    LoadServiceRequest();
    LoadSubsidyRequest();
    LoadLeaseAgreement();
    Loadidpp();

    // $("input[name='Request']").change(function()
    // {
    //   if($("input[name='Request']:checked").val()=='Service Request')
    //   {
    //     $('#GoodsTable').hide();
    //     $('#ServiceTable').show();
    //   }
    //   else
    //   {
    //     $('#GoodsTable').show();
    //     $('#ServiceTable').hide();
    //   }

    // });

    // $(".nav-tabs li").click(function() {
    //   if( $("li.active").text()=="Service Request")
    //   {
    //     $('#GoodsTable').hide();
    //     $('#ServiceTable').show();
    //   }
    //   else
    //   {
    //     $('#GoodsTable').show();
    //     $('#ServiceTable').hide();
    //   }
    // });

    $("#btnService").click(function () {
      location.href = siteURL + "/SitePages/New-Request.aspx?code=Service";
    });

    $("#btnGoods").click(function () {
      location.href = siteURL + "/SitePages/New-Request.aspx?code=Goods";
    });

    $("#btnSubsidy").click(function () {
      location.href = siteURL + "/SitePages/New-Request.aspx?code=Subsidy";
    });

    $("#btnLease").click(function () {
      location.href = siteURL + "/SitePages/New-Request.aspx?code=Lease";
    });

    $("#btnIdpp").click(function () {
      location.href = siteURL + "/SitePages/New-Request.aspx?code=idpp";
    });

    /*Excel click functionailty*/
    $("#btnExcel").click(function () {
      generateExcel();
    });
    $("#btnHODExcel").click(function () {
      if ($(this).attr("data-type") == "goods") generateHODExcel(GoodsRequest);
      else if ($(this).attr("data-type") == "service")
        generateHODExcel(ServiceRequest);
      else if ($(this).attr("data-type") == "subsidy")
        generateHODExcel(LocalSubsidyItems);
      else if ($(this).attr("data-type") == "lease")
        generateHODExcel(LeaseAgreementItems);
      else if ($(this).attr("data-type") == "idpp") generateHODExcel(IdppItems);
    });

    $(document).on("click", ".GdsdetailView", async function () {
      var that = $(this);
      var index;
      var gdsID = "GD-" + that.attr("req-id"); //Ref Id Of goods is like GD-1
      await GoodsRequest.forEach(function (val, key) {
        if (val.ID == that.attr("req-id")) {
          index = key;
          return false;
        }
      });

      let arrFiles = [];
      let otherFiles = [];
      let NeutralSpecfication = [];
      let Quantities = [];

      if (GoodsRequest[index].GoodsCategory == "goods") {
        arrFiles.push({
          Name: "CostFile",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "CostFile",
        });
        arrFiles.push({
          Name: "ShortList",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "ShortList",
        });
        arrFiles.push({
          Name: "NewsAdvertisement",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Technical Part of the Newspaper Advertisement",
        });
        arrFiles.push({
          Name: "Quantities",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Specifications and Quantities",
        });
        arrFiles.push({
          Name: "Others",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Other Attachments",
        });
        arrFiles.push({
          Name: "NeutralSpecfication",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Nonneutral Specifications",
        });
        arrFiles.push({
          Name: "VSRC",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Valid Supplier’s Registration",
        });
        arrFiles.push({
          Name: "VSCP",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Valid Supplier’s Company Profile",
        });
        arrFiles.push({
          Name: "VSSPAC",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Sole Provider Certificate",
        });
      } else if (GoodsRequest[index].GoodsCategory == "goodsamendment") {
        arrFiles.push({
          Name: "AmendmentSpecfications",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Specifications and Quantities",
        });
        arrFiles.push({
          Name: "Others",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Other Attachments",
        });
        arrFiles.push({
          Name: "Justification",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Justification for Amendment",
        });
      } else if (GoodsRequest[index].GoodsCategory == "framework") {
        arrFiles.push({
          Name: "AdditionalInformation",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Additional Information",
        });
        arrFiles.push({
          Name: "FilledCatalogue",
          FileName: "N/A",
          FileURl: "N/A",
          displayName: "Filled Catalogue",
        });
      }

      $.each(arrFiles, function (key, val) {
        for (var i = 0; i < ProcurementServiceFiles["Folders"].length; i++) {
          if (ProcurementServiceFiles["Folders"][i].Name == val.Name) {
            for (
              var j = 0;
              j < ProcurementServiceFiles["Folders"][i].Folders.length;
              j++
            ) {
              if (
                ProcurementServiceFiles["Folders"][i].Folders[j].Name == gdsID
              ) {
                for (
                  var k = 0;
                  k <
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files.length;
                  k++
                ) {
                  if (ProcurementServiceFiles["Folders"][i].Name == "Others") {
                    otherFiles.push({
                      displayname: "Other Attachments",
                      Name:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].Name,
                      Url:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].ServerRelativeUrl,
                    });
                  } 
                  else if (
                    ProcurementServiceFiles["Folders"][i].Name == "Quantities"
                  ) {
                    Quantities.push({
                      displayname: "Specifications and Quantities",
                      Name:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].Name,
                      Url:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].ServerRelativeUrl,
                    });
                  }else {
                    arrFiles[key].FileName =
                      ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                        k
                      ].Name;
                    arrFiles[key].FileURl =
                      ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                        k
                      ].ServerRelativeUrl;
                  }
                }
              }
            }
          }
        }
      });

      let HTMLGoods = "";

      HTMLGoods +=
        '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Project name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        GoodsRequest[index].ProjectName +
        "</p></div></div>";
      HTMLGoods +=
        '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Project ID</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        GoodsRequest[index].ID +
        "</p></div></div>";
      HTMLGoods +=
        '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Name Of AV</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        GoodsRequest[index].NameOfAV +
        "</p></div></div>";
      HTMLGoods +=
        '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">PN for ZAS</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        GoodsRequest[index].PNForZAS +
        "</p></div></div>";
      HTMLGoods +=
        '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Project Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        GoodsRequest[index].ProjectNumber +
        "</p></div></div>";
      if (GoodsRequest[index].isKompOutput == "Yes")
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">KompOutput</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].KompOutputNumber +
          " - " +
          GoodsRequest[index].kompPercent +
          "</p></div></div>";

      //goods request popup
      if (GoodsRequest[index].GoodsCategory == "goods") {
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Short Description</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].ShortDesc +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Specification</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].Specifications +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">JOD</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].JOD +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">EUR</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].EUR +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Warranty Time</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].WarrantyTime +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Delivery Time</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          moment(GoodsRequest[index].DeliveryTime).format("MM/DD/YYYY") +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Delivery Address</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].FullAddress +
          "</p></div></div>";
        if (GoodsRequest[index].Specifications == "Nonneutral Specifications") {
          HTMLGoods +=
            '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Name Of Contact Person</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            GoodsRequest[index].ContactPersonName +
            "</p></div></div>";
          HTMLGoods +=
            '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Email</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            GoodsRequest[index].PersonEmail +
            "</p></div></div>";
          HTMLGoods +=
            '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Mobile Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            GoodsRequest[index].PersonMobile +
            "</p></div></div>";
        }
      }
      //above codefor goods amendment popup
      else if (GoodsRequest[index].GoodsCategory == "goodsamendment") {
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">ProSoft Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].ProsoftNumber +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Delivery Time</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          moment(GoodsRequest[index].DeliveryTime).format("MM/DD/YYYY") +
          "</p></div></div>";
      }
      //for goods framework popup
      else if (GoodsRequest[index].GoodsCategory == "framework") {
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">Framework Agreement</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].Agreement +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">JOD</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].JOD +
          "</p></div></div>";
        HTMLGoods +=
          '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">EUR</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          GoodsRequest[index].EUR +
          "</p></div></div>";
      }

      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].FileURl != "N/A") {
          HTMLGoods +=
            '<div class="row goods-details"><div class="col-sm-4"><h5 class="goods-label">' +
            arrFiles[i].displayName +
            ' </h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
            encodeURI(arrFiles[i].FileURl) +
            ' target="_blank"> ' +
            arrFiles[i].FileName +
            "</a></p></div></div>";
        }
      }

      if (otherFiles.length > 0) {
        for (var idxOther = 0; idxOther < otherFiles.length; idxOther++) {
          if (idxOther == 0) {
            HTMLGoods += '<div class="row goods-details">';
            HTMLGoods +=
              '<div class="col-sm-4"><h5 class="goods-label">' +
              otherFiles[0].displayname +
              "</h5></div>";
            HTMLGoods +=
              '<div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLGoods += "</div>";
          } else {
            HTMLGoods += '<div class="row goods-details">';
            HTMLGoods +=
              '<div class="col-sm-4"><h5 class="goods-label"> </h5></div>';
            HTMLGoods +=
              '<div class="col-sm-1 text-center"> </div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLGoods += "</div>";
          }
        }
      }
      if (Quantities.length > 0) {
        for (
          var idxquantity = 0;
          idxquantity < Quantities.length;
          idxquantity++
        ) {
          if (idxquantity == 0) {
            HTMLGoods += '<div class="row goods-details">';
            HTMLGoods +=
              '<div class="col-sm-4"><h5 class="goods-label">' +
              Quantities[0].displayname +
              "</h5></div>";
            HTMLGoods +=
              '<div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(Quantities[idxquantity].Url) +
              ' target="_blank"> ' +
              Quantities[idxquantity].Name +
              "</a></p></div>";
            HTMLGoods += "</div>";
          } else {
            HTMLGoods += '<div class="row goods-details">';
            HTMLGoods +=
              '<div class="col-sm-4"><h5 class="goods-label"> </h5></div>';
            HTMLGoods +=
              '<div class="col-sm-1 text-center"> </div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(Quantities[idxquantity].Url) +
              ' target="_blank"> ' +
              Quantities[idxquantity].Name +
              "</a></p></div>";
            HTMLGoods += "</div>";
          }
        }
      }
      $("#ProjectDetails").html("");
      $("#ProjectDetails").html(
        "Goods Request Details for " + GoodsRequest[index].ProjectName
      );
      $("#modalbody").html("");
      $("#modalbody").append(HTMLGoods);
    });

    $(document).on("click", ".serdetailView", function () {
      var that = $(this);
      var index;
      var serviceID = that.attr("req-id");
      ServiceRequest.forEach(function (val, key) {
        if (val.ID == that.attr("req-id")) {
          index = key;
          return false;
        }
      });

      let arrFiles = [];
      let otherFiles = [];

      arrFiles.push({
        Name: "EstimatedCost",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Estimated Cost",
      });
      arrFiles.push({
        Name: "Justification",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Justification",
      });
      arrFiles.push({
        Name: "Terms",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Terms Of Reference",
      });
      arrFiles.push({
        Name: "Others",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Other Attachments",
      });
      arrFiles.push({
        Name: "ShortList",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "ShortList",
      });
      arrFiles.push({
        Name: "TechAssGrid",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Technical Assessment Grid",
      });
      arrFiles.push({
        Name: "NewsAdvertisement",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Technical Part of the Newspaper Advertisement",
      });
      arrFiles.push({
        Name: "ProjectProposal",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "ProjectProposal",
      });
      arrFiles.push({
        Name: "Budget",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Budget",
      });
      arrFiles.push({
        Name: "Profile",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Profile",
      });
      arrFiles.push({
        Name: "BankDetails",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "BankDetails",
      });
      arrFiles.push({
        Name: "CommercialSuitability",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "CommercialSuitability",
      });
      arrFiles.push({
        Name: "RegCert",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "RegCert",
      });
      arrFiles.push({
        Name: "LessorID",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "LessorID",
      });
      arrFiles.push({
        Name: "OwnerDocs",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "OwnerDocs",
      });
      arrFiles.push({
        Name: "RmoApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "RmoApproval",
      });
      arrFiles.push({
        Name: "DirectorApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "DirectorApproval",
      });
      arrFiles.push({
        Name: "LandScheme",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "LandScheme",
      });
      arrFiles.push({
        Name: "RmoApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "RmoApproval",
      });
      arrFiles.push({
        Name: "CVExperts",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "CVExperts",
      });
      arrFiles.push({
        Name: "Financialstatus",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Financial status of the done payments",
      });
      arrFiles.push({
        Name: "AgreementConcept",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "AgreementConcept",
      });
      arrFiles.push({
        Name: "Vergabedok",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Vergabedok",
      });
      arrFiles.push({
        Name: "SummaryActionPlan",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "SummaryActionPlan",
      });
      arrFiles.push({
        Name: "CompetitionReport",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "CompetitionReport",
      });
      arrFiles.push({
        Name: "FilledRequest",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Filled Request Form for Legal Services",
      });

      $.each(arrFiles, function (key, val) {
        for (var i = 0; i < ProcurementServiceFiles["Folders"].length; i++) {
          if (ProcurementServiceFiles["Folders"][i].Name == val.Name) {
            for (
              var j = 0;
              j < ProcurementServiceFiles["Folders"][i].Folders.length;
              j++
            ) {
              if (
                ProcurementServiceFiles["Folders"][i].Folders[j].Name ==
                serviceID
              ) {
                for (
                  var k = 0;
                  k <
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files.length;
                  k++
                ) {
                  if (ProcurementServiceFiles["Folders"][i].Name == "Others") {
                    otherFiles.push({
                      displayname: "Other Attachments",
                      Name:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].Name,
                      Url:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].ServerRelativeUrl,
                    });
                  } else {
                    arrFiles[key].FileName =
                      ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                        k
                      ].Name;
                    arrFiles[key].FileURl =
                      ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                        k
                      ].ServerRelativeUrl;
                  }
                }
              }
            }
          }
        }
      });

      let HTMLservice = "";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        ServiceRequest[index].ProjectName +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project ID</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        ServiceRequest[index].ID +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of AV</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        ServiceRequest[index].NameOfAV +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">PN for ZAS</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        ServiceRequest[index].PNForZAS +
        "</p></div></div>";
      if (ServiceRequest[index].isKompOutput == "Yes")
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">KompOutput</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].KompOutputNumber +
          " - " +
          ServiceRequest[index].kompPercent +
          "</p></div></div>";

      if (ServiceRequest[index].ChoicesOfServices == "Direct Award") {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">ConsultingFirm/Appariser</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].ConsultingFirm +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of Consulting Firm/Appariser</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].NameOfConsultingFirm +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Area Of Activity</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].AreaOfActivity +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Short Description</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].ShortDesc +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Full Address</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].FullAddress +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Contract Person from the Firm</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].ContactPerson +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Telephone Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].TelephoneNumber +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Email</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].EmailAddress +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Mobile Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].MobileNumber +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">From Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].DurationFrom +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">To Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].DurationTo +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">JOD</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].JOD +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">EUR</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].EUR +
          "</p></div></div>";
      }
      if (ServiceRequest[index].ChoicesOfServices == "Shortlisted tender") {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Short Description</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].ShortDesc +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">From Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          moment(ServiceRequest[index].DurationFrom).format("MM/DD/YYYY") +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">To Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          moment(ServiceRequest[index].DurationTo).format("MM/DD/YYYY") +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">JOD</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].JOD +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">EUR</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].EUR +
          "</p></div></div>";
      }
      if (ServiceRequest[index].ChoicesOfServices == "Public tender") {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Short Description</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].ShortDesc +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">From Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          moment(ServiceRequest[index].DurationFrom).format("MM/DD/YYYY") +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">To Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          moment(ServiceRequest[index].DurationTo).format("MM/DD/YYYY") +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">JOD</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].JOD +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">EUR</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].EUR +
          "</p></div></div>";
      }
      if (ServiceRequest[index].ChoicesOfServices == "Contract Amendment") {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Short Description</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].ShortDesc +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Full Address</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].FullAddress +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of Consulting Firm/Appariser</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].NameOfConsultingFirm +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Contract Person from the Firm</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].ContactPerson +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Telephone Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].TelephoneNumber +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Email</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].EmailAddress +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Mobile Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].MobileNumber +
          "</p></div></div>";
      }
      if (
        ServiceRequest[index].ChoicesOfServices ==
        "Request from a Framework Agreement"
      ) {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Agreement</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].Agreement +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">JOD</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].JOD +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">EUR</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          ServiceRequest[index].EUR +
          "</p></div></div>";
      }

      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].FileURl != "N/A") {
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">' +
            arrFiles[i].displayname +
            ' </h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
            encodeURI(arrFiles[i].FileURl) +
            ' target="_blank"> ' +
            arrFiles[i].FileName +
            "</a></p></div></div>";
        }
      }

      if (otherFiles.length > 0) {
        for (var idxOther = 0; idxOther < otherFiles.length; idxOther++) {
          if (idxOther == 0) {
            HTMLservice += '<div class="row goods-details">';
            HTMLservice +=
              '<div class="col-sm-3"><h5 class="goods-label">' +
              otherFiles[0].displayname +
              "</h5></div>";
            HTMLservice +=
              '<div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLservice += "</div>";
          } else {
            HTMLservice += '<div class="row goods-details">';
            HTMLservice +=
              '<div class="col-sm-3"><h5 class="goods-label"> </h5></div>';
            HTMLservice +=
              '<div class="col-sm-1 text-center"> </div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLservice += "</div>";
          }
        }
      }

      $("#ProjectDetails").html("");
      $("#ProjectDetails").html(
        "Service Request Details for " + ServiceRequest[index].ProjectName
      );
      $("#modalbody").html("");
      $("#modalbody").append(HTMLservice);
    });

    $(document).on("click", ".subdetailView", function () {
      var that = $(this);
      var index;
      var serviceID = "LS-" + that.attr("req-id");
      LocalSubsidyItems.forEach(function (val, key) {
        if (val.ID == that.attr("req-id")) {
          index = key;
          return false;
        }
      });

      let arrFiles = [];
      let otherFiles = [];

      arrFiles.push({
        Name: "Others",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Other Attachments",
      });
      arrFiles.push({
        Name: "ProjectProposal",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Project Proposal",
      });
      arrFiles.push({
        Name: "Budget",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Budget Break-down",
      });
      arrFiles.push({
        Name: "Profile",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Profile",
      });
      arrFiles.push({
        Name: "BankDetails",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Bank Details",
      });
      arrFiles.push({
        Name: "CommercialSuitability",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Commercial & Legal Suitability Check",
      });
      arrFiles.push({
        Name: "RegCert",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Registration Certificate",
      });
      arrFiles.push({
        Name: "MinisterApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Approval from the Prime Minister/ Authorized Ministry",
      });
      arrFiles.push({
        Name: "HQApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Checklist for HQ Approval",
      });

      arrFiles.push({
        Name: "MinisterApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Prime Minister approval for the additional budget",
      });
      arrFiles.push({
        Name: "Justification",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Justification for Amendment",
      });
      arrFiles.push({
        Name: "Budget",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Modified Budget Breakdown (signed and stamped)",
      });
      arrFiles.push({
        Name: "ProjectProposal",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Modified Project Proposal (signed and stamped)",
      });
      arrFiles.push({
        Name: "Financialstatus",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Financial status of the done payments",
      });

      $.each(arrFiles, function (key, val) {
        for (var i = 0; i < ProcurementServiceFiles["Folders"].length; i++) {
          if (ProcurementServiceFiles["Folders"][i].Name == val.Name) {
            for (
              var j = 0;
              j < ProcurementServiceFiles["Folders"][i].Folders.length;
              j++
            ) {
              if (
                ProcurementServiceFiles["Folders"][i].Folders[j].Name ==
                serviceID
              ) {
                for (
                  var k = 0;
                  k <
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files.length;
                  k++
                ) {
                  if (ProcurementServiceFiles["Folders"][i].Name == "Others") {
                    otherFiles.push({
                      displayname: "Other Attachments",
                      Name:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].Name,
                      Url:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].ServerRelativeUrl,
                    });
                  } else {
                    if (
                      ProcurementServiceFiles["Folders"][i].Name == "Others"
                    ) {
                      otherFiles.push({
                        displayname: "Other Attachments",
                        Name:
                          ProcurementServiceFiles["Folders"][i].Folders[j]
                            .Files[k].Name,
                        Url:
                          ProcurementServiceFiles["Folders"][i].Folders[j]
                            .Files[k].ServerRelativeUrl,
                      });
                    } else {
                      arrFiles[key].FileName =
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].Name;
                      arrFiles[key].FileURl =
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].ServerRelativeUrl;
                    }
                  }
                }
              }
            }
          }
        }
      });

      let HTMLservice = "";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LocalSubsidyItems[index].ProjectName +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project ID</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LocalSubsidyItems[index].ID +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of AV</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LocalSubsidyItems[index].NameOfAV +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">PN for ZAS</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LocalSubsidyItems[index].PNForZAS +
        "</p></div></div>";
      if (LocalSubsidyItems[index].isKompOutput == "Yes")
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">KompOutput</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].KompOutputNumber +
          " - " +
          LocalSubsidyItems[index].kompPercent +
          "</p></div></div>";

      if (LocalSubsidyItems[index].SubsidyCategory == "Subsidy") {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Short Description of the Requested Local Subsidy</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].ShortDesc +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of Beneficiary</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].NameOfBeneficiary +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Full Address</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].FullAddress +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Telephone Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].TelephoneNumber +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of Contact Person</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].ContactPerson +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Email</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].EmailAddress +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Mobile Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].TelephoneNumber +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">From Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].DurationFrom +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">To Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].DurationTo +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">JOD</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].JOD +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">EUR</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].EUR +
          "</p></div></div>";
      } else if (
        LocalSubsidyItems[index].SubsidyCategory == "Subsidyamendment"
      ) {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Local Subsidy CoSoft Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LocalSubsidyItems[index].CoSoftNumber +
          "</p></div></div>";
      }

      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].FileURl != "N/A") {
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">' +
            arrFiles[i].Name +
            ' </h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
            encodeURI(arrFiles[i].FileURl) +
            ' target="_blank"> ' +
            arrFiles[i].FileName +
            "</a></p></div></div>";
        }
      }

      if (otherFiles.length > 0) {
        for (var idxOther = 0; idxOther < otherFiles.length; idxOther++) {
          if (idxOther == 0) {
            HTMLservice += '<div class="row goods-details">';
            HTMLservice +=
              '<div class="col-sm-3"><h5 class="goods-label">' +
              otherFiles[0].displayname +
              "</h5></div>";
            HTMLservice +=
              '<div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLservice += "</div>";
          } else {
            HTMLservice += '<div class="row goods-details">';
            HTMLservice +=
              '<div class="col-sm-3"><h5 class="goods-label"> </h5></div>';
            HTMLservice +=
              '<div class="col-sm-1 text-center"> </div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLservice += "</div>";
          }
        }
      }

      $("#ProjectDetails").html("");
      $("#ProjectDetails").html(
        "Service Request Details for " + LocalSubsidyItems[index].ProjectName
      );
      $("#modalbody").html("");
      $("#modalbody").append(HTMLservice);
    });

    $(document).on("click", ".LeasedetailView", function () {
      var that = $(this);
      var index;
      var serviceID = "LA-" + that.attr("req-id");
      LeaseAgreementItems.forEach(function (val, key) {
        if (val.ID == that.attr("req-id")) {
          index = key;
          return false;
        }
      });

      let arrFiles = [];
      let otherFiles = [];

      arrFiles.push({
        Name: "Profile",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Company Profile",
      });
      arrFiles.push({
        Name: "RegCert",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Registration Certificate",
      });
      arrFiles.push({
        Name: "LessorID",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Lessor ID",
      });
      arrFiles.push({
        Name: "OwnerDocs",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Estate Ownership Documents",
      });
      arrFiles.push({
        Name: "RmoApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "RmoApproval",
      });
      arrFiles.push({
        Name: "BankDetails",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Bank Details",
      });
      arrFiles.push({
        Name: "DirectorApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Country Director Approval",
      });
      arrFiles.push({
        Name: "LandScheme",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Land Scheme",
      });
      arrFiles.push({
        Name: "RmoApproval",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Rmo Approval",
      });
      arrFiles.push({
        Name: "Others",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Other Attachments",
      });

      arrFiles.push({
        Name: "ModifiedOffer",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Modified offer by the lessor",
      });
      arrFiles.push({
        Name: "Justification",
        FileName: "N/A",
        FileURl: "N/A",
        displayname:
          "Justification for contract supplement signed by the project AV",
      });
      arrFiles.push({
        Name: "Financialstatus",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Financial status of the done payments",
      });

      $.each(arrFiles, function (key, val) {
        for (var i = 0; i < ProcurementServiceFiles["Folders"].length; i++) {
          if (ProcurementServiceFiles["Folders"][i].Name == val.Name) {
            for (
              var j = 0;
              j < ProcurementServiceFiles["Folders"][i].Folders.length;
              j++
            ) {
              if (
                ProcurementServiceFiles["Folders"][i].Folders[j].Name ==
                serviceID
              ) {
                for (
                  var k = 0;
                  k <
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files.length;
                  k++
                ) {
                  if (ProcurementServiceFiles["Folders"][i].Name == "Others") {
                    otherFiles.push({
                      displayname: "Other Attachments",
                      Name:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].Name,
                      Url:
                        ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                          k
                        ].ServerRelativeUrl,
                    });
                  } else {
                    arrFiles[key].FileName =
                      ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                        k
                      ].Name;
                    arrFiles[key].FileURl =
                      ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                        k
                      ].ServerRelativeUrl;
                  }
                }
              }
            }
          }
        }
      });

      let HTMLservice = "";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LeaseAgreementItems[index].ProjectName +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project ID</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LeaseAgreementItems[index].ID +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of AV</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LeaseAgreementItems[index].NameOfAV +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">PN for ZAS</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        LeaseAgreementItems[index].PNForZAS +
        "</p></div></div>";
      if (LeaseAgreementItems[index].isKompOutput == "Yes")
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">KompOutput</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LeaseAgreementItems[index].KompOutputNumber +
          " - " +
          LeaseAgreementItems[index].kompPercent +
          "</p></div></div>";

      if (LeaseAgreementItems[index].LeaseAgreementCategory == "Lease") {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Short Description of the Requested Local Subsidy</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LeaseAgreementItems[index].ShortDesc +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">From date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LeaseAgreementItems[index].DurationFrom +
          "</p></div></div>";
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">To date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LeaseAgreementItems[index].DurationTo +
          "</p></div></div>";

        if (
          LeaseAgreementItems[index].LessorPapers == "Lessor is an Individual"
        ) {
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Lessor Name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].LessorName +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Full Address</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].FullAddress +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Phone Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].TelephoneNumber +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Email</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].EmailAddress +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Mobile Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].MobileNumber +
            "</p></div></div>";
        } else {
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of Firm</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].NameOfConsultingFirm +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Full Address</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].FullAddress +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Phone Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].TelephoneNumber +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of Contact Person</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].ContactPerson +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Email</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].EmailAddress +
            "</p></div></div>";
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Mobile Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
            LeaseAgreementItems[index].MobileNumber +
            "</p></div></div>";
        }
      } else if (
        LeaseAgreementItems[index].LeaseAgreementCategory == "Leaseamendment"
      ) {
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Local Subsidy CoSoft Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          LeaseAgreementItems[index].CoSoftNumber +
          "</p></div></div>";
      }

      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].FileURl != "N/A") {
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">' +
            arrFiles[i].displayname +
            ' </h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
            encodeURI(arrFiles[i].FileURl) +
            ' target="_blank"> ' +
            arrFiles[i].FileName +
            "</a></p></div></div>";
        }
      }
      if (otherFiles.length > 0) {
        for (var idxOther = 0; idxOther < otherFiles.length; idxOther++) {
          if (idxOther == 0) {
            HTMLservice += '<div class="row goods-details">';
            HTMLservice +=
              '<div class="col-sm-3"><h5 class="goods-label">' +
              otherFiles[0].displayname +
              "</h5></div>";
            HTMLservice +=
              '<div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLservice += "</div>";
          } else {
            HTMLservice += '<div class="row goods-details">';
            HTMLservice +=
              '<div class="col-sm-3"><h5 class="goods-label"> </h5></div>';
            HTMLservice +=
              '<div class="col-sm-1 text-center"> </div><div class="col-sm-6"><p class="goodsresult"><a href=' +
              encodeURI(otherFiles[idxOther].Url) +
              ' target="_blank"> ' +
              otherFiles[idxOther].Name +
              "</a></p></div>";
            HTMLservice += "</div>";
          }
        }
      }

      $("#ProjectDetails").html("");
      $("#ProjectDetails").html(
        "Service Request Details for " + LeaseAgreementItems[index].ProjectName
      );
      $("#modalbody").html("");
      $("#modalbody").append(HTMLservice);
    });

    $(document).on("click", ".idppdetailView", function () {
      var that = $(this);
      var index;
      var serviceID = "IDP-" + that.attr("req-id");
      IdppItems.forEach(function (val, key) {
        if (val.ID == that.attr("req-id")) {
          index = key;
          return false;
        }
      });

      let arrFiles = [];

      arrFiles.push({
        Name: "Budget",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Budget Plan",
      });
      arrFiles.push({
        Name: "Profile",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Company Profile",
      });
      arrFiles.push({
        Name: "BankDetails",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Bank Details",
      });
      arrFiles.push({
        Name: "RegCert",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Company’s Registration Certificate",
      });
      arrFiles.push({
        Name: "CVExperts",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "CVs Of Experts",
      });
      arrFiles.push({
        Name: "FinancialReports",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Financial Reports",
      });
      arrFiles.push({
        Name: "AgreementConcept",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Brief concept For Agreement",
      });
      arrFiles.push({
        Name: "Vergabedok",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Vergabedok",
      });
      arrFiles.push({
        Name: "SummaryActionPlan",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Summary Action Plan",
      });
      arrFiles.push({
        Name: "CompetitionReport",
        FileName: "N/A",
        FileURl: "N/A",
        displayname: "Competition Report",
      });

      $.each(arrFiles, function (key, val) {
        for (var i = 0; i < ProcurementServiceFiles["Folders"].length; i++) {
          if (ProcurementServiceFiles["Folders"][i].Name == val.Name) {
            for (
              var j = 0;
              j < ProcurementServiceFiles["Folders"][i].Folders.length;
              j++
            ) {
              if (
                ProcurementServiceFiles["Folders"][i].Folders[j].Name ==
                serviceID
              ) {
                for (
                  var k = 0;
                  k <
                  ProcurementServiceFiles["Folders"][i].Folders[j].Files.length;
                  k++
                ) {
                  arrFiles[key].FileName =
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                      k
                    ].Name;
                  arrFiles[key].FileURl =
                    ProcurementServiceFiles["Folders"][i].Folders[j].Files[
                      k
                    ].ServerRelativeUrl;
                }
              }
            }
          }
        }
      });

      let HTMLservice = "";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        IdppItems[index].ProjectName +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project ID</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        IdppItems[index].ID +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of AV</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        IdppItems[index].NameOfAV +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">PN for ZAS</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        IdppItems[index].PNForZAS +
        "</p></div></div>";
      if (LeaseAgreementItems[index].isKompOutput == "Yes")
        HTMLservice +=
          '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">KompOutput</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
          IdppItems[index].KompOutputNumber +
          " - " +
          IdppItems[index].kompPercent +
          "</p></div></div>";

      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Short Description</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        IdppItems[index].ShortDesc +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">From Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        moment(IdppItems[index].DurationFrom).format("MM/DD/YYYY") +
        "</p></div></div>";
      HTMLservice +=
        '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">To Date</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">' +
        moment(IdppItems[index].DurationTo).format("MM/DD/YYYY") +
        "</p></div></div>";

      for (var i = 0; i < arrFiles.length; i++) {
        if (arrFiles[i].FileURl != "N/A") {
          HTMLservice +=
            '<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">' +
            arrFiles[i].Name +
            ' </h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href=' +
            encodeURI(arrFiles[i].FileURl) +
            ' target="_blank"> ' +
            arrFiles[i].FileName +
            "</a></p></div></div>";
        }
      }

      $("#ProjectDetails").html("");
      $("#ProjectDetails").html(
        "Service Request Details for " + LeaseAgreementItems[index].ProjectName
      );
      $("#modalbody").html("");
      $("#modalbody").append(HTMLservice);
    });

    /*Edit Fcuntionality*/

    $(document).on("click", ".SerEdit", function () {
      var indexofEdit = $(this).attr("index-value");
      var itemid = $(this).attr("req-id");
      var AssignedTo = $(
        ".UserDropdownSER" + indexofEdit + " option:selected"
      ).val();
      var Status = $(
        ".StatusDropdownSER" + indexofEdit + " option:selected"
      ).val();

      var html = "";
      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">AssignedTo</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="UserDropdownSERPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        Users +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">Status</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="statuspopup StatusDropdownSERPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        statusHtml +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      html += '<div id="divfordatefield"></div>';

      $("#modalbodyEdit").html(html);
      $(".UserDropdownSERPopup" + indexofEdit + "").val(AssignedTo);
      $(".StatusDropdownSERPopup" + indexofEdit + "").val(Status);

      var htmlbutton = "";
      htmlbutton +=
        '<button req-id="' +
        itemid +
        '" assigneduser="' +
        AssignedTo +
        '" index-value="' +
        indexofEdit +
        '" type="button" class="btn btn-default" id="serbtnUpdate">Update</button>';
      htmlbutton +=
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
      $("#divforbtn").html(htmlbutton);

      if (flgSystemAdmin)
        $(".UserDropdownSERPopup" + indexofEdit + "").attr("disabled", false);

      if (CrntUserID == AssignedTo)
        $(".StatusDropdownSERPopup" + indexofEdit + "").attr("disabled", false);
      //alert($(".UserDropdownSER"+indexofEdit+" option:selected").val());
    });

    $(document).on("click", ".GdsEdit", function () {
      var indexofEdit = $(this).attr("index-value");
      var itemid = $(this).attr("req-id");
      var AssignedTo = $(
        ".UserDropdownGDS" + indexofEdit + " option:selected"
      ).val();
      var Status = $(
        ".StatusDropdownGDS" + indexofEdit + " option:selected"
      ).val();

      var html = "";
      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">AssignedTo</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="UserDropdownGDSPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        Users +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">Status</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="statuspopup StatusDropdownGDSPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        statusHtml +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      html += '<div id="divfordatefield"></div>';

      $("#modalbodyEdit").html(html);
      $(".UserDropdownGDSPopup" + indexofEdit + "").val(AssignedTo);
      $(".StatusDropdownGDSPopup" + indexofEdit + "").val(Status);

      var htmlbutton = "";
      htmlbutton +=
        '<button req-id="' +
        itemid +
        '" assigneduser="' +
        AssignedTo +
        '" index-value="' +
        indexofEdit +
        '" type="button" class="btn btn-default" id="GdsbtnUpdate">Update</button>';
      htmlbutton +=
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
      $("#divforbtn").html(htmlbutton);

      if (flgSystemAdmin)
        $(".UserDropdownGDSPopup" + indexofEdit + "").attr("disabled", false);

      if (CrntUserID == AssignedTo)
        $(".StatusDropdownGDSPopup" + indexofEdit + "").attr("disabled", false);
    });

    $(document).on("click", ".SubEdit", function () {
      var indexofEdit = $(this).attr("index-value");
      var itemid = $(this).attr("req-id");
      var AssignedTo = $(
        ".UserDropdownSub" + indexofEdit + " option:selected"
      ).val();
      var Status = $(
        ".StatusDropdownSub" + indexofEdit + " option:selected"
      ).val();

      var html = "";
      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">AssignedTo</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="UserDropdownSubPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        Users +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">Status</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="StatusDropdownSubPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        statusHtml +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      $("#modalbodyEdit").html(html);
      $(".UserDropdownSubPopup" + indexofEdit + "").val(AssignedTo);
      $(".StatusDropdownSubPopup" + indexofEdit + "").val(Status);

      var htmlbutton = "";
      htmlbutton +=
        '<button req-id="' +
        itemid +
        '" assigneduser="' +
        AssignedTo +
        '" index-value="' +
        indexofEdit +
        '" type="button" class="btn btn-default" id="SubbtnUpdate">Update</button>';
      htmlbutton +=
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
      $("#divforbtn").html(htmlbutton);

      if (flgSystemAdmin)
        $(".UserDropdownSubPopup" + indexofEdit + "").attr("disabled", false);

      if (CrntUserID == AssignedTo)
        $(".StatusDropdownSubPopup" + indexofEdit + "").attr("disabled", false);
    });

    $(document).on("click", ".LeaseEdit", function () {
      var indexofEdit = $(this).attr("index-value");
      var itemid = $(this).attr("req-id");
      var AssignedTo = $(
        ".UserDropdownLease" + indexofEdit + " option:selected"
      ).val();
      var Status = $(
        ".StatusDropdownLease" + indexofEdit + " option:selected"
      ).val();

      var html = "";
      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">AssignedTo</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="UserDropdownLeasePopup' +
        indexofEdit +
        '" disabled="disabled">' +
        Users +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">Status</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="StatusDropdownLeasePopup' +
        indexofEdit +
        '" disabled="disabled">' +
        statusHtml +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      $("#modalbodyEdit").html(html);
      $(".UserDropdownLeasePopup" + indexofEdit + "").val(AssignedTo);
      $(".StatusDropdownLeasePopup" + indexofEdit + "").val(Status);

      var htmlbutton = "";
      htmlbutton +=
        '<button req-id="' +
        itemid +
        '" assigneduser="' +
        AssignedTo +
        '" index-value="' +
        indexofEdit +
        '" type="button" class="btn btn-default"  id="LeasebtnUpdate">Update</button>';
      htmlbutton +=
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
      $("#divforbtn").html(htmlbutton);

      if (flgSystemAdmin)
        $(".UserDropdownLeasePopup" + indexofEdit + "").attr("disabled", false);

      if (CrntUserID == AssignedTo)
        $(".StatusDropdownLeasePopup" + indexofEdit + "").attr(
          "disabled",
          false
        );
    });

    $(document).on("click", ".idppEdit", function () {
      var indexofEdit = $(this).attr("index-value");
      var itemid = $(this).attr("req-id");
      var AssignedTo = $(
        ".UserDropdownidpp" + indexofEdit + " option:selected"
      ).val();
      var Status = $(
        ".StatusDropdownidpp" + indexofEdit + " option:selected"
      ).val();

      var html = "";
      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">AssignedTo</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="UserDropdownidppPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        Users +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      html += '<div class="row goods-details">';
      html += '<div class="col-sm-3">';
      html += '<h5 class="goods-label">Status</h5></div>';
      html += '<div class="col-sm-1 text-center">:</div>';
      html += '<div class="col-sm-6">';
      html +=
        '<select class="StatusDropdownidppPopup' +
        indexofEdit +
        '" disabled="disabled">' +
        statusHtml +
        "<select>";
      html += "</div>";
      html += "</div></br>";

      $("#modalbodyEdit").html(html);
      $(".UserDropdownidppPopup" + indexofEdit + "").val(AssignedTo);
      $(".StatusDropdownidppPopup" + indexofEdit + "").val(Status);

      var htmlbutton = "";
      htmlbutton +=
        '<button req-id="' +
        itemid +
        '" assigneduser="' +
        AssignedTo +
        '" index-value="' +
        indexofEdit +
        '" type="button" class="btn btn-default"  id="idppbtnUpdate">Update</button>';
      htmlbutton +=
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
      $("#divforbtn").html(htmlbutton);

      if (flgSystemAdmin)
        $(".UserDropdownidppPopup" + indexofEdit + "").attr("disabled", false);

      if (CrntUserID == AssignedTo)
        $(".StatusDropdownidppPopup" + indexofEdit + "").attr(
          "disabled",
          false
        );
    });

    /* Save functionality */

    $(document).on("click", ".SerSave,#serbtnUpdate", function (e) {
      var itemid = $(this).attr("req-id");
      var indexofEdit = $(this).attr("index-value");
      var alreadyAssgnUsr = $(this).attr("AssignedUser");
      var AssignedUser = $(
        ".UserDropdownSERPopup" + indexofEdit + " option:selected"
      ).val();
      var ReqStatus = $(
        ".StatusDropdownSERPopup" + indexofEdit + " option:selected"
      ).val();

      if (AssignedUser != "Select") {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        $("#myModalEdit").modal("hide");

        var data;
        var statuschange = false;
        data = { AssignedTo1Id: AssignedUser };
        if (ReqStatus != "Select") {
          if (!ServiceRequest[indexofEdit].StatusSummary)
            ServiceRequest[indexofEdit].StatusSummary = "";

          var StatusSummary =
            ServiceRequest[indexofEdit].StatusSummary +
            "" +
            $(
              ".StatusDropdownSERPopup" + indexofEdit + " option:selected"
            ).text() +
            " by " +
            LoggedUserName +
            "," +
            moment($("#requestedDate").val(), "MM/DD/YYYY").format(
              "DD/MM/YYYY"
            ) +
            ";";
          if ($("#requestedDate").val()) {
            statuschange = true;
            let requestedDate = new Date(
              Date.parse(
                moment($("#requestedDate").val(), "MM/DD/YYYY").format(
                  "YYYY-MM-DD"
                )
              )
            ).toISOString();
            data = {
              AssignedTo1Id: AssignedUser,
              RequestStatusId: ReqStatus,
              statuschangedate: requestedDate,
              statusnotes: $("#txtNotes").val(),
              StatusSummary: StatusSummary,
            };
          } else {
            data = { AssignedTo1Id: AssignedUser, RequestStatusId: ReqStatus };
          }
        }

        if (statuschange)
          sendmailforstatuschange(
            $(".UserDropdownSERPopup" + indexofEdit + " option:selected").attr(
              "user-email"
            )
          );

        updaterequest(itemid, data, "ProcurementService", true);
      } else {
        alertify.error("Please Select Assignee");
      }
    });

    $(document).on("click", ".GdsSave,#GdsbtnUpdate", function () {
      var itemid = $(this).attr("req-id");
      var indexofEdit = $(this).attr("index-value");
      var alreadyAssgnUsr = $(this).attr("AssignedUser");
      var AssignedUser = $(
        ".UserDropdownGDSPopup" + indexofEdit + " option:selected"
      ).val();
      var ReqStatus = $(
        ".StatusDropdownGDSPopup" + indexofEdit + " option:selected"
      ).val();

      if (AssignedUser != "Select") {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        $("#myModalEdit").modal("hide");
        var statuschange = false;
        var data;
        data = { AssignedTo1Id: AssignedUser };

        if (ReqStatus != "Select") {
          if (!GoodsRequest[indexofEdit].StatusSummary)
            GoodsRequest[indexofEdit].StatusSummary = "";
          var StatusSummary =
            GoodsRequest[indexofEdit].StatusSummary +
            "" +
            $(
              ".StatusDropdownGDSPopup" + indexofEdit + " option:selected"
            ).text() +
            " by " +
            LoggedUserName +
            "," +
            moment($("#requestedDate").val(), "MM/DD/YYYY").format(
              "DD/MM/YYYY"
            ) +
            ";";
          if ($("#requestedDate").val()) {
            statuschange = true;
            let requestedDate = new Date(
              Date.parse(
                moment($("#requestedDate").val(), "MM/DD/YYYY").format(
                  "YYYY-MM-DD"
                )
              )
            ).toISOString();
            data = {
              AssignedTo1Id: AssignedUser,
              RequestStatusId: ReqStatus,
              statuschangedate: requestedDate,
              statusnotes: $("#txtNotes").val(),
              StatusSummary: StatusSummary,
            };
          } else {
            data = { AssignedTo1Id: AssignedUser, RequestStatusId: ReqStatus };
          }
        }
        if (statuschange)
          sendmailforstatuschange(
            $(".UserDropdownGDSPopup" + indexofEdit + " option:selected").attr(
              "user-email"
            )
          );
        updaterequest(itemid, data, "ProcurementGoods", true);
      } else {
        alertify.error("Please Select Assignee");
      }
    });

    $(document).on("click", ".SubSave,#SubbtnUpdate", function () {
      var itemid = $(this).attr("req-id");
      var indexofEdit = $(this).attr("index-value");
      var alreadyAssgnUsr = $(this).attr("AssignedUser");
      var AssignedUser = $(
        ".UserDropdownSubPopup" + indexofEdit + " option:selected"
      ).val();
      var ReqStatus = $(
        ".StatusDropdownSubPopup" + indexofEdit + " option:selected"
      ).val();

      if (AssignedUser != "Select") {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        $("#myModalEdit").modal("hide");
        var statuschange = false;
        var data;
        data = { AssignedTo1Id: AssignedUser };

        if (ReqStatus != "Select") {
          if (!LocalSubsidyItems[indexofEdit].StatusSummary)
            LocalSubsidyItems[indexofEdit].StatusSummary = "";
          var StatusSummary =
            LocalSubsidyItems[indexofEdit].StatusSummary +
            "" +
            $(
              ".StatusDropdownSubPopup" + indexofEdit + " option:selected"
            ).text() +
            " by " +
            LoggedUserName +
            "," +
            moment($("#requestedDate").val(), "MM/DD/YYYY").format(
              "DD/MM/YYYY"
            ) +
            ";";
          if ($("#requestedDate").val()) {
            statuschange = true;
            let requestedDate = new Date(
              Date.parse(
                moment($("#requestedDate").val(), "MM/DD/YYYY").format(
                  "YYYY-MM-DD"
                )
              )
            ).toISOString();
            data = {
              AssignedTo1Id: AssignedUser,
              RequestStatusId: ReqStatus,
              statuschangedate: requestedDate,
              statusnotes: $("#txtNotes").val(),
              StatusSummary: StatusSummary,
            };
          } else {
            data = { AssignedTo1Id: AssignedUser, RequestStatusId: ReqStatus };
          }
        }
        if (statuschange)
          sendmailforstatuschange(
            $(".UserDropdownSubPopup" + indexofEdit + " option:selected").attr(
              "user-email"
            )
          );
        updaterequest(itemid, data, "LocalSubsidy", true);
      } else {
        alertify.error("Please Select Assignee");
      }
    });

    $(document).on("click", ".LeaseSave,#LeasebtnUpdate", function () {
      var itemid = $(this).attr("req-id");
      var indexofEdit = $(this).attr("index-value");
      var alreadyAssgnUsr = $(this).attr("AssignedUser");
      var AssignedUser = $(
        ".UserDropdownLeasePopup" + indexofEdit + " option:selected"
      ).val();
      var ReqStatus = $(
        ".StatusDropdownLeasePopup" + indexofEdit + " option:selected"
      ).val();

      if (AssignedUser != "Select") {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        $("#myModalEdit").modal("hide");
        var statuschange = false;
        var data;
        data = { AssignedTo1Id: AssignedUser };

        if (ReqStatus != "Select") {
          if (!LeaseAgreementItems[indexofEdit].StatusSummary)
            LeaseAgreementItems[indexofEdit].StatusSummary = "";
          var StatusSummary =
            LeaseAgreementItems[indexofEdit].StatusSummary +
            "" +
            $(
              ".StatusDropdownLeasePopup" + indexofEdit + " option:selected"
            ).text() +
            " by " +
            LoggedUserName +
            "," +
            moment($("#requestedDate").val(), "MM/DD/YYYY").format(
              "DD/MM/YYYY"
            ) +
            ";";
          if ($("#requestedDate").val()) {
            statuschange = true;
            let requestedDate = new Date(
              Date.parse(
                moment($("#requestedDate").val(), "MM/DD/YYYY").format(
                  "YYYY-MM-DD"
                )
              )
            ).toISOString();
            data = {
              AssignedTo1Id: AssignedUser,
              RequestStatusId: ReqStatus,
              statuschangedate: requestedDate,
              statusnotes: $("#txtNotes").val(),
              StatusSummary: StatusSummary,
            };
          } else {
            data = { AssignedTo1Id: AssignedUser, RequestStatusId: ReqStatus };
          }
        }
        if (statuschange)
          sendmailforstatuschange(
            $(
              ".UserDropdownLeasePopup" + indexofEdit + " option:selected"
            ).attr("user-email")
          );
        updaterequest(itemid, data, "LeaseAgreement", true);
      } else {
        alertify.error("Please Select Assignee");
      }
    });

    $(document).on("click", ".idppSave,#idppbtnUpdate", function () {
      var itemid = $(this).attr("req-id");
      var indexofEdit = $(this).attr("index-value");
      var alreadyAssgnUsr = $(this).attr("AssignedUser");
      var AssignedUser = $(
        ".UserDropdownidppPopup" + indexofEdit + " option:selected"
      ).val();
      var ReqStatus = $(
        ".StatusDropdownidppPopup" + indexofEdit + " option:selected"
      ).val();

      if (AssignedUser != "Select") {
        $(".loading-modal").addClass("active");
        $("body").addClass("body-hidden");
        $("#myModalEdit").modal("hide");
        var statuschange = false;
        var data;
        data = { AssignedTo1Id: AssignedUser };

        if (ReqStatus != "Select") {
          if (!IdppItems[indexofEdit].StatusSummary)
            IdppItems[indexofEdit].StatusSummary = "";
          var StatusSummary =
            IdppItems[indexofEdit].StatusSummary +
            "" +
            $(
              ".StatusDropdownidppPopup" + indexofEdit + " option:selected"
            ).text() +
            " by " +
            LoggedUserName +
            "," +
            moment($("#requestedDate").val(), "MM/DD/YYYY").format(
              "DD/MM/YYYY"
            ) +
            ";";
          if ($("#requestedDate").val()) {
            statuschange = true;
            let requestedDate = new Date(
              Date.parse(
                moment($("#requestedDate").val(), "MM/DD/YYYY").format(
                  "YYYY-MM-DD"
                )
              )
            ).toISOString();
            data = {
              AssignedTo1Id: AssignedUser,
              RequestStatusId: ReqStatus,
              statuschangedate: requestedDate,
              statusnotes: $("#txtNotes").val(),
              StatusSummary: StatusSummary,
            };
          } else {
            data = { AssignedTo1Id: AssignedUser, RequestStatusId: ReqStatus };
          }
        }
        if (statuschange)
          sendmailforstatuschange(
            $(".UserDropdownidppPopup" + indexofEdit + " option:selected").attr(
              "user-email"
            )
          );
        updaterequest(itemid, data, "IDPP", true);
      } else {
        alertify.error("Please Select Assignee");
      }
    });

    /*Followup funtionality*/
    $(document).on("click", ".Gdsfollowup", function () {
      var indexofEdit = $(this).attr("index-value");
      sendfollowup(
        $(".UserDropdownGDS" + indexofEdit + " option:selected").attr(
          "user-email"
        )
      );
    });
    $(document).on("click", ".servicefollowup", function () {
      var indexofEdit = $(this).attr("index-value");
      sendfollowup(
        $(".UserDropdownSER" + indexofEdit + " option:selected").attr(
          "user-email"
        )
      );
    });
    $(document).on("click", ".subsidyfollowup", function () {
      var indexofEdit = $(this).attr("index-value");
      sendfollowup(
        $(".UserDropdownSub" + indexofEdit + " option:selected").attr(
          "user-email"
        )
      );
    });
    $(document).on("click", ".Leasefollowup", function () {
      var indexofEdit = $(this).attr("index-value");
      sendfollowup(
        $(".UserDropdownLease" + indexofEdit + " option:selected").attr(
          "user-email"
        )
      );
    });
    $(document).on("click", ".idppfollowup", function () {
      var indexofEdit = $(this).attr("index-value");
      sendfollowup(
        $(".UserDropdownidpp" + indexofEdit + " option:selected").attr(
          "user-email"
        )
      );
    });

    /*datatable search*/
    $("#drpStatusforgoods").change(function () {
      if ($("#drpStatusforgoods option:selected").val() == "Select") {
        oTablegoods.column(7).search("").draw();
      } else {
        //oTable.column(4).search($("#drpStatus option:selected").text()).draw();
        oTablegoods
          .column(7)
          .search($("#drpStatusforgoods option:selected").val())
          .draw();
      }
    });

    $("#drpStatusforservice").change(function () {
      if ($("#drpStatusforservice option:selected").val() == "Select") {
        oTableservice.column(7).search("").draw();
      } else {
        //oTable.column(4).search($("#drpStatus option:selected").text()).draw();
        oTableservice
          .column(7)
          .search($("#drpStatusforservice option:selected").val())
          .draw();
      }
    });

    $("#drpStatusforsubsidy").change(function () {
      if ($("#drpStatusforsubsidy option:selected").val() == "Select") {
        oTablesubsidy.column(7).search("").draw();
      } else {
        //oTable.column(4).search($("#drpStatus option:selected").text()).draw();
        oTablesubsidy
          .column(7)
          .search($("#drpStatusforsubsidy option:selected").val())
          .draw();
      }
    });

    $("#drpStatusforlease").change(function () {
      if ($("#drpStatusforlease option:selected").val() == "Select") {
        oTablelease.column(7).search("").draw();
      } else {
        //oTable.column(4).search($("#drpStatus option:selected").text()).draw();
        oTablelease
          .column(7)
          .search($("#drpStatusforlease option:selected").val())
          .draw();
      }
    });

    $("#drpStatusforidpp").change(function () {
      if ($("#drpStatusforidpp option:selected").val() == "Select") {
        oTableidpp.column(7).search("").draw();
      } else {
        //oTable.column(4).search($("#drpStatus option:selected").text()).draw();
        oTableidpp
          .column(7)
          .search($("#drpStatusforidpp option:selected").val())
          .draw();
      }
    });

    /*Bind date field and notes field*/
    $(document).on("change", ".statuspopup", function () {
      $("#divfordatefield").html(htmlforstatuschange);
      $("#requestedDate").datepicker("setDate", new Date());
      $("#requestedDate").datepicker({
        autoclose: true,
        daysOfWeekDisabled: [5, 6],
      });
    });
  }

  /*remove add contact*/

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

async function LoadGoodsRequest() {
  await sp.web.lists
    .getByTitle("ProcurementGoods")
    .items.select(
      "ProjectName,ProjectNumber,ID,AVName/ID,Representative/ID,Specifications,RequestItem,PNForZAS,NameOfAV,AssignedTo1/Title,AssignedTo1/ID,RequestStatus/ID,RequestStatus/Title,Author/Title,Author/ID,Created,Modified,KompOutputNumber,kompPercent,isKompOutput,Specifications,ShortDesc,RequestItem,JOD,EUR,DeliveryTime,WarrantyTime,FullAddress,ContactPersonName,PersonEmail,PersonMobile,ProsoftNumber,Agreement,GoodsCategory,StatusSummary"
    )
    .orderBy("Modified", false)
    .expand("AssignedTo1,AVName,Representative,RequestStatus,Author")
    .top(5000)
    .get()
    .then((allItems: any[]) => {
      var goodsHTML = "";
      GoodsRequest = allItems;
      for (var index = 0; index < allItems.length; index++) {
        var assgnuser = "select";
        if (allItems[index].AssignedTo1)
          assgnuser = allItems[index].AssignedTo1.ID;
        //if(flgProcurementTeam||allItems[index].AVName.ID==CrntUserID||allItems[index].Representative.ID==CrntUserID)
        if (
          flgSystemAdmin ||
          isHOD ||isProcurementAdmin||
          flgProcurementTeam ||
          allItems[index].AVName.ID == CrntUserID ||
          CrntUserID == assgnuser ||
          CrntUserID == allItems[index].Author.ID
        ) {
          goodsHTML += "<tr>";
          goodsHTML += "<td>" + allItems[index].Modified + "</td>";
          goodsHTML += "<td>" + allItems[index].ProjectName + "</td>";
          goodsHTML += "<td>" + allItems[index].ProjectNumber + "</td>";
          goodsHTML += "<td>" + allItems[index].NameOfAV + "</td>";
          goodsHTML +=
            "<td>" +
            moment(allItems[index].Created).format("DD MMMM YYYY") +
            "</td>";
          goodsHTML +=
            '<td><select class="UserDropdownGDS' +
            index +
            '" disabled="disabled">' +
            Users +
            "<select></td>";
          goodsHTML +=
            '<td><select class="StatusDropdownGDS' +
            index +
            '" disabled="disabled">' +
            statusHtml +
            "<select></td>";

          if (allItems[index].RequestStatus)
            goodsHTML += "<td>" + allItems[index].RequestStatus.ID + "</td>";
          else goodsHTML += "<td>Select</td>";

          goodsHTML += "<td>";
          goodsHTML +=
            '<a href="#" req-id="' +
            allItems[index].ID +
            '" class="GdsdetailView" data-toggle="modal" data-target="#myModal"><span class="icon-action icon-view"></span></a>';
          if (flgSystemAdmin || CrntUserID == assgnuser||isProcurementAdmin) {
            if(isProcurementAdmin)
            {
              goodsHTML +='<a href="'+siteURL+'/SitePages/EditRequest.aspx?itemid='+allItems[index].ID+'&code=Goods"><span class="icon-action icon-edit"></span></a>';
            }
            else
            {
              goodsHTML +=
              '<a href="#" index-value=' +
              index +
              ' req-id="' +
              allItems[index].ID +
              '" class="GdsEdit" data-toggle="modal" data-target="#myModalEdit"><span class="icon-action icon-edit"></span></a>';
            //goodsHTML+='<a href="#" req-id="'+allItems[index].ID+'" AssignedUser='+assgnuser+' index-value='+index+' class="GdsSave"><span class="icon-action icon-save"></span></a>';
            }           
          }

          if (assgnuser != "select" && CrntUserID == allItems[index].Author.ID)
            goodsHTML +=
              '<a href="#" req-id="' +
              allItems[index].ID +
              '" AssignedUser=' +
              assgnuser +
              " index-value=" +
              index +
              ' class="Gdsfollowup"><span class="icon-action icon-followup"></span></a>';

          if (CrntUserID == allItems[index].Author.ID)
            goodsHTML +=
              "<a href=" +
              siteURL +
              "/SitePages/Vertical-Timeline.aspx?itemid=" +
              allItems[index].ID +
              '&code=pg><span class="icon-action icon-timeline"></span></a>';

          goodsHTML += "</td>";
          goodsHTML += "</tr>";
        }
      }
      $("#tblGoods").html("");
      $("#tblGoods").append(goodsHTML);

      for (var i = 0; i < allItems.length; i++) {
        if (allItems[i].AssignedTo1)
          $(".UserDropdownGDS" + i + "").val(allItems[i].AssignedTo1.ID);

        if (allItems[i].RequestStatus)
          $(".StatusDropdownGDS" + i + "").val(allItems[i].RequestStatus.ID);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadGoodsRequest");
    });

  oTablegoods = $("#Goods").DataTable({
    scrollX: true,
    autoWidth: false,
    bLengthChange: false,
    order: [[0, "desc"]],
    columnDefs: [
      {
        targets: [0, 7],
        visible: false,
      },
    ],
    // aoColumns: [
    //   { sWidth: "20%" },
    //   { sWidth: "20%" },
    //   { sWidth: "20%" },
    //   { sWidth: "20%" },
    //   { sWidth: "20%" },
    //   { sWidth: "20%" },
    //   { sWidth: "20%" },
    //   { sWidth: "20%" },
    // ],
  });
}

async function LoadServiceRequest() {
  await sp.web.lists
    .getByTitle("ProcurementService")
    .items.select(
      "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,ConsultingFirm,ChoicesOfServices,NameOfConsultingFirm,AreaOfActivity,TelephoneNumber,ContactPerson,EmailAddress,MobileNumber,FullAddress,ShortDesc,DurationFrom,DurationTo,JOD,EUR,isKompOutput,KompOutputNumber,kompPercent,NameOfBeneficiary,CostExtension,ContractNumber,PaymentStatus,StatusSummary,Agreement"
    )
    .orderBy("Modified", false)
    .expand("AssignedTo1,AVName,Representative,RequestStatus,Author")
    .top(5000)
    .get()
    .then((allItems: any[]) => {
      var serviceHTML = "";
      ServiceRequest = allItems;
      for (var index = 0; index < allItems.length; index++) {
        var assgnuser = "select";
        if (allItems[index].AssignedTo1)
          assgnuser = allItems[index].AssignedTo1.ID;
        //if(flgProcurementTeam||allItems[index].AVName.ID==CrntUserID||allItems[index].Representative.ID==CrntUserID)
        if (
          flgSystemAdmin ||
          isHOD ||isProcurementAdmin||
          flgProcurementTeam ||
          allItems[index].AVName.ID == CrntUserID ||
          CrntUserID == assgnuser ||
          CrntUserID == allItems[index].Author.ID
        ) {
          serviceHTML += "<tr>";
          serviceHTML += "<td>" + allItems[index].Modified + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectName + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectNumber + "</td>";
          serviceHTML += "<td>" + allItems[index].NameOfAV + "</td>";
          serviceHTML +=
            "<td>" +
            moment(allItems[index].Created).format("DD MMMM YYYY") +
            "</td>";
          serviceHTML +=
            '<td><select class="UserDropdownSER' +
            index +
            '" disabled="disabled">' +
            Users +
            "</select></td>";
          serviceHTML +=
            '<td><select class="StatusDropdownSER' +
            index +
            '" disabled="disabled">' +
            statusHtml +
            "</select></td>";
          if (allItems[index].RequestStatus)
            serviceHTML += "<td>" + allItems[index].RequestStatus.ID + "</td>";
          else serviceHTML += "<td>Select</td>";
          serviceHTML += "<td>";
          serviceHTML +=
            '<a href="#" req-id="' +
            allItems[index].ID +
            '" class="serdetailView" data-toggle="modal" data-target="#myModal"><span class="icon-action icon-view"></a>';
          if (flgSystemAdmin || CrntUserID == assgnuser||isProcurementAdmin) 
          {
            if(isProcurementAdmin)
            {
              serviceHTML +='<a href="'+siteURL+'/SitePages/EditRequest.aspx?itemid='+allItems[index].ID+'&code=Service"><span class="icon-action icon-edit"></span></a>';
            }
            else
            {
              serviceHTML +=
              '<a href="#" index-value=' +
              index +
              ' req-id="' +
              allItems[index].ID +
              '" class="SerEdit" data-toggle="modal" data-target="#myModalEdit"><span class="icon-action icon-edit"></a>';
            //serviceHTML+='<a href="#" req-id="'+allItems[index].ID+'" AssignedUser='+assgnuser+' index-value='+index+' class="SerSave"><span class="icon-action icon-save"></a>';
            }       
          }
          if (assgnuser != "select" && CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              '<a href="#" req-id="' +
              allItems[index].ID +
              '" AssignedUser=' +
              assgnuser +
              " index-value=" +
              index +
              ' class="servicefollowup"><span class="icon-action icon-followup"></span></a>';

          if (CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              "<a href=" +
              siteURL +
              "/SitePages/Vertical-Timeline.aspx?itemid=" +
              allItems[index].ID +
              '&code=sr><span class="icon-action icon-timeline"></span></a>';

          serviceHTML += "</td>";
          serviceHTML += "</tr>";
        }
      }
      $("#tblService").html("");
      $("#tblService").append(serviceHTML);

      for (var i = 0; i < allItems.length; i++) {
        if (allItems[i].AssignedTo1)
          $(".UserDropdownSER" + i + "").val(allItems[i].AssignedTo1.ID);

        if (allItems[i].RequestStatus)
          $(".StatusDropdownSER" + i + "").val(allItems[i].RequestStatus.ID);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadServiceRequest");
    });

  oTableservice = $("#Service").DataTable({
    scrollX: true,
    autoWidth: false,
    bLengthChange: false,
    order: [[0, "desc"]],
    columnDefs: [
      {
        targets: [0, 7],
        visible: false,
      },
    ],
  });
  $(".UserDropdown").attr("disabled", true);
}

async function LoadSubsidyRequest() {
  await sp.web.lists
    .getByTitle("LocalSubsidy")
    .items.select(
      "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,SubsidyCategory,isKompOutput,KompOutputNumber,kompPercent,JOD,EUR,ShortDesc,TelephoneNumber,ContactPerson,EmailAddress,MobileNumber,FullAddress,NameOfBeneficiary,DurationFrom,DurationTo,CoSoftNumber,PaymentStatus,CoSoftNumber,StatusSummary"
    )
    .orderBy("Modified", false)
    .expand("AssignedTo1,AVName,Representative,RequestStatus,Author")
    .top(5000)
    .get()
    .then((allItems: any[]) => {
      var serviceHTML = "";
      LocalSubsidyItems = allItems;
      for (var index = 0; index < allItems.length; index++) {
        var assgnuser = "select";
        if (allItems[index].AssignedTo1)
          assgnuser = allItems[index].AssignedTo1.ID;
        //if(flgProcurementTeam||allItems[index].AVName.ID==CrntUserID||allItems[index].Representative.ID==CrntUserID)
        if (
          flgSystemAdmin ||
          isHOD ||isProcurementAdmin||
          flgProcurementTeam ||
          allItems[index].AVName.ID == CrntUserID ||
          CrntUserID == assgnuser ||
          CrntUserID == allItems[index].Author.ID
        ) {
          serviceHTML += "<tr>";
          serviceHTML += "<td>" + allItems[index].Modified + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectName + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectNumber + "</td>";
          serviceHTML += "<td>" + allItems[index].NameOfAV + "</td>";
          serviceHTML +=
            "<td>" +
            moment(allItems[index].Created).format("DD MMMM YYYY") +
            "</td>";
          serviceHTML +=
            '<td><select class="UserDropdownSub' +
            index +
            '" disabled="disabled">' +
            Users +
            "</select></td>";
          serviceHTML +=
            '<td><select class="StatusDropdownSub' +
            index +
            '" disabled="disabled">' +
            statusHtml +
            "</select></td>";
          if (allItems[index].RequestStatus)
            serviceHTML += "<td>" + allItems[index].RequestStatus.ID + "</td>";
          else serviceHTML += "<td>Select</td>";
          serviceHTML += "<td>";
          serviceHTML +=
            '<a href="#" req-id="' +
            allItems[index].ID +
            '" class="subdetailView" data-toggle="modal" data-target="#myModal"><span class="icon-action icon-view"></a>';
          if (flgSystemAdmin || CrntUserID == assgnuser||isProcurementAdmin) {
            if(isProcurementAdmin)
            {
              serviceHTML +='<a href="'+siteURL+'/SitePages/EditRequest.aspx?itemid='+allItems[index].ID+'&code=Subsidy"><span class="icon-action icon-edit"></span></a>';
            }
            else
            {
              serviceHTML +=
              '<a href="#" index-value=' +
              index +
              ' req-id="' +
              allItems[index].ID +
              '" class="SubEdit" data-toggle="modal" data-target="#myModalEdit"><span class="icon-action icon-edit"></a>';
            //serviceHTML+='<a href="#" req-id="'+allItems[index].ID+'" AssignedUser='+assgnuser+' index-value='+index+' class="SubSave"><span class="icon-action icon-save"></a>';
            }
          }
          if (assgnuser != "select" && CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              '<a href="#" req-id="' +
              allItems[index].ID +
              '" AssignedUser=' +
              assgnuser +
              " index-value=" +
              index +
              ' class="subsidyfollowup"><span class="icon-action icon-followup"></span></a>';

          if (CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              "<a href=" +
              siteURL +
              "/SitePages/Vertical-Timeline.aspx?itemid=" +
              allItems[index].ID +
              '&code=ls><span class="icon-action icon-timeline"></span></a>';

          serviceHTML += "</td>";
          serviceHTML += "</tr>";
        }
      }
      $("#tblSubsidy").html("");
      $("#tblSubsidy").append(serviceHTML);

      for (var i = 0; i < allItems.length; i++) {
        if (allItems[i].AssignedTo1)
          $(".UserDropdownSub" + i + "").val(allItems[i].AssignedTo1.ID);

        if (allItems[i].RequestStatus)
          $(".StatusDropdownSub" + i + "").val(allItems[i].RequestStatus.ID);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadSubsidyRequest");
    });

  oTablesubsidy = $("#Subsidy").DataTable({
    scrollX: true,
    autoWidth: false,
    bLengthChange: false,
    order: [[0, "desc"]],
    columnDefs: [
      {
        targets: [0, 7],
        visible: false,
      },
    ],
  });
  $(".UserDropdown").attr("disabled", true);
}

async function LoadLeaseAgreement() {
  await sp.web.lists
    .getByTitle("LeaseAgreement")
    .items.select(
      "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,ShortDesc,LessorPapers,LessorName,EmailAddress,MobileNumber,FullAddress,TelephoneNumber,DurationFrom,DurationTo,NameOfConsultingFirm,ContactPerson,CoSoftNumber,LeaseAgreementCategory,StatusSummary"
    )
    .orderBy("Modified", false)
    .expand("AssignedTo1,AVName,Representative,RequestStatus,Author")
    .top(5000)
    .get()
    .then((allItems: any[]) => {
      var serviceHTML = "";
      LeaseAgreementItems = allItems;
      for (var index = 0; index < allItems.length; index++) {
        var assgnuser = "select";
        if (allItems[index].AssignedTo1)
          assgnuser = allItems[index].AssignedTo1.ID;
        //if(flgProcurementTeam||allItems[index].AVName.ID==CrntUserID||allItems[index].Representative.ID==CrntUserID)
        if (
          flgSystemAdmin ||
          isHOD ||isProcurementAdmin||
          flgProcurementTeam ||
          allItems[index].AVName.ID == CrntUserID ||
          CrntUserID == assgnuser ||
          CrntUserID == allItems[index].Author.ID
        ) {
          serviceHTML += "<tr>";
          serviceHTML += "<td>" + allItems[index].Modified + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectName + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectNumber + "</td>";
          serviceHTML += "<td>" + allItems[index].NameOfAV + "</td>";
          serviceHTML +=
            "<td>" +
            moment(allItems[index].Created).format("DD MMMM YYYY") +
            "</td>";
          serviceHTML +=
            '<td><select class="UserDropdownLease' +
            index +
            '" disabled="disabled">' +
            Users +
            "</select></td>";
          serviceHTML +=
            '<td><select class="StatusDropdownLease' +
            index +
            '" disabled="disabled">' +
            statusHtml +
            "</select></td>";
          if (allItems[index].RequestStatus)
            serviceHTML += "<td>" + allItems[index].RequestStatus.ID + "</td>";
          else serviceHTML += "<td>Select</td>";
          serviceHTML += "<td>";
          serviceHTML +=
            '<a href="#" req-id="' +
            allItems[index].ID +
            '" class="LeasedetailView" data-toggle="modal" data-target="#myModal"><span class="icon-action icon-view"></a>';
          if (flgSystemAdmin || CrntUserID == assgnuser||isProcurementAdmin) {
            if(isProcurementAdmin)
            {
              serviceHTML +='<a href="'+siteURL+'/SitePages/EditRequest.aspx?itemid='+allItems[index].ID+'&code=Lease"><span class="icon-action icon-edit"></span></a>';
            }
            else
            {
              serviceHTML +=
              '<a href="#" index-value=' +
              index +
              ' req-id="' +
              allItems[index].ID +
              '" class="LeaseEdit" data-toggle="modal" data-target="#myModalEdit"><span class="icon-action icon-edit"></a>';
            //serviceHTML+='<a href="#" req-id="'+allItems[index].ID+'" AssignedUser='+assgnuser+' index-value='+index+' class="LeaseSave"><span class="icon-action icon-save"></a>';
            }
          }
          if (assgnuser != "select" && CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              '<a href="#" req-id="' +
              allItems[index].ID +
              '" AssignedUser=' +
              assgnuser +
              " index-value=" +
              index +
              ' class="Leasefollowup"><span class="icon-action icon-followup"></span></a>';

          if (CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              "<a href=" +
              siteURL +
              "/SitePages/Vertical-Timeline.aspx?itemid=" +
              allItems[index].ID +
              '&code=la><span class="icon-action icon-timeline"></span></a>';

          serviceHTML += "</td>";
          serviceHTML += "</tr>";
        }
      }
      $("#tblLease").html("");
      $("#tblLease").append(serviceHTML);

      for (var i = 0; i < allItems.length; i++) {
        if (allItems[i].AssignedTo1)
          $(".UserDropdownLease" + i + "").val(allItems[i].AssignedTo1.ID);

        if (allItems[i].RequestStatus)
          $(".StatusDropdownLease" + i + "").val(allItems[i].RequestStatus.ID);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadLeaseRequest");
    });

  oTablelease = $("#Lease").DataTable({
    scrollX: true,
    autoWidth: false,
    bLengthChange: false,
    order: [[0, "desc"]],
    columnDefs: [
      {
        targets: [0, 7],
        visible: false,
      },
    ],
  });
  $(".UserDropdown").attr("disabled", true);
}

async function Loadidpp() {
  await sp.web.lists
    .getByTitle("idpp")
    .items.select(
      "ProjectName,ProjectNumber,ID,Author/Title,Author/ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified,ShortDesc,DurationFrom,DurationTo,StatusSummary"
    )
    .orderBy("Modified", false)
    .expand("AssignedTo1,AVName,Representative,RequestStatus,Author")
    .top(5000)
    .get()
    .then((allItems: any[]) => {
      var serviceHTML = "";
      IdppItems = allItems;
      for (var index = 0; index < allItems.length; index++) {
        var assgnuser = "select";
        if (allItems[index].AssignedTo1)
          assgnuser = allItems[index].AssignedTo1.ID;
        //if(flgProcurementTeam||allItems[index].AVName.ID==CrntUserID||allItems[index].Representative.ID==CrntUserID)
        if (
          flgSystemAdmin ||
          isHOD ||isProcurementAdmin||
          flgProcurementTeam ||
          allItems[index].AVName.ID == CrntUserID ||
          CrntUserID == assgnuser ||
          CrntUserID == allItems[index].Author.ID
        ) {
          serviceHTML += "<tr>";
          serviceHTML += "<td>" + allItems[index].Modified + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectName + "</td>";
          serviceHTML += "<td>" + allItems[index].ProjectNumber + "</td>";
          serviceHTML += "<td>" + allItems[index].NameOfAV + "</td>";
          serviceHTML +=
            "<td>" +
            moment(allItems[index].Created).format("DD MMMM YYYY") +
            "</td>";
          serviceHTML +=
            '<td><select class="UserDropdownidpp' +
            index +
            '" disabled="disabled">' +
            Users +
            "</select></td>";
          serviceHTML +=
            '<td><select class="StatusDropdownidpp' +
            index +
            '" disabled="disabled">' +
            statusHtml +
            "</select></td>";
          if (allItems[index].RequestStatus)
            serviceHTML += "<td>" + allItems[index].RequestStatus.ID + "</td>";
          else serviceHTML += "<td>Select</td>";
          serviceHTML += "<td>";
          serviceHTML +=
            '<a href="#" req-id="' +
            allItems[index].ID +
            '" class="idppdetailView" data-toggle="modal" data-target="#myModal"><span class="icon-action icon-view"></a>';
          if (flgSystemAdmin || CrntUserID == assgnuser||isProcurementAdmin) {
            if(isProcurementAdmin)
            {
              serviceHTML +='<a href="'+siteURL+'/SitePages/EditRequest.aspx?itemid='+allItems[index].ID+'&code=idpp"><span class="icon-action icon-edit"></span></a>';
            }
            else
            {
              serviceHTML +=
              '<a href="#" index-value=' +
              index +
              ' req-id="' +
              allItems[index].ID +
              '" class="idppEdit" data-toggle="modal" data-target="#myModalEdit"><span class="icon-action icon-edit"></a>';
            //serviceHTML+='<a href="#" req-id="'+allItems[index].ID+'" AssignedUser='+assgnuser+' index-value='+index+' class="idppSave"><span class="icon-action icon-save"></a>';
            }
            
          }
          if (assgnuser != "select" && CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              '<a href="#" req-id="' +
              allItems[index].ID +
              '" AssignedUser=' +
              assgnuser +
              " index-value=" +
              index +
              ' class="idppfollowup"><span class="icon-action icon-followup"></span></a>'; 
          if (CrntUserID == allItems[index].Author.ID)
            serviceHTML +=
              "<a href=" +
              siteURL +
              "/SitePages/Vertical-Timeline.aspx?itemid=" +
              allItems[index].ID +
              '&code=idpp><span class="icon-action icon-timeline"></span></a>';

          serviceHTML += "</td>";
          serviceHTML += "</tr>";
        }
      }
      $("#tblidpp").html("");
      $("#tblidpp").append(serviceHTML);

      for (var i = 0; i < allItems.length; i++) {
        if (allItems[i].AssignedTo1)
          $(".UserDropdownidpp" + i + "").val(allItems[i].AssignedTo1.ID);

        if (allItems[i].RequestStatus)
          $(".StatusDropdownidpp" + i + "").val(allItems[i].RequestStatus.ID);
      }

      $(".icon-followup").attr('title','Send Followup');
      $(".icon-view").attr('title','View');
      $(".icon-edit").attr('title','Edit');
      $(".icon-timeline").attr('title','Track');

    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadLeaseRequest");
    });

  oTableidpp = $("#idpp").DataTable({
    scrollX: true,
    autoWidth: false,
    bLengthChange: false,
    order: [[0, "desc"]],
    columnDefs: [
      {
        targets: [0, 7],
        visible: false,
      },
    ],
  });
  $(".UserDropdown").attr("disabled", true);
}

async function LoadProcurementTeam() {
  await sp.web.siteGroups
    .getByName("ProcurementTeam")
    .users.filter("Email eq '" + LoggedUserEmail + "'")
    .get()
    .then((allItems: any[]) => {
      if (allItems.length > 0) {
        flgProcurementTeam = true;
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadProcurementTeam");
    });
}

async function LoadAdminTeam() {
  await sp.web.siteGroups
    .getByName("SystemAdmin")
    .users.filter("Email eq '" + LoggedUserEmail + "'")
    .get()
    .then((allItems: any[]) => {
      if (allItems.length > 0) {
        flgSystemAdmin = true;
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadProcurementTeam");
    });
}

async function LoadProcurementTeamMembers() {
  await sp.web.siteGroups
    .getByName("ProcurementTeam")
    .users.get()
    .then((allItems: any[]) => {
      Procurementusers = allItems;
      if (allItems.length > 0) {
        Users += '<option value="Select">Select</option>';
        for (var i = 0; i < allItems.length; i++) {
          //Users+='<select class="UserDropdown">';
          Users +=
            '<option User-id="' +
            allItems[i].Id +
            '"  User-email="' +
            allItems[i].Email +
            '"  value="' +
            allItems[i].Id +
            '">' +
            allItems[i].Title +
            "</option>";
          //Users+='</select>';
        }
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadProcurementTeam");
    });
}

async function LoadHeadofProcurementTeamMembers() {
  await sp.web.siteGroups
    .getByName("HeadOfProcurement")
    .users.get()
    .then((allItems: any[]) => {
      isHOD = false;
      if (allItems.length > 0) {
        for (var i = 0; i < allItems.length; i++) {
          if (allItems[i].Id == CrntUserID) isHOD = true;
        }

        if (isHOD) $(".btnExcel").hide();
        else $(".btnHODExcel").hide();
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadHeadofProcurementTeamMembers");
    });
}

async function LoadProcurementAdmin() {
  await sp.web.siteGroups
    .getByName("ProcurementAdmin")
    .users.get()
    .then((allItems: any[]) => {
      if (allItems.length > 0) {
        for (var i = 0; i < allItems.length; i++) {
          if (allItems[i].Id == CrntUserID)
          isProcurementAdmin = true;
        }
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadProcurementAdmin");
    });
}

async function LoadStatus() {
  await sp.web.lists
    .getByTitle("Status")
    .items.get()
    .then((allItems: any[]) => {
      if (allItems.length > 0) {
        statusHtml += '<option value="Select">Select</option>';
        for (var i = 0; i < allItems.length; i++) {
          //Users+='<select class="UserDropdown">';
          statusHtml +=
            '<option value="' +
            allItems[i].Id +
            '">' +
            allItems[i].Title +
            "</option>";
          //Users+='</select>';
        }
      }
      $(
        "#drpStatusforgoods,#drpStatusforservice,#drpStatusforsubsidy,#drpStatusforlease,#drpStatusforidpp"
      ).html("");
      $(
        "#drpStatusforgoods,#drpStatusforservice,#drpStatusforsubsidy,#drpStatusforlease,#drpStatusforidpp"
      ).html(statusHtml);
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadProcurementTeam");
    });
}

async function LoadProjects() {
  await sp.web.lists
    .getByTitle("Projects")
    .items.select("Title,Id,ProjectAV/Title,ProjectAV/ID,Representative/ID")
    .expand("ProjectAV,Representative")
    .getAll()
    .then((allItems: any[]) => {
      for (var index = 0; index < allItems.length; index++) {
        var element = allItems[index];
        for (
          var indexForRep = 0;
          indexForRep < allItems[index].Representative.length;
          indexForRep++
        ) {
          if (CrntUserID == element.Representative[indexForRep].ID) {
            flgRepUser = true;
            $("#projectName").append(
              '<option Proj-Rp-id="' +
                element.Representative.ID +
                '" Proj-Av-id="' +
                element.ProjectAV.ID +
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
          }
        }
      }
      if (!flgRepUser) {
        $("#btnGoods").prop("disabled", true);
        $("#btnService").prop("disabled", true);
        $("#btnSubsidy").prop("disabled", true);
        $("#btnLease").prop("disabled", true);
        $("#btnIdpp").prop("disabled", true);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "LoadProjects");
    });
}

async function getLoggedInUserDetails() {
  await sp.web.currentUser
    .get()
    .then((allItems: any) => {
      if (allItems) {
        CrntUserID = allItems.Id;
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "getLoggedInUserDetails");
    });
}

async function getAllFolders() {
  await sp.web
    .getFolderByServerRelativeUrl("ProcurementServices")
    .expand("Files,Folders/Folders/Files")
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

async function updaterequest(itemid, data, listname, close) {
  $(".loading-modal").addClass("active");
  $("body").addClass("body-hidden");

  let lstupdate = await sp.web.lists.getByTitle(listname);
  lstupdate.items
    .getById(itemid)
    .update(data)
    .then((allItems: any) => {
      if (close) {
        $(".loading-modal").removeClass("active");
        $("body").removeClass("body-hidden");
        location.reload(true);
      }
    })
    .catch(function (error) {
      ErrorCallBack(error, "updategoodsrequest");
    });
}

async function sendfollowup(user) {
  $(".loading-modal").addClass("active");
  $("body").addClass("body-hidden");

  /*var element = document.getElementById('modalbody');
    var opt = {
      margin:       1,
      filename:     'myfile.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf(element,opt);*/

  // New Promise-based usage:
  //html2pdf().from(element).set(opt).save();

  // Old monolithic-style usage:
  //html2pdf(element,opt);
  /*html2pdf().from(element).set(opt).toPdf().output('datauristring').then(function (pdfAsString) {
      // The PDF has been converted to a Data URI string and passed to this function.
      // Use pdfAsString however you like (send as email, etc)!
  
        var arr = pdfAsString.split(',');
        pdfAsString= arr[1];    
  
  
          });*/

  /*const elem = document.getElementById('modalbody');
          html2pdf().from(elem).outputPdf('arraybuffer').then((result) => 
          {
          // handle your result here...
          UploadFile("NewRequests",result);
          
          });*/

  var maildetails = {
    To: [user],
    CC: [],
    Subject: "This email is about followup",
    Body: "Here is the body for folowup messaage",
  };
  await sendemail(maildetails);
}

async function sendmailforstatuschange(user) {
  var maildetails = {
    To: [user],
    CC: [],
    Subject: "This email is about...",
    Body: "Here is the body for status messaage",
  };
  await sendemail(maildetails);
}

async function sendemail(maildetails) {
  let emailProps: EmailProperties = maildetails;

  await sp.utility
    .sendEmail(emailProps)
    .then((_) => {
      $(".loading-modal").removeClass("active");
      $("body").removeClass("body-hidden");
      AlertMessage("Followup mail sent");
    })
    .catch(function (error) {
      ErrorCallBack(error, "sendemail");
    });
}

function AlertMessage(strMewssageEN) {
  alertify
    .alert()
    .setting({
      label: "OK",

      message: strMewssageEN,

      onok: function () {
        window.location.href = "#";
      },
    })
    .show()
    .setHeader("<em>Confirmation</em> ")
    .set("closable", false);
}

async function ErrorCallBack(error, methodname) {
  try {
    var errordata = {
      Error: error.message,
      MethodName: methodname,
      Title: "Dashboard",
    };
    await sp.web.lists
      .getByTitle("ErrorLog")
      .items.add(errordata)
      .then(function (data) {
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

async function UploadFile(FolderUrl, files) {
  //if(files.length>0)
  //{
  await sp.web
    .getFolderByServerRelativeUrl(FolderUrl)
    .files.add("testgin.pdf", files, true)
    .then(function (data) {
      AlertMessage("Goods Request is created in the System");
    })
    .catch(function (error) {
      ErrorCallBack(error, "uploadFiles");
    });
  //}
}

function generateExcel() {
  var excelSheetArray = [];
  const workbook = new Excel.Workbook();
  const ProcurementGoodsworksheet = workbook.addWorksheet("ProcurementGoods");
  const ProcurementServiceworksheet = workbook.addWorksheet(
    "ProcurementService"
  );

  const LocalSubsidyworksheet = workbook.addWorksheet("LocalSubsidy");

  const IDPPworksheet = workbook.addWorksheet("IDPP");

  const LeaseAgreementworksheet = workbook.addWorksheet("LeaseAgreement");
  excelSheetArray.push(
    ProcurementGoodsworksheet,
    ProcurementServiceworksheet,
    LocalSubsidyworksheet,
    IDPPworksheet,
    LeaseAgreementworksheet
  );

  var dobCol = ProcurementGoodsworksheet.getRow(1); // You can define a row like 2 , 3
  for (let i = 0; i < excelSheetArray.length; i++) {
    excelSheetArray[i].columns = [
      { header: "Project Name", key: "ProjectName", width: 25 },
      { header: "ProjectNumber", key: "ProjectNumber", width: 25 },
      { header: "NameOfAV", key: "NameOfAV", width: 25 },
      //{ header: "AVName", key: "AVName", width: 25 },
      { header: "PNForZAS", key: "PNForZAS", width: 25 },
      { header: "Assigned To", key: "AssignedTo1", width: 25 },
      { header: "Status", key: "RequestStatus", width: 25 },
    ];
    if (excelSheetArray[i].name == "ProcurementGoods")
      var loopArray = GoodsRequest;
    else if (excelSheetArray[i].name == "ProcurementService")
      var loopArray = ServiceRequest;
    else if (excelSheetArray[i].name == "LocalSubsidy")
      var loopArray = LocalSubsidyItems;
    else if (excelSheetArray[i].name == "IDPP") var loopArray = IdppItems;
    else if (excelSheetArray[i].name == "LeaseAgreement")
      var loopArray = LeaseAgreementItems;

    loopArray.forEach(function (item, index) {
      var AssignedToValue = "";
      var status = "";

      if (item.Representative) {
        var repValue: any = [];
        item.Representative.map((rep, i) => {
          repValue.push(rep.Title);
        });
      }
      if (item.AssignedTo1) {
        AssignedToValue = item.AssignedTo1.Title;
      }

      if (item.RequestStatus != undefined) {
        status = item.RequestStatus.Title;
      }

      excelSheetArray[i].addRow({
        ProjectName: item.ProjectName,
        ProjectNumber: item.ProjectNumber,
        NameOfAV: item.NameOfAV,
        //AVName: item.AVName.Title,
        PNForZAS: item.PNForZAS,
        AssignedToValue: AssignedToValue,
        RequestStatus: status,
      });
    });

    ["A1", "B1", "C1", "D1", "E1", "F1"].map((key) => {
      excelSheetArray[i].getCell(key).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" },
      };
    });
    excelSheetArray[i].eachRow({ includeEmpty: true }, function (cell, index) {
      cell._cells.map((key, index) => {
        excelSheetArray[i].getCell(key._address).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });
  }

  workbook.xlsx
    .writeBuffer()
    .then((buffer) =>
      FileSaver.saveAs(new Blob([buffer]), `${Date.now()}_Requests.xlsx`)
    )
    .catch((err) => console.log("Error writing excel export", err));
}

function generateHODExcel(array) {
  const HODworkbook = new Excel.Workbook();
  sheetNames = [];
  Procurementusers.map((user, i) => {
    var sheetName = user.Title;
    sheetName = HODworkbook.addWorksheet(sheetName);
    sheetNames.push(sheetName);
    sheetName.columns = [
      { header: "Project Name", key: "ProjectName", width: 25 },
      { header: "ProjectNumber", key: "ProjectNumber", width: 25 },
      { header: "NameOfAV", key: "NameOfAV", width: 25 },
      //{ header: "AVName", key: "AVName", width: 25 },
      { header: "PNForZAS", key: "PNForZAS", width: 25 },
      //{ header: "Representative", key: "Representative", width: 25 },
      { header: "Assign To", key: "AssignedTo1", width: 25 },
      { header: "Status", key: "RequestStatus", width: 25 },
    ];
  });

  sheetNames.map((sheet, i) => {
    var loopsheet = sheet;
    var loopedArray = array.filter((data) => {
      if (data.AssignedTo1) return data.AssignedTo1.Title == loopsheet.name;
    });

    loopedArray.forEach(function (item, index) {
      var AssignedToValue = "";
      var status = "";
      if (item.Representative) {
        var repValue: any = [];
        item.Representative.map((rep, i) => {
          repValue.push(rep.Title);
        });
      }
      if (item.AssignedTo1) {
        AssignedToValue = item.AssignedTo1.Title;
      }
      if (item.RequestStatus != undefined) {
        status = item.RequestStatus.Title;
      }
      loopsheet.addRow({
        ProjectName: item.ProjectName,
        ProjectNumber: item.ProjectNumber,
        NameOfAV: item.NameOfAV,
        //AVName: item.AVName.Title,
        PNForZAS: item.PNForZAS,
        //Representative:repValue.toString(),
        AssignedTo1: AssignedToValue,
        RequestStatus: status,
      });
    });

    ["A1", "B1", "C1", "D1", "E1", "F1"].map((key) => {
      loopsheet.getCell(key).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF00" },
      };
    });
    loopsheet.eachRow({ includeEmpty: true }, function (cell, index) {
      cell._cells.map((key, index) => {
        loopsheet.getCell(key._address).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });
  });

  HODworkbook.xlsx
    .writeBuffer()
    .then((buffer) =>
      FileSaver.saveAs(new Blob([buffer]), `${Date.now()}Users.xlsx`)
    )
    .catch((err) => console.log("Error writing excel export", err));
}
