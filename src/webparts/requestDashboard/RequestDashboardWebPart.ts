import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { escape, each } from '@microsoft/sp-lodash-subset';

import styles from './RequestDashboardWebPart.module.scss';
import * as strings from 'RequestDashboardWebPartStrings';

import { SPComponentLoader } from "@microsoft/sp-loader";

import 'jquery';
import * as moment from 'moment';
import 'datatables';
import { sp } from "@pnp/sp";
import '../../ExternalRef/css/style.css';
import '../../ExternalRef/css/alertify.min.css';
import '../../ExternalRef/css/bootstrap-datepicker.min.css';
import '../../ExternalRef/js/bootstrap-datepicker.min.js';
import '../../ExternalRef/js/bootstrap.min.js';
import '../../../node_modules/datatables/media/css/jquery.dataTables.min.css';
var alertify: any = require('../../ExternalRef/js/alertify.min.js');

SPComponentLoader.loadCss("https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css");

declare var $;
var flgProcurementTeam=false;
var flgSystemAdmin=false;
var LoggedUserEmail='';
var CrntUserID='';
var GoodsRequest=[];
var ServiceRequest=[];
var ProcurementServiceFiles=[];
var filename='';
var siteURL='';
var Users='';
var statusHtml='';
var flgRepUser=false;

export interface IRequestDashboardWebPartProps {
  description: string;
}

export default class RequestDashboardWebPart extends BaseClientSideWebPart <IRequestDashboardWebPartProps> {

  public onInit(): Promise<void> {
    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context
      });
    });
  }
  
  public render(): void 
  { 
    LoggedUserEmail=this.context.pageContext.user.email;
    siteURL = this.context.pageContext.site.absoluteUrl;   
    this.domElement.innerHTML = `
    

    <div class="loading-modal"> 
    <div class="spinner-border" role="status"> 
    <span class="sr-only">Loading...</span>
    </div>
    </div>

    <ul class="nav nav-tabs">
    <li class="active"><a href="#home" data-toggle="tab">Service Request</a></li>
    <li><a href="#menu1" data-toggle="tab"> Goods Request</a></li>
    </ul>

    <div class='tab-content'> <div id='home' class='tab-pane fade in active tab-panel'>
 
    <div class='btnDiv'>
    <div>
    <input class="btn btn-primary" type='button' id='btnService' value='Create Service Request'>
    </div>
    </div>
   
    <div id='ServiceTable'>
    <table id="Service"  style="width:100%">
    <thead>
    <tr>
    <th>Id</th>
    <th>Project Name</th>
    <th>Project Number</th>
    <th>Name Of AV</th>
    <th>Date of Request</th>
    <th>Assigned To</th>
    <th>Status</th>
    <th>Details</th>
    </tr>
    </thead>
    <tbody id='tblService'>
    </tbody>
    </table>
    </div>  </div> <div id='menu1' class='tab-pane fade tab-panel'>    
    
    <div class='btnDiv'> 
    <div>
    <input class="btn btn-primary" type='button' id='btnGoods' value='Create Goods Request'>
    </div>
    </div>
    
    <div id='GoodsTable'>
    <table id="Goods" style="width:100%">
    <thead>
    <tr>
    <th>Id</th>
    <th>Project Name</th>
    <th>Project Number</th>
    <th>Name Of AV</th>
    <th>Date of Request</th>
    <th>Assigned To</th>
    <th>Status</th>
    <th>Details</th>
    </tr>
    </thead>
    <tbody id='tblGoods'>
    </tbody>
    </table>
    </div> </div> </div>


    
    




    <div class="modal fade" id="myModal" role="dialog">
    <div class="modal-dialog">
    
      <!-- Modal content-->
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">&times;</button>
          <h4 class="modal-title">Goods and Service</h4>
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
  
</div>

    `;

    //$('#GoodsTable').hide();
    
    getLoggedInUserDetails();
    LoadAdminTeam();
    getAllFolders();
    LoadProcurementTeamMembers();
    LoadStatus();
    LoadProjects();
    LoadProcurementTeam();
    LoadGoodsRequest();
    LoadServiceRequest();
    

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

    $('#btnService').click(function()
    {
      location.href = siteURL+'/SitePages/NewServiceRequest.aspx';
    });
    
    $('#btnGoods').click(function()
    {
      location.href = siteURL+'/SitePages/NewGoodsRequest.aspx';
    });

    $(document).on('click','.GdsdetailView',function()
    {
      
      var that=$(this);
      var index;
      var gdsID="GD-"+that.attr('req-id');//Ref Id Of goods is like GD-1
      GoodsRequest.forEach(function(val,key)
      {
          if(val.ID==that.attr('req-id'))
          {
            index=key;
          }
      });

      let arrFiles=[];
      

      // arrFiles.push({'Name':'Quantities','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Quantities','Files':[]});
      arrFiles.push({'Name':'ShortList','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'NewsAdvertisement','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Others','Files':[]});
      arrFiles.push({'Name':'CostFile','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'NeutralSpecfication','FileName':'N/A','FileURl':'N/A'});

      $.each(arrFiles,function(key,val)
      {
        for(var i=0;i<ProcurementServiceFiles['Folders'].length;i++)
        {
            if(ProcurementServiceFiles['Folders'][i].Name==val.Name)
            {
              for(var j=0;j<ProcurementServiceFiles['Folders'][i].Folders.length;j++)
              {
                if(ProcurementServiceFiles['Folders'][i].Folders[j].Name==gdsID)
                {
                  for(var k=0;k<ProcurementServiceFiles['Folders'][i].Folders[j].Files.length;k++)
                  {
                    if(val.Name=="Quantities")
                    {
                      arrFiles[key].Files.push({"FileName":ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].Name,"FileURI":ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].ServerRelativeUrl});
                    }
                    else if(val.Name=="Others")
                    {
                      arrFiles[key].Files.push({"FileName":ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].Name,"FileURI":ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].ServerRelativeUrl});
                    }
                    else
                    {
                      arrFiles[key].FileName=ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].Name;
                      arrFiles[key].FileURl=ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].ServerRelativeUrl;
                    }

                  
                  }
                }
              }
            }
        } 
      });




      
      let HTMLGoods='';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+GoodsRequest[index].ProjectName +'</p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project ID</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+GoodsRequest[index].ID +'</p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of AV</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+GoodsRequest[index].NameOfAV +'</p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">PN for ZAS</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+GoodsRequest[index].PNForZAS +'</p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project Number</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+GoodsRequest[index].ProjectNumber +'</p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Quantities</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'
        for(let i=0;i<arrFiles[0].Files.length;i++)
        {
          HTMLGoods+='<a href='+encodeURI(arrFiles[0].Files[i].FileURI)+' target="_blank">'+arrFiles[0].Files[i].FileName+'</a><br>'
        }
     HTMLGoods+='</p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">ShortList</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href='+encodeURI(arrFiles[1].FileURl)+' target="_blank">'+arrFiles[1].FileName+'</a></p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">NewsAdvertisement</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href='+encodeURI(arrFiles[2].FileURl)+' target="_blank">'+arrFiles[2].FileName+'</a></p></div></div>';

      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Others</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'
      for(let i=0;i<arrFiles[3].Files.length;i++)
      {
        HTMLGoods+='<a href='+encodeURI(arrFiles[3].Files[i].FileURI)+' target="_blank"> '+arrFiles[3].Files[i].FileName+'</a><br>'
      }
      HTMLGoods+='</p></div></div>';

      // HTMLGoods+='<table>';
      // HTMLGoods+='<tbody>  ';         
      // HTMLGoods+='<tr><td>Project Name : '+GoodsRequest[index].ProjectName +'</td></tr>';
      // HTMLGoods+='<tr><td>Project ID : '+GoodsRequest[index].ID +'</td></tr>';
      // HTMLGoods+='<tr><td>Name Of AV : '+GoodsRequest[index].NameOfAV+'</td></tr>';
      // HTMLGoods+='<tr><td>PN for ZAS : '+GoodsRequest[index].PNForZAS +'</td></tr>';
      // HTMLGoods+='<tr><td>Project Number : '+GoodsRequest[index].ProjectNumber +'</td></tr>';
      // HTMLGoods+='<tr><td>Quantities : <a href='+encodeURI(arrFiles[0].FileURl)+' target="_blank">'+arrFiles[0].FileName+'</a></td></tr>';
      // HTMLGoods+='<tr><td>ShortList : <a href='+encodeURI(arrFiles[1].FileURl)+' target="_blank">'+arrFiles[1].FileName+'</a></td></tr>';
      // HTMLGoods+='<tr><td>NewsAdvertisement : <a href='+encodeURI(arrFiles[2].FileURl)+' target="_blank">'+arrFiles[2].FileName+'</a></td></tr>';
      // HTMLGoods+='<tr><td>Others : <a href='+encodeURI(arrFiles[3].FileURl)+' target="_blank"> '+arrFiles[3].FileName+'</a></td></tr>';
      
      if(GoodsRequest[index].RequestItem=='Yes')
      {

        
      HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Cost Item</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href='+encodeURI(arrFiles[4].FileURl)+' target="_blank"> '+arrFiles[4].FileName+'</a></p></div></div>';

        // HTMLGoods+='<tr><td>Cost Item : <a href='+encodeURI(arrFiles[4].FileURl)+' target="_blank"> '+arrFiles[4].FileName+'</a></td></tr>';
      }
      if(GoodsRequest[index].Specifications=='Nonneutral Specifications')
      {
        HTMLGoods+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Specification</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href='+encodeURI(arrFiles[5].FileURl)+' target="_blank"> '+arrFiles[5].FileName+'</a></p></div></div>';

        // HTMLGoods+='<tr><td>Specification : <a href='+encodeURI(arrFiles[5].FileURl)+' target="_blank"> '+arrFiles[5].FileName+'</a></td></tr>';
      }

      // HTMLGoods+='</tbody></table>';
      

      $('#modalbody').html('');
      $('#modalbody').append(HTMLGoods);
      

    
    });

    $(document).on('click','.serdetailView',function()
    {
      
      var that=$(this);
      var index;
      var serviceID=that.attr('req-id');
      ServiceRequest.forEach(function(val,key)
      {
          if(val.ID==that.attr('req-id'))
          {
            index=key;
          }
      });


      let arrFiles=[];
      

      arrFiles.push({'Name':'EstimatedCost','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Justification','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Terms','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Others','Files':[]});
      // arrFiles.push({'Name':'Others','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'ShortList','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'TechAssGrid','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'NewsAdvertisement','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'ProjectProposal','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Budget','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Profile','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'BankDetails','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'CommercialSuitability','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'RegCert','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'LessorID','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'OwnerDocs','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'RmoApproval','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'DirectorApproval','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'LandScheme','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'RmoApproval','FileName':'N/A','FileURl':'N/A'}); 
      arrFiles.push({'Name':'CVExperts','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'FinancialReports','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'AgreementConcept','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'Vergabedok','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'SummaryActionPlan','FileName':'N/A','FileURl':'N/A'});
      arrFiles.push({'Name':'CompetitionReport','FileName':'N/A','FileURl':'N/A'});

      $.each(arrFiles,function(key,val)
      {
        for(var i=0;i<ProcurementServiceFiles['Folders'].length;i++)
        {
            if(ProcurementServiceFiles['Folders'][i].Name==val.Name)
            {
              for(var j=0;j<ProcurementServiceFiles['Folders'][i].Folders.length;j++)
              {
                if(ProcurementServiceFiles['Folders'][i].Folders[j].Name==serviceID)
                {
                  for(var k=0;k<ProcurementServiceFiles['Folders'][i].Folders[j].Files.length;k++)
                  {
                    if(val.Name=="Others")
                    {
                      arrFiles[key].Files.push({"FileName":ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].Name,"FileURl":ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].ServerRelativeUrl});
                    }
                    else
                    {
                      arrFiles[key].FileName=ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].Name;
                      arrFiles[key].FileURl=ProcurementServiceFiles['Folders'][i].Folders[j].Files[k].ServerRelativeUrl;
                    }

                  
                  }
                }
              }
            }
        } 
      });

      let HTMLservice='';

      HTMLservice+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project name</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+ServiceRequest[index].ProjectName +'</p></div></div>';

      HTMLservice+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Project ID</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+ServiceRequest[index].ID +'</p></div></div>';

      HTMLservice+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">Name Of AV</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+ServiceRequest[index].NameOfAV +'</p></div></div>';

      HTMLservice+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">PN for ZAS</h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">'+ServiceRequest[index].PNForZAS +'</p></div></div>';


      // HTMLservice+='<table>';
      // HTMLservice+='<tbody>  ';         
      // HTMLservice+='<tr><td>Project Name : '+ServiceRequest[index].ProjectName +'</td></tr>';
      // HTMLservice+='<tr><td>Project ID : '+ServiceRequest[index].ID +'</td></tr>';
      // HTMLservice+='<tr><td>Project Number : '+ServiceRequest[index].ProjectNumber +'</td></tr>';
      // HTMLservice+='<tr><td>Name Of AV : '+ServiceRequest[index].NameOfAV+'</td></tr>';
      // HTMLservice+='<tr><td>PN for ZAS : '+ServiceRequest[index].PNForZAS +'</td></tr>';
      for(var i=0;i<arrFiles.length;i++)
      {
        if(arrFiles[i].FileURl!='N/A')
        {

          if(arrFiles[i].Name=='Others')
          {
            HTMLservice+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">'+ arrFiles[i].Name +' </h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult">';
            
            for(let j=0;j<arrFiles[i].Files.length;j++)
            {
              HTMLservice+='<a href='+encodeURI(arrFiles[i].Files[j].FileURl)+' target="_blank"> '+arrFiles[i].Files[j].FileName+'</a><br>'
            }

            HTMLservice+='</p></div></div>';
          }
          else
          {
            HTMLservice+='<div class="row goods-details"><div class="col-sm-3"><h5 class="goods-label">'+ arrFiles[i].Name +' </h5></div><div class="col-sm-1 text-center">:</div><div class="col-sm-6"><p class="goodsresult"><a href='+encodeURI(arrFiles[i].FileURl)+' target="_blank"> '+arrFiles[i].FileName+'</a></p></div></div>';
          }



          // HTMLservice+='<tr><td>'+ arrFiles[i].Name +' : <a href='+encodeURI(arrFiles[i].FileURl)+' target="_blank"> '+arrFiles[i].FileName+'</a></td></tr>';
        }
      }
      // HTMLservice+='</tbody></table>';

      $('#modalbody').html('');
      $('#modalbody').append(HTMLservice);
      

    
    });

    /*Edit Fcuntionality*/

    $(document).on('click','.SerEdit',function()
    {
      var indexofEdit=$(this).attr('index-value');
      var AssignedTo=$(".UserDropdownSER"+indexofEdit+" option:selected").val();

      if(flgSystemAdmin)
      $(".UserDropdownSER"+indexofEdit+"").attr('disabled',false);

      if(CrntUserID==AssignedTo)
      $(".StatusDropdownSER"+indexofEdit+"").attr('disabled',false);
      //alert($(".UserDropdownSER"+indexofEdit+" option:selected").val());
    });

    $(document).on('click','.GdsEdit',function()
    {
      var indexofEdit=$(this).attr('index-value');
      var AssignedTo=$(".UserDropdownGDS"+indexofEdit+" option:selected").val();

      if(flgSystemAdmin)
      $(".UserDropdownGDS"+indexofEdit+"").attr('disabled',false);

      if(CrntUserID==AssignedTo)
      $(".StatusDropdownGDS"+indexofEdit+"").attr('disabled',false);
    });

    /* Save functionality */

    $(document).on('click','.SerSave',function()
    {
      var itemid=$(this).attr('req-id');
      var indexofEdit=$(this).attr('index-value');
      var alreadyAssgnUsr=$(this).attr('AssignedUser');
      var AssignedUser=$(".UserDropdownSER"+indexofEdit+" option:selected").val();
      var ReqStatus=$(".StatusDropdownSER"+indexofEdit+" option:selected").val();

      if(AssignedUser!='Select')
      {
        $('.loading-modal').addClass('active');
        $('body').addClass('body-hidden');
        
        var data; 
        data={"AssignedTo1Id":AssignedUser};
        if(ReqStatus!='Select')
        {
          data={"AssignedTo1Id":AssignedUser,"RequestStatusId":ReqStatus};
        }

        updaterequest(itemid,data,'ProcurementService',true);
      } 



      
    });

    $(document).on('click','.GdsSave',function()
    {
      var itemid=$(this).attr('req-id');
      var indexofEdit=$(this).attr('index-value');
      var alreadyAssgnUsr=$(this).attr('AssignedUser');
      var AssignedUser=$(".UserDropdownGDS"+indexofEdit+" option:selected").val();
      var ReqStatus=$(".StatusDropdownGDS"+indexofEdit+" option:selected").val();

      if(AssignedUser!='Select')
      {
        var data; 
        data={"AssignedTo1Id":AssignedUser};

        if(ReqStatus!='Select')
        {
          data={"AssignedTo1Id":AssignedUser,"RequestStatusId":ReqStatus};
        }

        updaterequest(itemid,data,'ProcurementGoods',true);
      }
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

async function LoadGoodsRequest()
  {
    await sp.web.lists.getByTitle('ProcurementGoods').items
    .select('ProjectName,ProjectNumber,ID,AVName/ID,Representative/ID,Specifications,RequestItem,PNForZAS,NameOfAV,AssignedTo1/Title,AssignedTo1/ID,RequestStatus/ID,RequestStatus/Title,Created,Modified')
    .orderBy("Modified",false)
    .expand('AssignedTo1,AVName,Representative,RequestStatus')
    .top(5000)
    .get().then((allItems: any[]) => {
      var goodsHTML='';
      GoodsRequest=allItems;
      for (var index = 0; index < allItems.length; index++) 
      {
        if(flgProcurementTeam||allItems[index].AVName.ID==CrntUserID||allItems[index].Representative.ID==CrntUserID)
        {
          var assgnuser='select';
        
        if(allItems[index].AssignedTo1)
        assgnuser=allItems[index].AssignedTo1.ID;
        
        goodsHTML+='<tr>';
        goodsHTML+='<td>'+allItems[index].Modified+'</td>';
        goodsHTML+='<td>'+allItems[index].ProjectName+'</td>';
        goodsHTML+='<td>'+allItems[index].ProjectNumber+'</td>';
        goodsHTML+='<td>'+allItems[index].NameOfAV+'</td>';
        goodsHTML+='<td>'+moment(allItems[index].Created).format('DD MMMM YYYY')+'</td>';
        goodsHTML+='<td><select class="UserDropdownGDS'+index+'" disabled="disabled">'+Users+'<select></td>';
        goodsHTML+='<td><select class="StatusDropdownGDS'+index+'" disabled="disabled">'+statusHtml+'<select></td>';
        goodsHTML+='<td>';
        goodsHTML+='<a herf="#" req-id="'+allItems[index].ID+'" class="GdsdetailView" data-toggle="modal" data-target="#myModal"><span class="icon-action icon-view"></span></a>';
        if(flgSystemAdmin||CrntUserID==assgnuser)
        {
        goodsHTML+='<a herf="#" index-value='+index+' class="GdsEdit"><span class="icon-action icon-edit"></span></a>';
        goodsHTML+='<a herf="#" req-id="'+allItems[index].ID+'" AssignedUser='+assgnuser+' index-value='+index+' class="GdsSave"><span class="icon-action icon-save"></span></a>';
        }
        goodsHTML+='</td>';
        goodsHTML+='</tr>';

        }

      }
      $('#tblGoods').html('');
      $('#tblGoods').append(goodsHTML);

      for(var i=0;i<allItems.length;i++)
      {
        if(allItems[i].AssignedTo1)
        $('.UserDropdownGDS'+i+'').val(allItems[i].AssignedTo1.ID);

        if(allItems[i].RequestStatus)
        $('.StatusDropdownGDS'+i+'').val(allItems[i].RequestStatus.ID);
      }

    }).catch(function(error){ErrorCallBack(error,'InsertService')});

    $('#Goods').DataTable({
      "order": [[ 0, "desc" ]],
      "columnDefs": [
        {
            "targets": [ 0 ],
            "visible": false,
        }  
    ]
  });
  }

  async function LoadServiceRequest()
  {
    await sp.web.lists.getByTitle('ProcurementService').items
    .select('ProjectName,ProjectNumber,ID,AVName/ID,Representative/ID,PNForZAS,NameOfAV,AssignedTo1/ID,AssignedTo1/Title,RequestStatus/Title,RequestStatus/ID,Created,Modified')
    .orderBy("Modified", false)
    .expand('AssignedTo1,AVName,Representative,RequestStatus')
    .top(5000)
    .get().then((allItems: any[]) => {
      var serviceHTML='';
      ServiceRequest=allItems;
      for (var index = 0; index < allItems.length; index++) 
      {
        
        if(flgProcurementTeam||allItems[index].AVName.ID==CrntUserID||allItems[index].Representative.ID==CrntUserID)
        {
        
        var assgnuser='select';
        
        if(allItems[index].AssignedTo1)
        assgnuser=allItems[index].AssignedTo1.ID; 

        serviceHTML+='<tr>';
        serviceHTML+='<td>'+allItems[index].Modified+'</td>';
        serviceHTML+='<td>'+allItems[index].ProjectName+'</td>';
        serviceHTML+='<td>'+allItems[index].ProjectNumber+'</td>';
        serviceHTML+='<td>'+allItems[index].NameOfAV+'</td>';
        serviceHTML+='<td>'+moment(allItems[index].Created).format('DD MMMM YYYY')+'</td>';
        serviceHTML+='<td><select class="UserDropdownSER'+index+'" disabled="disabled">'+Users+'</select></td>';
        serviceHTML+='<td><select class="StatusDropdownSER'+index+'" disabled="disabled">'+statusHtml+'</select></td>';
        serviceHTML+='<td>';
        serviceHTML+='<a herf="#" req-id="'+allItems[index].ID+'" class="serdetailView" data-toggle="modal" data-target="#myModal"><span class="icon-action icon-view"></a>';
        if(flgSystemAdmin||CrntUserID==assgnuser){
        serviceHTML+='<a herf="#" index-value='+index+' class="SerEdit"><span class="icon-action icon-edit"></a>';  
        serviceHTML+='<a herf="#" req-id="'+allItems[index].ID+'" AssignedUser='+assgnuser+' index-value='+index+' class="SerSave"><span class="icon-action icon-save"></a>';
        }
        serviceHTML+='</td>';
        serviceHTML+='</tr>';
        }

      }
      $('#tblService').html('');
      $('#tblService').append(serviceHTML);

      for(var i=0;i<allItems.length;i++)
      {
        if(allItems[i].AssignedTo1)
        $('.UserDropdownSER'+i+'').val(allItems[i].AssignedTo1.ID);

        if(allItems[i].RequestStatus)
        $('.StatusDropdownSER'+i+'').val(allItems[i].RequestStatus.ID);
      }

    }).catch(function(error){ErrorCallBack(error,'LoadServiceRequest')});

    $('#Service').DataTable({
      "order": [[ 0, "desc" ]],
      "columnDefs": [
        {
            "targets": [ 0 ],
            "visible": false,
        }]
  });
    $('.UserDropdown').attr('disabled',true);
  }

  async function LoadProcurementTeam()
  {
    await sp.web.siteGroups.getByName('ProcurementTeam').users.filter("Email eq '"+LoggedUserEmail+"'").get().then((allItems: any[]) => 
    {
        if(allItems.length>0)
        {
          flgProcurementTeam=true;
        }
    }).catch(function(error){ErrorCallBack(error,'LoadProcurementTeam')});
  }

  async function LoadAdminTeam()
  {
    await sp.web.siteGroups.getByName('SystemAdmin').users.filter("Email eq '"+LoggedUserEmail+"'").get().then((allItems: any[]) => 
    {
        if(allItems.length>0)
        {
          flgSystemAdmin=true;
        }
    }).catch(function(error){ErrorCallBack(error,'LoadProcurementTeam')});
  }

  async function LoadProcurementTeamMembers()
  {
    await sp.web.siteGroups.getByName('ProcurementTeam').users.get().then((allItems: any[]) => 
    {
        if(allItems.length>0)
        {
          Users+='<option value="Select">Select</option>';
          for(var i=0;i<allItems.length;i++)
          {
            //Users+='<select class="UserDropdown">';
            Users+='<option User-id="' + allItems[i].Id + '"  value="' + allItems[i].Id + '">' + allItems[i].Title + '</option>';
            //Users+='</select>';
          }
          
        }
    }).catch(function(error){ErrorCallBack(error,'LoadProcurementTeam')});
  }

  async function LoadStatus()
  {
    await sp.web.lists.getByTitle('Status').items.get().then((allItems: any[]) => 
    {
        if(allItems.length>0)
        {
          statusHtml+='<option value="Select">Select</option>';
          for(var i=0;i<allItems.length;i++)
          {
            //Users+='<select class="UserDropdown">';
            statusHtml+='<option value="' + allItems[i].Id + '">' + allItems[i].Title + '</option>';
            //Users+='</select>';
          }
          
        }
    }).catch(function(error){ErrorCallBack(error,'LoadProcurementTeam')});
  }


  async function LoadProjects()
  {
     await sp.web.lists.getByTitle('Projects').items.select('Title,Id,ProjectAV/Title,ProjectAV/ID,Representative/ID').expand('ProjectAV,Representative').getAll().then((allItems: any[]) => {
      for (var index = 0; index < allItems.length; index++) 
      {
        var element = allItems[index];
        if(CrntUserID==element.Representative.ID)
        {
          flgRepUser=true;
          $('#projectName').append('<option Proj-Rp-id="' + element.Representative.ID + '" Proj-Av-id="' + element.ProjectAV.ID + '" Proj-Av="' + element.ProjectAV.Title + '"  proj-id="' + element.Id + '" value="' + element.Title + '">' + element.Title + '</option>');
        }
      }

      if(!flgRepUser)
        {
          $('#btnGoods').prop('disabled',true);
          $('#btnService').prop('disabled',true);
        }

    });
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

  async function getAllFolders()
  {

    await sp.web.getFolderByServerRelativeUrl('ProcurementServices')
    .expand('Files,Folders/Folders/Files')
    .get()
    .then((allItems: any[]) =>
    {
      
      console.log(allItems);
      if(allItems)
      {
        ProcurementServiceFiles=allItems;
      }

    }).catch(function(error){ErrorCallBack(error,'getAllFolders')});

  }

  async function updaterequest(itemid,data,listname,close)
  {
    $('.loading-modal').addClass('active');
    $('body').addClass('body-hidden');
    let lstupdate=await sp.web.lists.getByTitle(listname);
    lstupdate.items.getById(itemid).update(data).then((allItems: any) => 
    {
        //alert('updated');
        if(close){
          $('.loading-modal').removeClass('active');
          $('body').removeClass('body-hidden');
          location.reload(true); 
        }
        
    }).catch(function(error){ErrorCallBack(error,'updategoodsrequest')});
  }

  
function ErrorCallBack(error,methodname)
{	
  $('.loading-modal').removeClass('active');
  alert(error);
}
