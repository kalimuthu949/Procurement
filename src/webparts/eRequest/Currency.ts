import {
    SPHttpClient,
    SPHttpClientResponse,
    ISPHttpClientOptions,
  } from "@microsoft/sp-http";
  
  import { WebPartContext } from "@microsoft/sp-webpart-base";
    
    
  export class ServiceProvider {  
      private wpcontext:WebPartContext;  
      public constructor(context: WebPartContext) {  
         this.wpcontext= context;  
        }  
        
        private httpClientOptionsForGlobal: ISPHttpClientOptions = {  
          headers: new Headers({  
            "Content-type":"application/x-www-form-urlencoded",
          }),  
          method: "GET",  
          mode: "cors"  
    };
  
  
    public async getcurrency() {  
    
      var response = await this.wpcontext.httpClient  
     .get("https://ec.europa.eu/budg/inforeuro/api/public/monthly-rates?year=2020&month=09", SPHttpClient.configurations.v1,this.httpClientOptionsForGlobal);  
     console.log(response);  
     var responeJson : any = await response.json();  
     return responeJson;  
     
    }

     /*public async Loadcurrency() {
        const url = 'https://ec.europa.eu/budg/inforeuro/api/public/monthly-rates?year=2020&month=09';
      
        const requestHeaders: Headers = new Headers();
        // requestHeaders.append("Content-type", "application/json");
        requestHeaders.append(
            "Content-type",
            "application/x-www-form-urlencoded"
        );
      
        const httpClientOptions: ISPHttpClientOptions  = {
        headers: requestHeaders,
        mode: "cors"
      };
      
        await this.context.httpClient
          .get(url, SPHttpClient.configurations.v1, httpClientOptions)
          .then(response => {
              console.log(response);
              return response.json();
          });
      }*/

  
  }

  async function servicetest()
  {
    debugger;
    var response = await this.wpcontext.httpClient  
    .get("https://ec.europa.eu/budg/inforeuro/api/public/monthly-rates?year=2020&month=09", SPHttpClient.configurations.v1,this.httpClientOptionsForGlobal);  
    console.log(response);  
    var responeJson : any = await response.json();  
    return responeJson; 
  }

  export default ServiceProvider;

 

