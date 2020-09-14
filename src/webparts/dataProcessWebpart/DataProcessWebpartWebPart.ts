import { Version } from "@microsoft/sp-core-library";
import { SPComponentLoader } from "@microsoft/sp-loader";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";
import { sp } from "@pnp/sp";
import "alertifyjs";
import * as strings from "DataProcessWebpartWebPartStrings";
import "jquery";
import "../../ExternalRef/css/alertify.min.css";
import "../../ExternalRef/css/bootstrap-datepicker.min.css";
import "../../ExternalRef/css/style.css";

require("bootstrap");
SPComponentLoader.loadCss(
  "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
);
require("../../ExternalRef/js/bootstrap-datepicker.min.js");
var alertify: any = require("../../ExternalRef/js/alertify.min.js");

declare var $;
var list = {
  ProcurementGoods: "Procurement Goods",
  ShortlistDocuments: "ShortlistDocuments",
  NewspaperAdvertisements: "NewspaperAdvertisements",
  SpecificationsandQuantities: "Specifications and Quantities",
  EstimatedcostDocumentLibrary: "EstimatedcostDocumentLibrary",
  NonneutralSpecifications: "Nonneutral Specifications",
  GoodsOtherAttachments: "Goods Other Attachments",
  Projects: "Projects",
  ProjectAV: "ProjectAV",
};

var globalData = {
  Projects: [],
  ProjectAV: [],
  QuantityFiles: [],
  NonneutralSpecificationFile: null,
  Estimatedcost: null,
  ShortlistFile: null,
  NewspaperFile: null,
  OtherFiles: [],
};
var siteURL = "";
export interface IDataProcessWebpartWebPartProps {
  description: string;
}

export default class DataProcessWebpartWebPart extends BaseClientSideWebPart<
  IDataProcessWebpartWebPartProps
> {
  public onInit(): Promise<void> {
    return super.onInit().then((_) => {
      sp.setup({
        spfxContext: this.context,
      });
    });
  }
  private readonly newProperty = `<div class="row">
  <div class="col-sm-6">
    <div class="form-group">
      <label>Project name:<span class="star">*</span></label>
      <select class="form-control" id="projectName">
        <option value="">Select</option>
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
      <input class="form-control" type="text" id="AV" value="">
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
    <div class="col-sm-6">
    <div class="form-group">
    <input class="radio-stylish" id="neutralspec" type="radio" name="Specifications" value="Neutral Specifications" checked />
    <span class="radio-element"></span>
    <label class="stylish-label" for="neutralspec">Neutral Specifications</label>
    </div>
    </div>
	
	<div class="col-sm-6">
    <div class="form-group">
    <input class="radio-stylish" id="nonneutralspec" type="radio" name="Specifications" value="Nonneutral Specifications">
    <span class="radio-element"></span>
    <label class="stylish-label" for="nonneutralspec"> Nonneutral Specifications</label>
    </div>
  
    </div>
</div>

<div class="form-group" id="divnonneutralFile">
<div class="input-group">
<div class="custom-file">
  <input type="file" id="nonneutralFile" class="form-control custom-file-input">
  <label class="custom-file-label" for="nonneutralFile">Attach a justification</label>

  </div>
  </div>
</div>

<div class="row">
<div class="col-sm-6">
<div class="form-group">
  <label>JOD :<span class="star">*</span></label> 
  <input class="form-control" type="number" id="JOD" value="">
</div>
</div>
<div class="col-sm-6">

<div class="form-group">
  <label>EUR :<span class="star">*</span></label> 
  <input class="form-control" type="number" id="EUR" value="">
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
<div class="input-group">
<div class="custom-file">
<input type="file" id="costFile" class="custom-file-input">
<label class="custom-file-label" for="costFile">Choose File</label>
</div>
</div>
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
<div class="col-sm-10">
<div class="form-group">
  <label>Delivery Address :<span class="star">*</span></label>
  <textarea class="form-control" id="deliveryAddress"></textarea>
</div></div></div>


<h4>Contact Person for Delivery :</h4>
<div id="lst-contact-details">
<div class="contact-details contact-detail0">
<div class="row">
<div class="col-sm-3">
<div class="form-gorup">
  <label>Name :<span class="star">*</span></label>
  <input type="text" class="contactName form-control" value="">
</div>
</div>

<div class="col-sm-3">
<div class="form-gorup">
<label>Email :<span class="star">*</span></label> <input type="email" class="contactEmail form-control" value="">
</div>
</div>

<div class="col-sm-3">
<div class="form-gorup">
<label>Phone number :<span class="star">*</span></label> <input type="text" class="contactPhoneNumber form-control" value="">
</div>
</div>

<div class="col-sm-3">
<a class="remove-contact" data-class="contact-detail0">Remove</a>
</div>
</div>
</div>
</div>
<div class="form-group">
<input class="btn btn-primary" type="button" id="btnContact" value="Add contact">
</div>
<div class="form-group">
<label>Other attachments :</label>
<div class="input-group">      
<div class="custom-file">
<input type="file" name="myFile" id="otherAttachments" multiple class="custom-file-input">
<label class="custom-file-label" for="otherAttachments">Choose File</label>
</div>
</div><span id="otherAttachmentFiles"></span></div>
<div class="row">
<div class="col-sm-6">
<div class="form-gorup" id="spanKOMP">
<label >KOMP :</label> <input type="text" id="komp" value="" class="form-control">
</div>
</div>
</div>
<div class="form-group" id='btnfinal'>
    <input class="btn btn-primary" type="button" id="btnSubmit" value="Submit">
</div>`;
  public render(): void {
    var siteURL = this.context.pageContext.site.absoluteUrl;

    this.domElement.innerHTML = this.newProperty;
    $("#requestedDeliveryTime").datepicker({ autoclose: true });

    $("#nonneutralFile,#costFile,#fileShortlist,#newspaperFile").change(
      function () {
        if ($(this).val()) {
          $(this)
            .parent(".custom-file")
            .find(".custom-file-label")
            .text(
              $(this)
                .val()
                .replace(/C:\\fakepath\\/i, "")
            );
        } else {
          alertify.set("notifier", "position", "top-right");
          alertify.error("Please select file");
        }
      }
    );

    sp.web.lists
      .getByTitle(list.Projects)
      .items.getAll()
      .then((allItems: any[]) => {
        globalData.Projects = allItems;
        for (var index = 0; index < allItems.length; index++) {
          var element = allItems[index];
          $("#projectName").append(
            '<option proj-id="' +
              element.Id +
              '" value="' +
              element.Title +
              '">' +
              element.Title +
              "</option>"
          );
        }
      });

    sp.web.lists
      .getByTitle(list.ProjectAV)
      .items.getAll()
      .then((allItems: any[]) => {
        globalData.ProjectAV = allItems;
      });

    $("#projectName").on("change", function () {
      if (
        $("#projectName").val() == "MWR II" ||
        $("#projectName").val() == "RWU II"
      ) {
        $("#spanKOMP").show();
      } else {
        $("#komp").val("");
        $("#spanKOMP").hide();
      }
      var projId = $("#projectName option:selected").attr("proj-id");
      var avs = globalData.ProjectAV.filter((c) => c.ProjectId == projId);
      if (avs.length > 0) {
        $("#pnForZAS").val(avs[0].Title);
      }
    });

    $("#fileQuantities").on("change", function () {
      if ($(this)[0].files.length > 0) {
        for (let index = 0; index < $(this)[0].files.length; index++) {
          const file = $(this)[0].files[index];
          globalData.QuantityFiles.push(file);
          $("#quantityFiles").append("<p>" + file.name + "</p>");
        }
        $(this).val("");
      }
    });

    for (let index = 0; index <= 20; index++) {
      $("#requestedWarrantyTime").append(
        '<option value="' + index + '">' + index + "</option>"
      );
    }

    $("#divnonneutralFile").hide();
    $("#divcostFile").hide();
    $("#spanKOMP").hide();

    $("input[name='Specifications']").on("change", function () {
      if (
        $("input[name='Specifications']:checked").val() ==
        "Nonneutral Specifications"
      ) {
        $("#divnonneutralFile").show();
      } else {
        $("#divnonneutralFile").hide();
      }
    });

    $("#nonneutralFile").on("change", function () {
      if ($(this)[0].files.length > 0) {
        const file = $(this)[0].files[0];
        globalData.NonneutralSpecificationFile = file;
      } else {
        globalData.NonneutralSpecificationFile = null;
      }
    });

    $("#chkMoreItem").on("change", function () {
      if ($(this).prop("checked")) {
        $("#divcostFile").show();
      } else {
        $("#divcostFile").hide();
      }
    });

    $("#costFile").on("change", function () {
      if ($(this)[0].files.length > 0) {
        const file = $(this)[0].files[0];
        globalData.ShortlistFile = file;
      } else {
        globalData.ShortlistFile = null;
      }
    });

    $("#fileShortlist").on("change", function () {
      if ($(this)[0].files.length > 0) {
        const file = $(this)[0].files[0];
        globalData.Estimatedcost = file;
      } else {
        globalData.Estimatedcost = null;
      }
    });

    $("#newspaperFile").on("change", function () {
      if ($(this)[0].files.length > 0) {
        const file = $(this)[0].files[0];
        globalData.NewspaperFile = file;
      } else {
        globalData.NewspaperFile = null;
      }
    });

    $("#EUR").on("blur", function () {
      if ($("#EUR").val() > 20000) {
        globalData.Estimatedcost = null;
        $("#fileShortlist").val("");
        $("#fileShortlistFileName").text("Choose File");
        $("#fileShortlist").prop("disabled", true);
      } else {
        $("#fileShortlist").prop("disabled", false);
      }
    });

    $("#otherAttachments").on("change", function () {
      if ($(this)[0].files.length > 0) {
        for (let index = 0; index < $(this)[0].files.length; index++) {
          const file = $(this)[0].files[index];
          globalData.OtherFiles.push(file);
          $("#otherAttachmentFiles").append("<p>" + file.name + "</p>");
        }
        $(this).val("");
      }
    });

    function addContact() {
      if ($(".contact-details").length < 3) {
        var newcontact = `<div class="contact-details clsname">
        <div class="row">
        <div class="col-sm-3">
        <div class="form-group">
        <label>Name :<span class="star">*</span></label> <input type="text" class="contactName form-control" value=""></div></div>
        <div class="col-sm-3"><div class="form-group">
        <label>Email :<span class="star">*</span></label> <input type="email" class="contactEmail form-control" value=""></div></div>
        <div class="col-sm-3"><div class="form-group">
        <label>Phone number :<span class="star">*</span></label> <input type="text" class="contactPhoneNumber form-control" value=""></div></div><div class="col-sm-3">removetag</div></div>
        </div>`;
        var clsname = "contact-detail" + $(".contact-details").length;
        newcontact = newcontact.replace("clsname", clsname);
        newcontact = newcontact.replace(
          "removetag",
          '<a class="remove-contact" data-class="' + clsname + '">Remove</a>'
        );
        $("#lst-contact-details").append(newcontact);
      }
      if ($(".contact-details").length == 3) {
        $("#btnContact").hide();
      } else {
        $("#btnContact").show();
      }
    }

    $(document).on("click", "#btnContact", function () {
      addContact();
    });

    $(document).on("click", ".remove-contact", function () {
      $("#btnContact").show();
      var clsname = $(this).attr("data-class");
      $("." + clsname).remove();
      if ($(".contact-details").length == 0) {
        addContact();
      }
    });

    $("#btnSubmit").on("click", function () {
      if (!$("#projectName").val()) {
        // alert('Project name is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("Project name is required");
        $("#projectName").focus();
        return;
      }
      if (!$("#projectNumber").val()) {
        // alert('Project number is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("Project number is required");
        $("#projectNumber").focus();
        return;
      }
      if (!$("#pnForZAS").val()) {
        // alert('PN for ZAS number is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("PN for ZAS number is required");
        $("#pnForZAS").focus();
        return;
      }
      if (!$("#shortDescription").val()) {
        //alert('Short Description is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("Short Description is required");
        $("#shortDescription").focus();
        return;
      }
      if (globalData.QuantityFiles.length == 0) {
        // alert('Specifications and Quantities must contain atleast one document');
        alertify.set("notifier", "position", "top-right");
        alertify.error(
          "Specifications and Quantities must contain atleast one document"
        );
        return;
      }
      if (
        $("input[name='Specifications']:checked").val() ==
        "Nonneutral Specifications"
      ) {
        if (!globalData.NonneutralSpecificationFile) {
          //alert('Nonneutral Specifications must contain justification attachment');
          alertify.set("notifier", "position", "top-right");
          alertify.error(
            "Nonneutral Specifications must contain justification attachment"
          );
          return;
        }
      }
      if (!$("#JOD").val()) {
        //  alert('JOD is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("JOD is required");
        $("#JOD").focus();
        return;
      }
      if (!$("#EUR").val()) {
        // alert('EUR is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("EUR is required");
        $("#EUR").focus();
        return;
      }
      if ($("#chkMoreItem:checked").val()) {
        if (!globalData.ShortlistFile) {
          // alert('Estimate cost attachment is empty');
          alertify.set("notifier", "position", "top-right");
          alertify.error("Estimate cost attachment is empty");
          return;
        }
      }
      if ($("#EUR").val() > 2000) {
        if ($("#newspaperFile")[0].files.length == 0) {
          // alert('Newspaper advertisement required a document');
          alertify.set("notifier", "position", "top-right");
          alertify.error("Newspaper advertisement required a document");
          $("#newspaperFile").focus();
          return;
        }
      }
      if (!$("#requestedDeliveryTime").val()) {
        //alert('Requested Delivery Time is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("Requested Delivery Time is required");
        $("#requestedDeliveryTime").focus();
        return;
      }
      if (!$("#deliveryAddress").val()) {
        // alert('Delivery address is required');
        alertify.set("notifier", "position", "top-right");
        alertify.error("Delivery address is required");
        $("#deliveryAddress").focus();
        return;
      }
      for (let index = 0; index < $(".contact-details").length; index++) {
        if (!$(".contactName")[index].value) {
          // alert('Contact name is required');
          alertify.set("notifier", "position", "top-right");
          alertify.error("Contact name is required");
          $(".contactName:eq(" + index + ")").focus();
          return;
        }
        if (!$(".contactEmail")[index].value) {
          // alert('Contact email is required');
          alertify.set("notifier", "position", "top-right");
          alertify.error("Contact email is required");
          $(".contactEmail:eq(" + index + ")").focus();
          return;
        }
        if (!$(".contactPhoneNumber")[index].value) {
          // alert('Phone number is required');
          alertify.set("notifier", "position", "top-right");
          alertify.error("Phone number is required");
          $(".contactPhoneNumber:eq(" + index + ")").focus();
          return;
        }
      }

      if (
        $("#projectName").val() == "MWR II" ||
        $("#projectName").val() == "RWU II"
      ) {
        if (!$("#komp").val()) {
          // alert('KOMP is required');
          alertify.set("notifier", "position", "top-right");
          alertify.error("KOMP is required");
          $("#komp").focus();
          return;
        }
      }

      var objModel = {
        Title: "Procurement Data",
        ProjectName: $("#projectName").val(),
        ProjectNumber: $("#projectNumber").val(),
        PNforZAS: $("#pnForZAS").val(),
        NameofAV: null,
        ShortDescription: $("#shortDescription").val(),
        Specifications: "",
        justification: "",
        EstimatedcostJOD: $("#JOD").val(),
        EstimatedcostEUR: $("#EUR").val(),
        EstimatedcostDocURL: "",
        ShortlistDocURL: "",
        NewsPaperAdvertisementDocURL: "",
        RequestedWarrantyTime: $("#requestedWarrantyTime").val(),
        RequestedDeliveryTime: $("#requestedDeliveryTime").val(),
        DeliveryAddress: $("#deliveryAddress").val(),
        KOMPOutput: $("#komp").val(),
      };

      for (let index = 0; index < $(".contact-details").length; index++) {
        objModel["ContactName" + (index + 1)] = $(".contactName")[index].value;
        objModel["ContactEmail" + (index + 1)] = $(".contactEmail")[
          index
        ].value;
        objModel["ContactPhone" + (index + 1)] = $(".contactPhoneNumber")[
          index
        ].value;
      }

      sp.web.lists
        .getByTitle(list.ProcurementGoods)
        .items.add(objModel)
        .then((response) => {
          if (globalData.QuantityFiles) {
            objModel.Specifications =
              siteURL +
              "/" +
              list.SpecificationsandQuantities +
              "/" +
              response.data.Id;
          }

          if (globalData.NonneutralSpecificationFile) {
            objModel.justification =
              siteURL +
              "/" +
              list.NonneutralSpecifications +
              "/" +
              response.data.Id;
          }

          if (globalData.Estimatedcost) {
            objModel.EstimatedcostDocURL =
              siteURL +
              "/" +
              list.EstimatedcostDocumentLibrary +
              "/" +
              response.data.Id;
          }

          if (globalData.ShortlistFile) {
            objModel.ShortlistDocURL =
              siteURL + "/" + list.ShortlistDocuments + "/" + response.data.Id;
          }

          if (globalData.NewspaperFile) {
            objModel.NewsPaperAdvertisementDocURL =
              siteURL +
              "/" +
              list.NewspaperAdvertisements +
              "/" +
              response.data.Id;
          }

          objModel["Id"] = response.data.Id;

          sp.web.lists
            .getByTitle(list.ProcurementGoods)
            .items.getById(response.data.Id)
            .update(objModel)
            .then(function (result) {
              uploadSpecificationsandQuantities(response.data.Id + "");
            });
        });
    });

    function uploadSpecificationsandQuantities(id) {
      if (globalData.QuantityFiles.length > 0) {
        uploadSpecifications(0, id);
      } else {
        uploadNonneutralSpecificationFile(id);
      }
    }

    function uploadSpecifications(index, id) {
      var file = globalData.QuantityFiles[index];

      sp.web
        .getFolderByServerRelativePath(list.SpecificationsandQuantities)
        .folders.add(id)
        .then(function (result) {
          result.folder.files
            .add(file.name, file, true)
            .then(function (result) {
              result.file.listItemAllFields.get().then((listItemAllFields) => {
                sp.web.lists
                  .getByTitle(list.SpecificationsandQuantities)
                  .items.getById(listItemAllFields.Id)
                  .update({ ProcurementId: id })
                  .then(function (result) {
                    if (index < globalData.QuantityFiles.length - 1) {
                      index++;
                      uploadSpecifications(index, id);
                    } else {
                      uploadNonneutralSpecificationFile(id);
                    }
                  });
              });
            });
        });
    }

    function uploadNonneutralSpecificationFile(id) {
      if (globalData.NonneutralSpecificationFile) {
        commonUpload(
          list.NonneutralSpecifications,
          globalData.NonneutralSpecificationFile,
          id,
          function () {
            uploadEstimatedcostFile(id);
          }
        );
      } else {
        uploadEstimatedcostFile(id);
      }
    }

    function uploadEstimatedcostFile(id) {
      if (globalData.Estimatedcost) {
        commonUpload(
          list.EstimatedcostDocumentLibrary,
          globalData.Estimatedcost,
          id,
          function () {
            uploadShortlist(id);
          }
        );
      } else {
        uploadShortlist(id);
      }
    }

    function uploadShortlist(id) {
      if (globalData.ShortlistFile) {
        commonUpload(
          list.ShortlistDocuments,
          globalData.ShortlistFile,
          id,
          function () {
            uploadNewspaperFile(id);
          }
        );
      } else {
        uploadNewspaperFile(id);
      }
    }

    function uploadNewspaperFile(id) {
      if (globalData.NewspaperFile) {
        commonUpload(
          list.NewspaperAdvertisements,
          globalData.NewspaperFile,
          id,
          function () {
            otherFiles(id);
          }
        );
      } else {
        otherFiles(id);
      }
    }

    function otherFiles(id) {
      if (globalData.OtherFiles && globalData.OtherFiles.length > 0) {
        uploadOtherFiles(0, id);
      } else {
        alertify
          .alert("Data save successfully", function () {
            location.href = siteURL;
          })
          .setHeader("Success")
          .set("closable", false);
        // alert('Data save successfully');
      }
    }

    function uploadOtherFiles(index, id) {
      var file = globalData.OtherFiles[index];

      sp.web
        .getFolderByServerRelativePath(list.GoodsOtherAttachments)
        .folders.add(id)
        .then(function (result) {
          result.folder.files
            .add(file.name, file, true)
            .then(function (result) {
              result.file.listItemAllFields.get().then((listItemAllFields) => {
                sp.web.lists
                  .getByTitle(list.GoodsOtherAttachments)
                  .items.getById(listItemAllFields.Id)
                  .update({ ProcurementId: id })
                  .then(function (result) {
                    if (index < globalData.OtherFiles.length - 1) {
                      index++;
                      uploadOtherFiles(index, id);
                    } else {
                      //alert('Data save successfully');
                      alertify
                        .alert("Data save successfully", function () {
                          location.href = siteURL;
                        })
                        .setHeader("Success")
                        .set("closable", false);
                    }
                  });
              });
            });
        });
    }

    function commonUpload(listName, file, id, callback) {
      sp.web
        .getFolderByServerRelativePath(listName)
        .folders.add(id)
        .then(function (result) {
          result.folder.files
            .add(file.name, file, true)
            .then(function (result) {
              result.file.listItemAllFields.get().then((listItemAllFields) => {
                sp.web.lists
                  .getByTitle(listName)
                  .items.getById(listItemAllFields.Id)
                  .update({ ProcurementId: id })
                  .then(function (result) {
                    callback();
                  });
              });
            });
        });
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
